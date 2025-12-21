const supabase = require('../services/supabaseClient');

class TransactionRepository {
    async create(transactionData) {
        const { data, error } = await supabase.from('transacoes').insert([transactionData]).select().single();
        if (error) console.error("Repo Error (Tx.create):", error);
        return data;
    }

    async createMany(transactionsData) {
        const { data, error } = await supabase.from('transacoes').insert(transactionsData).select();
        if (error) console.error("Repo Error (Tx.createMany):", error);
        return data || [];
    }

    async findByUserAndDateRange(userId, startDate, endDate) {
        const { data, error } = await supabase
            .from('transacoes')
            .select('*')
            .eq('user_id', userId)
            .gte('data', startDate)
            .lt('data', endDate);

        if (error) console.error("Repo Error (Tx.findRange):", error);
        return data || [];
    }

    async findTopCategories(userId, startDate) {
        const { data, error } = await supabase
            .from('transacoes')
            .select('valor, categoria')
            .eq('user_id', userId)
            .eq('tipo', 'despesa')
            .gte('data', startDate);

        if (error) console.error("Repo Error (Tx.topCat):", error);
        return data || [];
    }

    async searchSimilar(embedding) {
        const { data, error } = await supabase.rpc('match_transacoes', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5
        });
        if (error) console.error("Repo Error (Tx.search):", error);
        return data || [];
    }
}

module.exports = new TransactionRepository();
