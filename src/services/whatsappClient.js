const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');

// Force-load the root puppeteer which we validated with check_puppeteer.js
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.warn("Could not load root puppeteer:", e);
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // Explicitly use the executablePath from the root puppeteer package
        executablePath: puppeteer ? puppeteer.executablePath() : undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        headless: false
    }
});

if (puppeteer) {
    console.log("✅ Using Puppeteer Executable at:", puppeteer.executablePath());
} else {
    console.log("⚠️ Puppeteer not found, using wwebjs default (Risk of failure)");
}

client.on('qr', (qr) => {
    // Generate terminal QR
    qrcode.generate(qr, { small: true });

    // Save to file for User UI
    QRCode.toFile('qrcode.png', qr, {
        color: {
            dark: '#000000',  // Black dots
            light: '#FFFFFF' // White background
        }
    }, function (err) {
        if (err) console.error("Error saving QR:", err);
        else console.log('✅ QR Code saved to qrcode.png');
    });

    console.log('QR Code gerado! Escaneie com seu WhatsApp.');
});

client.on('ready', () => {
    console.log('✅ Cliente WhatsApp conectado e pronto!');
    console.log("✅ VERSÃO ATUALIZADA (RC-FINAL) CARREGADA COM SUCESSO!");
});

module.exports = client;
