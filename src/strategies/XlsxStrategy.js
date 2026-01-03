const ExcelJS = require('exceljs');
const { analyzePdfText } = require('../services/openaiService');

class XlsxStrategy {
    async execute(message) {
        try {
            // Buffer from Base64
            const media = await message.downloadMedia();
            if (!media) return { type: 'system_error', content: "Erro ao baixar arquivo Excel." };

            const buffer = Buffer.from(media.data, 'base64');

            // Parse Workbook with ExcelJS
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            // Get first sheet
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                return { type: 'system_error', content: "O arquivo Excel parece vazio." };
            }

            // Convert Processed Rows to CSV-like string
            let csvText = "";
            worksheet.eachRow((row, rowNumber) => {
                const rowValues = row.values;
                if (Array.isArray(rowValues)) {
                    // ExcelJS row.values is 1-based, index 0 is sometimes null or empty
                    // We join legitimate values
                    const line = rowValues.slice(1).join(',');
                    csvText += line + "\n";
                }
            });

            console.log("[XLSX] Convertido para texto (ExcelJS). Enviando para IA...");
            const aiResult = await analyzePdfText(csvText);

            if (aiResult.error) {
                return { type: 'system_error', content: "Não consegui entender esse Excel." };
            }

            return {
                type: 'data_extraction',
                content: aiResult
            };

        } catch (error) {
            console.error("XLSX Strategy Error:", error);
            return { type: 'system_error', content: "Erro ao ler arquivo Excel." };
        }
    }
}

module.exports = new XlsxStrategy();
