const mediaWorker = require('../../src/workers/mediaWorker');
const {
    _createMockMessage,
    _processAIResponse
} = mediaWorker;

// Mock dependencies
const mockProcessExtractedData = jest.fn();
jest.mock('../../src/services/dataProcessor', () => ({
    processExtractedData: jest.fn((...args) => mockProcessExtractedData(...args))
}));
jest.mock('../../src/services/loggerService', () => ({}));
jest.mock('../../src/services/queueService', () => ({}));
jest.mock('../../src/services/sessionService', () => ({}));
jest.mock('../../src/factories/MediaStrategyFactory', () => ({}));
jest.mock('../../src/strategies/TextStrategy', () => ({}));
jest.mock('../../src/services/redisClient', () => ({}));

describe('MediaWorker Helpers', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('_createMockMessage', () => {
        it('should create a mock message with correct properties', async () => {
            const jobData = {
                chatId: '12345',
                mediaData: 'base64str',
                mimeType: 'image/jpeg',
                filename: 'test.jpg',
                body: 'caption',
                id: 'job1'
            };
            const replyFn = jest.fn();

            const msg = _createMockMessage(jobData, replyFn, 'PROCESS_IMAGE');

            expect(msg.from).toBe('12345');
            expect(msg.body).toBe('caption');
            expect(msg.type).toBe('image');
            expect(msg.hasMedia).toBe(true);
            expect(msg.reply).toBe(replyFn);

            const media = await msg.downloadMedia();
            expect(media).toEqual({
                mimetype: 'image/jpeg',
                data: 'base64str',
                filename: 'test.jpg'
            });
        });

        it('should default type to document/ptt correctly', () => {
            const jobData = { id: '1' };
            const replyFn = jest.fn();

            const msgAudio = _createMockMessage(jobData, replyFn, 'PROCESS_AUDIO');
            expect(msgAudio.type).toBe('ptt');

            const msgDoc = _createMockMessage(jobData, replyFn, 'PROCESS_PDF');
            expect(msgDoc.type).toBe('document');
        });
    });

    describe('_processAIResponse', () => {
        it('should parse valid JSON and call processExtractedData', async () => {
            // Using a valid transaction structure to match Schema
            const dataPayload = { transacoes: [{ valor: 100, descricao: 'Test' }] };
            const jsonText = `Some text \`\`\`json\n${JSON.stringify(dataPayload)}\n\`\`\``;
            const userId = 'user1';
            const replyFn = jest.fn();

            const result = await _processAIResponse(jsonText, userId, replyFn);

            // Expect schema defaults to be added
            expect(mockProcessExtractedData).toHaveBeenCalledWith(
                expect.objectContaining({ transacoes: expect.anything() }),
                userId,
                replyFn
            );
            expect(replyFn).not.toHaveBeenCalled(); // Successful process, silent
            expect(result).toBe(jsonText);
        });

        it('should handle plain text response (invalid JSON) and reply', async () => {
            const plainText = 'Just a chat message';
            const userId = 'user1';
            const replyFn = jest.fn();

            const result = await _processAIResponse(plainText, userId, replyFn);

            expect(mockProcessExtractedData).not.toHaveBeenCalled();
            expect(replyFn).toHaveBeenCalledWith(plainText);
            expect(result).toBe(plainText);
        });

        it('should handle broken JSON safely', async () => {
            const brokenJson = '{"data": ';
            const userId = 'user1';
            const replyFn = jest.fn();

            const result = await _processAIResponse(brokenJson, userId, replyFn);

            expect(mockProcessExtractedData).not.toHaveBeenCalled();
            expect(replyFn).toHaveBeenCalledWith(brokenJson);
        });
    });
});
