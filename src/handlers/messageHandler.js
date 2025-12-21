const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const supabase = require('../services/supabaseClient');
const { chatCompletion, analyzeImage, transcribeAudio, generateEmbedding, generateBatchEmbeddings } = require('../services/openaiService');
const imageStrategy = require('../strategies/ImageStrategy');
const audioStrategy = require('../strategies/AudioStrategy');
const pdfStrategy = require('../strategies/PdfStrategy'); // NEW
const textStrategy = require('../strategies/TextStrategy');
const userRepo = require('../repositories/UserRepository');
const transactionRepo = require('../repositories/TransactionRepository');

// FORÇANDO via Variável de Ambiente
process.env.FFMPEG_PATH = ffmpegPath;

// --- HELPERS ---

function parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr;
    const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    return brMatch ? `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}` : new Date().toISOString();
}

// --- FORMATTER ---
// --- FORMATTER ---
function formatSuccessMessage(gasto, savedTxId) {
    const valor = Math.abs(gasto.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    // User requested "✅ Gasto Registrado!", but we should distinguish Revenue? 
    // "✅ Gasto Registrado!" seems to be a template. Let's respect it but maybe adapt for Revenue if 'tipo' is 'receita'.
    // User said: "Template String: ... ✅ Gasto Registrado! ..."
    // I will use "Transação Registrada" or keep "Gasto" ? 
    // Let's stick to the requested "✅ Gasto Registrado!" for expenses, and maybe "✅ Entrada Registrada!" for income.

    const titulo = gasto.tipo === 'receita' ? '✅ Entrada Registrada!' : '✅ Gasto Registrado!';

    return `${titulo}\n\n` +
        `🪙 ${gasto.categoria} (${gasto.descricao})\n` +
        `💰 R$ ${valor}\n` +
        `🗓️ ${gasto.dataFormatted || parseDate(gasto.data)}\n\n`; // savedTxId removed as not in User Template
}

// --- DATA PROCESSOR (Batch Optimization) ---
async function processExtractedData(content, message, userId) {
    let data;
    try {
        data = typeof content === 'string' ? JSON.parse(content.replace(/```json|```/g, '').trim()) : content;
        if (typeof data === 'string') data = JSON.parse(data);
    } catch { return; }

    if (data.pergunta) return message.reply(data.pergunta);
    if (data.ignorar) return message.reply(data.resposta || "🤖 Olá!");

    const transacoes = data.transacoes || data.gastos || (data.valor ? [data] : []);
    const totalFatura = data.total_fatura;

    // Se não achou transações mas achou TOTAL DA FATURA, sugere registrar o pagamento da fatura
    if (!transacoes.length && totalFatura) {
        transacoes.push({
            descricao: `Pagamento de Fatura (Venc: ${data.vencimento || '?'})`,
            valor: totalFatura,
            categoria: "Pagamento de Fatura",
            tipo: "despesa",
            data: data.vencimento || new Date().toISOString().split('T')[0]
        });
    }

    if (!transacoes.length) return message.reply("🤔 Não encontrei transações nem valor total nesta fatura.");

    // 1. Prepare Data & Descriptions
    const validItems = [];
    const textsForEmbedding = [];

    for (const g of transacoes) {
        if (!g.valor) continue;
        g.descricao = g.descricao || "Item";
        g.categoria = g.categoria || "Outros";
        g.dataFormatted = parseDate(g.data);

        validItems.push(g);
        textsForEmbedding.push(`${g.descricao} - ${g.categoria}`);
    }

    if (validItems.length === 0) return message.reply("🤔 Nenhum valor válido encontrado.");

    // 2. Batch Embeddings (Optimized API Call)
    const embeddings = await generateBatchEmbeddings(textsForEmbedding);

    // 3. Prepare Batch Insert payload
    const payload = validItems.map((g, idx) => ({
        user_id: userId,
        valor: g.valor,
        categoria: g.categoria,
        descricao: g.descricao,
        data: g.dataFormatted,
        tipo: g.tipo || 'despesa',
        embedding: embeddings[idx] // Match index
    }));

    // 4. Perform Batch Insert (Optimized DB Call)
    const savedTxs = await transactionRepo.createMany(payload);

    // 5. Build Response
    let response = "";
    if (savedTxs && savedTxs.length > 0) {
        savedTxs.forEach((tx, idx) => {
            response += formatSuccessMessage(payload[idx], tx.id);
        });
        await message.reply(response.trim());
    } else {
        await message.reply("❌ Erro ao salvar dados.");
    }
}

// --- MAIN CONTROLLER ---
const userContexts = {};

// MEMORY CLEANUP (Garbage Collection)
// Cleans inactive contexts every hour to prevent Memory Leaks
setInterval(() => {
    // For MVP, brute force clear to ensure stability
    for (const userId in userContexts) {
        delete userContexts[userId];
    }
    console.log("🧹 Garbage Collector ran: Memory Cleared.");
}, 1000 * 60 * 60 * 4); // 4 Hours

async function handleMessage(message) {
    try {
        console.log(`\n--- MSG: ${message.from} ---`);

        const user = await userRepo.findByPhone(message.from) || await userRepo.create(message.from);
        if (!user) return message.reply('❌ Erro de Perfil.');

        // Memory Init
        if (!userContexts[user.id]) userContexts[user.id] = [];

        // Strategy Selection
        let result = null;

        // 0. State Check: Waiting for PDF Password?
        if (userContexts[user.id] && userContexts[user.id].pendingPdf) {
            // Assume text is password
            const password = message.body.trim();
            const pendingFile = userContexts[user.id].pendingPdf;

            console.log(`[PDF] Tentando desbloquear com senha: ${password}`);
            const retryResult = await pdfStrategy.retryWithPassword(pendingFile, password);

            if (retryResult.success) {
                // Sucesso: Limpa estado e processa
                delete userContexts[user.id].pendingPdf;
                await message.reply("🔓 PDF Desbloqueado! Processando...");
                await processExtractedData(retryResult.data, message, user.id);
                return; // Fim do fluxo de senha
            } else {
                // Falha: Pede de novo ou cancela? Manda msg de erro
                return message.reply(`❌ ${retryResult.error || "Senha incorreta."} Tente novamente ou envie outro arquivo.`);
            }
        }

        if (message.hasMedia) {
            // MIME TYPE CHECK
            // WhatsApp Web JS docs: message.mimetype might be available?
            // Or detect by type 'document'
            if (message.type === 'image') {
                result = await imageStrategy.execute(message);
            } else if (message.type === 'ptt' || message.type === 'audio') {
                result = await audioStrategy.execute(message);
            } else if (message.type === 'document' && (message._data.mimetype === 'application/pdf' || message.body.endsWith('.pdf'))) {
                // PDF Strategy
                result = await pdfStrategy.execute(message);
            }
        } else {
            result = { type: 'text_command', content: message.body };
        }

        if (!result) return;

        // --- Result Handling ---
        if (result.type === 'pdf_password_request') {
            // Salva estado para esperar senha
            userContexts[user.id].pendingPdf = result.fileBuffer; // Base64
            // Define timeout para limpar memória (5 min)
            setTimeout(() => {
                if (userContexts[user.id] && userContexts[user.id].pendingPdf) {
                    delete userContexts[user.id].pendingPdf;
                    console.log(`[PDF] Timeout senha user ${user.id}`);
                }
            }, 5 * 60 * 1000);

            return message.reply("🔒 Este arquivo PDF é protegido por senha.\nDigite a senha para que eu possa ler:");
        }

        if (result.type === 'data_extraction') {
            await processExtractedData(result.content, message, user.id);
        } else if (result.type === 'system_error') {
            // Reply directly with error, do NOT send to AI
            await message.reply(`❌ ${result.content}`);
        } else if (result.type === 'text_command') {
            const response = await textStrategy.execute(result.content, message, user, userContexts[user.id]);

            if (response.type === 'ai_response' || response.type === 'tool_response') {
                const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

                // Robust JSON Extraction
                let jsonStr = text;
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    jsonStr = text.substring(firstBrace, lastBrace + 1);
                }

                // Check if it looks like our schema before trying to process
                if (jsonStr.includes('"gastos"') || jsonStr.includes('"transacoes"') || jsonStr.includes('"valor"')) {
                    try {
                        await processExtractedData(jsonStr, message, user.id);
                    } catch (e) {
                        // Fallback: If processing fails, reply with text (or maybe error msg)
                        console.error("JSON Processing Fail:", e);
                        await message.reply(text);
                    }
                } else {
                    await message.reply(text);
                }

                userContexts[user.id].push({ role: "user", content: result.content });
                userContexts[user.id].push({ role: "assistant", content: text });
                if (userContexts[user.id].length > 10) userContexts[user.id] = userContexts[user.id].slice(-10);
            }
        }

    } catch (err) {
        console.error("❌ Controller Error:", err);
    }
}

module.exports = { handleMessage };
