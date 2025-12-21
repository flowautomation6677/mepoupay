const { Worker } = require('bullmq');
const client = require('../services/whatsappClient');
const { processExtractedData } = require('../services/dataProcessor');
const imageStrategy = require('../strategies/ImageStrategy');
const audioStrategy = require('../strategies/AudioStrategy');
const pdfStrategy = require('../strategies/PdfStrategy');
const ofxStrategy = require('../strategies/OfxStrategy');
const csvStrategy = require('../strategies/CsvStrategy');
const xlsxStrategy = require('../strategies/XlsxStrategy');

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
};

const mediaWorker = new Worker('media-processing', async (job) => {
    const { chatId, userId, mediaData, mimeType, filename, body } = job.data;
    const type = job.name;

    console.log(`[Worker] Processing Job ${job.id}: ${type} for user ${userId}`);

    // Helper to send messages
    const reply = async (text) => {
        try {
            await client.sendMessage(chatId, text);
        } catch (err) {
            console.error(`[Worker] Failed to send message to ${chatId}:`, err);
        }
    };

    try {
        let result = null;

        // Create a mock message object for strategies that rely on it
        // Note: Strategies usually call message.reply() or use message.body/type.
        // We need to adapt the strategies OR mock the message object.
        // Most strategies in this codebase accept the `message` object and extract data from it.
        // We will mock the message object with necessary fields and methods.
        const mockMessage = {
            from: chatId,
            body: body || '',
            type: type === 'PROCESS_AUDIO' ? 'ptt' : 'document', // Simplified
            _data: { mimetype: mimeType },
            hasMedia: true,
            downloadMedia: async () => {
                // Return the mediaData we stored (Base64 is passed in job)
                // whatsapp-web.js MessageMedia format: { mimetype, data (base64), filename }
                return {
                    mimetype: mimeType,
                    data: mediaData,
                    filename: filename
                };
            },
            reply: reply
        };

        // For Image Strategy, it might check type 'image'
        if (type === 'PROCESS_IMAGE') mockMessage.type = 'image';

        // --- EXECUTE STRATEGY ---
        switch (type) {
            case 'PROCESS_IMAGE':
                result = await imageStrategy.execute(mockMessage);
                break;
            case 'PROCESS_AUDIO':
                result = await audioStrategy.execute(mockMessage);
                break;
            case 'PROCESS_PDF':
                result = await pdfStrategy.execute(mockMessage);
                break;
            case 'PROCESS_OFX':
                result = await ofxStrategy.execute(mockMessage);
                break;
            case 'PROCESS_CSV':
                result = await csvStrategy.execute(mockMessage);
                break;
            case 'PROCESS_XLSX':
                result = await xlsxStrategy.execute(mockMessage);
                break;
            default:
                throw new Error(`Unknown job type: ${type}`);
        }

        // --- HANDLE RESULT ---
        if (!result) return;

        if (result.type === 'data_extraction') {
            await processExtractedData(result.content, userId, reply);
        } else if (result.type === 'system_error') {
            await reply(`❌ ${result.content}`);
        } else if (result.type === 'pdf_password_request') {
            // Special Case: Worker cannot easily handle "wait for password" state in the same way 
            // if we want to follow the stateless pattern, but the logic 
            // "sessionService.setPdfState" should still be valid if we are sharing Redis.
            // HOWEVER, the `pdfStrategy` usually returns the buffer.
            // If the strategy returns a buffer we need to handle it.

            // If result.fileBuffer is Buffer, convert to Base64
            const base64Data = Buffer.isBuffer(result.fileBuffer)
                ? result.fileBuffer.toString('base64')
                : result.fileBuffer;

            // We need to import sessionService here to save state?
            // Yes, let's require it dynamically or at top if needed.
            const sessionService = require('../services/sessionService');
            await sessionService.setPdfState(userId, base64Data, 300);

            await reply("🔒 Este arquivo PDF é protegido por senha.\nDigite a senha para que eu possa ler:");
        }

    } catch (err) {
        console.error(`[Worker] Job ${job.id} failed:`, err);
        await reply("❌ Ocorreu um erro ao processar seu arquivo. Tente novamente mais tarde.");
        throw err; // Trigger BullMQ retry
    }

}, { connection });

// Event Listeners
mediaWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed!`);
});

mediaWorker.on('failed', (job, err) => {
    console.log(`[Worker] Job ${job.id} failed with ${err.message}`);
});

module.exports = mediaWorker;
