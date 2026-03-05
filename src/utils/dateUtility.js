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

/**
 * Formata data preservando hora exata para "hoje" ou fixando 12:00 BRT para dias passados
 * Previne que o DB zere a hora para meia-noite (UTC) e a UI exiba 21:00 do dia anterior.
 * @param {Date|string} date 
 * @returns {string} ISO Date String with Offset
 */
function getExactTimestamp(dateStr) {
    if (!dateStr) return new Date().toISOString();

    const d = typeof dateStr === 'string' ? parseAnyDate(dateStr) : dateStr;
    if (!isValid(d)) return new Date().toISOString();

    // Compare dates in BRT to avoid UTC midnight crossing changing the perceived day
    const TIMEZONE = 'America/Sao_Paulo';
    const toBRTDateStr = (dt) =>
        new Intl.DateTimeFormat('sv', { timeZone: TIMEZONE }).format(dt); // returns 'YYYY-MM-DD'

    const formattedDbDate = format(d, 'yyyy-MM-dd'); // always local date from parseAnyDate
    const todayBRT = toBRTDateStr(new Date());

    if (formattedDbDate === todayBRT) {
        // It's today in BRT. Return the exact current timestamp.
        return new Date().toISOString();
    } else {
        // Past or future date. Fix to noon BRT to avoid timezone day-shift.
        return `${formattedDbDate}T12:00:00-03:00`;
    }
}

module.exports = {
    parseAnyDate,
    formatToISO,
    formatToDisplay,
    getExactTimestamp
};
