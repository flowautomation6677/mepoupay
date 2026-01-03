const textStrategy = require('../strategies/TextStrategy');
const { AIResponseSchema } = require('../schemas/transactionSchema');
const { processExtractedData } = require('../services/dataProcessor');
const sessionService = require('../services/sessionService');
const logger = require('../services/loggerService');

class AiConversationHandler {
    async handle(message, user, userContext) {
        // Default to text execution
        const content = message.body;

        // Step 1: Execute Text Strategy
        const response = await textStrategy.execute(content, message, user, userContext);

        // Step 2: Handle Response Types
        if (response.type === 'media_response') {
            const { mimetype, data, filename, caption } = response.content;
            const media = { mimetype, data, filename };
            await message.reply(media, undefined, { caption });
            return;
        }

        if (response.type === 'ai_response' || response.type === 'tool_response') {
            const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

            // Wrap reply to pass to processor
            const reply = async (t) => await message.reply(t);

            // 1. Validation (Is it JSON?)
            let jsonStr = text;
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = text.substring(firstBrace, lastBrace + 1);
            }

            try {
                const parsedRaw = JSON.parse(jsonStr);
                const validation = AIResponseSchema.safeParse(parsedRaw);

                if (validation.success) {
                    // Valid Data
                    const dataToProcess = {
                        ...validation.data,
                        prompt_version: response.metadata?.prompt_version || 'v1_stable'
                    };
                    const processingResult = await processExtractedData(dataToProcess, user.id, reply);

                    // HITL Check
                    if (processingResult && processingResult.status === 'pending_review') {
                        const txs = processingResult.transactions;
                        const mainTx = txs[0];

                        await sessionService.setPendingCorrection(user.id, {
                            last_input: content,
                            ai_response: validation.data,
                            confidence: processingResult.confidence,
                            transactionIds: txs.map(t => t.id)
                        });

                        const confirmText = `Fiquei na dúvida sobre esse gasto. 🤔\n\n` +
                            `Entendi: *${mainTx.descricao}* - *R$ ${mainTx.valor.toFixed(2)}*\n\n` +
                            `Confirma? (Sim/Não)`;
                        await message.reply(confirmText);
                    }

                } else {
                    // Validation Failed
                    const isTransactionAttempt = jsonStr.includes('"gastos"') || jsonStr.includes('"transacoes"');
                    if (isTransactionAttempt) {
                        logger.warn("Falha de Validação Zod", { errors: validation.error.format(), input: text });
                        await message.reply("😵‍💫 Fiquei confuso com os dados. Poderia repetir de forma mais clara?");
                    } else {
                        await message.reply(text);
                    }
                }
            } catch (e) {
                // Not JSON, plain text response
                if (jsonStr.includes('"gastos"')) {
                    logger.error("JSON Syntax Error", { error: e.message, input: text });
                    await message.reply("❌ Erro técnico ao processar sua solicitação.");
                } else {
                    await message.reply(text);
                }
            }

            // Update context
            userContext.push({ role: "user", content: content });
            userContext.push({ role: "assistant", content: text });

            if (userContext.length > 10) {
                userContext = userContext.slice(-10);
            }

            await sessionService.setContext(user.id, userContext, 86400);
        }
    }
}

module.exports = new AiConversationHandler();
