const resetCommand = require('../commands/ResetCommand');
const forgotCommand = require('../commands/ForgotCommand');
const reportCommand = require('../commands/ReportCommand');
const onboardingCommand = require('../commands/OnboardingCommand');

class CommandDispatcher {
    constructor() {
        this.commands = [
            resetCommand,
            forgotCommand,
            reportCommand,
            onboardingCommand
        ];
    }

    async dispatch(message, user) {
        const bodyLower = message.body.toLowerCase().trim();

        for (const cmd of this.commands) {
            if (cmd.matches(bodyLower)) {
                return await cmd.execute(message, user);
            }
        }
        return { handled: false };
    }
}

module.exports = new CommandDispatcher();
