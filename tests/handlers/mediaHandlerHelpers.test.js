const {
    _isValidSize,
    _determineJobType,
    _downloadMediaSafe
} = require('../../src/handlers/MediaHandler');

// Mock Logger
jest.mock('../../src/services/loggerService', () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
}));

describe('MediaHandler Helpers', () => {

    describe('_isValidSize', () => {
        it('should return true for small files', () => {
            const message = { _data: { size: 1024 } }; // 1KB
            expect(_isValidSize(message)).toBe(true);
        });

        it('should return false for files larger than limit', () => {
            const limit = 100;
            const message = { _data: { size: 200 } };
            expect(_isValidSize(message, limit)).toBe(false);
        });

        it('should fail safely if size is missing (assume 0)', () => {
            const message = {};
            expect(_isValidSize(message)).toBe(true);
        });
    });

    describe('_determineJobType', () => {
        it('should identify images', () => {
            const msg = { type: 'image' };
            const media = { mimetype: 'image/jpeg' };
            expect(_determineJobType(msg, media)).toBe('PROCESS_IMAGE');
        });

        it('should identify audio/ptt', () => {
            const msg = { type: 'ptt' };
            const media = { mimetype: 'audio/ogg' };
            expect(_determineJobType(msg, media)).toBe('PROCESS_AUDIO');
        });

        it('should identify PDF documents', () => {
            const msg = { type: 'document' };
            const media = { mimetype: 'application/pdf', filename: 'doc.pdf' };
            expect(_determineJobType(msg, media)).toBe('PROCESS_PDF');
        });

        it('should identify OFX files', () => {
            const msg = { type: 'document' };
            const media = { mimetype: 'text/plain', filename: 'bank.ofx' };
            expect(_determineJobType(msg, media)).toBe('PROCESS_OFX');
        });

        it('should identify CSV files', () => {
            const msg = { type: 'document' };
            const media = { mimetype: 'text/csv', filename: 'data.csv' };
            expect(_determineJobType(msg, media)).toBe('PROCESS_CSV');
        });

        it('should identify Excel files', () => {
            const msg = { type: 'document' };
            const media = { mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: 'sheet.xlsx' };
            expect(_determineJobType(msg, media)).toBe('PROCESS_XLSX');
        });

        it('should return null for unknown types', () => {
            const msg = { type: 'document' };
            const media = { mimetype: 'application/unknown', filename: 'unknown.xyz' };
            expect(_determineJobType(msg, media)).toBeNull();
        });
    });

    describe('_downloadMediaSafe', () => {
        it('should return media if download succeeds', async () => {
            const message = {
                downloadMedia: jest.fn().mockResolvedValue({ data: 'base64' }),
                id: { _serialized: 'msg123' }
            };
            const result = await _downloadMediaSafe(message, 'user1');
            expect(result).toEqual({ data: 'base64' });
        });

        it('should return null and log if download fails (returns null)', async () => {
            const message = {
                downloadMedia: jest.fn().mockResolvedValue(null),
                id: { _serialized: 'msg123' }
            };
            const result = await _downloadMediaSafe(message, 'user1');
            expect(result).toBeNull();
        });

        it('should return null and safe catch error on exception', async () => {
            const message = {
                downloadMedia: jest.fn().mockRejectedValue(new Error('Network error')),
                id: { _serialized: 'msg123' }
            };
            const result = await _downloadMediaSafe(message, 'user1');
            expect(result).toBeNull();
        });
    });

});
