const { analyzePdfText } = require('../services/openaiService');
const logger = require('../services/loggerService');

class CsvStrategy {
    async execute(message) {
        try {
            const media = await message.downloadMedia();
            if (!media) return { type: 'system_error', content: "Erro ao baixar arquivo CSV." };

            const buffer = Buffer.from(media.data, 'base64');
            const csvText = buffer.toString('utf-8');

            // Limit rows to avoid token overflow? 
            // analyzePdfText limits to 15000 chars, which is good.
            // We just pass the raw CSV text to the AI.
            // But we need to update the PROMPT in openaiService to understand it's a "CSV/Extract" not just "Fatura".

            // For now, let's try using analyzePdfText as it handles "Text Analysis".
            // If it fails, we will create a dedicated analyzeFinancialStatement method.

            logger.info("[CSV] Enviando para análise IA...");
            const aiResult = await analyzePdfText(csvText);

            if (aiResult.error) {
                return { type: 'system_error', content: "Não consegui entender esse CSV." };
            }

            return {
                type: 'data_extraction',
                content: aiResult
            };

        } catch (error) {
            logger.error("CSV Strategy Error:", error);
            return { type: 'system_error', content: "Erro ao ler arquivo CSV." };
        }
    }
}

module.exports = new CsvStrategy();
