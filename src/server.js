const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./services/loggerService');
const { handleMessage } = require('./handlers/messageHandler');
const EvolutionAdapter = require('./adapters/evolutionAdapter');
const evolutionService = require('./services/evolutionService');

const app = express();
const PORT = process.env.PORT || 4001; // Railway requires process.env.PORT

// 🛡️ Security: Disable fingerprinting (SonarQube)
app.disable('x-powered-by');

// Limit reduced to 20mb to mitigate DoS risks while allowing WhatsApp video uploads.
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// QR Code Endpoint Removed (Responsibility moved to Web Dashboard)


// Evolution API Webhook Endpoint
app.post('/webhook/evolution', async (req, res) => {
    try {
        // 🛡️ Security: Validate API Key if configured
        const apiKey = req.headers['apikey'] || req.query.apikey;
        // We expect the Evolution instance to send its API Key via 'apikey' header
        if (process.env.AUTHENTICATION_API_KEY && apiKey !== process.env.AUTHENTICATION_API_KEY) {
            logger.warn(`⛔ Webhook Unauthorized Attempt: ${req.ip || 'Unknown IP'} - Invalid Key`);
            return res.status(403).send('Unauthorized');
        }

        const eventType = req.body.event;
        // Structured logging for observability
        logger.info("📥 Webhook Payload Received", {
            event: eventType,
            instance: req.body.instance,
            remoteJid: req.body.data?.key?.remoteJid
        });

        // Detailed debug log (only visible if level=debug)
        logger.debug("Webhook Payload Details", {
            fullBody: req.body,
            eventTypeCheck: eventType?.toUpperCase()
        });

        // Log incoming event (Debug)
        // logger.debug(`Webhook Event: ${eventType} from ${instance}`);


        if (eventType.toUpperCase() === 'MESSAGES.UPSERT') {
            const data = req.body.data;

            // Evolution v2 sends messages in an array? Usually singular for webhook unless configured otherwise
            // Assuming standard payload structure

            if (!data || !data.key || data.key.fromMe) {
                // Ignore outgoing messages or malformed data
                return res.status(200).send('OK');
            }

            logger.info('📩 Incoming Webhook Message', { from: data.key.remoteJid });

            // DEBUG: Write to file to verify reception
            const fs = require('node:fs');
            const logPath = require('node:path').join(process.cwd(), 'logs', 'webhook_debug.log');
            const logEntry = `[${new Date().toISOString()}] Message from ${data.key.remoteJid}\n`;
            if (!fs.existsSync(require('node:path').dirname(logPath))) fs.mkdirSync(require('node:path').dirname(logPath), { recursive: true });
            fs.appendFileSync(logPath, logEntry);


            // Adapt and Handle
            const adaptedMessage = new EvolutionAdapter(req.body);
            await handleMessage(adaptedMessage);
        }

        res.status(200).send('OK');

    } catch (error) {
        logger.error('❌ Error processing webhook', { error: error.message, stack: error.stack });
        res.status(500).send('Internal Server Error');
    }
});

function startServer() {
    app.listen(PORT, async () => {
        logger.info(`🚀 Server running on port ${PORT}`);

        // Optional: Auto-connect logic
        const connected = await evolutionService.checkConnection();
        if (!connected) {
            logger.warn('⚠️ Evolution API Instance not connected. Please connect via Manager.');
        } else {
            logger.info('✅ Evolution API Instance is connected.');
        }

        // Configure Webhook if Public URL is known
        if (process.env.WEBHOOK_PUBLIC_URL) {
            const webhookEndpoint = `${process.env.WEBHOOK_PUBLIC_URL}/webhook/evolution`;
            await evolutionService.setWebhook(webhookEndpoint);
        }
    });
}

module.exports = { startServer, app };
