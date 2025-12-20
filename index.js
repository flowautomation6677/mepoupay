require('dotenv').config();
console.log("--- TESTE DE CARGA DO AMBIENTE ---");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "Carregada (oculta)" : "NÃO DEFINIDA");
console.log("OPENAI_KEY:", process.env.OPENAI_API_KEY ? "Carregada (oculta)" : "NÃO DEFINIDA");
console.log("----------------------------------");
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuração do FFmpeg (Estático)
const ffmpegPath = require('ffmpeg-static');
// const ffprobePath = require('ffprobe-static').path;
console.log('FFmpeg Path:', ffmpegPath);

// FORÇANDO via Variável de Ambiente
process.env.FFMPEG_PATH = ffmpegPath;

if (!fs.existsSync(ffmpegPath)) {
    console.error('❌ ERRO: FFmpeg não encontrado!');
}

// Inicialização do Cliente Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('❌ ERRO: Faltam as credenciais do SUPABASE no arquivo .env');
    process.exit(1);
}
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Configuração da OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Inicialização do Cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code gerado! Escaneie com seu WhatsApp.');
});

client.on('ready', () => {
    console.log('Cliente está pronto!');
});

// Memória de Conversa (In-Memory)
const userContexts = {};

client.on('message', async (message) => {
    try {
        console.log(`Mensagem recebida de ${message.from}: ${message.body}`);

        // Identificação do Usuário
        const user = await getOrCreateUser(message.from);
        if (!user) {
            await message.reply('❌ Erro ao identificar seu perfil no sistema.');
            return;
        }

        // Inicializa contexto se não existir
        if (!userContexts[user.id]) {
            userContexts[user.id] = [];
        }

        let textToProcess = '';

        // 0. Comandos Especiais (Reset de Memória)
        const cmd = message.body.toLowerCase().trim();
        if (cmd === '/reset' || cmd === '/limpar' || cmd === '/esquecer') {
            userContexts[user.id] = [];
            await message.reply('🧠 Memória limpa! O que vamos fazer agora?');
            return;
        }

        // 1. Processamento de Mídia
        if (message.hasMedia) {
            const media = await message.downloadMedia();

            // IMAGEM
            if (media.mimetype.includes('image')) {
                console.log('Recebida imagem. Analisando...');
                await message.reply('🧐 Olhando...');

                const systemPromptVision = `Extraia dados financeiros. Retorne JSON {gastos: [...]}. Inclua "data".`;
                const completion = await openai.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPromptVision },
                        { role: "user", content: [{ type: "image_url", image_url: { url: `data:${media.mimetype};base64,${media.data}` } }] }
                    ],
                    model: "gpt-4o",
                    response_format: { type: "json_object" }
                });
                await processAIResponse(completion.choices[0].message.content, message, user.id);
                return;
            }

            // ÁUDIO (PTT ou Audio puro)
            if (media.mimetype.includes('audio')) {
                console.log('Recebido áudio. Transcrevendo...');
                await message.reply('🎧 Ouvindo...');

                try {
                    const audioBuffer = Buffer.from(media.data, 'base64');
                    const tempOggPath = path.join(__dirname, `temp_audio_${message.id.id}.ogg`);
                    const tempMp3Path = path.join(__dirname, `temp_audio_${message.id.id}.mp3`);

                    fs.writeFileSync(tempOggPath, audioBuffer);

                    // Converte OGG/Opus para MP3 (necessário para Whisper)
                    await transcodeAudioToMp3(tempOggPath, tempMp3Path);

                    const transcription = await openai.audio.transcriptions.create({
                        file: fs.createReadStream(tempMp3Path),
                        model: "whisper-1",
                    });

                    textToProcess = transcription.text;
                    console.log('Transcrição:', textToProcess);
                    await message.reply(`📝 Ouvi: "${textToProcess}"`);

                    // Limpeza
                    fs.unlinkSync(tempOggPath);
                    fs.unlinkSync(tempMp3Path);

                } catch (err) {
                    console.error("Erro na transcrição:", err);
                    await message.reply("❌ Não consegui ouvir o áudio direito.");
                    return;
                }
            }
        }

        if (!message.hasMedia) {
            textToProcess = message.body;
        }

        if (!textToProcess) return;

        // 2. Busca Semântica (RAG)
        const similarDocs = await searchSimilarTransactions(textToProcess);
        const contextStr = similarDocs.map(d => `- ${d.descricao}: R$ ${d.valor}`).join('\n');

        // 3. Definição das Tools (Porquim 360)
        const tools = [
            {
                type: "function",
                function: {
                    name: "get_financial_health",
                    description: "Consultar saúde financeira atual (Saldo, Entradas, Saídas, Meta).",
                    parameters: { type: "object", properties: {}, required: [] }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_top_categories",
                    description: "Verificar top 3 categorias de gastos.",
                    parameters: { type: "object", properties: {}, required: [] }
                }
            },
            {
                type: "function",
                function: {
                    name: "manage_profile",
                    description: "Definir ou ler meta financeira.",
                    parameters: {
                        type: "object",
                        properties: {
                            action: { type: "string", enum: ["set_goal", "get_goal"] },
                            value: { type: "string" }
                        },
                        required: ["action"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_spending_summary",
                    description: "Resumo específico por período/categoria.",
                    parameters: {
                        type: "object",
                        properties: {
                            period: { type: "string", enum: ["current_month", "last_month"] },
                            category: { type: "string" }
                        },
                        required: ["period"]
                    }
                }
            }
        ];

        // 4. System Prompt (Persona COACH 360)
        const hoje = new Date();
        const systemPrompt = `Você é o **Porquim 360**, um Consultor Financeiro Pessoal Inteligente.
        Hoje: ${hoje.toLocaleDateString('pt-BR')}.
        
        🧠 **MEMÓRIA RAG:**
        ${contextStr ? contextStr : "N/D"}

        🎯 **MISSÃO:** Analise, Alerte e Eduque.

        📋 **DIRETRIZES:**
        1. **Registro:** Se for gasto, retorne JSON padrão: { "gastos": [...] }.
        2. **Consultoria:** Se perguntarem "Posso gastar?", USE TOOLS (get_financial_health). Responda com base nos dados.
        3. **Formatação:** Use negrito para valores (*R$ 10,00*). Seja amigável e parceiro.
        
        IMPORTANTE: Se chamar uma Tool, analise o JSON de retorno dela e responda em texto para o usuário.`;

        // Monta mensagens
        const messages = [
            { role: "system", content: systemPrompt },
            ...userContexts[user.id],
            { role: "user", content: textToProcess }
        ];

        // 5. Primeira Chamada OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            tools: tools,
            tool_choice: "auto",
        });

        const responseMessage = completion.choices[0].message;

        // 6. Verificação de Tool Call
        if (responseMessage.tool_calls) {
            const toolResults = [];

            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);
                let toolResult = "";

                console.log(`🔧 Acionando Tool: ${functionName}`);

                if (functionName === 'get_spending_summary') {
                    toolResult = await getSpendingSummary({ userId: user.id, ...functionArgs });
                }
                else if (functionName === 'get_financial_health') {
                    toolResult = await getFinancialHealth({ userId: user.id });
                }
                else if (functionName === 'get_top_categories') {
                    toolResult = await getTopCategories({ userId: user.id });
                }
                else if (functionName === 'manage_profile') {
                    toolResult = await manageProfile({ userId: user.id, ...functionArgs });
                }

                toolResults.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: toolResult
                });
            }

            // Segunda chamada: Passar resultados para a IA
            messages.push(responseMessage);
            messages.push(...toolResults);

            const secondResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: messages
            });

            const finalContent = secondResponse.choices[0].message.content;
            await message.reply(finalContent);

            // Atualiza histórico
            userContexts[user.id].push({ role: "user", content: textToProcess });
            userContexts[user.id].push({ role: "assistant", content: finalContent });
            return;
        }

        // 7. Se não houve Tool Call, processa normal ou extrai JSON de converda
        const content = responseMessage.content;

        // Tenta encontrar um bloco JSON dentro da resposta (mesmo que haja texto antes/depois)
        // Regex procura por { ... } que contenha "gastos" ou "valor" para ser mais assertivo
        const jsonMatch = content.match(/(\{[\s\S]*"gastos"[\s\S]*\}|\{[\s\S]*"valor"[\s\S]*\})/);

        try {
            if (jsonMatch) {
                // Se achou JSON de gastos, processa
                console.log("JSON extraído da resposta:", jsonMatch[0]);
                await processAIResponse(jsonMatch[0], message, user.id);
            } else if (content.trim().startsWith('{')) {
                // Fallback para JSON puro
                await processAIResponse(content, message, user.id);
            } else {
                // Se não é gasto, é conversa (ou tool response explicada)
                await message.reply(content);
            }
        } catch (e) {
            // Em caso de erro, manda o texto original
            await message.reply(content);
        }

        // Atualiza histórico
        userContexts[user.id].push({ role: "user", content: textToProcess });
        userContexts[user.id].push({ role: "assistant", content: content });
        if (userContexts[user.id].length > 10) userContexts[user.id] = userContexts[user.id].slice(-10);

    } catch (error) {
        console.error('Erro na mensagem:', error);
    }
});

