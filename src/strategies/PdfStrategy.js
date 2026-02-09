const logger = require('../services/loggerService');

// FIXED: Polyfills CRÍTICOS para Node.js (pdfjs-dist v5+)
(function () {
    // 1. Promise.withResolvers (Node < 22)
    if (Promise.withResolvers === undefined) {
        Promise.withResolvers = function () {
            let resolve, reject;
            const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
            return { promise, resolve, reject };
        };
    }

    // 2. DOMMatrix (Browser API simulation)
    // Usando globalThis para garantir visibilidade em todos os escopos
    if (globalThis.DOMMatrix === undefined) {
        class DOMMatrix {
            a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
            m11 = 1; m22 = 1; m33 = 1; m44 = 1;

            transformPoint(p) { return p; }
            translate() { return this; }
            scale() { return this; }
            toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
        }
        globalThis.DOMMatrix = DOMMatrix;
    }
})();

class PdfStrategy {

    /**
     * Extrai texto completo do PDF de forma robusta.
     * @param {Buffer} buffer 
     * @param {string} [password] 
     */
    async processPdf(buffer, password) {
        try {
            // Check Size (Warn if > 10MB)
            const mbSize = buffer.length / 1024 / 1024;
            if (mbSize > 10) {
                logger.warn("Processing Large PDF", { sizeMB: mbSize.toFixed(2) });
            }

            // Strategy Switch: Use 'pdf-parse' (stable for Node) instead of 'pdfjs-dist' (browser-focused)
            // This eliminates DOMMatrix/Canvas polyfill issues.
            const pdf = require('pdf-parse');

            try {
                const data = await pdf(buffer);

                // Validate extraction
                if (!data || !data.text || data.text.trim().length === 0) {
                    throw new Error("PDF parsing returned empty text.");
                }

                // Format text to match expected structure (roughly)
                // pdf-parse provides a single text blob. We can add a header.
                const fullText = `--- Início do PDF ---\nInfo: ${data.info ? JSON.stringify(data.info) : 'N/A'}\nPages: ${data.numpages}\nContent:\n${data.text}`;

                return { success: true, text: fullText };

            } catch (innerError) {
                // Check for password error pattern in pdf-parse
                // pdf-parse might throw string errors or specific shapes
                if (innerError.message && innerError.message.toLowerCase().includes('password')) {
                    logger.info("PDF Password Required (via pdf-parse)");
                    return { success: false, needsPassword: true, error: "Senha necessária." };
                }
                throw innerError;
            }

        } catch (error) {
            logger.error("PdfStrategy Critical Error (pdf-parse)", { error: error.message, stack: error.stack });
            return { success: false, error: `Falha técnica no PDF: ${error.message}` };
        }
    }

    async execute(message) {
        try {
            const media = await message.downloadMedia();
            if (!media) return { type: 'system_error', content: "Falha no download da mídia." };

            const buffer = Buffer.from(media.data, 'base64');
            const content = await this.processPdf(buffer, "");

            if (content.needsPassword) {
                return {
                    type: 'pdf_password_request',
                    fileBuffer: media.data,
                    fileName: "documento.pdf"
                };
            }

            if (content.success && content.text) {
                // Import tardio para evitar dependência circular se houver refatoração
                const { analyzePdfText } = require('../services/openaiService');
                const extraction = await analyzePdfText(content.text);
                return { type: 'data_extraction', content: extraction };
            }

            return { type: 'system_error', content: content.error || "Erro desconhecido ao ler PDF." };
        } catch (e) {
            logger.error("PdfStrategy Execute Wrapper Error", e);
            return { type: 'system_error', content: "Erro crítico no processamento." };
        }
    }

    async retryWithPassword(base64Data, password) {
        try {
            const buffer = Buffer.from(base64Data, 'base64');
            const content = await this.processPdf(buffer, password);

            if (content.success && content.text) {
                const { analyzePdfText } = require('../services/openaiService');
                const extraction = await analyzePdfText(content.text);
                return { success: true, data: extraction };
            }

            return { success: false, error: content.error || "Senha incorreta." };
        } catch (e) {
            // Handle this exception or don't catch it at all.
            // Returning error object is handling it.
            return { success: false, error: "Erro crítico ao tentar senha." };
        }
    }
}

module.exports = new PdfStrategy();
