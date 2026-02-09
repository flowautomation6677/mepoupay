const fs = require('fs');
const file = '/app/src/server.js';
console.log('Reading ' + file);
let content = fs.readFileSync(file, 'utf8');
const probe = "\n    console.log('⚡ RAW WEBHOOK REQUEST Hit:', req.method, req.url); // DEBUG PROBE";
if (!content.includes('DEBUG PROBE')) {
    content = content.replace("app.post('/webhook/evolution', async (req, res) => {", "app.post('/webhook/evolution', async (req, res) => {" + probe);
    fs.writeFileSync(file, content);
    console.log('PATCHED');
} else {
    console.log('ALREADY PATCHED');
}
