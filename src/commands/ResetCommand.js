const sessionService = require('../services/sessionService');
const userRepo = require('../repositories/UserRepository');
const logger = require('../services/loggerService');

class ResetCommand {
    constructor() {
        this.triggers = ['/reset', '/novo_usuario'];
    }

    matches(text) {
        return this.triggers.includes(text.toLowerCase().trim());
    }

    async execute(message, user) {
        await message.reply("⚠️ Iniciando reset total de fábrica...");
        try {
            // 1. Clear Redis
            await sessionService.clearContext(user.id);
            await sessionService.clearPdfState(user.id);
            await sessionService.clearPendingCorrection(user.id);

            // 2. Delete DB Params
            await userRepo.delete(user.id);

            await message.reply("✨ Tudo apagado! Sou um novo bot para você.\nMande um 'Oi' para começar do zero.");
            return { handled: true };
        } catch (e) {
            logger.error("Reset Error", e);
            await message.reply("❌ Erro ao resetar. Tente novamente.");
            return { handled: true };
        }
    }
}

module.exports = new ResetCommand();
