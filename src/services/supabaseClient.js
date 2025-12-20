require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Inicialização do Cliente Supabase
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!process.env.SUPABASE_URL || !supabaseKey) {
    console.error('❌ ERRO: Faltam as credenciais do SUPABASE no arquivo .env');
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);

module.exports = supabase;
