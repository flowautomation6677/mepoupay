const axios = require('axios');

async function testWebhook() {
    console.log("🚀 Testing Webhook locally...");
    try {
        const res = await axios.post('http://localhost:3000/webhook/evolution', {
            event: "MESSAGES_UPSERT",
            instance: "FinanceBot_v3",
            data: {
                key: {
                    remoteJid: "5521999999999@s.whatsapp.net",
                    fromMe: false
                },
                message: {
                    conversation: "Teste de Webhook Local"
                }
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
                // No api key needed locally as per my analysis of missing env var
            }
        });

        console.log(`✅ Response: ${res.status} ${res.statusText}`);
        console.log(`data: ${res.data}`);
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
            console.error(`Data: ${e.response.data}`);
        }
    }
}

testWebhook();
