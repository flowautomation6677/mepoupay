const supabase = require('../services/supabaseClient');

class UserRepository {
    async findByPhone(phone) {
        const { data, error } = await supabase.from('perfis').select('*').eq('whatsapp_number', phone).single();
        if (error && error.code !== 'PGRST116') console.error("Repo Error (User.find):", error);
        return data;
    }

    async create(phone) {
        const { data, error } = await supabase.from('perfis').insert([{ whatsapp_number: phone }]).select().single();
        if (error) console.error("Repo Error (User.create):", error);
        return data;
    }

    async getFinancialGoal(userId) {
        const { data } = await supabase.from('perfis').select('financial_goal').eq('id', userId).single();
        return data?.financial_goal;
    }

    async setFinancialGoal(userId, goal) {
        const { error } = await supabase.from('perfis').update({ financial_goal: goal }).eq('id', userId);
        return !error;
    }
}

module.exports = new UserRepository();
