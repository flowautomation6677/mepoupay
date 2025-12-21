const { analyzeImage } = require('../services/openaiService');

class ImageStrategy {
    async execute(message, context) {
        await message.reply('🧐 Analisando imagem...');
        try {
            const media = await message.downloadMedia();
            const jsonAnalysis = await analyzeImage(media.data, media.mimetype);
            // Delega para o processador de dados (poderia ser outra estratégia de conversão, mas vamos manter simples)
            return { type: 'data_extraction', content: jsonAnalysis };
        } catch (e) {
            console.error("ImageStrategy Error:", e);
            await message.reply("❌ Erro ao processar imagem.");
            return null;
        }
    }
}

module.exports = new ImageStrategy();
