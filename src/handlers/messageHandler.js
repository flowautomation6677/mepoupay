const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const supabase = require('../services/supabaseClient');
const { openai, chatCompletion, analyzeImage, transcribeAudio, generateEmbedding } = require('../services/openaiService');

// FORÇANDO via Variável de Ambiente
process.env.FFMPEG_PATH = ffmpegPath;

/**
 * Normaliza data DD/MM/YYYY para ISO YYYY-MM-DD
 */
function parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr;
    const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
    return new Date().toISOString();
}

/**
 * Transcoding Helper
 */
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

/**
 * Core User Management
 */
async function getOrCreateUser(whatsappNumber) {
    const { data: existingUser } = await supabase
        .from('perfis')
        .select('*')
        .eq('whatsapp_number', whatsappNumber)
        .single();

    if (existingUser) return existingUser;

    const { data: newUser, error } = await supabase
        .from('perfis')
        .insert([{ whatsapp_number: whatsappNumber }])
        .select()
        .single();

    if (error) console.error("Erro ao criar usuário:", error);
    return newUser;
}

/**
 * RAG Search
 */
async function searchSimilarTransactions(queryText) {
    const queryEmbedding = await generateEmbedding(queryText);
    if (!queryEmbedding) return [];

    const { data, error } = await supabase.rpc('match_transacoes', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
    });

    if (error) {
        console.error("Erro na busca semântica:", error);
        return [];
    }
    return data || [];
}

/**
 * Save Transaction
 */
async function saveTransaction(userId, transactionData) {
    const descFinal = transactionData.descricao || transactionData.categoria || "Gasto Diverso";
    const descricaoCompleta = `${descFinal} - ${transactionData.categoria}`;
    const embedding = await generateEmbedding(descricaoCompleta);
    const dataFormatada = parseDate(transactionData.data);

    // Garante que valores de entrada são positivos mas marcados como receita
    // O banco pode tratar sinal se necessário, mas aqui seguimos a regra de negócio do prompt

    const { data, error } = await supabase
        .from('transacoes')
        .insert([{
            user_id: userId,
            valor: transactionData.valor,
            categoria: transactionData.categoria,
            descricao: descFinal,
            data: dataFormatada,
            tipo: transactionData.tipo || 'despesa',
            embedding: embedding
        }])
        .select()
        .single();

    if (error) {
        console.error("Erro ao salvar transação:", error);
        return null;
    }
    return data;
}

// --- TOOLS FUNCTIONS (Moved from index.js) ---

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

    if (category) query = query.ilike('categoria', `%${category}%`);

    const { data: transacoes, error } = await query;
    if (error || !transacoes) return "Erro ao buscar dados.";

    const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transacoes.filter(t => t.tipo !== 'receita').reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;

    return JSON.stringify({ receitas, despesas, saldo, detalhes: `Encontradas ${transacoes.length} transações.` });
}

async function getFinancialHealth({ userId }) {
    const hoje = new Date();
    const startDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
    const endDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString();

    const { data: transacoes } = await supabase.from('transacoes').select('valor, tipo').eq('user_id', userId).gte('data', startDate).lt('data', endDate);
    if (!transacoes) return "Erro ao consultar saúde.";

    const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transacoes.filter(t => t.tipo !== 'receita').reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;

    const { data: perfil } = await supabase.from('perfis').select('financial_goal').eq('id', userId).single();

    return JSON.stringify({ saldo_atual: saldo, total_entradas: receitas, total_saidas: despesas, meta_usuario: perfil?.financial_goal || "N/D" });
}

async function getTopCategories({ userId }) {
    const past = new Date();
    past.setDate(past.getDate() - 30);
    const { data: transacoes } = await supabase.from('transacoes').select('valor, categoria').eq('user_id', userId).eq('tipo', 'despesa').gte('data', past.toISOString());

    if (!transacoes) return "Erro ao analisar.";
    const categorias = {};
    transacoes.forEach(t => { categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor; });

    const sorted = Object.entries(categorias).sort(([, a], [, b]) => b - a).slice(0, 3).map(([c, v]) => `${c}: R$ ${v.toFixed(2)}`);
    return JSON.stringify({ top_categorias: sorted });
}

