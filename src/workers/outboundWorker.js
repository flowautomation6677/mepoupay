const { Worker } = require('bullmq');
const evolutionService = require('../services/evolutionService');
const logger = require('../services/loggerService');
const redis = require('../services/redisClient');

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
            await evolutionService.sendText(chatId, text);
        }
    } catch (err) {
        logger.error(`[Outbound] Failed to send to ${chatId}`, err);
        throw err;
    }
}, {
    connection: redis,
    concurrency: 5 // Allow parallel sending
});

module.exports = outboundWorker;
