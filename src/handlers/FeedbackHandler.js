const sessionService = require('../services/sessionService');
const TransactionRepository = require('../repositories/TransactionRepository');
const { adminClient } = require('../services/supabaseClient');

// Inject Admin Client (Bot context)
const transactionRepo = new TransactionRepository(adminClient);
const queueService = require('../services/queueService');
const logger = require('../services/loggerService');

class FeedbackHandler {
    async handle(message, user) {
        const bodyLower = message.body.toLowerCase().trim();

        // 1. Password Retry Logic
        const pendingPdfBase64 = await sessionService.getPdfState(user.id);
        if (pendingPdfBase64 && !message.hasMedia) {
            const password = message.body.trim();
            await message.reply("⏳ Verificando senha e processando...");
            logger.info('Queueing PDF Password Retry', { userId: user.id });

            await queueService.addJob('RETRY_PDF_PASSWORD', {
                chatId: message.from,
                userId: user.id,
                mediaData: pendingPdfBase64,
                password: password,
                filename: 'locked.pdf',
                instanceName: message.instanceName
            });
            return true;
        }

        // 2. Pending Corrections (HITL)
        const pendingCorrection = await sessionService.getPendingCorrection(user.id);

        if (pendingCorrection && !pendingCorrection.is_processed) {
            const isConfirmation = ['sim', 's', 'correto', 'ok', 'confirmado'].includes(bodyLower);
            const isDenial = ['nao', 'não', 'n', 'errado', 'erro', '!'].includes(bodyLower) || bodyLower.startsWith('!');

            if (isConfirmation) {
                await Promise.all(pendingCorrection.transactionIds.map(id =>
                    transactionRepo.update(id, { status: 'confirmed', is_validated: true })
                ));
                await sessionService.clearPendingCorrection(user.id);
                await message.reply("✅ Confirmado! Já registrei.");
                return true;
            }

            if (isDenial) {
                await adminClient.from('transaction_learning').insert({
                    original_input: pendingCorrection.last_input,
                    ai_response: pendingCorrection.ai_response,
                    user_correction: message.body,
                    confidence_at_time: pendingCorrection.confidence
                });

                if (bodyLower.length < 10) {
                    await sessionService.clearPendingCorrection(user.id);
                    await message.reply("Ops! Entendi errado. 😅\nComo foi o gasto correto? (Ex: '50 mercado')");
                    return true;
                }

                await sessionService.clearPendingCorrection(user.id);
                // Fallthrough to allow re-processing as new text
                return false;
            }
        }

        // 3. Quick Manual Correction Trigger
        if (bodyLower === '!' || bodyLower === 'errado') {
            await message.reply("Opa! Se eu errei algo anterior, por favor digite o gasto correto novamente.");
            return true;
        }

        return false;
    }
}

module.exports = new FeedbackHandler();
