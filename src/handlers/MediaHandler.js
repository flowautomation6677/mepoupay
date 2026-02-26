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

// Document type matchers (extracted for clarity)
function _isPDF(mime, filename) {
    return mime === 'application/pdf' || filename.endsWith('.pdf');
}

function _isOFX(mime, filename) {
    return filename.endsWith('.ofx') || mime.includes('ofx');
}

function _isCSV(mime, filename) {
    return filename.endsWith('.csv') || mime.includes('csv');
}

function _isExcel(mime, filename) {
    return filename.endsWith('.xlsx') ||
        filename.endsWith('.xls') ||
        mime.includes('excel') ||
        mime.includes('spreadsheet');
}

// Refactored: Reduced complexity from ~17 to ~5
function _determineJobType(message, media) {
    const mime = media.mimetype;
    const filename = media.filename || message.body || 'unknown';
    const messageType = message.type;

    // Map simple types
    if (messageType === 'image') return 'PROCESS_IMAGE';
    if (messageType === 'ptt' || messageType === 'audio') return 'PROCESS_AUDIO';

    // Handle document types
    if (messageType === 'document') {
        if (_isPDF(mime, filename)) return 'PROCESS_PDF';
        if (_isOFX(mime, filename)) return 'PROCESS_OFX';
        if (_isCSV(mime, filename)) return 'PROCESS_CSV';
        if (_isExcel(mime, filename)) return 'PROCESS_XLSX';
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
                body: message.body,
                instanceName: message.instanceName
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
    _downloadMediaSafe,
    // Exporting matchers for testing
    _isPDF,
    _isOFX,
    _isCSV,
    _isExcel
};
