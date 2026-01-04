/* eslint-disable no-undef */
jest.mock('bullmq', () => ({
    Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn()
    })),
    Queue: jest.fn()
}));
jest.mock('../../src/services/loggerService');
jest.mock('../../src/services/queueService');
jest.mock('../../src/services/sessionService');
jest.mock('../../src/services/dataProcessor', () => ({
    processExtractedData: jest.fn(),
    AIResponseSchema: { safeParse: jest.fn(() => ({ success: true, data: {} })) }
}));
jest.mock('../../src/factories/MediaStrategyFactory');
jest.mock('../../src/strategies/TextStrategy');
jest.mock('../../src/services/redisClient', () => ({}));

const mediaWorker = require('../../src/workers/mediaWorker');
const sessionService = require('../../src/services/sessionService');
const { TextStrategy } = require('../../src/strategies/TextStrategy');
const { processExtractedData } = require('../../src/services/dataProcessor');

describe('MediaWorker Helpers', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('_processStrategyResult', () => {
        const userId = 'user-123';
        const replyCallback = jest.fn();
        const mockMessage = {};

        test('deve processar type data_extraction', async () => {
            const result = { type: 'data_extraction', content: { data: 'test' } };

            await mediaWorker._processStrategyResult(result, userId, replyCallback, mockMessage);

            expect(processExtractedData).toHaveBeenCalledWith(result.content, userId, replyCallback);
        });

        test('deve processar type system_error', async () => {
            const result = { type: 'system_error', content: 'Falha crítica' };

            await mediaWorker._processStrategyResult(result, userId, replyCallback, mockMessage);

            expect(replyCallback).toHaveBeenCalledWith('❌ Falha crítica');
        });

        test('deve processar type pdf_password_request', async () => {
            const result = { type: 'pdf_password_request', fileBuffer: Buffer.from('pdf') };

            await mediaWorker._processStrategyResult(result, userId, replyCallback, mockMessage);

            expect(sessionService.setPdfState).toHaveBeenCalled();
            expect(replyCallback).toHaveBeenCalledWith(expect.stringContaining('senha'));
        });

        test('deve processar type text_command', async () => {
            const result = { type: 'text_command', content: 'Texto extraído' };

            // Mock text strategy flow
            TextStrategy.execute.mockResolvedValue({ type: 'ai_response', content: 'Resposta AI' });
            sessionService.getContext.mockResolvedValue([]);

            await mediaWorker._processStrategyResult(result, userId, replyCallback, mockMessage);

            expect(TextStrategy.execute).toHaveBeenCalledWith('Texto extraído', mockMessage, expect.anything(), expect.anything());
            // Verifica atualização de contexto
            expect(sessionService.setContext).toHaveBeenCalled();
        });
    });
});
