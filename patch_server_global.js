const fs = require('fs');
const file = '/app/src/server.js';
console.log('Reading ' + file);
let content = fs.readFileSync(file, 'utf8');
const globalProbe = "\napp.use((req, res, next) => { console.log('⚡ GLOBAL REQ:', req.method, req.url); next(); }); // GLOBAL PROBE\n";
if (!content.includes('GLOBAL PROBE')) {
    // Insert before bodyParser
    const target = "app.use(bodyParser.json({ limit: '20mb' }));";
    if (content.includes(target)) {
        content = content.replace(target, globalProbe + target);
        fs.writeFileSync(file, content);
        console.log('PATCHED GLOBAL');
    } else {
        console.log('TARGET NOT FOUND: bodyParser line missing or different');
        console.log('Content preview: ' + content.substring(0, 500));
    }
} else {
    console.log('ALREADY PATCHED GLOBAL');
}
