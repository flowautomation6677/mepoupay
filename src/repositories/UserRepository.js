const { publicClient, adminClient } = require('../services/supabaseClient');
const logger = require('../services/loggerService');

// Use Admin Client for Bot operations
const supabase = adminClient || publicClient;

class UserRepository {
    async findByPhone(phone) {
        // Retorna POJO (Plain Old JavaScript Object) ou null
        const { data, error } = await supabase
            .from('perfis')
            .select('*')
            .eq('whatsapp_number', phone)
            .single();

        logger.debug(`UserRepository findByPhone: ${phone}`, { data });

        if (error && error.code !== 'PGRST116') {
            logger.error("Repo Error (User.find)", { error });
            return null;
        }
        return data || null;
    }

    async create(phone, name = null) {
        // 1. Prepare Payload (Without 'name' as it was removed from schema)
        const payload = { whatsapp_number: phone };

        // 2. Insert into Perfis (ID triggered by trigger or we need to fetch user first?)
        // Note: Perfis uses `id` unrelated to phone usually, but let's assume standard flow
        const { data, error } = await supabase
            .from('perfis')
            .insert([payload])
            .select()
            .single();

        if (error) {
            logger.error("Repo Error (User.create)", { error });
            throw new Error("Falha ao criar usuário");
        }

        // 3. Update Auth Metadata if name is provided (Best Effort)
        if (name && adminClient) {
            const { error: authError } = await adminClient.auth.admin.updateUserById(
                data.id, // Assuming trigger links perfis.id to auth.id or we just inserted
                { user_metadata: { name: name, full_name: name } }
            );
            if (authError) logger.warn("Failed to set name on create", authError);
        }

        return data; // POJO
    }

    async updateName(userId, name) {
        if (!name) return;

        // 1. Update Auth Metadata (Source of Truth)
        if (adminClient) {
            const { error: authError } = await adminClient.auth.admin.updateUserById(
                userId,
                { user_metadata: { name: name, full_name: name } }
            );

            if (authError) {
                // If user doesn't exist in Auth (e.g. manually inserted in DB), regular Error log is too noisy.
                if (authError.code === 'user_not_found' || authError.status === 404) {
                    logger.warn(`User.updateName - Skipped (Auth User Not Found): ${userId}`);
                } else {
                    logger.error("Repo Error (User.updateName - Auth)", { error: authError });
                }
            }
        } else {
            logger.warn("⚠️ Cannot update name: Admin Client not available");
        }

        // 2. Fallback: Check if 'name' still exists in 'perfis' for backward compatibility
        // Ignoring PGRST204 safely
    }

    async getFinancialGoal(userId) {
        const { data, error } = await supabase
            .from('perfis')
            .select('financial_goal')
            .eq('id', userId)
            .single();

        if (error) {
            logger.error("Repo Error (User.getGoal)", { error });
            return null;
        }
        return data?.financial_goal || null;
    }

    async setFinancialGoal(userId, goal) {
        const { error } = await supabase
            .from('perfis')
            .update({ financial_goal: goal })
            .eq('id', userId);

        if (error) {
            logger.error("Repo Error (User.setGoal)", { error });
            return false;
        }
        return true;
    }

    async delete(userId) {
        // 1. Delete Transactions (Cascade is usually automatic, but being explicit is safer for code logic)
        const { error: txError } = await supabase
            .from('transacoes')
            .delete()
            .eq('user_id', userId);

        if (txError) {
            logger.error("Repo Error (User.delete - transactions)", { error: txError });
            // Continue to try deleting profile? or throw? 
            // If FK constraint forbids deleting profile with existing tx, we must succeed here.
        }

        // 2. Delete Profile
        const { error } = await supabase
            .from('perfis')
            .delete()
            .eq('id', userId);

        if (error) {
            logger.error("Repo Error (User.delete)", { error });
            throw new Error("Falha ao deletar usuário");
        }
        return true;
    }
}

module.exports = new UserRepository();
