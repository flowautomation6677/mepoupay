
fetch('http://mepoupay_evolution_prod:8080/webhook/set/FinanceBot', {
    method: 'POST',
    headers: {
        'apikey': '429683C4C977415CAAFCCE10F7D57E11',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        webhookUrl: 'http://mepoupay_bot_prod:3000/webhook/evolution',
        enabled: true,
        events: ['MESSAGES_UPSERT']
    })
})
    .then(res => res.json())
    .then(data => console.log('SUCCESS:', JSON.stringify(data)))
    .catch(err => console.error('ERROR:', err.message));
