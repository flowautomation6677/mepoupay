const clearContextCommand = require('../../commands/ClearContextCommand');
const sessionService = require('../../services/sessionService');
const logger = require('../../services/loggerService');

// Mock dependencies
jest.mock('../../services/sessionService');
jest.mock('../../services/loggerService');

describe('ClearContextCommand', () => {
    let mockMessage;
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();

        mockMessage = {
            reply: jest.fn().mockResolvedValue(true)
        };

        mockUser = {
            id: '5511999999999'
        };
    });

    describe('matches', () => {
        it('should match valid triggers', () => {
            expect(clearContextCommand.matches('/esquecer')).toBe(true);
            expect(clearContextCommand.matches('/limpar')).toBe(true);
            expect(clearContextCommand.matches('/forget')).toBe(true);
            expect(clearContextCommand.matches('/clean')).toBe(true);

            // test with spaces and different casing
            expect(clearContextCommand.matches('  /ESQUECER   ')).toBe(true);
        });

        it('should not match invalid triggers', () => {
            expect(clearContextCommand.matches('/reset')).toBe(false);
            expect(clearContextCommand.matches('esquecer')).toBe(false);
        });
    });

    describe('execute', () => {
        it('should call sessionService.clearContext and reply to user', async () => {
            sessionService.clearContext.mockResolvedValue();
            sessionService.clearPendingCorrection.mockResolvedValue();

            const result = await clearContextCommand.execute(mockMessage, mockUser);

            // Assertions
            expect(sessionService.clearContext).toHaveBeenCalledWith(mockUser.id);
            expect(sessionService.clearPendingCorrection).toHaveBeenCalledWith(mockUser.id);
            expect(mockMessage.reply).toHaveBeenCalledWith(expect.stringContaining('Esqueci tudo o que conversamos'));
            expect(result).toEqual({ handled: true });
        });

        it('should handle errors gracefully and reply with error message', async () => {
            // Mock an error
            const error = new Error('Redis connection failed');
            sessionService.clearContext.mockRejectedValue(error);

            const result = await clearContextCommand.execute(mockMessage, mockUser);

            // Assertions
            expect(logger.error).toHaveBeenCalledWith('Error clearing context', error);
            expect(mockMessage.reply).toHaveBeenCalledWith('❌ Erro ao limpar memória.');
            expect(result).toEqual({ handled: true });
        });
    });
});
