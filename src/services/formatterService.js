const { formatToDisplay } = require('../utils/dateUtility');

const FormatterService = {

    /**
     * Formata mensagem de sucesso para registro de transação
     */
    formatSuccessMessage(gasto) {
        const valorReal = gasto.valor !== undefined ? gasto.valor : gasto.amount;
        let tipoStr = 'despesa';
        if (gasto.tipo === 'receita' || gasto.type === 'INCOME') tipoStr = 'receita';

        const dataOriginal = gasto.data || gasto.date;
        const categoriaFinal = gasto.categoria || (gasto.metadata && gasto.metadata.categoria_original) || "Outros";
        const descricaoFinal = gasto.descricao || gasto.description;

        const valor = this.formatCurrency(valorReal, gasto.moeda || 'BRL');
        const titulo = tipoStr === 'receita' ? '✅ Entrada Registrada!' : '✅ Gasto Registrado!';
        const dataDisplay = formatToDisplay(dataOriginal);

        return `${titulo}\n\n` +
            `🪙 ${categoriaFinal} (${descricaoFinal})\n` +
            `💰 ${valor}\n` +
            `🗓️ ${dataDisplay}\n\n`;
    },

    /**
     * Formata valor monetário (Multi-moeda)
     */
    formatCurrency(value, currency = 'BRL') {
        try {
            return Math.abs(value).toLocaleString('pt-BR', { style: 'currency', currency: currency });
        } catch (e) {
            // Fallback para BRL se a moeda for inválida
            return Math.abs(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    },

    /**
     * Formata mensagem de erro padrão
     */
    formatErrorMessage(msg) {
        return `❌ ${msg}`;
    },

    /**
     * Gera resumo financeiro visual (Placeholder para uso futuro)
     */
    formatFinancialSummary(resumo) {
        // Implementar lógica de lista/tabela se necessário
        return "Resumo ainda não implementado.";
    }
};

module.exports = FormatterService;
