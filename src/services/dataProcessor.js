const transactionRepo = require('../repositories/TransactionRepository');
const { generateBatchEmbeddings } = require('../services/openaiService');

// --- HELPERS ---

function parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    // Se já for YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr.split('T')[0];
    // Se for DD/MM/YYYY
    const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    return brMatch ? `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}` : new Date().toISOString().split('T')[0];
}

function formatDateDisplay(dateStr) {
    const iso = parseDate(dateStr);
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function formatSuccessMessage(gasto, savedTxId) {
    const valor = Math.abs(gasto.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const titulo = gasto.tipo === 'receita' ? '✅ Entrada Registrada!' : '✅ Gasto Registrado!';

    return `${titulo}\n\n` +
        `🪙 ${gasto.categoria} (${gasto.descricao})\n` +
        `💰 R$ ${valor}\n` +
        `🗓️ ${formatDateDisplay(gasto.data)}\n\n`;
}

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

    if (!transacoes.length) return replyCallback("🤔 Não encontrei transações nem valor total nesta fatura.");

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

    if (validItems.length === 0) return replyCallback("🤔 Nenhum valor válido encontrado.");

    // 2. Batch Embeddings (Optimized API Call)
    const embeddings = await generateBatchEmbeddings(textsForEmbedding);

    // 3. Prepare Batch Insert payload
    const payload = validItems.map((g, idx) => ({
        user_id: userId,
        valor: g.valor,
        categoria: g.categoria,
        descricao: g.descricao,
        data: g.dataFormatted || parseDate(g.data), // Ensure ISO YYYY-MM-DD for DB
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
        await replyCallback(response.trim());
    } else {
        await replyCallback("❌ Erro ao salvar dados.");
    }
}

module.exports = { processExtractedData };
