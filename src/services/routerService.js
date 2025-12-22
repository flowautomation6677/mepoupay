const logger = require('./loggerService');

class RouterService {
    constructor() {
        this.LOW_COST_MODEL = "gpt-4o-mini";
        this.HIGH_REASONING_MODEL = "gpt-4o";
    }

    /**
     * Decides which model to use based on input complexity.
     * @param {string} text - The user message.
     * @param {object} context - Optional context about file attachments.
     * @returns {string} - Model name.
     */
    route(text, context = {}) {
        // 1. If there's an image/PDF (Vision/Complex), use High Reasoning
        if (context.hasMedia || context.isFile) {
            logger.debug("[Router] Media detected. Routing to HIGH_REASONING.");
            return this.HIGH_REASONING_MODEL;
        }

        if (!text || typeof text !== 'string') return this.LOW_COST_MODEL;

        const cleanText = text.trim();

        // 2. Simple Transaction Patterns (Regex Heuristics)
        // Ex: "Almoço 20", "Uber 15.50", "20 reais padaria"
        // This regex looks for a number and some words roughly.
        const simpleTransactionRegex = /^[\w\s\u00C0-\u00FFçÇ]+ \d+([,.]\d+)?$|^\d+([,.]\d+)? [\w\s\u00C0-\u00FFçÇ]+$/i;

        if (simpleTransactionRegex.test(cleanText) && cleanText.length < 100) {
            logger.debug(`[Router] Simple text detected: "${cleanText}". Routing to LOW_COST.`);
            return this.LOW_COST_MODEL;
        }

        // 3. Conversational / Short Queries
        // Ex: "Oi", "Tudo bem?", "Como uso o bot?"
        if (cleanText.length < 20) {
            logger.debug("[Router] Short conversational text. Routing to LOW_COST.");
            return this.LOW_COST_MODEL;
        }

        // 4. Default: Complex Reasoning
        // Ambiguous sentences, multiple items, semantic nuance.
        logger.debug("[Router] Complex/Long text. Routing to HIGH_REASONING.");
        return this.HIGH_REASONING_MODEL;
    }
}

module.exports = new RouterService();