// --- FUNÇÕES DE BANCO DE DADOS (SUPABASE) ---

// Busca usuário pelo número telefônico ou cria se não existir
async function getOrCreateUser(whatsappNumber) {
    // 1. Tenta buscar
    const { data: existingUser, error: findError } = await supabase
        .from('perfis')
        .select('*')
        .eq('whatsapp_number', whatsappNumber)
        .single();

    if (existingUser) return existingUser;

    // 2. Se não existe, cria
    const { data: newUser, error: createError } = await supabase
        .from('perfis')
        .insert([{ whatsapp_number: whatsappNumber }])
        .select()
        .single();

    if (createError) {
        console.error("Erro ao criar usuário:", createError);
        return null;
    }

    console.log(`Novo usuário criado: ${whatsappNumber}`);
    return newUser;
}

// Função auxiliar para converter data DD/MM/YYYY para ISO
function parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString();

    // Se já estiver em formato ISO (YYYY-MM-DD...)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr;

    // Se for formato brasileiro DD/MM/YYYY
    const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brMatch) {
        return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
    }

    return new Date().toISOString(); // Fallback
}

// Salva transação no Supabase vinculada ao ID do usuário
async function saveTransaction(userId, transactionData) {
    // Fallback para descrição se vier vazia
    const descFinal = transactionData.descricao || transactionData.categoria || "Gasto Diverso";
    const descricaoCompleta = `${descFinal} - ${transactionData.categoria}`;

    const embedding = await generateEmbedding(descricaoCompleta);
    const dataFormatada = parseDate(transactionData.data);

    const { error } = await supabase
        .from('transacoes')
        .insert([{
            user_id: userId,
            valor: transactionData.valor,
            categoria: transactionData.categoria,
            descricao: descFinal,
            data: dataFormatada,
            tipo: transactionData.tipo || 'despesa',
            embedding: embedding
        }]);

    if (error) console.error("Erro ao salvar transação:", error);
}

