const fs = require('fs');
const file = '/app/src/server.js';
console.log('Reading ' + file);
let content = fs.readFileSync(file, 'utf8');

// 1. Update Global Probe to show headers
if (content.includes('GLOBAL PROBE')) {
    content = content.replace("req.url);", "req.url, 'HEADERS:', JSON.stringify(req.headers));");
    console.log('UPDATED PROBE');
}

// 2. Add Global Error Handler
const errorHandler = "\napp.use((err, req, res, next) => { console.error('❌ GLOBAL ERROR:', err.message); res.status(400).send('Bad Request'); }); // ERROR HANDLER\n";
if (!content.includes('ERROR HANDLER')) {
    // Insert before startServer function
    content = content.replace("function startServer() {", errorHandler + "function startServer() {");
    console.log('ADDED ERROR HANDLER');
} else {
    console.log('ALREADY HA S ERROR HANDLER');
}

fs.writeFileSync(file, content);
