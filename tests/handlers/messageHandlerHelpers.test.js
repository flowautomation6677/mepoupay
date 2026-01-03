const {
    _authenticateUser,
    _handleLegacyHandshake
} = require('../../src/handlers/messageHandler');

// Mock dependencies (Hoisted)
jest.mock('../../src/repositories/UserRepository', () => ({
    findByPhone: jest.fn(),
    updateName: jest.fn()
}));
jest.mock('../../src/services/evolutionService', () => ({
    sendText: jest.fn()
}));
jest.mock('../../src/services/loggerService', () => ({
    warn: jest.fn(),
    info: jest.fn()
}));
jest.mock('../../src/services/sessionService', () => ({}));
jest.mock('../../src/handlers/CommandDispatcher', () => ({}));
jest.mock('../../src/handlers/MediaHandler', () => ({ MediaHandler: { handle: jest.fn() } }));
jest.mock('../../src/handlers/FeedbackHandler', () => ({}));
jest.mock('../../src/handlers/AiConversationHandler', () => ({}));

// Access mocks after they are defined/hoisted
const mockUserRepo = require('../../src/repositories/UserRepository');
const mockEvaluationService = require('../../src/services/evolutionService');
const mockLogger = require('../../src/services/loggerService');

describe('MessageHandler Helpers', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('_authenticateUser', () => {
        it('should return null and send denial if user not found', async () => {
            mockUserRepo.findByPhone.mockResolvedValue(null);
            const message = { from: '5511999999999@s.whatsapp.net' };

            const result = await _authenticateUser(message);

            expect(result).toBeNull();
            expect(mockUserRepo.findByPhone).toHaveBeenCalledWith('5511999999999');
            expect(mockLogger.warn).toHaveBeenCalled();
            expect(mockEvaluationService.sendText).toHaveBeenCalledWith(
                message.from,
                expect.stringContaining("Acesso Negado")
            );
        });

        it('should return user if found', async () => {
            const user = { id: 1, name: 'John' };
            mockUserRepo.findByPhone.mockResolvedValue(user);
            const message = { from: '5511999999999@s.whatsapp.net' };

            const result = await _authenticateUser(message);

            expect(result).toEqual(user);
            expect(mockEvaluationService.sendText).not.toHaveBeenCalled();
        });

        it('should update name if user has no name but message has pushname', async () => {
            const user = { id: 1, name: null };
            mockUserRepo.findByPhone.mockResolvedValue(user);
            const message = {
                from: '5511999999999@s.whatsapp.net',
                pushname: 'John Doe'
            };

            await _authenticateUser(message);

            expect(mockUserRepo.updateName).toHaveBeenCalledWith(1, 'John Doe');
        });
    });

    describe('_handleLegacyHandshake', () => {
        it('should return false if text does not match', async () => {
            const message = { body: "Hello" };
            const user = {};
            const result = await _handleLegacyHandshake(message, user);
            expect(result).toBe(false);
        });

        it('should return false if text matches but user missing goal', async () => {
            const message = { body: "Olá! Quero começar a economizar com a Porquim IA" };
            const user = { savings_goal: null }; // Missing goal
            const result = await _handleLegacyHandshake(message, user);
            expect(result).toBe(false);
        });

        it('should handle handshake if text matches and user has goal', async () => {
            const message = { body: "Olá! Quero começar a economizar com a Porquim IA", from: '123' };
            const user = {
                savings_goal: 1000,
                monthly_income: 5000,
                pushname: 'User'
            };

            const result = await _handleLegacyHandshake(message, user);

            expect(result).toBe(true);
            expect(mockEvaluationService.sendText).toHaveBeenCalledWith(
                '123',
                expect.stringContaining("R$ 1000")
            );
        });
    });
});
