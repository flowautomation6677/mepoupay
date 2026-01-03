const userRepo = require('../repositories/UserRepository');
const evaluationService = require('../services/evolutionService'); // Use service to send access denied
const sessionService = require('../services/sessionService');
const logger = require('../services/loggerService');

// Refactored Components
const commandDispatcher = require('./CommandDispatcher');
const mediaHandler = require('./MediaHandler');
const feedbackHandler = require('./FeedbackHandler');
const aiConversationHandler = require('./AiConversationHandler');

async function handleMessage(message) {
    try {
        if (message.from === 'status@broadcast') return;

        logger.info("📩 Message Received", {
            from: message.from,
            type: message.type,
            hasMedia: message.hasMedia,
            body: message.body?.substring(0, 50)
        });

        // 1. Auth Check
        const pushname = message._data?.notifyName || message.pushname;
        const cleanPhone = message.from.replace(/\D/g, '');

        let user = await userRepo.findByPhone(cleanPhone);

        if (!user) {
            logger.warn(`🚫 Acesso Negado: ${message.from}`);
            await evaluationService.sendText(message.from, "❌ *Acesso Negado*\n\nEste bot é privado e exclusivo para usuários convidados.\n\nPeça seu convite ao administrador para começar.");
            return;
        } else if (pushname && !user.name) {
            await userRepo.updateName(user.id, pushname);
        }

        // 2. Fetch Context
        let userContext = await sessionService.getContext(user.id);

        // 3. Command Dispatching
        const cmdResult = await commandDispatcher.dispatch(message, user);
        if (cmdResult.handled) {
            return; // Command executed and finished
        }

        // Special case: Onboarding modification (Command modifies body, but flow continues)
        if (cmdResult.modified) {

        }

        // 4. Feedback & Correction Check
        const feedbackHandled = await feedbackHandler.handle(message, user);
        if (feedbackHandled) return;

        // 5. Hardcoded Handshake (Legacy - Consider moving to Command or AI Prompt)
        if (message.body.includes("Olá! Quero começar a economizar com a Porquim IA")) {
            if (user.savings_goal && user.monthly_income) {
                const available = user.monthly_income - user.savings_goal;
                const response = `Oi ${user.pushname || 'Campeão'}! 🐷\n\nTudo pronto. Já vi aqui que sua meta é poupar *R$ ${user.savings_goal}* este mês. 🎯\nIsso deixa você com cerca de *R$ ${available}* para gastos livres.\n\nAgora é só me avisar sempre que gastar algo. Ex: "Gastei 30 reais no almoço".\n\n👇 *Vamos testar?* Me conta sua última compra!`;
                await evaluationService.sendText(message.from, response);
                return;
            }
        }

        // 6. Media Handling
        const mediaHandled = await mediaHandler.handle(message, user);
        if (mediaHandled) return;

        // 7. AI Conversation Handling (Default Fallback)
        await aiConversationHandler.handle(message, user, userContext);

    } catch (err) {
        console.error("DEBUG STACK:", err.stack);
        logger.error("❌ Controller Error", { error: err, stack: err.stack });

        if (message && message.from) {
            try {
                await evaluationService.sendText(
                    message.from,
                    "🐛 *Debug:* Ocorreu um erro interno ao processar sua mensagem.\nVerifique os logs do servidor."
                );
            } catch (sendErr) {
                console.error("Falha ao enviar aviso de erro:", sendErr);
            }
        }
    }
}

module.exports = { handleMessage };