// --- RAG & TOOLS HELPERS ---

// Gera embedding (vetor) para um texto usando OpenAI
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });
        return response.data[0].embedding;
    } catch (e) {
        console.error("Erro ao gerar embedding:", e);
        return null;
    }
}

// Busca transações similares no Supabase (RAG)
async function searchSimilarTransactions(queryText, matchThreshold = 0.5, matchCount = 5) {
    const queryEmbedding = await generateEmbedding(queryText);
    if (!queryEmbedding) return [];

    const { data, error } = await supabase.rpc('match_transacoes', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
    });

    if (error) {
        console.error("Erro na busca semântica:", error);
        return [];
    }
    return data || [];
}

// Tool Implementation: Resumo de Gastos
async function getSpendingSummary({ userId, period, category }) {
    const hoje = new Date();
    let startDate, endDate;

    if (period === 'current_month') {
        startDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        endDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString();
    } else if (period === 'last_month') {
        startDate = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString();
        endDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
    } else {
        // Default: últimos 30 dias
        const past = new Date();
        past.setDate(past.getDate() - 30);
        startDate = past.toISOString();
        endDate = hoje.toISOString();
    }

    let query = supabase
        .from('transacoes')
        .select('valor, tipo, categoria')
        .eq('user_id', userId)
        .gte('data', startDate)
        .lt('data', endDate);

    if (category) {
        query = query.ilike('categoria', `%${category}%`);
    }

    const { data: transacoes, error } = await query;

    if (error) return "Erro ao buscar dados no banco.";
    if (!transacoes || transacoes.length === 0) return "Nenhuma transação encontrada neste período.";

    // Agregação
    const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transacoes.filter(t => t.tipo !== 'receita').reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;

    return JSON.stringify({
        receitas,
        despesas,
        saldo,
        detalhes: `Encontradas ${transacoes.length} transações.`
    });
}

