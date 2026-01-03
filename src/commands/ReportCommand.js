const reportService = require('../services/reportService');
const logger = require('../services/loggerService');

class ReportCommand {
    constructor() {
        this.triggers = ['/relatorio'];
    }

    matches(text) {
        return this.triggers.includes(text.toLowerCase().trim());
    }

    async execute(message, user) {
        await message.reply("📊 Gerando seu relatório mensal em PDF... Aguarde um instante.");
        try {
            const pdfBuffer = await reportService.generateMonthlyReport(user.id);
            const base64Pdf = pdfBuffer.toString('base64');

            const media = {
                mimetype: 'application/pdf',
                data: base64Pdf,
                filename: 'Relatorio_Mensal.pdf'
            };

            await message.reply(media);
            return { handled: true };
        } catch (err) {
            logger.error("Falha ao gerar relatório", { error: err });
            await message.reply("❌ Erro ao gerar o relatório. Tente novamente mais tarde.");
            return { handled: true };
        }
    }
}

module.exports = new ReportCommand();
