const reportService = require('../services/reportService');
const sessionService = require('../services/sessionService');
const logger = require('../services/loggerService');
const { subMonths } = require('date-fns');

class ReportCommand {
    constructor() {
        this.triggers = ['relatório', 'relatorio', 'saldo', 'quanto gastei', 'fechamento', 'pdf', 'arquivo', 'documento', 'baixar'];
    }

    matches(text) {
        const lowerText = text.toLowerCase().trim();
        return this.triggers.some(t => lowerText.includes(t));
    }

    async execute(message, user) {
        const text = message.body.toLowerCase().trim();

        const wantsPdf = ['pdf', 'arquivo', 'documento', 'baixar', 'fechamento'].some(t => text.includes(t));
        const isOnlyQueroPdf = text === 'quero pdf' || text === 'queropdf';

        let targetMonth;
        let targetYear;

        const now = new Date();

        if (isOnlyQueroPdf) {
            const context = await sessionService.getReportContext(user.id);
            if (context) {
                targetMonth = context.month;
                targetYear = context.year;
            } else {
                await message.reply("Como faz um tempo desde a nossa última conversa, gerei o PDF do mês atual. Se quiser outro mês, é só me falar a data!");
                targetMonth = now.getMonth();
                targetYear = now.getFullYear();
            }
        } else {
            const monthNames = {
                'janeiro': 0, 'jan\\b': 0, 'fevereiro': 1, 'fev\\b': 1, 'março': 2, 'mar\\b': 2,
                'abril': 3, 'abr\\b': 3, 'maio': 4, 'mai\\b': 4, 'junho': 5, 'jun\\b': 5,
                'julho': 6, 'jul\\b': 6, 'agosto': 7, 'ago\\b': 7, 'setembro': 8, 'set\\b': 8,
                'outubro': 9, 'out\\b': 9, 'novembro': 10, 'nov\\b': 10, 'dezembro': 11, 'dez\\b': 11
            };

            if (text.includes('mês retrasado') || text.includes('mes retrasado')) {
                const d = subMonths(now, 2);
                targetMonth = d.getMonth();
                targetYear = d.getFullYear();
            } else if (text.includes('mês passado') || text.includes('mes passado')) {
                const d = subMonths(now, 1);
                targetMonth = d.getMonth();
                targetYear = d.getFullYear();
            } else {
                for (const [name, val] of Object.entries(monthNames)) {
                    const regex = new RegExp(`\\b${name}`, 'i');
                    if (regex.test(text)) {
                        targetMonth = val;
                        if (targetMonth > now.getMonth()) {
                            targetYear = now.getFullYear() - 1;
                        } else {
                            targetYear = now.getFullYear();
                        }
                        break;
                    }
                }
            }

            if (targetMonth === undefined) {
                targetMonth = now.getMonth();
                targetYear = now.getFullYear();
            }
        }

        try {
            const stats = await reportService.getMonthlyStats(user.id, targetMonth, targetYear);

            if (!stats.hasData) {
                await message.reply(`Ops! 🕵️‍♂️ Não achei nenhum gasto ou ganho registrado em ${stats.periodo.mes}. Que tal começar lançando algo?`);
                return { handled: true };
            }

            // Guardar Contexto p/ fluxo "Quero PDF"
            await sessionService.setReportContext(user.id, { month: targetMonth, year: targetYear });

            let emjSaldo = stats.saldo >= 0 ? '✅' : '⚠️';
            let textMsg = `📊 *Resumo de ${stats.periodo.mes}/${stats.periodo.ano}*\n\n`;
            textMsg += `📈 Receitas: R$ ${stats.totalReceitas.toFixed(2)}\n`;
            textMsg += `📉 Despesas: R$ ${stats.totalDespesas.toFixed(2)}\n`;
            textMsg += `${emjSaldo} *Saldo:* R$ ${stats.saldo.toFixed(2)}\n\n`;

            if (stats.totalDespesas === 0) {
                textMsg += `Uau! Zero despesas este mês? 🏆\n\n`;
            }

            textMsg += `🔗 Detalhes completos: mepoupay.app.br\n📄 Quer o arquivo PDF? Digite "Quero PDF".`;

            await message.reply(textMsg);

            if (wantsPdf || isOnlyQueroPdf) {
                const pdfBuffer = await reportService.generateMonthlyReport(user.id, targetMonth, targetYear);
                const media = {
                    mimetype: 'application/pdf',
                    data: pdfBuffer.toString('base64'),
                    filename: `Relatorio_${stats.periodo.mes}_${stats.periodo.ano}.pdf`
                };
                await message.reply(media);
            }

            return { handled: true };
        } catch (err) {
            logger.error("Falha ao gerar relatório", { error: err });
            await message.reply("❌ Erro ao gerar o relatório. Tente novamente mais tarde.");
            return { handled: true };
        }
    }
}

module.exports = new ReportCommand();
