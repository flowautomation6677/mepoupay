const { publicClient, adminClient } = require('../services/supabaseClient');
const logger = require('../services/loggerService');

// Use Admin Client for Bot operations
const supabase = adminClient || publicClient;

/**
 * Normalizes a Brazilian phone number to the canonical format:
 * 55 (country) + 2-digit DDD + 9 (9th digit) + 8 digits = 13 digits total.
 * Handles input from WhatsApp (which may omit the 9th digit) and manual entry.
 */
function normalizeBrazilianPhone(phone) {
    const digits = phone.replaceAll(/\D/g, '');
    const local = digits.startsWith('55') ? digits.slice(2) : digits;

    if (local.length === 10) {
        // Missing 9th digit — insert after DDD
        return '55' + local.slice(0, 2) + '9' + local.slice(2);
    }
    if (local.length === 11) {
        return '55' + local;
    }
    // Unknown format — return as-is
    return digits.startsWith('55') ? digits : '55' + digits;
}

class UserRepository {
    async findByPhone(phone) {
        // Normaliza para o formato canônico BR e faz uma única query exata
        const normalized = normalizeBrazilianPhone(phone);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .contains('whatsapp_numbers', [normalized])
            .single();

        if (error && error.code !== 'PGRST116') {
            logger.error('Repo Error (User.find)', { error });
            return null;
        }

        logger.debug(`UserRepository findByPhone: ${phone} -> ${normalized} -> ${data ? 'found' : 'not found'}`);
        return data || null;
    }

    async create(phone, name = null) {
        const normalized = normalizeBrazilianPhone(phone);
        const payload = { whatsapp_numbers: [normalized] };

        // 2. Insert into Profiles
        const { data, error } = await supabase
            .from('profiles') // Updated table name
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
                data.id, // Linked via trigger or manually
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

        // 2. Fallback: Check if 'name' still exists in 'profiles' for backward compatibility
        // Ignoring PGRST204 safely
    }

    async getFinancialGoal(userId) {
        const { data, error } = await supabase
            .from('profiles')
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
            .from('profiles')
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
            .from('transactions') // Updated table
            .delete()
            .eq('user_id', userId);

        if (txError) {
            logger.error("Repo Error (User.delete - transactions)", { error: txError });
            // Continue to try deleting profile? or throw? 
            // If FK constraint forbids deleting profile with existing tx, we must succeed here.
        }

        // 2. Delete Profile
        const { error } = await supabase
            .from('profiles') // Updated table
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
