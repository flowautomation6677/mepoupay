const client = require('./src/services/whatsappClient');
const { handleMessage } = require('./src/handlers/messageHandler');

console.log("🚀 Iniciando Porquim 360 (V2 - Modular)...");

// Registra o handler principal
client.on('message', handleMessage);

// Inicializa
client.initialize();
