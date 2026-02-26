const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis('redis://localhost:6379', { maxRetriesPerRequest: null });

async function checkQueueStats(queueName) {
    const queue = new Queue(queueName, { connection });
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const delayed = await queue.getDelayedCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();

    console.log(`\n=== Queue: ${queueName} ===`);
    console.log(`Waiting: ${waiting}, Active: ${active}, Completed: ${completed}, Failed: ${failed}`);

    if (failed > 0) {
        const failedJobs = await queue.getFailed(0, 5);
        console.log('Top 5 Failed jobs:');
        failedJobs.forEach(j => {
            const reason = typeof j.failedReason === 'string' ? j.failedReason.substring(0, 100).replace(/\n/g, ' ') : j.failedReason;
            console.log(`- Job ${j.id}: ${reason}`);
        });
    }

    if (waiting > 0) {
        const waitingJobs = await queue.getWaiting(0, 5);
        console.log('Top 5 Waiting jobs:');
        waitingJobs.forEach(j => {
            console.log(`- Job ${j.id} [${j.name}]`);
        });
    }
}

async function checkJobs() {
    await checkQueueStats('media-processing');
    await checkQueueStats('outbound-messages');
    process.exit(0);
}

checkJobs().catch(console.error);
