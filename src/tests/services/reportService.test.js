const reportService = require('../../services/reportService');
const TransactionRepository = require('../../repositories/TransactionRepository');
const { format } = require('date-fns');

jest.mock('../../repositories/TransactionRepository');

describe('ReportService - getMonthlyStats', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return aggregated data for a specific month and year', async () => {
        // Arrange
        const userId = '123';
        const mockTransactions = [
            { valor: 100, tipo: 'receita', categoria: 'Salário' },
            { valor: 50, tipo: 'despesa', categoria: 'Comida' },
            { valor: 20, tipo: 'despesa', categoria: 'Transporte' },
            { valor: 30, tipo: 'despesa', categoria: 'Comida' }
        ];

        TransactionRepository.prototype.findByUserAndDateRange.mockResolvedValue(mockTransactions);

        // Act
        // month is 0-indexed. 2 = March
        const result = await reportService.getMonthlyStats(userId, 2, 2026);

        // Assert
        expect(result.totalReceitas).toBe(100);
        expect(result.totalDespesas).toBe(100); // 50+20+30
        expect(result.saldo).toBe(0);
        expect(result.categorias).toEqual({
            'Comida': 80,
            'Transporte': 20
        });
        expect(result.periodo.mes.toLowerCase()).toBe('março');
        expect(result.periodo.ano).toBe(2026);
        expect(result.hasData).toBe(true);
        expect(result.transactions).toBe(mockTransactions);
    });

    test('should return hasData false if no transactions', async () => {
        const userId = '123';
        TransactionRepository.prototype.findByUserAndDateRange.mockResolvedValue([]);

        const result = await reportService.getMonthlyStats(userId, 2, 2026);

        expect(result.hasData).toBe(false);
        expect(result.totalReceitas).toBe(0);
        expect(result.totalDespesas).toBe(0);
        expect(result.saldo).toBe(0);
        expect(result.categorias).toEqual({});
    });
});
