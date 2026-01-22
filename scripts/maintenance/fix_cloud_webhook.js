const axios = require('axios');

const API_URL = 'http://evolution.mepoupay.app.br';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const TARGET_WEBHOOK_URL = 'http://finance_bot_main:3000/webhook/evolution';

async function fixWebhook() {
    console.log(`🔍 Connecting to Evolution API...`);

    try {
        // 1. Fetch Instances
        const response = await axios.get(`${API_URL}/instance/fetchInstances`, {
            headers: { 'apikey': API_KEY }
        });

        const instances = response.data;
        if (instances.length === 0) {
            console.log("❌ No instances found.");
            return;
        }

        const instance = instances[0]; // Assuming the first one is the main one
        console.log(`📱 Found Instance: ${instance.name} (Status: ${instance.connectionStatus})`);

        // 2. Fetch current Webhook
        let currentWebhook = {};
        try {
            const webhookRes = await axios.get(`${API_URL}/webhook/find/${instance.name}`, {
                headers: { 'apikey': API_KEY }
            });
            currentWebhook = webhookRes.data || {};
        } catch (e) {
            console.log("   (Webhook not found or error fetching)");
        }

        const currentUrl = currentWebhook.webhookUrl || currentWebhook.url;
        const isEnabled = currentWebhook.enabled;

        console.log(`   Current Webhook URL: ${currentUrl}`);
        console.log(`   Current Enabled: ${isEnabled}`);

        // 3. Check if needs fix
        if (currentUrl !== TARGET_WEBHOOK_URL || !isEnabled) {
            console.log(`⚠️  Configuration mismatch. Fixing Webhook...`);

            await axios.post(`${API_URL}/webhook/set/${instance.name}`, {
                "webhook": {
                    "enabled": true,
                    "url": TARGET_WEBHOOK_URL,
                    "webhookUrl": TARGET_WEBHOOK_URL,
                    "webhookByEvents": true,
                    "events": [
                        "MESSAGES_UPSERT",
                        "MESSAGES_UPDATE",
                        "SEND_MESSAGE"
                    ]
                }
            }, {
                headers: { 'apikey': API_KEY }
            });

            console.log(`✅ SUCCESS: Webhook updated to ${TARGET_WEBHOOK_URL}`);
        } else {
            console.log(`✅ Webhook is already correctly configured.`);
        }

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (error.response) console.error("API Response:", error.response.data);
    }
}

fixWebhook();
