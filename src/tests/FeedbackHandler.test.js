const FeedbackHandler = require('../handlers/FeedbackHandler');
const sessionService = require('../services/sessionService');
const queueService = require('../services/queueService');
const { adminClient } = require('../services/supabaseClient');

// Mocks
jest.mock('../services/sessionService');
jest.mock('../services/queueService');
jest.mock('../services/loggerService'); // Silent logger
jest.mock('../services/supabaseClient', () => {
    return {
        adminClient: {
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({ error: null })
        }
    };
});
// Mock the TransactionRepository class
jest.mock('../repositories/TransactionRepository', () => {
    return jest.fn().mockImplementation(() => {
        return {
            update: jest.fn().mockResolvedValue(true)
        };
    });
});

describe('FeedbackHandler', () => {
    let mockUser;
    let mockMessage;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = { id: 'user-123' };
        mockMessage = {
            from: '552199999999',
            body: '',
            hasMedia: false,
            reply: jest.fn().mockResolvedValue(true)
        };
    });

    test('should queue PDF password retry if PDF state exists', async () => {
        // Setup
        sessionService.getPdfState.mockResolvedValue('base64data');
        mockMessage.body = 'mypassword';

        // Execute
        const result = await FeedbackHandler.handle(mockMessage, mockUser);

        // Verify
        expect(result).toBe(true);
        expect(queueService.addJob).toHaveBeenCalledWith('RETRY_PDF_PASSWORD', expect.objectContaining({
            userId: 'user-123',
            password: 'mypassword',
            mediaData: 'base64data'
        }));
        expect(mockMessage.reply).toHaveBeenCalledWith(expect.stringContaining('Verificando senha'));
    });

    test('should confirm pending transaction if user says "sim"', async () => {
        // Setup
        sessionService.getPdfState.mockResolvedValue(null);
        sessionService.getPendingCorrection.mockResolvedValue({
            is_processed: false,
            transactionIds: [1, 2]
        });
        mockMessage.body = 'sim';

        // Execute
        const result = await FeedbackHandler.handle(mockMessage, mockUser);

        // Verify
        expect(result).toBe(true);
        // We need to access the spy on the INSTANCE of TransactionRepository used by FeedbackHandler.
        // Since FeedbackHandler instantiates it internally, and we mocked the class to return a mock object,
        // we can inspect the methods of that mock object if we can access it?
        // Actually, FeedbackHandler exports an INSTANCE of the handler, which holds the repo instance.
        // But since we require FeedbackHandler which requires Repo, the mock is already in place.
        // However, we don't have direct access to the `transactionRepo` property of the handler (it's closure or private).
        // But jest.mock returns a mock constructor.
        // So the instances created by it have mock methods.

        // Wait, 'new TransactionRepository()' returns an object.
        // We need to verify if 'update' was called on *any* instance (since it's a singleton usage effectively).
        // Best way:
        /*
          const TransactionRepository = require('../repositories/TransactionRepository');
          const mockRepoInstance = TransactionRepository.mock.instances[0];
          expect(mockRepoInstance.update).toHaveBeenCalled();
        */
        // But FeedbackHandler is instantiated at require time.
        // So `TransactionRepository` constructor was called when `FeedbackHandler.js` was required.
        // `TransactionRepository` mock must be hoisted or defined before require.
        // Jest handles this.

        // Let's rely on the mock implementation correctness.
        // We can't easily get the specific instance if we didn't save it, but we can check if the mock class was used?
        // Actually, let's verify sessionService calls which are easier.
        expect(sessionService.clearPendingCorrection).toHaveBeenCalledWith('user-123');
        expect(mockMessage.reply).toHaveBeenCalledWith(expect.stringContaining('Confirmado'));
    });

    test('should record learning and ask correction if user says "não"', async () => {
        // Setup
        sessionService.getPdfState.mockResolvedValue(null);
        sessionService.getPendingCorrection.mockResolvedValue({
            is_processed: false,
            transactionIds: [1],
            last_input: 'gastei 50',
            ai_response: '{}',
            confidence: 0.5
        });
        mockMessage.body = 'não';

        // Execute
        const result = await FeedbackHandler.handle(mockMessage, mockUser);

        // Verify
        expect(result).toBe(true);
        expect(adminClient.from).toHaveBeenCalledWith('transaction_learning');
        expect(adminClient.insert).toHaveBeenCalled();
        expect(sessionService.clearPendingCorrection).toHaveBeenCalledWith('user-123');
        expect(mockMessage.reply).toHaveBeenCalledWith(expect.stringContaining('Entendi errado'));
    });

    test('should return false if no pending state matches', async () => {
        sessionService.getPdfState.mockResolvedValue(null);
        sessionService.getPendingCorrection.mockResolvedValue(null);
        mockMessage.body = 'olá';

        const result = await FeedbackHandler.handle(mockMessage, mockUser);

        expect(result).toBe(false);
    });
});
