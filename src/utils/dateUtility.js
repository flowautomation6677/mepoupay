const { parse, format, isValid, parseISO } = require('date-fns');

/**
 * Tenta converter uma string de data (DD/MM/YYYY ou YYYY-MM-DD) para Objeto Date.
 * Se falhar, retorna a data de hoje.
 * @param {string} dateStr 
 * @returns {Date}
 */
function parseAnyDate(dateStr) {
    if (!dateStr) return new Date();

    let parsedDate;

    // Tenta formato YYYY-MM-DD (ISO)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        parsedDate = parseISO(dateStr.split('T')[0]);
    }
    // Tenta formato DD/MM/YYYY
    else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
    }

    return isValid(parsedDate) ? parsedDate : new Date();
}

/**
 * Formata data para YYYY-MM-DD (Banco de Dados)
 * @param {Date|string} date 
 * @returns {string}
 */
function formatToISO(date) {
    if (!date) date = new Date();
    const d = typeof date === 'string' ? parseAnyDate(date) : date;
    return format(d, 'yyyy-MM-dd');
}

/**
 * Formata data para DD/MM/YYYY (Exibição Usuário)
 * @param {Date|string} date 
 * @returns {string}
 */
function formatToDisplay(date) {
    if (!date) date = new Date();
    const d = typeof date === 'string' ? parseAnyDate(date) : date;
    if (!isValid(d)) return format(new Date(), 'dd/MM/yyyy');
    return format(d, 'dd/MM/yyyy');
}

module.exports = {
    parseAnyDate,
    formatToISO,
    formatToDisplay
};
