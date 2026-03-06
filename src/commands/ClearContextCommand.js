const sessionService = require('../services/sessionService');
const logger = require('../services/loggerService');

class ClearContextCommand {
    constructor() {
        // Gatilhos para o comando
        this.triggers = ['/esquecer', '/limpar', '/forget', '/clean'];
    }

    matches(text) {
        return this.triggers.includes(text.toLowerCase().trim());
    }

    async execute(message, user) {
        try {
            // Limpa apenas o contexto de conversa (array de mensagens anteriores)
            // Usa a função existente no sessionService
            await sessionService.clearContext(user.id);

            // Opcional: Limpar também correções pendentes para evitar estados presos
            await sessionService.clearPendingCorrection(user.id);

            await message.reply("🧠 *Memória Apagada!* \n\nEsqueci tudo o que conversamos anteriormente. Pode testar o novo prompt agora como se fosse o início da conversa.");

            return { handled: true };
        } catch (e) {
            logger.error("Error clearing context", e);
            await message.reply("❌ Erro ao limpar memória.");
            return { handled: true };
        }
    }
}

module.exports = new ClearContextCommand();
