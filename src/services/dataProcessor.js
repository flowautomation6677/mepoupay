const TransactionRepository = require('../repositories/TransactionRepository');
const { adminClient } = require('./supabaseClient');

// Inject Admin Client (Bot context)
const transactionRepo = new TransactionRepository(adminClient);

const transactionEmbeddingService = require('./transactionEmbeddingService');
const currencyService = require('./currencyService');
const FormatterService = require('../services/formatterService');
const sessionService = require('../services/sessionService');
const { formatToISO, getExactTimestamp } = require('../utils/dateUtility');

// --- DATA PROCESSOR (Batch Optimization) ---

// --- Helpers ---

function _parseContent(content) {
    try {
        let data = typeof content === 'string' ? JSON.parse(content.replaceAll(/```json|```/g, '').trim()) : content;
        if (typeof data === 'string') data = JSON.parse(data);
        return data;
    } catch {
        return null;
    }
}

function _normalizeTransactions(data) {
    // Merge arrays to avoid shadowing
    const txA = data.transacoes || [];
    const txB = data.gastos || [];
    const legacySingle = data.valor ? [data] : [];

    const transacoes = [...txA, ...txB, ...legacySingle];
    const totalFatura = data.total_fatura;

    if (!transacoes.length && totalFatura) {
        transacoes.push({
            descricao: `Pagamento de Fatura (Venc: ${data.vencimento || '?'})`,
            valor: totalFatura,
            categoria: "Pagamento de Fatura",
            tipo: "despesa",
            data: data.vencimento || new Date().toISOString().split('T')[0]
        });
    }
    return transacoes;
}

async function _processItems(transacoes) {
    const validItems = [];
    for (const g of transacoes) {
        if (!g.valor) continue;
        g.descricao = g.descricao || "Item";
        g.categoria = g.categoria || "Outros";

        const { convertedValue, exchangeRate } = await currencyService.convertValue(g.valor, g.moeda);

        validItems.push({
            ...g,
            valor: convertedValue, // Valor em BRL
            valor_original: g.valor, // Valor original
            moeda_original: g.moeda || 'BRL',
            taxa_cambio: exchangeRate,
            data: g.data // Mantém data original para formatação posterior
        });
    }
    return validItems;
}

async function _resolveCategory(userId, categoria) {
    if (categoria) {
        const { data: catData } = await adminClient
            .from('categories')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', categoria)
            .limit(1)
            .single();
        if (catData) return catData.id;
    }

    const { data: fallbackCat } = await adminClient
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', 'Outros')
        .limit(1)
        .single();
    if (fallbackCat) return fallbackCat.id;

    const { data: anyCat } = await adminClient
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();
    return anyCat?.id ?? null;
}

async function _generatePayload(validItems, embeddings, userId, data) {
    const confidenceScore = typeof data.confidence_score === 'number' ? data.confidence_score : 1;
    const status = confidenceScore < 0.7 ? 'pending_review' : 'confirmed';

    // 1. Fetch user's default account
    const { data: accountData } = await adminClient
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

    if (!accountData) {
        throw new Error("Usuário não possui uma conta (carteira) configurada.");
    }

    const payload = [];

    // 2. Map and fetch categories for each item
    for (let idx = 0; idx < validItems.length; idx++) {
        const g = validItems[idx];
        const category_id = await _resolveCategory(userId, g.categoria);

        const typeEnum = g.tipo === 'receita' ? 'INCOME' : 'EXPENSE';

        payload.push({
            user_id: userId,
            account_id: accountData.id,
            category_id: category_id,
            amount: g.valor,
            type: typeEnum,
            description: g.descricao || 'Item sem descrição',
            date: getExactTimestamp(g.data),
            metadata: {
                valor_original: g.valor_original,
                moeda_original: g.moeda_original,
                taxa_cambio: g.taxa_cambio,
                categoria_original: g.categoria,
                prompt_version: data.prompt_version || 'v1_stable',
                embedding: embeddings[idx],
                confidence_score: confidenceScore
            },
            is_recurring: false,
            status: status
        });
    }

    return { payload, status, confidenceScore };
}

