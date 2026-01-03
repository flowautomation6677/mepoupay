const sessionService = require('../services/sessionService');

class OnboardingCommand {
    constructor() {
        this.triggers = ['/onboarding', '/start'];
    }

    matches(text) {
        return this.triggers.includes(text.toLowerCase().trim());
    }

    async execute(message, user) {
        await sessionService.clearContext(user.id);
        await sessionService.clearPdfState(user.id);
        await sessionService.clearPendingCorrection(user.id);

        // Modify body to trigger AI welcome text
        message.body = `[SYSTEM_INIT] Aja como se fosse meu primeiro acesso. Faça sua introdução de boas-vindas amigável e explique como você pode me ajudar.`;

        // Return handled: false to allow fallthrough to AI Handler
        return { handled: false, modified: true };
    }
}

module.exports = new OnboardingCommand();
