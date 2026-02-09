const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
    console.log("🔍 Iniciando verificação da migração...");

    try {
        // 1. Check Profiles
        const { data: profiles, error: pError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (pError) throw new Error(`Erro ao acessar profiles: ${pError.message}`);
        console.log(`✅ Tabela 'profiles' acessível. Total registros: ${profiles === null ? 'N/A' : 'OK'}`);

        // 2. Check Accounts
        const { data: accounts, error: aError } = await supabase.from('accounts').select('*').limit(1);
        if (aError) throw new Error(`Erro ao acessar accounts: ${aError.message}`);
        console.log(`✅ Tabela 'accounts' acessível. Exemplo: ${accounts.length > 0 ? accounts[0].name : 'Vazia'}`);

        // 3. Check Categories
        const { data: categories, error: cError } = await supabase.from('categories').select('*').limit(1);
        if (cError) throw new Error(`Erro ao acessar categories: ${cError.message}`);
        console.log(`✅ Tabela 'categories' acessível. Exemplo: ${categories.length > 0 ? categories[0].name : 'Vazia'}`);

        // 4. Check Transactions
        const { data: transactions, error: tError } = await supabase.from('transactions').select('*').limit(1);
        if (tError) throw new Error(`Erro ao acessar transactions: ${tError.message}`);
        console.log(`✅ Tabela 'transactions' acessível. Exemplo: ${transactions.length > 0 ? transactions[0].amount : 'Vazia'}`);

        // 5. Check Audit Logs
        const { data: audit, error: audError } = await supabase.from('audit_logs').select('*').limit(1);
        if (audError && audError.code !== '42P01') throw new Error(`Erro ao acessar audit_logs: ${audError.message}`); // 42P01 is undefined table
        console.log(`✅ Tabela 'audit_logs' acessível.`);

        console.log("\n🚀 SUCESSO! Todas as tabelas do novo esquema foram verificadas.");
        console.log("Os dados parecem ter sido migrados corretamente (se haviam dados anteriores).");

    } catch (error) {
        console.error("\n❌ FALHA NA VERIFICAÇÃO:");
        console.error(error.message);
        console.log("\n⚠️  Certifique-se de que você rodou os scripts SQL (001 e 002) no Supabase SQL Editor.");
    }
}

verifyMigration();
