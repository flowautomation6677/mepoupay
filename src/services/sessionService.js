const Redis = require('ioredis');

// Ensure REDIS_URL is present or default to localhost if not strict
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

redis.on('error', (err) => {
    console.error('❌ Redis Client Error', err);
});

redis.on('connect', () => {
    console.log('✅ Connected to Redis');
});

const CONTEXT_PREFIX = 'session:context:';
const PDF_PREFIX = 'session:pendingPdf:';

const sessionService = {
    /**
     * Retrieve user chat context
     * @param {string} userId 
     * @returns {Promise<Array>}
     */
    async getContext(userId) {
        try {
            const minKey = `${CONTEXT_PREFIX}${userId}`;
            const data = await redis.get(minKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error getting context for user ${userId}:`, error);
            return [];
        }
    },

    /**
     * Set user chat context with TTL
     * @param {string} userId 
     * @param {Array} context 
     * @param {number} ttlInSeconds 
     */
    async setContext(userId, context, ttlInSeconds = 86400) {
        try {
            const key = `${CONTEXT_PREFIX}${userId}`;
            await redis.set(key, JSON.stringify(context), 'EX', ttlInSeconds);
        } catch (error) {
            console.error(`Error setting context for user ${userId}:`, error);
        }
    },

    /**
     * Clear user context
     * @param {string} userId 
     */
    async clearContext(userId) {
        try {
            const key = `${CONTEXT_PREFIX}${userId}`;
            await redis.del(key);
        } catch (error) {
            console.error(`Error clearing context for user ${userId}:`, error);
        }
    },

    /**
     * Set pending PDF state (buffer)
     * @param {string} userId 
     * @param {string} base64Data 
     * @param {number} ttlInSeconds 
     */
    async setPdfState(userId, base64Data, ttlInSeconds = 300) {
        try {
            const key = `${PDF_PREFIX}${userId}`;
            await redis.set(key, base64Data, 'EX', ttlInSeconds);
        } catch (error) {
            console.error(`Error setting PDF state for user ${userId}:`, error);
        }
    },

    /**
     * Get pending PDF state
     * @param {string} userId 
     * @returns {Promise<string|null>} base64 string or null
     */
    async getPdfState(userId) {
        try {
            const key = `${PDF_PREFIX}${userId}`;
            return await redis.get(key);
        } catch (error) {
            console.error(`Error getting PDF state for user ${userId}:`, error);
            return null;
        }
    },

    /**
     * Clear pending PDF state
     * @param {string} userId 
     */
    async clearPdfState(userId) {
        try {
            const key = `${PDF_PREFIX}${userId}`;
            await redis.del(key);
        } catch (error) {
            console.error(`Error clearing PDF state for user ${userId}:`, error);
        }
    }
};

module.exports = sessionService;
