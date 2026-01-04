const { Worker } = require('bullmq');
const logger = require('../services/loggerService');
const queueService = require('../services/queueService');
const sessionService = require('../services/sessionService');
const { processExtractedData } = require('../services/dataProcessor');
const mediaStrategyFactory = require('../factories/MediaStrategyFactory');
const { TextStrategy: textStrategy } = require('../strategies/TextStrategy');
const redis = require('../services/redisClient');
const { AIResponseSchema } = require('../schemas/transactionSchema');

// --- Helpers ---

function _createMockMessage(jobData, replyCallback, type) {
    const { chatId, mediaData, mimeType, filename, body, id } = jobData;

    const mockMessage = {
        id: { id: id, _serialized: id },
        from: chatId,
        body: body || '',
        type: type === 'PROCESS_AUDIO' ? 'ptt' : 'document',
        _data: { mimetype: mimeType },
        hasMedia: true,
        downloadMedia: async () => ({
            mimetype: mimeType,
            data: mediaData,
            filename: filename
        }),
        reply: replyCallback
    };

    if (type === 'PROCESS_IMAGE') mockMessage.type = 'image';
    return mockMessage;
}

async function _processAIResponse(responseContent, userId, replyCallback) {
    const text = typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent);
    let processedSuccessfully = false;

    // Extract JSON
    let jsonStr = text;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = text.substring(firstBrace, lastBrace + 1);
    }

    try {
        const parsedRaw = JSON.parse(jsonStr);
        const validation = AIResponseSchema.safeParse(parsedRaw);
        if (validation.success) {
            // Valid JSON: Process silently
            await processExtractedData(validation.data, userId, replyCallback);
            processedSuccessfully = true;
        }
    } catch { /* Not a JSON, ignore */ }

    // If NOT processed as a transaction, reply with text
    if (!processedSuccessfully) {
        await replyCallback(text);
    }
    return text; // Return text for context update
}

async function _handleTextCommand(text, userId, replyCallback, mockMessage) {
    const userContext = await sessionService.getContext(userId);
    const mockUser = { id: userId };

    const response = await textStrategy.execute(text, mockMessage, mockUser, userContext);

    if (response.type === 'ai_response' || response.type === 'tool_response') {
        const responseText = await _processAIResponse(response.content, userId, replyCallback);

        userContext.push({ role: "user", content: text });
        userContext.push({ role: "assistant", content: responseText });
        if (userContext.length > 10) userContext.splice(0, userContext.length - 10);
        await sessionService.setContext(userId, userContext, 86400);
    }
}

async function _handlePdfPasswordRequest(result, userId, replyCallback) {
    const base64Data = Buffer.isBuffer(result.fileBuffer)
        ? result.fileBuffer.toString('base64')
        : result.fileBuffer;

    await sessionService.setPdfState(userId, base64Data, 300);
    await replyCallback("🔒 Este arquivo PDF é protegido por senha.\nDigite a senha para que eu possa ler:");
}

async function _processStrategyResult(result, userId, replyCallback, mockMessage) {
    if (!result) return;

    switch (result.type) {
        case 'data_extraction':
            await processExtractedData(result.content, userId, replyCallback);
            break;
        case 'text_command':
            await _handleTextCommand(result.content, userId, replyCallback, mockMessage);
            break;
        case 'system_error':
            await replyCallback(`❌ ${result.content}`);
            break;
        case 'pdf_password_request':
            await _handlePdfPasswordRequest(result, userId, replyCallback);
            break;
    }
}

// --- Worker ---

const mediaWorker = new Worker('media-processing', async (job) => {
    const { chatId, userId } = job.data;
    const type = job.name;

    logger.info(`[Worker] Processing Job ${job.id}`, { type, userId });

    const reply = async (text) => {
        try {
            await queueService.addOutbound(chatId, text);
        } catch (err) {
            logger.error(`[Worker] Failed to queue outbound message`, { chatId, error: err });
        }
    };

    try {
        const mockMessage = _createMockMessage({ ...job.data, id: job.id }, reply, type);

        // Execute Strategy
        const strategy = mediaStrategyFactory.getStrategy(type);
        const result = await strategy.execute(mockMessage, job.data);

        await _processStrategyResult(result, userId, reply, mockMessage);

    } catch (err) {
        logger.error(`[Worker] Job ${job.id} failed`, { error: err });
        await reply("❌ Ocorreu um erro ao processar seu arquivo. Tente novamente mais tarde.");
        throw err;
    }

}, { connection: redis });

mediaWorker.on('completed', (job) => {
    logger.info(`[Worker] Job ${job.id} completed!`);
});

mediaWorker.on('failed', (job, err) => {
    logger.error(`[Worker] Job ${job.id} failed`, { error: err.message });
});

// Export worker mostly, but expose helpers for testing
mediaWorker._createMockMessage = _createMockMessage;
mediaWorker._processAIResponse = _processAIResponse;
mediaWorker._processStrategyResult = _processStrategyResult;
mediaWorker._handleTextCommand = _handleTextCommand;
mediaWorker._handlePdfPasswordRequest = _handlePdfPasswordRequest;

module.exports = mediaWorker;
