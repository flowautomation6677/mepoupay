require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyOptimization() {
    console.log("🚀 Iniciando Verificação de Otimização (Trigger de Saldo)...");

    // 1. Get a Test User
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, accounts(id, current_balance)')
        .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
        console.error("❌ Erro ao buscar perfil:", profileError);
        return;
    }

    const user = profiles[0];
    const account = user.accounts[0];

    if (!account) {
        console.error("❌ Usuário sem conta. Rode a migração 002 novamente.");
        return;
    }

    console.log(`👤 Usuário: ${user.email}`);
    console.log(`💰 Saldo Inicial: R$ ${account.current_balance}`);

    // 2. Insert a Test Transaction
    const testAmount = 100.00;
    const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
            user_id: user.id,
            account_id: account.id,
            amount: testAmount,
            type: 'INCOME',
            description: 'Teste de Trigger de Otimização',
            date: new Date().toISOString()
        })
        .select()
        .single();

    if (txError) {
        console.error("❌ Erro ao inserir transação:", txError);
        return;
    }

    console.log(`➕ Transação Inserida: R$ ${testAmount} (INCOME)`);

    // 3. Verify Balance Update
    const { data: updatedAccount, error: accError } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('id', account.id)
        .single();

    if (accError) {
        console.error("❌ Erro ao buscar saldo atualizado:", accError);
        return;
    }

    const expectedBalance = Number(account.current_balance) + testAmount;
    const actualBalance = Number(updatedAccount.current_balance);

    console.log(`💰 Saldo Esperado: R$ ${expectedBalance.toFixed(2)}`);
    console.log(`💰 Saldo Atual:    R$ ${actualBalance.toFixed(2)}`);

    if (Math.abs(actualBalance - expectedBalance) < 0.01) {
        console.log("✅ SUCESSO: O Trigger atualizou o saldo corretamente!");
    } else {
        console.error("❌ FALHA: O saldo não corresponde ao esperado.");
    }

    // Cleanup (Optional - remove test transaction)
    await supabase.from('transactions').delete().eq('id', transaction.id);
    console.log("🧹 Transação de teste removida (Saldo deve voltar ao original).");
}

verifyOptimization();
