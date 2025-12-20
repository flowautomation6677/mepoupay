const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code gerado! Escaneie com seu WhatsApp.');
});

client.on('ready', () => {
    console.log('✅ Cliente WhatsApp conectado e pronto!');
    console.log("✅ VERSÃO ATUALIZADA (RC-FINAL) CARREGADA COM SUCESSO!");
});

module.exports = client;
