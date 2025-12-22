require('dotenv').config();
const logger = require('./services/loggerService');

// Validate Environment
if (!process.env.REDIS_URL) {
    logger.error("❌ REDIS_URL Missing for Independent Worker");
    process.exit(1);
}

logger.info("👷 Starting Independent Media Worker...");

// Initialize Worker
require('./workers/mediaWorker');

logger.info("✅ Media Worker is Listening for Jobs...");

// Keep process alive
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutdown...');
    // Close connections if needed
    process.exit(0);
});
