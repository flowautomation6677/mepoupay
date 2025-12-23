const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./services/loggerService');
const { handleMessage } = require('./handlers/messageHandler');
const EvolutionAdapter = require('./adapters/evolutionAdapter');
const evolutionService = require('./services/evolutionService');

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

// Increase limit for media payloads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// QR Code HTML Page (Auto-Refresh)
app.get('/qr', (req, res) => {
    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>WhatsApp OR Code</title>
                <meta http-equiv="refresh" content="10">
                <style>
                    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f0f2f5; }
                    h1 { margin-bottom: 20px; color: #128c7e; }
                    img { box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; }
                    p { color: #666; margin-top: 15px; }
                </style>
            </head>
            <body>
                <h1>Escaneie para Conectar 🐷</h1>
                <img src="/qr-image?t=${Date.now()}" alt="QR Code" width="300" height="300">
                <p>Atualizando automaticamente a cada 10 segundos...</p>
            </body>
        </html>
    `;
    res.send(html);
});

// Raw QR Image File
app.get('/qr-image', (req, res) => {
    const path = require('path');
    const qrPath = path.join(process.cwd(), 'qrcode.png');

    // Check if file exists
    const fs = require('fs');
    if (fs.existsSync(qrPath)) {
        res.sendFile(qrPath);
    } else {
        res.status(404).send('QR Code not generated yet. Wait a moment.');
    }
});

// Evolution API Webhook Endpoint
app.post('/webhook/evolution', async (req, res) => {
    try {
        const eventType = req.body.event;
        const instance = req.body.instance;

        // Log incoming event (Debug)
        // logger.debug(`Webhook Event: ${eventType} from ${instance}`);

        if (eventType === 'MESSAGES_UPSERT') {
            const data = req.body.data;

            // Evolution v2 sends messages in an array? Usually singular for webhook unless configured otherwise
            // Assuming standard payload structure

            if (!data || !data.key || data.key.fromMe) {
                // Ignore outgoing messages or malformed data
                return res.status(200).send('OK');
            }

            logger.info('📩 Incoming Webhook Message', { from: data.key.remoteJid });

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
