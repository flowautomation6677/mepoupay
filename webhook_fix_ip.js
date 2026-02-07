
const EVO_IP = '172.20.0.3';
const BOT_IP = '172.20.0.2';

console.log(`Configuring Webhook: Evo=${EVO_IP}, Bot=${BOT_IP}`);

fetch(`http://${EVO_IP}:8080/webhook/set/FinanceBot`, {
    method: 'POST',
    headers: {
        'apikey': '429683C4C977415CAAFCCE10F7D57E11',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        webhookUrl: `http://${BOT_IP}:3000/webhook/evolution`,
        enabled: true,
        events: ['MESSAGES_UPSERT']
    })
})
    .then(res => res.json())
    .then(data => console.log('SUCCESS:', JSON.stringify(data)))
    .catch(err => {
        console.error('ERROR:', err.message);
        if (err.cause) console.error('CAUSE:', err.cause);
    });
