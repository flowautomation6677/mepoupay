const Redis = require('ioredis');
const logger = require('./loggerService');

// Singleton Redis Client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: null // Required for BullMQ if we accept it later
});

redis.on('error', (err) => {
    logger.error('❌ Redis Client Error', err);
});

redis.on('connect', () => {
    logger.info('✅ Shared Redis Client Connected');
});

module.exports = redis;
