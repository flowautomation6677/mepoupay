// Client is now injected via constructor for Security (RLS Segregation)
const logger = require('../services/loggerService');

class TransactionRepository {
    constructor(supabaseClient) {
        if (!supabaseClient) {
            // Fallback to public client if service key is missing, 
            // OR log error if strict isolation is needed. sw
            // For now, logging warning and falling back to check what was passed.
            const { supabase } = require('../services/supabaseClient');
            this.supabase = supabase;
            logger.warn("TransactionRepository initialized with NULL client. Falling back to public client.");
        } else {
            this.supabase = supabaseClient;
        }
    }

    async create(transactionData) {
        const { data, error } = await this.supabase
            .from('transactions')
            .insert([transactionData])
            .select()
            .single();

        if (error) {
            logger.error("Repo Error (Tx.create)", { error, data: transactionData });
            throw error;
        }
        return data;
    }

    async createMany(transactionsData) {
        if (!transactionsData || transactionsData.length === 0) return [];

        const { data, error } = await this.supabase
            .from('transactions')
            .insert(transactionsData)
            .select();

        if (error) {
            logger.error("Repo Error (Tx.createMany)", { error });
            throw error;
        }
        return data || [];
    }

    async findByUserAndDateRange(userId, startDate, endDate) {
        const { data, error } = await this.supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lt('date', endDate)
            .order('date', { ascending: false });

        if (error) {
            logger.error("Repo Error (Tx.findRange)", { error });
            return [];
        }
        return data || [];
    }

    async findTopCategories(userId, startDate) {
        const { data, error } = await this.supabase
            .from('transactions')
            .select('amount, categories(name)')
            .eq('user_id', userId)
            .eq('type', 'EXPENSE')
            .gte('date', startDate);

        if (error) {
            logger.error("Repo Error (Tx.topCat)", { error });
            return [];
        }
        return data || [];
    }

    async searchSimilar(embedding) {
        const { data, error } = await this.supabase.rpc('match_transactions', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5
        });

        if (error) {
            logger.error("Repo Error (Tx.search)", { error });
            return [];
        }
        return data || [];
    }

    // Static helper if needed, or factory
    static withClient(client) {
        return new TransactionRepository(client);
    }
}

module.exports = TransactionRepository;
