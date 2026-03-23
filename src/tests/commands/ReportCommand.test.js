const ReportCommand = require('../../commands/ReportCommand');
const reportService = require('../../services/reportService');
const sessionService = require('../../services/sessionService');
const { subMonths } = require('date-fns');

jest.mock('../../services/reportService');
jest.mock('../../services/sessionService');

// Use fake timers to control 'now' to match prompt examples.
// T01, T02 refer to dates in 2026.

describe('ReportCommand', () => {
    let mockMessage;
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();
        mockMessage = {
            reply: jest.fn()
        };
        mockUser = { id: 'user123' };
    });

    describe('Matches', () => {
        test('I01 - matches simple relatorio intent', () => {
            const matched = ReportCommand.matches('Manda o relatório aí');
            expect(matched).toBe(true);
        });

        test('I02 - matches explicit PDF intent', () => {
            const matched = ReportCommand.matches('Preciso do PDF de março');
            expect(matched).toBe(true);
        });

        test('I03 - matches explicit baixar intent', () => {
            const matched = ReportCommand.matches('Quero baixar o fechamento');
            expect(matched).toBe(true);
        });
    });

    describe('Execute - Temporal NLP', () => {
        beforeAll(() => {
            jest.useFakeTimers().setSystemTime(new Date('2026-03-15T12:00:00Z'));
        });
        
        afterAll(() => {
            jest.useRealTimers();
        });

        beforeEach(() => {
            reportService.getMonthlyStats.mockResolvedValue({
                totalReceitas: 5000,
                totalDespesas: 3000,
                saldo: 2000,
                categorias: { Aluguel: 1000 },
                periodo: { mes: 'Março', ano: 2026 },
                hasData: true,
                transactions: []
            });
            sessionService.getReportContext.mockResolvedValue(null);
            reportService.generateMonthlyReport.mockResolvedValue(Buffer.from('pdf'));
        });

        test('T01 - Resumo do mês retrasado (15/Mar/2026 -> Jan/2026)', async () => {
             await ReportCommand.execute({ ...mockMessage, body: 'Resumo do mês retrasado' }, mockUser);
             expect(reportService.getMonthlyStats).toHaveBeenCalledWith('user123', 0, 2026); // Janeiro é 0
        });

        test('T04 - Quero o de Dezembro (Current is Março, expects previous year Dez/2025)', async () => {
            // "Dezembro" > "Março" implies last year.
             await ReportCommand.execute({ ...mockMessage, body: 'Quero o de Dezembro' }, mockUser);
             expect(reportService.getMonthlyStats).toHaveBeenCalledWith('user123', 11, 2025); // Dezembro 2025
        });

        test('S01 - Fallback if month is totally broken/lixo', async () => {
             await ReportCommand.execute({ ...mockMessage, body: 'Relatório do mês de batata' }, mockUser);
             expect(reportService.getMonthlyStats).toHaveBeenCalledWith('user123', 2, 2026); // Março 2026
        });
    });

    describe('Execute - Flows and Context', () => {
        beforeAll(() => {
            jest.useFakeTimers().setSystemTime(new Date('2026-03-15T12:00:00Z'));
        });
        afterAll(() => {
            jest.useRealTimers();
        });

        beforeEach(() => {
            reportService.generateMonthlyReport.mockResolvedValue(Buffer.from('pdf'));
        });

        test('D01 - Ghost User (No Data) with simple text trigger', async () => {
            reportService.getMonthlyStats.mockResolvedValue({
                hasData: false, periodo: { mes: 'Março', ano: 2026 }
            });

            await ReportCommand.execute({ ...mockMessage, body: 'Relatório deste mês' }, mockUser);
            expect(mockMessage.reply).toHaveBeenCalledWith(expect.stringContaining('Não achei nenhum gasto'));
            expect(mockMessage.reply).not.toHaveBeenCalledWith(expect.objectContaining({ mimetype: 'application/pdf' }));
        });

        test('D01 + Explicit PDF - Should fallback and NOT send empty PDF based on QA answer', async () => {
            reportService.getMonthlyStats.mockResolvedValue({
                hasData: false, periodo: { mes: 'Março', ano: 2026 }
            });
            await ReportCommand.execute({ ...mockMessage, body: 'Quero baixar o fechamento' }, mockUser);
            expect(mockMessage.reply).toHaveBeenCalledWith(expect.stringContaining('Não achei nenhum gasto'));
            expect(mockMessage.reply).not.toHaveBeenCalledWith(expect.objectContaining({ mimetype: 'application/pdf' }));
        });

        test('State Context - "Quero PDF" with saved Redis date', async () => {
            // User already triggered "Relatório de fevereiro" earlier
            sessionService.getReportContext.mockResolvedValue({ month: 1, year: 2026 });
            
            reportService.getMonthlyStats.mockResolvedValue({
                hasData: true, totalReceitas: 10, totalDespesas: 5, saldo: 5, categorias: {}, periodo: { mes: 'Fevereiro', ano: 2026 }
            });

            await ReportCommand.execute({ ...mockMessage, body: 'Quero PDF' }, mockUser);
            
            expect(sessionService.getReportContext).toHaveBeenCalledWith('user123');
            expect(reportService.getMonthlyStats).toHaveBeenCalledWith('user123', 1, 2026);
            expect(mockMessage.reply).toHaveBeenCalledWith(expect.objectContaining({ mimetype: 'application/pdf' }));
        });

        test('State Context - "Quero PDF" without context (fallback)', async () => {
            sessionService.getReportContext.mockResolvedValue(null);
            
            reportService.getMonthlyStats.mockResolvedValue({
                hasData: true, totalReceitas: 10, totalDespesas: 5, saldo: 5, categorias: {}, periodo: { mes: 'Março', ano: 2026 }
            });

            await ReportCommand.execute({ ...mockMessage, body: 'Quero PDF' }, mockUser);
            
            expect(mockMessage.reply).toHaveBeenCalledWith(expect.stringContaining('Como faz um tempo desde a nossa última conversa, gerei o PDF do mês atual'));
            expect(reportService.getMonthlyStats).toHaveBeenCalledWith('user123', 2, 2026); // current month
        });
    });
});
