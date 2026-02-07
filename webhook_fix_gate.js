// Bot is running with network_mode: host
// Evolution API is running on port 8080 (Mapped to Host)

const CONFIG_URL = 'http://localhost:8080/webhook/set/FinanceBot';
const WEBHOOK_URL = 'http://127.0.0.1:4000/webhook/evolution'; // Unified Host Localhost

console.log(`Configuring Webhook (Unified Host): Request=${CONFIG_URL}, Callback=${WEBHOOK_URL}`);

fetch(CONFIG_URL, {
    method: 'POST',
    headers: {
        'apikey': '429683C4C977415CAAFCCE10F7D57E11',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        webhook: {
            url: WEBHOOK_URL,
            enabled: true,
            events: ['MESSAGES_UPSERT']
        }
    })
})
    .then(res => res.json())
    .then(data => console.log('SUCCESS:', JSON.stringify(data)))
    .catch(err => {
        console.error('ERROR:', err.message);
        if (err.cause) console.error('CAUSE:', err.cause);
    });
