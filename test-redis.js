const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis('redis://localhost:6379', { maxRetriesPerRequest: null });

connection.on('error', (err) => {
    console.error('Redis Error:', err);
    process.exit(1);
});

async function testQueue() {
    console.log('Connected to Redis');

    const queue = new Queue('test-queue', { connection });
    const worker = new Worker('test-queue', async job => {
        console.log('Worker picked up job:', job.data);
    }, { connection });

    worker.on('completed', () => {
        console.log('Job completed successfully');
        process.exit(0);
    });

    await queue.add('test', { foo: 'bar' });
    console.log('Job added to queue');
}

testQueue().catch(console.error);
