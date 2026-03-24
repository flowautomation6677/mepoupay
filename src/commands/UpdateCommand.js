const sessionService = require('../services/sessionService');
const logger = require('../services/loggerService');

class UpdateCommand {
    constructor() {
        // Gatilho amigável focado no cliente B2C
        this.triggers = ['/atualizar'];
    }

    matches(text) {
        return this.triggers.includes(text.toLowerCase().trim());
    }

    async execute(message, user) {
        try {
            // Limpa o contexto de conversa (NLP memory)
            await sessionService.clearContext(user.id);

            // Limpa correções pendentes ou pendências de edição
            await sessionService.clearPendingCorrection(user.id);
            
            // Opcional: Esvaziar contextos específicos se o método existir
            if (typeof sessionService.clearPdfState === 'function') {
                await sessionService.clearPdfState(user.id);
            }

            // A resposta é psicologicamente segura para o usuário (não usamos a palavra "esquecer")
            await message.reply("✅ *Sistema atualizado com sucesso!*\n\nO cenário de conversação foi redefinido de forma segura. O que deseja lançar agora?");

            return { handled: true };
        } catch (e) {
            logger.error("Error clearing context via /atualizar", e);
            await message.reply("❌ Erro ao atualizar o sistema. Tente novamente em instantes.");
            return { handled: true };
        }
    }
}

module.exports = new UpdateCommand();
