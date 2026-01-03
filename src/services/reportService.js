const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const TransactionRepository = require('../repositories/TransactionRepository');
const { adminClient } = require('./supabaseClient');

// Inject Admin Client (Bot context)
const transactionRepo = new TransactionRepository(adminClient);
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const logger = require('./loggerService');

class ReportService {

    /**
     * Gera relatório PDF mensal para o usuário
     * @param {string} userId 
     * @param {number} [month] 0-11 (Jan=0, Dez=11) - Default: Mês Atual
     * @param {number} [year] Default: Ano Atual
     * @returns {Promise<Buffer>}
     */
    async generateMonthlyReport(userId, month, year) {
        try {
            // 1. Definir Período
            const now = new Date();
            const targetYear = year || now.getFullYear();
            const targetMonth = month !== undefined ? month : now.getMonth();

            const startDate = new Date(targetYear, targetMonth, 1).toISOString(); // 1º dia
            const endDate = new Date(targetYear, targetMonth + 1, 0).toISOString(); // Último dia
            const queryDate = new Date(targetYear, targetMonth, 1); // Para formatação

            // 2. Buscar Dados
            const transactions = await transactionRepo.findByUserAndDateRange(userId, startDate, endDate);

            // 3. Cálculos
            let totalReceitas = 0;
            let totalDespesas = 0;
            const categorias = {};

            transactions.forEach(tx => {
                const valor = Number(tx.valor);
                if (tx.tipo === 'receita') {
                    totalReceitas += valor;
                } else {
                    totalDespesas += valor;
                    // Agrupar categorias
                    categorias[tx.categoria] = (categorias[tx.categoria] || 0) + valor;
                }
            });

            const saldo = totalReceitas - totalDespesas;

            // 4. Criar PDF
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const fontSize = 12;
            let y = height - 50;

            // Helper para escrever texto
            const drawText = (text, options = {}) => {
                page.drawText(text, {
                    size: fontSize,
                    font: font,
                    color: rgb(0, 0, 0),
                    ...options
                });
            };

            // --- CABEÇALHO ---
            drawText('Relatório Financeiro Mensal', { x: 50, y, size: 20, font: fontBold });
            y -= 30;
            const mesExtenso = format(queryDate, 'MMMM yyyy', { locale: ptBR });
            drawText(`Período: ${mesExtenso.charAt(0).toUpperCase() + mesExtenso.slice(1)}`, { x: 50, y, size: 14 });
            y -= 40;

            // --- RESUMO ---
            drawText('Resumo Geral', { x: 50, y, size: 16, font: fontBold });
            y -= 25;
            drawText(`Receitas: R$ ${totalReceitas.toFixed(2)}`, { x: 50, y, color: rgb(0, 0.6, 0) });
            y -= 20;
            drawText(`Despesas: R$ ${totalDespesas.toFixed(2)}`, { x: 50, y, color: rgb(0.8, 0, 0) });
            y -= 20;
            const corSaldo = saldo >= 0 ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);
            drawText(`Saldo: R$ ${saldo.toFixed(2)}`, { x: 50, y, font: fontBold, color: corSaldo });
            y -= 40;

            // --- POR CATEGORIA ---
            drawText('Despesas por Categoria', { x: 50, y, size: 16, font: fontBold });
            y -= 25;

            Object.entries(categorias).sort((a, b) => b[1] - a[1]).forEach(([cat, val]) => {
                drawText(`• ${cat}: R$ ${val.toFixed(2)}`, { x: 60, y });
                y -= 20;
                if (y < 50) { // Nova Página se necessário (simplificado: apenas para na margem)
                    // Em versão completa, adicionaríamos page = pdfDoc.addPage() e resetaríamos y
                }
            });

            y -= 20;

            // --- LISTA DE TRANSAÇÕES (Top 10 Recentes) ---
            drawText('Últimas 15 Transações', { x: 50, y, size: 16, font: fontBold });
            y -= 25;

            transactions.slice(0, 15).forEach(tx => {
                const dateStr = format(new Date(tx.data), 'dd/MM');
                const symbol = tx.tipo === 'receita' ? '+' : '-';
                const color = tx.tipo === 'receita' ? rgb(0, 0.6, 0) : rgb(0, 0, 0);

                const line = `${dateStr} | ${tx.descricao} - ${symbol} R$ ${Number(tx.valor).toFixed(2)}`;
                drawText(line, { x: 50, y, size: 10, color });
                y -= 15;
            });

            // 5. Finalizar
            const pdfBytes = await pdfDoc.save();
            return Buffer.from(pdfBytes);

        } catch (error) {
            logger.error("Erro ao gerar relatório PDF", { error });
            throw error;
        }
    }
}

module.exports = new ReportService();
