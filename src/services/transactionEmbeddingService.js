const { generateBatchEmbeddings } = require('./openaiService');

class TransactionEmbeddingService {
    async generateForTransactions(transactions) {
        // Filter transactions with valid amounts
        const validTransactions = transactions.filter(t => t.valor);
        const texts = validTransactions.map(t => `${t.descricao || 'Item'} - ${t.categoria || 'Outros'}`);

        if (texts.length === 0) return [];

        return await generateBatchEmbeddings(texts);
    }
}

module.exports = new TransactionEmbeddingService();
