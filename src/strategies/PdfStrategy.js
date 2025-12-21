// Usando a build ES5 do pdfjs-dist (v2) para compatibilidade CommonJS
const pdfjsLib = require('pdfjs-dist');
const { analyzePdfText } = require('../services/openaiService');

class PdfStrategy {

    /**
     * Extrai texto completo do PDF usando PDF.js (Mozilla Engine)
     * Suporta criptografia moderna (AES-256 R6) usada por bancos.
     * @param {Buffer} buffer 
     * @param {string} [password] 
     */
    async processPdf(buffer, password) {
        try {
            // Convertendo Buffer para Uint8Array (formato esperado pelo PDF.js)
            const data = new Uint8Array(buffer);

            const loadingTask = pdfjsLib.getDocument({
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
                const page = await doc.getPage(i);
                const tokenizedText = await page.getTextContent();
                const pageText = tokenizedText.items.map(token => token.str).join(' ');
                fullText += `\n--- Pág ${i} ---\n${pageText}`;
            }

            return { success: true, text: fullText };

        } catch (error) {
            // Tratamento de Erro de Senha
            if (error.name === 'PasswordException' || error.message.includes('Password') || error.name === 'MissingPDFException') {
                return { success: false, needsPassword: true, error: "Senha necessária ou incorreta." };
            }

            console.error("PdfStrategy (PDFJS) Error:", error);

            // Se tiver senha e falhou, é incorreta
            if (password) {
                return { success: false, needsPassword: true, error: `Falha ao abrir com senha: ${error.message}` };
            }

            return { success: false, error: `Erro ao processar PDF: ${error.message}` };
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
