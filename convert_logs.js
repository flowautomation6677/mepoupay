const fs = require('fs');
const content = fs.readFileSync('remote_bot_logs_latest.txt', 'utf16le');
fs.writeFileSync('remote_bot_logs_utf8.txt', content, 'utf8');
console.log('Converted');
