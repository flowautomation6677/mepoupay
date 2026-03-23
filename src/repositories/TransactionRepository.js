// Client is now injected via constructor for Security (RLS Segregation)
const logger = require('../services/loggerService');

class TransactionRepository {
    constructor(supabaseClient) {
        if (supabaseClient) {
            this.supabase = supabaseClient;
        } else {
            // Fallback to public client if service key is missing
            const { supabase } = require('../services/supabaseClient');
            this.supabase = supabase;
            logger.warn("TransactionRepository initialized with NULL client. Falling back to public client.");
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
            .select('*, categories(name)')
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

    async deleteLastByUser(userId) {
        const { data: last, error: findError } = await this.supabase
            .from('transactions')
            .select('id, description, amount, type')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (findError || !last) {
            logger.warn("Repo: no transaction found to delete", { userId });
            return null;
        }

        const { error: deleteError } = await this.supabase
            .from('transactions')
            .delete()
            .eq('id', last.id);

        if (deleteError) {
            logger.error("Repo Error (Tx.deleteLast)", { error: deleteError });
            throw deleteError;
        }

        logger.info("Tx deleted (last)", { userId, txId: last.id });
        return last;
    }

    async updateByIds(transactionIds, userId, updates) {
        if (!transactionIds || transactionIds.length === 0) return [];

        // Atualizar baseado nos IDs exatos recuperados da memória de curto prazo (Redis)
        const { data, error } = await this.supabase
            .from('transactions')
            .update(updates)
            .in('id', transactionIds)
            .eq('user_id', userId)
            .select();

        if (error) {
            logger.error("Repo Error (Tx.updateByIds)", { error, transactionIds });
            throw error;
        }

        logger.info("Tx updated by Short-Term Memory IDs", { userId, count: data?.length });
        return data || [];
    }

    async updateLastByUser(userId, updates) {
        // Fallback: se o cache expirar ou não houver, atualiza só o id recém criado
        const { data: last, error: findError } = await this.supabase
            .from('transactions')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (findError || !last) {
            logger.warn("Repo: no transaction found to update (Fallback)", { userId });
            return null;
        }

        const { data, error: updateError } = await this.supabase
            .from('transactions')
            .update(updates)
            .eq('id', last.id)
            .select()
            .single();

        if (updateError) {
            logger.error("Repo Error (Tx.updateLast)", { error: updateError });
            throw updateError;
        }

        logger.info("Tx updated (last Fallback)", { userId, txId: last.id });
        return data;
    }

    // Static helper if needed, or factory
    static withClient(client) {
        return new TransactionRepository(client);
    }
}

module.exports = TransactionRepository;
