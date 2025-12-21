require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Cliente de Teste
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL e SUPABASE_KEY são obrigatórios no .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Supabase Contract Tests (Real DB)', () => {
    const testPhone = '5511999999999';
    let userId = null;

    test('Deve conectar ao Supabase', async () => {
        // Verifica tabela perfis
        const { data, error } = await supabase.from('perfis').select('count', { count: 'exact', head: true });
        if (error) console.error("Connection Error:", error);
        expect(error).toBeNull();
    });

    test('Deve criar (ou recuperar) um usuário de teste na tabela PERFIS', async () => {
        // Tenta buscar primeiro
        const { data: existing } = await supabase
            .from('perfis')
            .select('id')
            .eq('whatsapp_number', testPhone)
            .single();

        if (existing) {
            userId = existing.id;
        } else {
            const { data, error } = await supabase
                .from('perfis')
                .insert([{ whatsapp_number: testPhone }])
                .select()
                .single();

            if (error) {
                console.error("Create User Error:", error, error.message);
                fs.writeFileSync('test_debug_user.json', JSON.stringify(error, null, 2));
            }
            expect(error).toBeNull();
            expect(data).toHaveProperty('id');
            userId = data.id;
        }
        expect(userId).toBeTruthy();
    });

    test('Deve inserir uma transação com campo TIPO (Receita/Despesa)', async () => {
        if (!userId) throw new Error("Usuário não criado");

        const tx = {
            user_id: userId,
            descricao: 'Contract Test Item',
            valor: 123.45,
            categoria: 'Testes',
            tipo: 'despesa', // Verifica se a coluna existe
            data: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('transacoes')
            .insert([tx])
            .select()
            .single();

        if (error) {
            console.error("Insert TX Error:", error);
            fs.writeFileSync('test_debug_tx.json', JSON.stringify(error, null, 2));
        }

        expect(error).toBeNull();
        expect(data.tipo).toBe('despesa');
        expect(parseFloat(data.valor)).toBe(123.45);
    });

    test('Deve limpar dados de teste', async () => {
        if (!userId) return;

        // Limpeza
        const { error: txError } = await supabase
            .from('transacoes')
            .delete()
            .eq('user_id', userId)
            .ilike('descricao', 'Contract Test Item');

        expect(txError).toBeNull();
    });
});
