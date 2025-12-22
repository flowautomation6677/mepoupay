require('dotenv').config();
const logger = require('./src/services/loggerService');

// 0. Validação de Ambiente (Failsafe)
const REQUIRED_ENV = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    // New Requirements for Evolution
    // 'EVOLUTION_API_URL', 
    // 'EVOLUTION_API_KEY'
];

const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
    logger.error(`❌ ERRO FATAL: Variáveis de ambiente obrigatórias ausentes: ${missingEnv.join(', ')}`);
    process.exit(1);
}

const client = require('./src/services/whatsappClient');
const { handleMessage } = require('./src/handlers/messageHandler');

// Initialize Outbound Worker (Handling responses from specialized workers)
require('./src/workers/outboundWorker');

// Initialize Local Media Worker (Default: true, unless running in Split Mode)
if (process.env.RUN_WORKER_LOCALLY !== 'false') {
    require('./src/workers/mediaWorker');
    logger.info("🔧 Local Media Worker Started");
}


logger.info("🚀 Iniciando Porquim 360 (V2 - Modular)...");

// Registra o handler principal
client.on('message', async (msg) => {
    // Optional: Log incoming message event (debug level)
    // logger.debug("Message received", { from: msg.from, type: msg.type });
    await handleMessage(msg);
});

client.on('ready', () => {
    logger.info('✅ Cliente WhatsApp conectado e pronto!');
    logger.info('✅ VERSÃO ATUALIZADA (RC-FINAL) CARREGADA COM SUCESSO!');
});

client.on('auth_failure', msg => {
    logger.error('❌ Falha na autenticação', { error: msg });
});

client.on('disconnected', (reason) => {
    logger.warn('❌ Cliente desconectado', { reason: reason });
});

// Inicializa
client.initialize();
