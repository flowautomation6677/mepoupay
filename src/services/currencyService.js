const axios = require('axios');
const logger = require('./loggerService');

class CurrencyService {
    async getExchangeRate(moedaOrigem) {
        if (!moedaOrigem || moedaOrigem === 'BRL') return 1.0;
        try {
            const response = await axios.get(`https://economia.awesomeapi.com.br/json/last/${moedaOrigem}-BRL`);
            // API returns object like { USDBRL: { bid: "5.50" } }
            // So we access response.data[`${moedaOrigem}BRL`].bid
            const key = `${moedaOrigem}BRL`;
            if (response.data[key]) {
                const rate = parseFloat(response.data[key].bid);
                logger.info(`Taxa de câmbio obtida: ${moedaOrigem} -> BRL = ${rate}`);
                return rate;
            }
            logger.warn(`API de Câmbio não retornou a chave esperada para ${moedaOrigem}. Usando 1.0`);
            return 1.0;
        } catch (error) {
            logger.error(`Falha ao obter câmbio para ${moedaOrigem}. Usando 1.0.`, { error: error.message });
            return 1.0;
        }
    }

    async convertValue(amount, currency) {
        const rate = await this.getExchangeRate(currency);
        return {
            convertedValue: amount * rate,
            exchangeRate: rate
        };
    }
}
module.exports = new CurrencyService();
