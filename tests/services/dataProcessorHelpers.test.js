const {
    _parseContent,
    _normalizeTransactions,
    _processItems,
    _generatePayload,
    _handleResponse
} = require('../../src/services/dataProcessor');

// Mock dependencies
jest.mock('../../src/services/currencyService', () => ({
    convertValue: jest.fn().mockResolvedValue({ convertedValue: 100, exchangeRate: 1.0 })
}));

jest.mock('../../src/utils/dateUtility', () => ({
    formatToISO: (date) => date // Simple mock
}));

jest.mock('../../src/services/formatterService', () => ({
    formatSuccessMessage: (obj) => `Success: ${obj.descricao}\n`,
    formatErrorMessage: (msg) => `Error: ${msg}`
}));

describe('Data Processor Helpers', () => {

    describe('_parseContent', () => {
        it('should parse valid JSON string', () => {
            const input = '{"key": "value"}';
            expect(_parseContent(input)).toEqual({ key: "value" });
        });

        it('should clean markdown code blocks', () => {
            const input = '```json\n{"key": "value"}\n```';
            expect(_parseContent(input)).toEqual({ key: "value" });
        });

        it('should return object if already an object', () => {
            const input = { key: "value" };
            expect(_parseContent(input)).toEqual(input);
        });

        it('should return null for invalid JSON', () => {
            expect(_parseContent("invalid-json")).toBeNull();
        });
    });

    describe('_normalizeTransactions', () => {
        it('should merge transacoes and gastos arrays', () => {
            const data = {
                transacoes: [{ id: 1 }],
                gastos: [{ id: 2 }]
            };
            const result = _normalizeTransactions(data);
            expect(result).toHaveLength(2);
        });

        it('should handle legacy "valor" field', () => {
            const data = { valor: 50 };
            const result = _normalizeTransactions(data);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ valor: 50 });
        });

        it('should infer invoice payment if empty but total_fatura exists', () => {
            const data = { total_fatura: 500, vencimento: '2025-10-10' };
            const result = _normalizeTransactions(data);
            expect(result).toHaveLength(1);
            expect(result[0].descricao).toContain('Pagamento de Fatura');
            expect(result[0].valor).toBe(500);
        });
    });

    describe('_processItems', () => {
        it('should filter items without value', async () => {
            const items = [{ valor: 10 }, { descricao: 'No Value' }];
            const result = await _processItems(items);
            expect(result).toHaveLength(1);
        });

        it('should convert currency and keep original values', async () => {
            const items = [{ valor: 10, moeda: 'USD' }];
            const result = await _processItems(items);

            expect(result[0].valor).toBe(100); // Mocked return
            expect(result[0].valor_original).toBe(10);
            expect(result[0].taxa_cambio).toBe(1.0);
        });
    });

    describe('_generatePayload', () => {
        it('should generate correct status for high confidence', () => {
            const items = [{ valor: 100 }];
            const embeddings = [[0.1, 0.2]];
            const data = { confidence_score: 0.9 };

            const result = _generatePayload(items, embeddings, 'user123', data);

            expect(result.status).toBe('confirmed');
            expect(result.payload[0].status).toBe('confirmed');
            expect(result.payload[0].is_validated).toBe(true);
        });

        it('should generate correct status for low confidence', () => {
            const items = [{ valor: 100 }];
            const embeddings = [[0.1, 0.2]];
            const data = { confidence_score: 0.5 };

            const result = _generatePayload(items, embeddings, 'user123', data);

            expect(result.status).toBe('pending_review');
            expect(result.payload[0].status).toBe('pending_review');
            expect(result.payload[0].is_validated).toBe(false);
        });
    });
});
