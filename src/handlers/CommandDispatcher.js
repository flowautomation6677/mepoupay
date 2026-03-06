const resetCommand = require('../commands/ResetCommand');
const clearContextCommand = require('../commands/ClearContextCommand');
const reportCommand = require('../commands/ReportCommand');
const onboardingCommand = require('../commands/OnboardingCommand');

class CommandDispatcher {
    constructor() {
        this.commands = [
            resetCommand,
            clearContextCommand,
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
