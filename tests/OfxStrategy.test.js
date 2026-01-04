const {
    OfxStrategy,
    _downloadAndValidateMedia,
    _parseOfxData,
    _extractTransactionList,
    _formatOfxDate,
    _mapTransaction,
    _processTransactions,
    _calculateBalance
} = require('../src/strategies/OfxStrategy');

// Mock dependencies if needed, but helpers are pure-ish
const securityService = require('../src/services/securityService');

jest.mock('../src/services/securityService', () => ({
    redactPII: jest.fn(val => val)
}));

jest.mock('../src/services/loggerService');

describe('OfxStrategy - Refactored Functions', () => {

    describe('_downloadAndValidateMedia', () => {
        test('deve retornar mídia se sucesso', async () => {
            const mockMessage = {
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'application/x-ofx',
                    data: 'base64data'
                })
            };
            const result = await _downloadAndValidateMedia(mockMessage);
            expect(result).toEqual({ mimetype: 'application/x-ofx', data: 'base64data' });
        });

        test('deve retornar null se download falhar', async () => {
            const mockMessage = {
                downloadMedia: jest.fn().mockResolvedValue(null)
            };
            const result = await _downloadAndValidateMedia(mockMessage);
            expect(result).toBeNull();
        });
    });

    describe('_parseOfxData', () => {
        const ofxContent = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
</OFX>`;
        // Mock node-ofx-parser handled by implementation? 
        // Logic uses require('node-ofx-parser').parse. We assume it works or mock it.
        // For unit test of logic *around* it, we can trust the lib or mock it.
        // Let's rely on integration for lib, unit for flow.
        // Actually, _parseOfxData calls the lib. Let's strictly test it passes buffer correctly.
    });

    describe('_formatOfxDate', () => {
        test('deve formatar YYYYMMDD corretamente', () => {
            const result = _formatOfxDate('20260104120000');
            expect(result).toBe('2026-01-04');
        });
    });

    describe('_mapTransaction', () => {
        test('deve mapear transação de despesa', () => {
            const tx = {
                TRNAMT: "-50.00",
                MEMO: "Supermercado",
                DTPOSTED: "20260104100000",
                FITID: "12345"
            };
            const result = _mapTransaction(tx);
            expect(result).toEqual({
                descricao: "Supermercado",
                valor: 50.00,
                tipo: 'despesa',
                categoria: 'Bancário',
                data: '2026-01-04',
                raw_id: "12345"
            });
        });

        test('deve mapear transação de receita', () => {
            const tx = {
                TRNAMT: "1000.00",
                MEMO: "Salário",
                DTPOSTED: "20260105",
                FITID: "67890"
            };
            const result = _mapTransaction(tx);
            expect(result).toEqual({
                descricao: "Salário",
                valor: 1000.00,
                tipo: 'receita',
                categoria: 'Bancário',
                data: '2026-01-05',
                raw_id: "67890"
            });
        });
    });

    describe('_calculateBalance', () => {
        test('deve calcular saldo corretamente', () => {
            const transactions = [
                { tipo: 'despesa', valor: 50 },
                { tipo: 'receita', valor: 100 },
                { tipo: 'despesa', valor: 10 }
            ];
            const result = _calculateBalance(transactions);
            expect(result).toBe(40); // 100 - 50 - 10 = 40
        });

        test('deve retornar 0 para lista vazia', () => {
            expect(_calculateBalance([])).toBe(0);
        });
    });

    describe('_processTransactions', () => {
        test('deve retornar array vazio se lista nula', () => {
            expect(_processTransactions(null)).toEqual([]);
        });
    });
});
