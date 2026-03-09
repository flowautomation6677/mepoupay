const sessionService = require('../services/sessionService');
const redis = require('../services/redisClient');

jest.mock('../services/redisClient', () => ({
    set: jest.fn(),
    get: jest.fn()
}));

describe('Session Service - Short Term Memory', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should set last transaction IDs correctly', async () => {
        const userId = 'user-123';
        const txIds = ['id-1', 'id-2'];

        await sessionService.setLastTransactionIds(userId, txIds);

        expect(redis.set).toHaveBeenCalledWith(
            `session:lastTransactions:${userId}`,
            JSON.stringify(txIds),
            'EX',
            300
        );
    });

    test('should get last transaction IDs correctly when they exist', async () => {
        const userId = 'user-123';
        const txIds = ['id-1'];
        redis.get.mockResolvedValueOnce(JSON.stringify(txIds));

        const result = await sessionService.getLastTransactionIds(userId);

        expect(redis.get).toHaveBeenCalledWith(`session:lastTransactions:${userId}`);
        expect(result).toEqual(txIds);
    });

    test('should return null when getting non-existent last transaction IDs', async () => {
        const userId = 'user-123';
        redis.get.mockResolvedValueOnce(null);

        const result = await sessionService.getLastTransactionIds(userId);

        expect(result).toBeNull();
    });
});
