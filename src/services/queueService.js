const { Queue } = require('bullmq');

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
};

const mediaQueue = new Queue('media-processing', { connection });

async function addJob(type, data) {
    return await mediaQueue.add(type, data, {
        attempts: 3, // Retry 3 times
        backoff: {
            type: 'exponential',
            delay: 1000 // 1s, 2s, 4s
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: {
            age: 24 * 3600 // Keep failed jobs for 24h for inspection
        }
    });
}

module.exports = {
    mediaQueue,
    addJob
};
