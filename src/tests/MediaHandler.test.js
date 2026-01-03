const MediaHandler = require('../handlers/MediaHandler');
const queueService = require('../services/queueService');

// Mocks
jest.mock('../services/queueService');
jest.mock('../services/loggerService');

describe('MediaHandler', () => {
    let mockUser;
    let mockMessage;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = { id: 'user-123' };
        mockMessage = {
            id: { _serialized: 'msg-id' },
            from: '552199999999',
            body: '',
            hasMedia: true,
            type: 'image',
            _data: { size: 1000 },
            reply: jest.fn().mockResolvedValue(true),
            downloadMedia: jest.fn().mockResolvedValue({
                data: 'base64',
                mimetype: 'image/jpeg',
                filename: 'image.jpg'
            })
        };
    });

    test('should reject files larger than 15MB', async () => {
        mockMessage._data.size = 20 * 1024 * 1024; // 20MB

        const result = await MediaHandler.handle(mockMessage, mockUser);

        expect(result).toBe(true);
        expect(mockMessage.reply).toHaveBeenCalledWith(expect.stringContaining('muito grande'));
        expect(mockMessage.downloadMedia).not.toHaveBeenCalled();
    });

    test('should handle download failure', async () => {
        mockMessage.downloadMedia.mockResolvedValue(null);

        const result = await MediaHandler.handle(mockMessage, mockUser);

        expect(result).toBe(true);
        expect(mockMessage.reply).toHaveBeenCalledWith(expect.stringContaining('Não consegui baixar'));
    });

    test('should queue PROCESS_IMAGE job for image type', async () => {
        mockMessage.type = 'image';

        const result = await MediaHandler.handle(mockMessage, mockUser);

        expect(result).toBe(true);
        expect(queueService.addJob).toHaveBeenCalledWith('PROCESS_IMAGE', expect.objectContaining({
            userId: 'user-123',
            mediaData: 'base64'
        }));
    });

    test('should queue PROCESS_AUDIO job for ptt type', async () => {
        mockMessage.type = 'ptt';
        mockMessage.downloadMedia.mockResolvedValue({
            data: 'base64audio',
            mimetype: 'audio/ogg',
            filename: 'audio.ogg'
        });

        const result = await MediaHandler.handle(mockMessage, mockUser);

        expect(result).toBe(true);
        expect(queueService.addJob).toHaveBeenCalledWith('PROCESS_AUDIO', expect.objectContaining({
            userId: 'user-123',
            mediaData: 'base64audio'
        }));
    });

    test('should queue PROCESS_PDF job for pdf document', async () => {
        mockMessage.type = 'document';
        mockMessage.downloadMedia.mockResolvedValue({
            data: 'base64pdf',
            mimetype: 'application/pdf',
            filename: 'doc.pdf'
        });

        const result = await MediaHandler.handle(mockMessage, mockUser);

        expect(result).toBe(true);
        expect(queueService.addJob).toHaveBeenCalledWith('PROCESS_PDF', expect.objectContaining({
            filename: 'doc.pdf'
        }));
    });

    test('should queue PROCESS_OFX job for ofx extension', async () => {
        mockMessage.type = 'document';
        mockMessage.downloadMedia.mockResolvedValue({
            data: 'base64ofx',
            mimetype: 'application/octet-stream',
            filename: 'statement.ofx'
        });

        const result = await MediaHandler.handle(mockMessage, mockUser);

        expect(result).toBe(true);
        expect(queueService.addJob).toHaveBeenCalledWith('PROCESS_OFX', expect.objectContaining({
            filename: 'statement.ofx'
        }));
    });

    test('should ignore unsupported document types', async () => {
        mockMessage.type = 'document';
        mockMessage.downloadMedia.mockResolvedValue({
            data: 'base64exe',
            mimetype: 'application/octet-stream',
            filename: 'virus.exe'
        });

        const result = await MediaHandler.handle(mockMessage, mockUser);

        expect(result).toBe(false);
        expect(queueService.addJob).not.toHaveBeenCalled();
    });
});
