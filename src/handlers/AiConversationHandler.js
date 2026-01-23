const { TextStrategy: textStrategy } = require('../strategies/TextStrategy');
const { AIResponseSchema } = require('../schemas/transactionSchema');
const { processExtractedData } = require('../services/dataProcessor');
const sessionService = require('../services/sessionService');
const logger = require('../services/loggerService');

// --- Helpers ---

function _parseAIResponse(text) {
    let jsonStr = text;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = text.substring(firstBrace, lastBrace + 1);
    }
    return jsonStr;
}

async function _handleHITL(processingResult, validationData, content, user, message) {
    if (processingResult && processingResult.status === 'pending_review') {
        const txs = processingResult.transactions;
        const mainTx = txs[0];

        await sessionService.setPendingCorrection(user.id, {
            last_input: content,
            ai_response: validationData,
            confidence: processingResult.confidence,
            transactionIds: txs.map(t => t.id)
        });

        const confirmText = `Fiquei na dúvida sobre esse gasto. 🤔\\n\\n` +
            `Entendi: *${mainTx.descricao}* - *R$ ${mainTx.valor.toFixed(2)}*\\n\\n` +
            `Confirma? (Sim/Não)`;
        await message.reply(confirmText);
        return true; // HITL triggered
    }
    return false;
}

async function _processTransactionData(validation, user, message, content, responseMetadata) {
    // Wrap reply to pass to processor
    const reply = async (t) => await message.reply(t);

    const dataToProcess = {
        ...validation.data,
        prompt_version: responseMetadata?.prompt_version || 'v1_stable'
    };

    const processingResult = await processExtractedData(dataToProcess, user.id, reply);

    // HITL Check
    await _handleHITL(processingResult, validation.data, content, user, message);
}

// --- Main Handler ---

class AiConversationHandler {
    // Extracted Method 1: Handle Media Response
    async _handleMediaResponse(response, message) {
        const { mimetype, data, filename, caption } = response.content;
        const media = { mimetype, data, filename };
        await message.reply(media, undefined, { caption });
    }

    // Extracted Method 2: Handle Validation Failure
    async _handleValidationFailure(validation, jsonStr, message, text) {
        const isTransactionAttempt = jsonStr.includes('"gastos"') || jsonStr.includes('"transacoes"');

        if (isTransactionAttempt) {
            logger.warn("Falha de Validação Zod", {
                errors: validation.error.format(),
                input: text
            });
            await message.reply("😵‍💫 Fiquei confuso com os dados. Poderia repetir de forma mais clara?");
        } else {
            await message.reply(text);
        }
    }

    // Extracted Method 3: Handle JSON Parse Error
    async _handleJSONParseError(error, jsonStr, message, text) {
        if (jsonStr.includes('"gastos"')) {
            logger.error("JSON Syntax Error", { error: error.message, input: text });
            await message.reply("❌ Erro técnico ao processar sua solicitação.");
        } else {
            await message.reply(text);
        }
    }

    // Extracted Method 4: Parse and Validate JSON
    async _parseAndValidateJSON(text, message, user, content, metadata) {
        const jsonStr = _parseAIResponse(text);

        try {
            const parsedRaw = JSON.parse(jsonStr);
            const validation = AIResponseSchema.safeParse(parsedRaw);

            if (validation.success) {
                await _processTransactionData(validation, user, message, content, metadata);
                return;
            }

            await this._handleValidationFailure(validation, jsonStr, message, text);

        } catch (e) {
            await this._handleJSONParseError(e, jsonStr, message, text);
        }
    }

    // Extracted Method 5: Update User Context
    _updateUserContext(userContext, userContent, assistantContent) {
        const updated = [...userContext];
        updated.push({ role: "user", content: userContent });
        updated.push({ role: "assistant", content: assistantContent });

        return updated.length > 10 ? updated.slice(-10) : updated;
    }

    // Extracted Method 6: Handle AI Response
    async _handleAIResponse(response, message, user, userContext, content) {
        const text = typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content);

        await this._parseAndValidateJSON(text, message, user, content, response.metadata);

        return this._updateUserContext(userContext, content, text);
    }

    // Main Handler (Refactored)
    async handle(message, user, userContext) {
        const content = message.body;
        const response = await textStrategy.execute(content, message, user, userContext);

        // Early return for media response
        if (response.type === 'media_response') {
            await this._handleMediaResponse(response, message);
            return;
        }

        // Handle AI/Tool responses
        if (response.type === 'ai_response' || response.type === 'tool_response') {
            const updatedContext = await this._handleAIResponse(
                response,
                message,
                user,
                userContext,
                content
            );
            await sessionService.setContext(user.id, updatedContext, 86400);
        }
    }
}

module.exports = {
    AiConversationHandler: new AiConversationHandler(),
    // Exporting helpers for testing
    _parseAIResponse,
    _handleHITL,
    _processTransactionData
};
