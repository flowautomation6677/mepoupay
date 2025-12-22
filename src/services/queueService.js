const { Queue } = require('bullmq');
const redis = require('./redisClient'); // Shared connection
const logger = require('./loggerService');

// Define Queues
const mediaQueue = new Queue('media-processing', { connection: redis });
const outboundQueue = new Queue('outbound-messages', { connection: redis });

const queueService = {
    /**
     * Add job to media processing queue
     */
    async addJob(type, data) {
        try {
            // Options can be tuned (attempts, backoff)
            await mediaQueue.add(type, data, {
                removeOnComplete: true,
                removeOnFail: 100
            });
            logger.info(`[Queue] Job added: ${type}`);
        } catch (error) {
            logger.error('[Queue] Failed to add media job', error);
        }
    },

    /**
     * Add job to outbound message queue
     * @param {string} chatId 
     * @param {string|MessageMedia} textOrMedia 
     * @param {object} options 
     */
    async addOutbound(chatId, textOrMedia, options = {}) {
        try {
            await outboundQueue.add('send-message', {
                chatId,
                text: textOrMedia,
                options
            }, {
                removeOnComplete: true
            });
        } catch (error) {
            logger.error('[Queue] Failed to add outbound job', error);
        }
    }
};

module.exports = queueService;
