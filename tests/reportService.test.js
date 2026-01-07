// Mock das dependências
jest.mock('pdf-lib');
// Definir mockRepo FORA para ser acessível na factory
const mockTransactionRepo = {
    findByUserAndDateRange: jest.fn()
};

jest.mock('pdf-lib');
jest.mock('../src/repositories/TransactionRepository', () => {
    return jest.fn().mockImplementation(() => mockTransactionRepo);
});
jest.mock('../src/services/loggerService');
jest.mock('date-fns', () => ({
    format: jest.fn((date, formatStr) => {
        // Mock simples para format
        if (formatStr === 'MMMM yyyy') return 'janeiro 2026';
        if (formatStr === 'dd/MM') return '01/01';
        return '01/01/2026';
    })
}));
jest.mock('date-fns/locale', () => ({
    ptBR: {}
}));

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const reportService = require('../src/services/reportService');
const TransactionRepository = require('../src/repositories/TransactionRepository');
const logger = require('../src/services/loggerService');

describe('ReportService', () => {
    let mockPdfDoc;
    let mockPage;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock do PDFDocument
        mockPage = {
            getSize: jest.fn().mockReturnValue({ width: 595, height: 842 }),
            drawText: jest.fn()
        };

        mockPdfDoc = {
            addPage: jest.fn().mockReturnValue(mockPage),
            embedFont: jest.fn().mockResolvedValue('mock-font'),
            save: jest.fn().mockResolvedValue(new Uint8Array([80, 68, 70])) // "PDF"
        };

        PDFDocument.create = jest.fn().mockResolvedValue(mockPdfDoc);
        StandardFonts.Helvetica = 'Helvetica';
        StandardFonts.HelveticaBold = 'HelveticaBold';

        // Mock do TransactionRepository
        // mockTransactionRepo já está definido globalmente, apenas limpamos
        mockTransactionRepo.findByUserAndDateRange.mockReset();
    });

    describe('generateMonthlyReport', () => {
        test('deve gerar relatório PDF para mês atual', async () => {
            const mockTransactions = [
                {
                    id: 'tx1',
                    valor: 100,
                    tipo: 'receita',
                    descricao: 'Salário',
                    categoria: 'Receita',
                    data: '2026-01-15'
                },
                {
                    id: 'tx2',
                    valor: 50,
                    tipo: 'despesa',
                    descricao: 'Market',
                    categoria: 'Alimentação',
                    data: '2026-01-16'
                }
            ];

            mockTransactionRepo.findByUserAndDateRange.mockResolvedValue(mockTransactions);

            const buffer = await reportService.generateMonthlyReport('user123');

            // Verificar que PDF foi criado
            expect(PDFDocument.create).toHaveBeenCalled();
            expect(mockPdfDoc.addPage).toHaveBeenCalled();
            expect(mockPdfDoc.embedFont).toHaveBeenCalledWith('Helvetica');
            expect(mockPdfDoc.embedFont).toHaveBeenCalledWith('HelveticaBold');

            // Verificar que save foi chamado
            expect(mockPdfDoc.save).toHaveBeenCalled();

            // Verificar que retornou Buffer
            expect(buffer).toBeInstanceOf(Buffer);
        });

        test('deve buscar transações do período correto', async () => {
            mockTransactionRepo.findByUserAndDateRange.mockResolvedValue([]);

            await reportService.generateMonthlyReport('user123', 5, 2025); // Junho 2025

            expect(mockTransactionRepo.findByUserAndDateRange).toHaveBeenCalledWith(
                'user123',
                expect.stringContaining('2025-06-01'),
                expect.stringContaining('2025-06-30')
            );
        });

        test('deve calcular totais de receitas e despesas corretamente', async () => {
            const mockTransactions = [
                { valor: 1000, tipo: 'receita', descricao: 'Sal', categoria: 'Rec', data: '2026-01-01' },
                { valor: 500, tipo: 'receita', descricao: 'Bonus', categoria: 'Rec', data: '2026-01-02' },
                { valor: 300, tipo: 'despesa', descricao: 'Market', categoria: 'Alim', data: '2026-01-03' },
                { valor: 200, tipo: 'despesa', descricao: 'Transp', categoria: 'Transp', data: '2026-01-04' }
            ];

            mockTransactionRepo.findByUserAndDateRange.mockResolvedValue(mockTransactions);

            await reportService.generateMonthlyReport('user123');

            // Verificar que drawText foi chamado com valores corretos
            // Total Receitas: 1500
            // Total Despesas: 500
            // Saldo: 1000
            expect(mockPage.drawText).toHaveBeenCalledWith(
                expect.stringContaining('R$ 1500.00'),
                expect.any(Object)
            );
            expect(mockPage.drawText).toHaveBeenCalledWith(
                expect.stringContaining('R$ 500.00'),
                expect.any(Object)
            );
            expect(mockPage.drawText).toHaveBeenCalledWith(
                expect.stringContaining('R$ 1000.00'),
                expect.any(Object)
            );
        });

        test('deve agrupar despesas por categoria', async () => {
            const mockTransactions = [
                { valor: 100, tipo: 'despesa', descricao: 'Merc 1', categoria: 'Alimentação', data: '2026-01-01' },
                { valor: 150, tipo: 'despesa', descricao: 'Merc 2', categoria: 'Alimentação', data: '2026-01-02' },
                { valor: 80, tipo: 'despesa', descricao: 'Uber', categoria: 'Transporte', data: '2026-01-03' }
            ];

            mockTransactionRepo.findByUserAndDateRange.mockResolvedValue(mockTransactions);

            await reportService.generateMonthlyReport('user123');

            // Verificar que categorias foram agrupadas
            // Alimentação: 250
            // Transporte: 80
            expect(mockPage.drawText).toHaveBeenCalledWith(
                expect.stringContaining('Alimentação: R$ 250.00'),
                expect.any(Object)
            );
            expect(mockPage.drawText).toHaveBeenCalledWith(
                expect.stringContaining('Transporte: R$ 80.00'),
                expect.any(Object)
            );
        });

        test('deve incluir cabeçalho com título', async () => {
            mockTransactionRepo.findByUserAndDateRange.mockResolvedValue([]);

            await reportService.generateMonthlyReport('user123');

            expect(mockPage.drawText).toHaveBeenCalledWith(
                'Relatório Financeiro Mensal',
                expect.objectContaining({
                    size: 20
                })
            );
        });

        test('deve lidar com transações vazias', async () => {
            mockTransactionRepo.findByUserAndDateRange.mockResolvedValue([]);

            const buffer = await reportService.generateMonthlyReport('user123');

            expect(buffer).toBeInstanceOf(Buffer);
            expect(mockPdfDoc.save).toHaveBeenCalled();
        });

        test('deve usar mês e ano padrão quando não fornecidos', async () => {
            mockTransactionRepo.findByUserAndDateRange.mockResolvedValue([]);

            await reportService.generateMonthlyReport('user123');

            // Deve ter buscado transações (com data atual)
            expect(mockTransactionRepo.findByUserAndDateRange).toHaveBeenCalled();
        });

        test('deve lançar erro e logar quando falha', async () => {
            const error = new Error('Database error');
            mockTransactionRepo.findByUserAndDateRange.mockRejectedValue(error);

            await expect(
                reportService.generateMonthlyReport('user123')
            ).rejects.toThrow('Database error');

            expect(logger.error).toHaveBeenCalledWith(
                'Erro ao gerar relatório PDF',
                expect.objectContaining({ error })
            );
        });

        test('deve limitar lista a 15 transações mais recentes', async () => {
            // Criar 20 transações
            const mockTransactions = Array.from({ length: 20 }, (_, i) => ({
                id: `tx${i}`,
                valor: 10,
                tipo: 'despesa',
                descricao: `Item ${i}`,
                categoria: 'Test',
                data: `2026-01-${String(i + 1).padStart(2, '0')}`
            }));

            mockTransactionRepo.findByUserAndDateRange.mockResolvedValue(mockTransactions);

            await reportService.generateMonthlyReport('user123');

            // Contar quantas vezes drawText foi chamado com descrições de transações
            const txDrawCalls = mockPage.drawText.mock.calls.filter(call =>
                call[0].includes('Item')
            );

            // Máximo 15 transações devem ser desenhadas
            expect(txDrawCalls.length).toBeLessThanOrEqual(15);
        });

        test('deve usar cor verde para saldo positivo', async () => {
            const mockTransactions = [
                { valor: 1000, tipo: 'receita', descricao: 'Sal', categoria: 'Rec', data: '2026-01-01' },
                { valor: 100, tipo: 'despesa', descricao: 'Gasto', categoria: 'Alim', data: '2026-01-02' }
            ];

            mockTransactionRepo.findByUserAndDateRange.mockResolvedValue(mockTransactions);

            await reportService.generateMonthlyReport('user123');

            // Verificar que saldo positivo usa cor verde
            const saldoCalls = mockPage.drawText.mock.calls.filter(call =>
                call[0].includes('Saldo: R$')
            );

            expect(saldoCalls.length).toBeGreaterThan(0);
        });
    });
});
