const logger = require('../services/loggerService');
const queueService = require('../services/queueService');

// --- Helpers ---

function _isValidSize(message, limitBytes = 15 * 1024 * 1024) {
    const fileSize = message._data?.size || 0;
    return fileSize <= limitBytes;
}

async function _downloadMediaSafe(message, userId) {
    try {
        const media = await message.downloadMedia();
        if (!media) {
            logger.warn('Failed to download media', { userId, messageId: message.id._serialized });
            return null;
        }
        return media;
    } catch (error) {
        logger.error('Error downloading media', { userId, error });
        return null;
    }
}

function _determineJobType(message, media) {
    const mime = media.mimetype;
    const filename = media.filename || message.body || 'unknown';

    if (message.type === 'image') return 'PROCESS_IMAGE';
    if (message.type === 'ptt' || message.type === 'audio') return 'PROCESS_AUDIO';

    if (message.type === 'document') {
        if (mime === 'application/pdf' || filename.endsWith('.pdf')) return 'PROCESS_PDF';
        if (filename.endsWith('.ofx') || mime.includes('ofx')) return 'PROCESS_OFX';
        if (filename.endsWith('.csv') || mime.includes('csv')) return 'PROCESS_CSV';
        if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || mime.includes('excel') || mime.includes('spreadsheet')) return 'PROCESS_XLSX';
    }
    return null;
}

class MediaHandler {
    async handle(message, user) {
        // Quick fail if no media or incorrect type
        if (!message.hasMedia || message.type === 'chat') return false;

        // 1. Memory Protection
        if (!_isValidSize(message)) {
            logger.warn('🚫 Media too large', { userId: user.id, size: message._data?.size });
            await message.reply("⚠️ Arquivo muito grande! Por favor, envie arquivos menores que 15MB.");
            return true;
        }

        // 2. Download Media
        const media = await _downloadMediaSafe(message, user.id);
        if (!media) {
            await message.reply("❌ Não consegui baixar a mídia. Tente novamente.");
            return true;
        }

        const base64Data = media.data;
        const mime = media.mimetype;
        const filename = media.filename || message.body || 'unknown';

        // 3. Determine Job Type
        const jobType = _determineJobType(message, media);

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

module.exports = {
    MediaHandler: new MediaHandler(),
    // Exporting helpers for testing
    _isValidSize,
    _determineJobType,
    _downloadMediaSafe
};
