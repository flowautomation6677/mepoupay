const { Worker } = require('bullmq');
const client = require('../services/whatsappClient');
const logger = require('../services/loggerService');
const redis = require('../services/redisClient');

// This worker runs in the MAIN process (where WhatsApp Client exists)
logger.info("🔧 Outbound Message Worker Initializing...");

const outboundWorker = new Worker('outbound-messages', async (job) => {
    const { chatId, text, options } = job.data;
    logger.info(`[Outbound] PREPARING to send to ${chatId}: ${typeof text === 'string' ? text.substring(0, 30) : 'Media Object'}`);


    logger.debug(`[Outbound] Sending to ${chatId}`);

    try {
        await client.sendMessage(chatId, text, options);
    } catch (err) {
        logger.error(`[Outbound] Failed to send to ${chatId}`, err);
        throw err;
    }
}, {
    connection: redis,
    concurrency: 5 // Allow parallel sending
});

module.exports = outboundWorker;
