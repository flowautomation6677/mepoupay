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
     * Extrai os dados sumarizados do mês para exibição em texto/dashboard
     * @param {string} userId 
     * @param {number} [month] 0-11 (Jan=0, Dez=11) - Default: Mês Atual
     * @param {number} [year] Default: Ano Atual
     * @returns {Promise<object>}
     */
    async getMonthlyStats(userId, month, year) {
        try {
            const now = new Date();
            const targetYear = year === undefined ? now.getFullYear() : year;
            const targetMonth = month === undefined ? now.getMonth() : month;

            const startDate = new Date(targetYear, targetMonth, 1).toISOString(); // 1º dia
            const endDate = new Date(targetYear, targetMonth + 1, 0).toISOString(); // Último dia
            const queryDate = new Date(targetYear, targetMonth, 1); // Para formatação

            const transactions = await transactionRepo.findByUserAndDateRange(userId, startDate, endDate);

            let totalReceitas = 0;
            let totalDespesas = 0;
            const categorias = {};

            transactions.forEach(tx => {
                // Ensure value is correctly parsed even if it comes with a comma or is null
                // Support both tx.valor (tests fallback) or tx.amount (real db)
                const valTarget = tx.amount !== undefined ? tx.amount : tx.valor;
                const rawValor = valTarget !== null && valTarget !== undefined ? String(valTarget).replace(',', '.') : '0';
                const valor = Number(rawValor) || 0;
                
                const typeToMatch = tx.type || tx.tipo;

                if (typeToMatch === 'INCOME' || typeToMatch === 'receita') {
                    totalReceitas += valor;
                } else {
                    totalDespesas += valor;
                    
                    const catName = tx.categories?.name || tx.categoria || 'Sem Categoria';
                    categorias[catName] = (categorias[catName] || 0) + valor;
                }
            });

            const saldo = totalReceitas - totalDespesas;
            const mesExtenso = format(queryDate, 'MMMM', { locale: ptBR });

            return {
                totalReceitas,
                totalDespesas,
                saldo,
                categorias,
                periodo: {
                    mes: mesExtenso.charAt(0).toUpperCase() + mesExtenso.slice(1),
                    ano: targetYear
                },
                hasData: transactions.length > 0,
                transactions // Injetamos as brutas para o ReportPDF poder reusar
            };
        } catch (error) {
            logger.error("Erro ao buscar stats mensais", { error });
            throw error;
        }
    }

    /**
     * Gera relatório PDF mensal para o usuário
     * @param {string} userId 
     * @param {number} [month] 0-11 (Jan=0, Dez=11) - Default: Mês Atual
     * @param {number} [year] Default: Ano Atual
     * @returns {Promise<Buffer>}
     */
    async generateMonthlyReport(userId, month, year) {
        try {
            // Reutiliza a lógica extraída
            const stats = await this.getMonthlyStats(userId, month, year);

            // 4. Criar PDF
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { height } = page.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);


            const fontSize = 12;
            let y = height - 50;

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
            drawText(`Período: ${stats.periodo.mes} ${stats.periodo.ano}`, { x: 50, y, size: 14 });
            y -= 40;

            // --- RESUMO ---
            drawText('Resumo Geral', { x: 50, y, size: 16, font: fontBold });
            y -= 25;
            drawText(`Receitas: R$ ${stats.totalReceitas.toFixed(2)}`, { x: 50, y, color: rgb(0, 0.6, 0) });
            y -= 20;
            drawText(`Despesas: R$ ${stats.totalDespesas.toFixed(2)}`, { x: 50, y, color: rgb(0.8, 0, 0) });
            y -= 20;
            const corSaldo = stats.saldo >= 0 ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);
            drawText(`Saldo: R$ ${stats.saldo.toFixed(2)}`, { x: 50, y, font: fontBold, color: corSaldo });
            y -= 40;

            // --- POR CATEGORIA ---
            drawText('Despesas por Categoria', { x: 50, y, size: 16, font: fontBold });
            y -= 25;

            // Prevenção D02 (Proteção de categorias não quebra sem despesas)
            Object.entries(stats.categorias).sort((a, b) => b[1] - a[1]).forEach(([cat, val]) => {
                drawText(`• ${cat}: R$ ${val.toFixed(2)}`, { x: 60, y });
                y -= 20;
            });

            y -= 20;

            // --- LISTA DE TRANSAÇÕES (Top 10 Recentes) ---
            drawText('Últimas 15 Transações', { x: 50, y, size: 16, font: fontBold });
            y -= 25;

            stats.transactions.slice(0, 15).forEach(tx => {
                const dateSrc = tx.date || tx.data || new Date();
                const dateStr = format(new Date(dateSrc), 'dd/MM');
                
                const typeToMatch = tx.type || tx.tipo;
                const isIncome = typeToMatch === 'INCOME' || typeToMatch === 'receita';
                
                const symbol = isIncome ? '+' : '-';
                const color = isIncome ? rgb(0, 0.6, 0) : rgb(0, 0, 0);

                const desc = tx.description || tx.descricao || 'Sem Descrição';
                const valTarget = tx.amount !== undefined ? tx.amount : tx.valor;
                const rawValor = valTarget !== null && valTarget !== undefined ? String(valTarget).replace(',', '.') : '0';
                const cleanValor = Number(rawValor) || 0;

                const line = `${dateStr} | ${desc} - ${symbol} R$ ${cleanValor.toFixed(2)}`;
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
