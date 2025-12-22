const redis = require('./redisClient');
const logger = require('./loggerService');
const crypto = require('crypto');

class CacheService {
    constructor() {
        this.PREFIX = 'semantic_cache:';
        this.TTL = 60 * 60 * 24 * 7; // 7 Days Retention for exact matches
    }

    /**
     * Generates a hash for the text key.
     * @param {string} text 
     */
    _hash(text) {
        return crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
    }

    /**
     * Try to get a cached response for the input text.
     * @param {string} text 
     * @returns {Promise<object|null>}
     */
    async get(text) {
        if (!text) return null;
        try {
            const key = this.PREFIX + this._hash(text);
            const cached = await redis.get(key);
            if (cached) {
                logger.info(`[Cache] HIT for "${text.substring(0, 20)}..."`);
                return JSON.parse(cached);
            }
        } catch (e) {
            logger.warn("[Cache] Get Error:", e);
        }
        return null; // Miss
    }

    /**
     * Save AI response to cache.
     * @param {string} text 
     * @param {object} responseData 
     */
    async set(text, responseData) {
        if (!text || !responseData) return;
        try {
            const key = this.PREFIX + this._hash(text);
            await redis.set(key, JSON.stringify(responseData), 'EX', this.TTL);
            logger.debug(`[Cache] SET for "${text.substring(0, 20)}..."`);
        } catch (e) {
            logger.warn("[Cache] Set Error:", e);
        }
    }
}

module.exports = new CacheService();