async function _handleResponse(savedTxs, payloadDetails, data, replyCallback) {
    const { status, payload, confidenceScore } = payloadDetails;

    if (status === 'pending_review') {
        return {
            status: 'pending_review',
            transactions: savedTxs,
            confidence: confidenceScore,
            original_data: data
        };
    }

    if (savedTxs && savedTxs.length > 0) {
        let response = "";
        savedTxs.forEach((tx, idx) => {
            const displayObj = {
                ...payload[idx], // Use payload for formatting as it has transformed data
                moeda: 'BRL'
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


// --- Main Function ---

// replyCallback(text) -> Promise<void>
async function processExtractedData(content, userId, replyCallback) {
    const data = _parseContent(content);
    if (!data) return;

    if (data.pergunta) return replyCallback(data.pergunta);
    if (data.ignorar) return replyCallback(data.resposta || "🤖 Olá!");

    // Deletion intent from AI
    if (data.acao === 'excluir_ultimo' && data.confirmado) {
        const deleted = await transactionRepo.deleteLastByUser(userId);
        if (!deleted) return replyCallback("🤔 Não encontrei nenhum lançamento para excluir.");
        const tipo = deleted.type === 'INCOME' ? 'receita' : 'despesa';
        return replyCallback(`🗑️ Lançamento excluído!\n\n*${deleted.description}* (${tipo}) — R$ ${Number(deleted.amount).toFixed(2)}`);
    }

    // Update Direct Intent from AI with Short-Term Memory
    if (data.acao === 'atualizar_ultimo' && data.gastos && data.gastos.length > 0) {
        // Obter os IDs das últimas transações a partir da memória de curto prazo (Redis)
        const lastTxIds = await sessionService.getLastTransactionIds(userId);

        let updatedTxs = [];
        const g = data.gastos[0]; // Só permite atualizar 1 pelo prompt direto

        // Conversão de moeda (caso alterem valor ou moeda na correção)
        const valParaConverter = g.valor || 0; // fallback para evitar null se só atualizou descrição
        const { convertedValue } = valParaConverter ? await currencyService.convertValue(valParaConverter, g.moeda) : { convertedValue: null };

        const updates = {};
        if (g.valor !== undefined && convertedValue !== null) updates.amount = convertedValue;

        // Evitando overwriting indesejado, como setar "Manter descrição anterior"
        if (g.descricao && !g.descricao.includes("Manter")) updates.description = g.descricao;

        if (g.categoria) {
            const category_id = await _resolveCategory(userId, g.categoria);
            if (category_id) updates.category_id = category_id;
        }

        if (g.tipo) {
            updates.type = g.tipo === 'receita' ? 'INCOME' : 'EXPENSE';
        }

        // Tenta usar a memória de curto prazo. Se vazar o ttl, usa o fallback de última transação
        if (lastTxIds && lastTxIds.length > 0) {
            updatedTxs = await transactionRepo.updateByIds(lastTxIds, userId, updates);
        } else {
            const updated = await transactionRepo.updateLastByUser(userId, updates);
            if (updated) updatedTxs = [updated];
        }

        if (updatedTxs && updatedTxs.length > 0) {
            await replyCallback(`✏️ Lançamento atualizado com sucesso!\n\nNovo valor: R$ ${Number(updatedTxs[updatedTxs.length - 1].amount).toFixed(2)}`);
            return;
        } else {
            await replyCallback("🤔 Entendi que você queria corrigir algo, mas não encontrei transações recentes no sistema para alterar.");
            return;
        }
    }

    const transacoes = _normalizeTransactions(data);
    if (!transacoes.length) return replyCallback("🤔 Não encontrei transações nem valor total nesta fatura.");

    const validItems = await _processItems(transacoes);
    if (validItems.length === 0) return replyCallback("🤔 Nenhum valor válido encontrado.");

    const embeddings = await transactionEmbeddingService.generateForTransactions(validItems);

    const payloadDetails = await _generatePayload(validItems, embeddings, userId, data);


    const savedTxs = await transactionRepo.createMany(payloadDetails.payload);

    // Salvar estado na Memória de Curto Prazo (Short-Term Memory)
    if (savedTxs && savedTxs.length > 0) {
        const ids = savedTxs.map(tx => tx.id);
        await sessionService.setLastTransactionIds(userId, ids);
    }

    return _handleResponse(savedTxs, payloadDetails, data, replyCallback);
}

module.exports = {
    processExtractedData,
    // Exporting helpers for testing purposes
    _parseContent,
    _normalizeTransactions,
    _processItems,
    _generatePayload,
    _handleResponse
};
