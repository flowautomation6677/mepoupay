const { analyzePdfText } = require('../services/openaiService');
const logger = require('../services/loggerService');

class PdfStrategy {

    /**
     * Extrai texto completo do PDF usando PDF.js (Mozilla Engine)
     * Suporta criptografia moderna (AES-256 R6) usada por bancos.
     * @param {Buffer} buffer 
     * @param {string} [password] 
     */
    async processPdf(buffer, password) {
        let loadingTask = null;
        try {
            // Check Size (Warn if > 10MB)
            const mbSize = buffer.length / 1024 / 1024;
            if (mbSize > 10) {
                logger.warn("Processing Large PDF", { sizeMB: mbSize.toFixed(2) });
            }

            // Dynamic Import for ESM compatibility (pdfjs-dist v5+)
            const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

            // Convertendo Buffer para Uint8Array (formato esperado pelo PDF.js)
            const data = new Uint8Array(buffer);

            loadingTask = pdfjsLib.getDocument({
                data: data,
                password: password || '', // Se vazio, tenta abrir sem senha
                // Opções para desativar features de browser que quebram no Node
                disableFontFace: true,
                verbosity: 0
            });

            const doc = await loadingTask.promise;

            // PDF carregou! Agora extrair texto de todas as páginas.
            let fullText = "";

            // Paralelizar extração? Melhor sequencial para garantir ordem.
            for (let i = 1; i <= doc.numPages; i++) {
                let page = null;
                try {
                    page = await doc.getPage(i);
                    const tokenizedText = await page.getTextContent();
                    const pageText = tokenizedText.items.map(token => token.str).join(' ');
                    fullText += `\n--- Pág ${i} ---\n${pageText}`;
                } finally {
                    // Explicit Page Cleanup to free memory
                    if (page) page.cleanup();
                }
            }

            return { success: true, text: fullText };

        } catch (error) {
            // Tratamento de Erro de Senha
            if (error.name === 'PasswordException' || error.message.includes('Password') || error.name === 'MissingPDFException') {
                logger.info("PDF Password Required", { error: error.message });
                return { success: false, needsPassword: true, error: "Senha necessária ou incorreta." };
            }

            logger.error("PdfStrategy (PDFJS) Error", { error });

            // Se tiver senha e falhou, é incorreta
            if (password) {
                return { success: false, needsPassword: true, error: `Falha ao abrir com senha: ${error.message}` };
            }

            return { success: false, error: `Erro ao processar PDF: ${error.message}` };
        } finally {
            // Document Cleanup
            if (loadingTask && loadingTask.destroy) {
                await loadingTask.destroy().catch(e => logger.warn("Error destroying PDF task", { error: e }));
            }
        }
    }

    async execute(message) {
        const media = await message.downloadMedia();
        if (!media) return null;

        const buffer = Buffer.from(media.data, 'base64');

        // Tentativa Inicial (Sem senha explícita)
        const content = await this.processPdf(buffer, "");

        if (content.needsPassword) {
            return {
                type: 'pdf_password_request',
                fileBuffer: media.data,
                fileName: "documento.pdf"
            };
        }

        if (content.success && content.text) {
            const extraction = await analyzePdfText(content.text);
            return { type: 'data_extraction', content: extraction };
        }

        return { type: 'system_error', content: content.error || "Erro desconhecido ao ler PDF." };
    }

    async retryWithPassword(base64Data, password) {
        const buffer = Buffer.from(base64Data, 'base64');
        const content = await this.processPdf(buffer, password);

        if (content.success && content.text) {
            const extraction = await analyzePdfText(content.text);
            return { success: true, data: extraction };
        }

        // Se falhou (Needs Password ou Error)
        let msg = content.error || "Senha incorreta.";
        return { success: false, error: msg };
    }
}

module.exports = new PdfStrategy();
