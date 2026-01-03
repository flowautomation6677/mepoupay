const pdfStrategy = require('./PdfStrategy');

class PdfRetryStrategy {
    async execute(mockMessage, jobData) {
        // Adapt the specific logic for retry here
        const { mediaData, password } = jobData;
        const retryResult = await pdfStrategy.retryWithPassword(mediaData, password);

        if (retryResult.success) {
            return { type: 'data_extraction', content: retryResult.data };
        } else {
            return { type: 'system_error', content: `Senha inválida ou erro: ${retryResult.error}` };
        }
    }
}
module.exports = new PdfRetryStrategy();
