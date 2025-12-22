const transactionRepo = require('../repositories/TransactionRepository');
const { generateBatchEmbeddings } = require('../services/openaiService');
const { formatToISO } = require('../utils/dateUtility');
const FormatterService = require('../services/formatterService');

const currencyService = require('./currencyService');

// --- DATA PROCESSOR (Batch Optimization) ---
// replyCallback(text) -> Promise<void>
async function processExtractedData(content, userId, replyCallback) {
    let data;
    try {
        data = typeof content === 'string' ? JSON.parse(content.replace(/```json|```/g, '').trim()) : content;
        if (typeof data === 'string') data = JSON.parse(data);
    } catch { return; }

    if (data.pergunta) return replyCallback(data.pergunta);
    if (data.ignorar) return replyCallback(data.resposta || "🤖 Olá!");

    // Merge arrays to avoid shadowing (Zod might default transacoes to [])
    const txA = data.transacoes || [];
    const txB = data.gastos || [];
    // Also support legacy single 'valor' object
    const legacySingle = data.valor ? [data] : [];

    const transacoes = [...txA, ...txB, ...legacySingle];
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

    if (!transacoes.length) return replyCallback("🤔 Não encontrei transações nem valor total nesta fatura.");

    // 1. Prepare Data & Descriptions with Currency Conversion
    const validItems = [];
    const textsForEmbedding = [];

    for (const g of transacoes) {
        if (!g.valor) continue;
        g.descricao = g.descricao || "Item";
        g.categoria = g.categoria || "Outros";

        // Lógica de Conversão
        const taxa = await currencyService.getExchangeRate(g.moeda);
        let valorFinal = g.valor;

        // Se a taxa for diferente de 1, converte
        if (taxa !== 1.0) {
            valorFinal = g.valor * taxa;
        }

        const itemProcessed = {
            ...g,
            valor: valorFinal, // Valor em BRL
            valor_original: g.valor, // Valor original
            moeda_original: g.moeda || 'BRL',
            taxa_cambio: taxa,
            data: g.data // Mantém data original para formatação posterior
        };

        validItems.push(itemProcessed);
        textsForEmbedding.push(`${g.descricao} - ${g.categoria}`);
    }

    if (validItems.length === 0) return replyCallback("🤔 Nenhum valor válido encontrado.");

    // 2. Batch Embeddings (Optimized API Call)
    const embeddings = await generateBatchEmbeddings(textsForEmbedding);

    // 4. Prepare Batch Insert payload
    const confidenceScore = typeof data.confidence_score === 'number' ? data.confidence_score : 1.0;
    const status = confidenceScore < 0.7 ? 'pending_review' : 'confirmed';

    const payload = validItems.map((g, idx) => ({
        user_id: userId,
        prompt_version: data.prompt_version || 'v1_stable', // A/B Testing Version
        valor: g.valor, // Convertido em BRL
        valor_original: g.valor_original,
        moeda_original: g.moeda_original,
        taxa_cambio: g.taxa_cambio,
        categoria: g.categoria,
        descricao: g.descricao,
        data: formatToISO(g.data), // Use new ISO formatter
        tipo: g.tipo || 'despesa',
        embedding: embeddings[idx], // Match index

        // Reliability Fields
        confidence_score: confidenceScore,
        status: status,
        is_validated: status === 'confirmed' // If high confidence, auto-validate? Or just keep false? Let's say false unless explicitly confirmed. Actually, if >= 0.7, we might assume it's good but let user validate in dashboard. But per user requirements "Se input for ambíguo (<0.7) ... se > 0.7 segue normal".
    }));

    // 4. Perform Batch Insert (Optimized DB Call)
    const savedTxs = await transactionRepo.createMany(payload);

    // 5. Build Response or Return State
    if (status === 'pending_review') {
        // Return info for handlers to ask confirmation
        return {
            status: 'pending_review',
            transactions: savedTxs,
            confidence: confidenceScore,
            original_data: data
        };
    }

    // Normal Flow (High Confidence)
    let response = "";
    if (savedTxs && savedTxs.length > 0) {
        savedTxs.forEach((tx, idx) => {
            const displayObj = {
                ...payload[idx],
                moeda: 'BRL' // Exibe em BRL pois já foi convertido
            };
            response += FormatterService.formatSuccessMessage(displayObj);
        });
        await replyCallback(response.trim());

        return { status: 'success', transactions: savedTxs };
    } else {
        await replyCallback(FormatterService.formatErrorMessage("Erro ao salvar dados."));
        return { status: 'error' };
    }
}

module.exports = { processExtractedData };
