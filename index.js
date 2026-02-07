require('dotenv').config();
const logger = require('./src/services/loggerService');

// 0. Validação de Ambiente (Failsafe)
const REQUIRED_ENV = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    // 'SUPABASE_ANON_KEY' -> Checked manually below for flexibility
];

const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);

if (!process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_KEY) {
    missingEnv.push('SUPABASE_ANON_KEY (ou SUPABASE_KEY)');
}

if (missingEnv.length > 0) {
    logger.error(`❌ ERRO FATAL: Variáveis de ambiente obrigatórias ausentes: ${missingEnv.join(', ')}`);
    process.exit(1);
}

// Initialize Outbound Worker (Handling responses from specialized workers)
require('./src/workers/outboundWorker');

// Initialize Local Media Worker (Default: true, unless running in Split Mode)
if (process.env.RUN_WORKER_LOCALLY !== 'false') {
    require('./src/workers/mediaWorker');
    logger.info("🔧 Local Media Worker Started");
}


logger.info("🚀 Iniciando Me Poupay (Evolution API Mode)...");

// Inicializa Server (Health Checks & Webhooks)
const { startServer } = require('./src/server');
startServer();
