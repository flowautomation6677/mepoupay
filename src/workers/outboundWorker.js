const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const evolutionService = require('../services/evolutionService');
const logger = require('../services/loggerService');

// Create dedicated connection for Worker
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

connection.on('error', (err) => {
    logger.error('❌ Outbound Worker Redis Connection Error', err);
});

// This worker runs in the MAIN process (where WhatsApp Client exists)
logger.info("🔧 Outbound Message Worker Initializing...");

const outboundWorker = new Worker('outbound-messages', async (job) => {
    const { chatId, text } = job.data;
    logger.info(`[Outbound] PREPARING to send to ${chatId}: ${typeof text === 'string' ? text.substring(0, 30) : 'Media Object'}`);


    logger.debug(`[Outbound] Sending to ${chatId}`);

    try {
        // Simple logic for Text vs Media
        // If 'text' is an object with base64/mimetype, treat as media
        if (typeof text === 'object' && text.data && text.mimetype) {
            await evolutionService.sendMedia(chatId, text, 'document'); // Default to document or infer
        } else {
            // Ensure text is string
            const safeText = typeof text === 'string' ? text : JSON.stringify(text);
            await evolutionService.sendText(chatId, safeText);
        }
    } catch (err) {
        logger.error(`[Outbound] Failed to send to ${chatId}`, err);
        throw err;
    }
}, {
    connection,
    concurrency: 5 // Allow parallel sending
});

module.exports = outboundWorker;
