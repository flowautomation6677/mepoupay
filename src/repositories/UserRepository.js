const { publicClient, adminClient } = require('../services/supabaseClient');
const logger = require('../services/loggerService');

// Use Admin Client for Bot operations
const supabase = adminClient || publicClient;

/**
 * Handles the Brazilian "9th digit" inconsistency.
 * WhatsApp may deliver a number without the 9th digit (e.g., 556196761655)
 * but the DB may have stored it with the digit (e.g., 5561996761655), or vice-versa.
 * Returns an array of variants to try, starting with the original.
 */
function _buildBrazilianPhoneVariants(phone) {
    const variants = [phone];

    // Only applies to Brazilian numbers (starts with 55 + DDD + number)
    // Format with 9: 55 + 2-digit DDD + 9 + 8 digits = 13 chars
    // Format without 9: 55 + 2-digit DDD + 8 digits = 12 chars
    if (phone.startsWith('55') && phone.length === 12) {
        // Received without 9 — try adding it after DDD (position 4)
        const withNinth = phone.slice(0, 4) + '9' + phone.slice(4);
        variants.push(withNinth);
    } else if (phone.startsWith('55') && phone.length === 13) {
        // Received with 9 — try removing it (position 4)
        const withoutNinth = phone.slice(0, 4) + phone.slice(5);
        variants.push(withoutNinth);
    }

    return variants;
}

class UserRepository {
    async findByPhone(phone) {
        // Gera variantes (com/sem 9º dígito BR) e busca com overlap em uma única query
        const phonesToTry = _buildBrazilianPhoneVariants(phone);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .overlaps('whatsapp_numbers', phonesToTry)
            .single();

        if (error && error.code !== 'PGRST116') {
            logger.error("Repo Error (User.find)", { error });
            return null;
        }

        logger.debug(`UserRepository findByPhone: ${phone} -> ${data ? 'found' : 'not found'}`);
        return data || null;
    }

    async create(phone, name = null) {
        // 1. Prepare Payload
        // 'profiles' uses 'whatsapp_numbers' (array)
        const payload = { whatsapp_numbers: [phone] };

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
