const sessionService = require('../services/sessionService');

class ForgotCommand {
    constructor() {
        this.triggers = ['/esquecer'];
    }

    matches(text) {
        return this.triggers.includes(text.toLowerCase().trim());
    }

    async execute(message, user) {
        await sessionService.clearContext(user.id);
        await sessionService.clearPdfState(user.id);
        await sessionService.clearPendingCorrection(user.id);
        await message.reply("🧹 Memória de curto prazo limpa! Esqueci nossa conversa recente.\n(Seus dados salvos continuam aqui).");
        return { handled: true };
    }
}

module.exports = new ForgotCommand();