async function manageProfile({ userId, action, value }) {
    if (action === 'set_goal') {
        const { error } = await supabase.from('perfis').update({ financial_goal: value }).eq('id', userId);
        return error ? "Erro" : `Meta definida: "${value}"`;
    }
    if (action === 'get_goal') {
        const { data } = await supabase.from('perfis').select('financial_goal').eq('id', userId).single();
        return `Meta atual: ${data?.financial_goal || "N/D"}`;
    }
    return "Ação desconhecida.";
}

// --- MAIN PROCESSOR ---

async function processAIResponse(jsonContent, message, userId) {
    let data;
    try {
        const cleanJson = jsonContent.replace(/```json|```/g, '').trim();
        data = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Erro Parse JSON IA:", e);
        return;
    }

    if (data.pergunta) {
        await message.reply(`🤔 ${data.pergunta}`);
        return;
    }
    if (data.ignorar) {
        await message.reply(data.resposta || "🤖 Olá!");
        return;
    }

    let gastos = data.gastos || (data.valor ? [data] : []);
    if (gastos.length === 0) {
        await message.reply("🤔 Não captei valores. Pode repetir?");
        return;
    }

    let respostaFinal = "";
    let saveCount = 0;
    const CATEGORIAS_VALIDAS = ['Alimentação', 'Transporte', 'Lazer', 'Contas', 'Saúde', 'Educação', 'Vestuário', 'Casa', 'Outros', 'Salário', 'Investimentos', 'Receita'];

    for (const gasto of gastos) {
        if (!gasto.valor) continue;

        gasto.descricao = gasto.descricao || gasto.item || "Gasto Diverso";
        gasto.categoria = gasto.categoria || "Outros"; // Fallback robusto

        const catNormalizada = CATEGORIAS_VALIDAS.find(c => c.toLowerCase() === gasto.categoria.toLowerCase());

        if (!catNormalizada && gasto.tipo !== 'receita') {
            // Fallback implícito para Outros se não reconhecer, para não travar o flow
            gasto.categoria = "Outros";
        } else if (catNormalizada) {
            gasto.categoria = catNormalizada;
        }

        const savedTx = await saveTransaction(userId, gasto);

        if (savedTx) {
            saveCount++;
            const valorFormatado = Math.abs(gasto.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            respostaFinal += `✅ ${gasto.tipo === 'receita' ? 'Entrada' : 'Gasto'} Registrado!\n` +
                `🪙 ${gasto.categoria} (${gasto.descricao})\n` +
                `💰 ${valorFormatado}\n` +
                `🗓️ ${gasto.data || new Date().toLocaleDateString('pt-BR')} – ID: ${savedTx.id}\n\n`;
        }
    }

    if (saveCount === 0) {
        await message.reply("🤔 Identifiquei itens, mas sem valores válidos.");
    } else {
        await message.reply(respostaFinal.trim());
    }
}

// --- EXPORTED HANDLER ---

const userContexts = {}; // Ainda em memória por simplicidade do refactor phase 1

async function handleMessage(message) {
    try {
        console.log(`\n--- MSG: ${message.from} | ${message.type} ---`);

        const user = await getOrCreateUser(message.from);
        if (!user) {
            await message.reply('❌ Erro de Perfil.');
            return;
        }

        if (!userContexts[user.id]) userContexts[user.id] = [];

        // Reset Command
        if (['/reset', '/limpar'].includes(message.body.toLowerCase().trim())) {
            userContexts[user.id] = [];
            await message.reply('🧠 Memória limpa!');
            return;
        }

        let textToProcess = message.body;

        // 1. Mídia (Imagem/Audio)
        if (message.hasMedia) {
            const media = await message.downloadMedia();
            // console.log(`Mídia: ${media.mimetype}`);

            if (media.mimetype.includes('image')) {
                await message.reply('🧐 Analisando recibo...');
                try {
                    const rawContent = await analyzeImage(media.data, media.mimetype);
                    console.log("🤖 Vision Raw:", rawContent);
                    await processAIResponse(rawContent, message, user.id);
                } catch (e) {
                    console.error("Erro Vision:", e);
                    await message.reply("❌ Erro ao ler imagem.");
                }
                return;
            }

            if (media.mimetype.includes('audio')) {
                await message.reply('🎧 Ouvindo...');
                try {
                    const tempOgg = path.join(__dirname, `../../temp_${message.id.id}.ogg`);
                    const tempMp3 = path.join(__dirname, `../../temp_${message.id.id}.mp3`);

                    fs.writeFileSync(tempOgg, Buffer.from(media.data, 'base64'));
                    await transcodeAudioToMp3(tempOgg, tempMp3);

                    textToProcess = await transcribeAudio(tempMp3);
                    console.log('🗣️ Transcrição:', textToProcess);
                    await message.reply(`📝: "${textToProcess}"`);

                    fs.unlinkSync(tempOgg);
                    fs.unlinkSync(tempMp3);
                } catch (e) {
                    console.error("Erro Audio:", e);
                    await message.reply("❌ Erro no áudio.");
                    return;
                }
            }
        }

        if (!textToProcess) return;

        // 2. RAG & Chat
        const similarDocs = await searchSimilarTransactions(textToProcess);
        const contextStr = similarDocs.map(d => `- ${d.descricao}: R$ ${d.valor}`).join('\n');

        const tools = [
            { type: "function", function: { name: "get_financial_health", description: "Saúde financeira (saldo, entradas, saídas).", parameters: { type: "object", properties: {}, required: [] } } },
            { type: "function", function: { name: "get_top_categories", description: "Top 3 gastos.", parameters: { type: "object", properties: {}, required: [] } } },
            { type: "function", function: { name: "manage_profile", description: "Gerenciar meta.", parameters: { type: "object", properties: { action: { type: "string", enum: ["set_goal", "get_goal"] }, value: { type: "string" } }, required: ["action"] } } },
            { type: "function", function: { name: "get_spending_summary", description: "Resumo por período.", parameters: { type: "object", properties: { period: { type: "string", enum: ["current_month", "last_month"] }, category: { type: "string" } }, required: ["period"] } } }
        ];

        const systemPrompt = `Você é o **Porquim 360**. Hoje: ${new Date().toLocaleDateString('pt-BR')}.
        🧠 Memória: ${contextStr || "N/D"}
        📋 DIRETRIZES:
        1. Registro: Se for financeiro, retorne JSON puro:
           { "gastos": [{ "descricao": "...", "valor": 10.50, "categoria": "...", "tipo": "despesa" | "receita" }] }
        2. Entradas: Valor POSITIVO, tipo "receita".
        3. Formatação: Negrito em valores.
        4. Se usuário pedir dados, chame Tools.`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...userContexts[user.id],
            { role: "user", content: textToProcess }
        ];

        const completion = await chatCompletion(messages, tools);
        const responseMessage = completion.choices[0].message;

        // Tool Execution
        if (responseMessage.tool_calls) {
            const toolResults = [];
            for (const t of responseMessage.tool_calls) {
                const args = JSON.parse(t.function.arguments);
                let result = "";

                if (t.function.name === 'get_financial_health') result = await getFinancialHealth({ userId: user.id });
                if (t.function.name === 'get_spending_summary') result = await getSpendingSummary({ userId: user.id, ...args });
                if (t.function.name === 'get_top_categories') result = await getTopCategories({ userId: user.id });
                if (t.function.name === 'manage_profile') result = await manageProfile({ userId: user.id, ...args });

                toolResults.push({ role: "tool", tool_call_id: t.id, content: result });
            }

            messages.push(responseMessage);
            messages.push(...toolResults);

            const secondResponse = await chatCompletion(messages);
            const finalContent = secondResponse.choices[0].message.content;
            await message.reply(finalContent);

            userContexts[user.id].push({ role: "user", content: textToProcess });
            userContexts[user.id].push({ role: "assistant", content: finalContent });
            return;
        }

        // Processing Normal Response (JSON or Text)
        const content = responseMessage.content;
        const jsonMatch = content.match(/(\{[\s\S]*"gastos"[\s\S]*\}|\{[\s\S]*"valor"[\s\S]*\})/);

        if (jsonMatch) {
            await processAIResponse(jsonMatch[0], message, user.id);
        } else if (content.trim().startsWith('{')) {
            await processAIResponse(content, message, user.id);
        } else {
            await message.reply(content);
        }

        userContexts[user.id].push({ role: "user", content: textToProcess });
        userContexts[user.id].push({ role: "assistant", content: content });
        if (userContexts[user.id].length > 10) userContexts[user.id] = userContexts[user.id].slice(-10);

    } catch (err) {
        console.error("❌ Erro Handler:", err);
    }
}

module.exports = { handleMessage };
