const { Client, LocalAuth } = require('whatsapp-web.js');

console.log("🚀 Initializing whatsapp-web.js client...");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
        headless: true
    }
});

client.on('qr', (qr) => {
    // Should not happen if we use pairing code
    console.log('QR Code received (unexpected)');
});

client.on('ready', () => {
    console.log('✅ Client is ready!');
    process.exit(0);
});

client.initialize().then(async () => {
    console.log("⌛ Client initialized. Waiting for ID...");
    // Wait a bit for the browser to launch
    setTimeout(async () => {
        try {
            const number = '5521990149660';
            console.log(`📞 Requesting Pairing Code for ${number}...`);
            const code = await client.requestPairingCode(number);
            console.log("============================================");
            console.log(`🔐 PAIRING CODE: ${code}`);
            console.log("============================================");
        } catch (err) {
            console.error("❌ Failed to get pairing code:", err);
        }
    }, 5000); // Wait 5s for pupeteer
});
