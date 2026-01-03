const logger = require('../services/loggerService');
const queueService = require('../services/queueService');

class MediaHandler {
    async handle(message, user) {
        // Quick fail if no media or incorrect type
        if (!message.hasMedia || message.type === 'chat') return false;

        // 1. Memory Protection: Check file size header before download
        const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
        const fileSize = message._data?.size || 0;

        if (fileSize > MAX_SIZE_BYTES) {
            logger.warn('🚫 Media too large', { userId: user.id, size: fileSize });
            await message.reply("⚠️ Arquivo muito grande! Por favor, envie arquivos menores que 15MB.");
            return true;
        }

        const media = await message.downloadMedia();
        if (!media) {
            logger.warn('Failed to download media', { userId: user.id, messageId: message.id._serialized });
            await message.reply("❌ Não consegui baixar a mídia. Tente novamente.");
            return true;
        }

        const base64Data = media.data;
        const mime = media.mimetype;
        const filename = media.filename || message.body || 'unknown';

        let jobType = null;

        if (message.type === 'image') {
            jobType = 'PROCESS_IMAGE';
        } else if (message.type === 'ptt' || message.type === 'audio') {
            jobType = 'PROCESS_AUDIO';
        } else if (message.type === 'document' && (mime === 'application/pdf' || filename.endsWith('.pdf'))) {
            jobType = 'PROCESS_PDF';
        } else if (message.type === 'document') {
            if (filename.endsWith('.ofx') || mime.includes('ofx')) {
                jobType = 'PROCESS_OFX';
            } else if (filename.endsWith('.csv') || mime.includes('csv')) {
                jobType = 'PROCESS_CSV';
            } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || mime.includes('excel') || mime.includes('spreadsheet')) {
                jobType = 'PROCESS_XLSX';
            }
        }

        if (jobType) {
            await message.reply("⏳ Recebi seu arquivo! Estou processando e te aviso em instantes...");
            logger.info(`Queueing Job: ${jobType}`, { userId: user.id, filename });
            await queueService.addJob(jobType, {
                chatId: message.from,
                userId: user.id,
                mediaData: base64Data,
                mimeType: mime,
                filename: filename,
                body: message.body
            });
            return true; // Handled
        }

        return false; // Not a supported media type handled here
    }
}

module.exports = new MediaHandler();
