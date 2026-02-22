const fs = require('fs');
const content = fs.readFileSync('bot_logs_latest2.txt', 'utf8');
const lines = content.split('\n');
lines.forEach(line => {
    try {
        if (line.includes('Webhook Payload Received') && line.includes('remoteJid')) {
            const parsed = JSON.parse(line.split('Received ')[1]);
            console.log('Webhook from:', parsed.remoteJid);
        }
        if (line.includes('Message Received') && line.includes('from')) {
            const parsed = JSON.parse(line.split('Received ')[1]);
            console.log('Parsed from:', parsed.from, 'Body:', parsed.body);
        }
    } catch (e) { }
});
