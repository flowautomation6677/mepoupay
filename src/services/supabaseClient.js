require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const logger = require('./loggerService'); // Usando nosso logger

// Validação Rigorosa das Chaves
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    logger.error('❌ ERRO FATAL: Credenciais do Supabase (URL ou ANON_KEY) ausentes.');
    process.exit(1);
}

// Cliente Público (Respeita RLS - Row Level Security)
// Deve ser usado para 99% das operações
const publicClient = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Administrativo (Ignora RLS - GOD MODE)
// Use com extrema cautela, apenas para tarefas de sistema (ex: Cron Jobs, Webhooks)
let adminClient = null;

if (supabaseServiceKey) {
    adminClient = createClient(supabaseUrl, supabaseServiceKey);
} else {
    logger.warn('⚠️ AVISO: SUPABASE_SERVICE_ROLE_KEY não definida. Funcionalidades administrativas podem falhar.');
}

module.exports = {
    supabase: publicClient, // Default export for backwards compatibility (temporary)
    publicClient,
    adminClient
};