// Tool Implementation: Saúde Financeira (Health)
async function getFinancialHealth({ userId }) {
    const hoje = new Date();
    const startDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
    const endDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString();

    const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('valor, tipo')
        .eq('user_id', userId)
        .gte('data', startDate)
        .lt('data', endDate);

    if (error) return "Erro ao consultar saúde financeira.";

    const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transacoes.filter(t => t.tipo !== 'receita').reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;

    const { data: perfil } = await supabase.from('perfis').select('financial_goal').eq('id', userId).single();
    const meta = perfil?.financial_goal || "Nenhuma meta definida.";

    return JSON.stringify({
        saldo_atual: saldo,
        total_entradas: receitas,
        total_saidas: despesas,
        meta_usuario: meta
    });
}

// Tool Implementation: Top Categorias
async function getTopCategories({ userId }) {
    const past = new Date();
    past.setDate(past.getDate() - 30);

    const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('valor, categoria')
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data', past.toISOString());

    if (error || !transacoes) return "Erro ao analisar categorias.";

    const categorias = {};
    transacoes.forEach(t => {
        categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    });

    const sorted = Object.entries(categorias)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`);

    return JSON.stringify({ top_categorias: sorted });
}

// Tool Implementation: Gerenciar Perfil
async function manageProfile({ userId, action, value }) {
    if (action === 'set_goal') {
        const { error } = await supabase.from('perfis').update({ financial_goal: value }).eq('id', userId);
        return error ? "Erro ao salvar meta." : `Meta definida: "${value}"`;
    }
    if (action === 'get_goal') {
        const { data } = await supabase.from('perfis').select('financial_goal').eq('id', userId).single();
        return data?.financial_goal ? `Meta atual: ${data.financial_goal}` : "Nenhuma meta definida.";
    }
    return "Ação desconhecida.";
}

// Gera relatório (Legacy - mantido para compatibilidade, mas agora usando Tool é melhor)
// Mantendo apenas se for chamado diretamente, mas o ideal é a IA usar o tool.
async function generateReport(userId) {
    // ... (Mantendo implementação antiga ou redirecionando para getSpendingSummary se quiser)
    // Para simplificar, vou deixar a função antiga aqui mas ela pode ser depreciada.
    return await getSpendingSummary({ userId, period: 'current_month' });
}

// Função auxiliar para processar e salvar a resposta da IA (usada por Texto e Imagem)
// Função auxiliar para processar e salvar a resposta da IA (usada por Texto e Imagem)
async function processAIResponse(jsonContent, message, userId) {
    let data;
    try {
        data = JSON.parse(jsonContent);
    } catch (e) {
        console.error("Erro ao fazer parse do JSON da IA", e);
        // Tenta limpar markdown ```json ... ``` se existir
        const cleanJson = jsonContent.replace(/```json|```/g, '').trim();
        try {
            data = JSON.parse(cleanJson);
        } catch (e2) {
            return; // Falha total silenciosa ou poderia avisar
        }
    }

    // 0. Ação de Relatório Solicitada
    if (data.action === 'relatorio') {
        const report = await generateReport(userId);
        await message.reply(report);
        return;
    }

    // 1. Tratamento de Dúvidas/Perguntas da IA
    if (data.pergunta) {
        await message.reply(`🤔 ${data.pergunta}`);
        return;
    }

    if (data.ignorar) {
        await message.reply(data.resposta || "🤖 Olá! Posso anotar seus gastos, só mandar!");
        return;
    }

    // Normaliza para array
    let gastos = [];
    if (data.gastos && Array.isArray(data.gastos)) {
        gastos = data.gastos;
    } else if (!data.gastos && data.valor) {
        gastos = [data];
    }

    if (gastos.length === 0) {
        // Se não extraiu nada
        await message.reply("🤔 Não consegui identificar os valores. Pode repetir?");
        return;
    }

    let respostaFinal = "✅ Gastos salvos:\n";
    const CATEGORIAS_VALIDAS = [
        'Alimentação', 'Transporte', 'Lazer', 'Contas',
        'Saúde', 'Educação', 'Vestuário', 'Casa', 'Outros',
        'Salário', 'Investimentos', 'Receita' // Receitas
    ];

    for (const gasto of gastos) {
        // Validação extra
        if (!gasto.valor) continue;

        // CORREÇÃO DE DESCRIÇÃO (Undefined fix)
        // Se a descrição for vazia, usa a categoria original ou um texto padrão
        gasto.descricao = gasto.descricao || gasto.categoria || "Gasto";

        // VALIDAÇÃO DE CATEGORIA (Interactive Clarification)
        // Normaliza para Title Case para comparar (Alimentação, Alimentacao...)
        const catNormalizada = CATEGORIAS_VALIDAS.find(c => c.toLowerCase() === gasto.categoria.toLowerCase());

        if (!catNormalizada && gasto.tipo !== 'receita') {
            // Se a categoria não for válida (ex: "Restaurante"), PERGUNTA ao usuário
            await message.reply(`🤔 O gasto de R$ ${gasto.valor} foi classificado como "${gasto.categoria}", mas minhas categorias oficiais são:\n\n` +
                `🍽️ Alimentação\n🚌 Transporte\n🎉 Lazer\n🏠 Casa\n👕 Vestuário\n💊 Saúde\n\n` +
                `Qual delas devo usar? Responda com o nome da categoria.`);
            return; // Interrompe o processo para esperar resposta (na v2 poderia guardar estado, aqui força reenvio)
        }

        // Se achou normalizada, usa ela
        if (catNormalizada) {
            gasto.categoria = catNormalizada;
        }

        await saveTransaction(userId, gasto);

        const valorFormatado = gasto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const emoji = gasto.tipo === 'receita' ? '🤑' : '💸';
        respostaFinal += `- ${emoji} ${valorFormatado} (${gasto.categoria}): ${gasto.descricao}\n`;
    }

    await message.reply(respostaFinal);
}

// Função auxiliar de Transcoding (FFmpeg)
function transcodeAudioToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = require('child_process').spawn(ffmpegPath, [
            '-i', inputPath,
            '-acodec', 'libmp3lame',
            '-b:a', '128k',
            outputPath
        ]);
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(`FFmpeg process exited with code ${code}`);
        });
        ffmpeg.on('error', (err) => reject(err));
    });
}
client.initialize();
