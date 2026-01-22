const axios = require('axios');

const INSTANCE_NAME = 'FinanceBot_v3';
const API_URL = 'http://localhost:8080';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
// Webhook URL must be reachable from inside the Docker container
const WEBHOOK_URL = 'http://host.docker.internal:4001/webhook/evolution';

const createInstance = async () => {
    try {
        console.log(`🚀 Creating instance: ${INSTANCE_NAME}...`);

        // 1. Create Instance (Clean)
        const createPayload = {
            instanceName: INSTANCE_NAME,
            token: "secret_token_123",
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
            reject_call: false,
            groups_ignore: false,
            always_online: true,
            read_messages: false,
            read_status: false
        };

        const response = await axios.post(`${API_URL}/instance/create`, createPayload, {
            headers: { 'apikey': API_KEY }
        });

        console.log("✅ Instance Created!");

        // 2. Set Webhook
        console.log("🔗 Configuring Webhook...");
        const webhookPayload = {
            webhook: {
                url: WEBHOOK_URL,
                byEvents: false, // Try global first
                events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE", "CONNECTION_UPDATE"],
                enabled: true
            }
        };

        // Note: URL might be /webhook/set/:instance
        await axios.post(`${API_URL}/webhook/set/${INSTANCE_NAME}`, webhookPayload, {
            headers: { 'apikey': API_KEY }
        });
        console.log("✅ Webhook Configured!");

    } catch (error) {
        if (error.response?.status === 403) {
            console.log("⚠️ Instance might already exist (403).");
        } else {
            console.error("❌ Error:", error.response?.data || error.message);
        }
    }
};

createInstance();
