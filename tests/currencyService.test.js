// Mock do axios e logger
jest.mock('axios');
jest.mock('../src/services/loggerService');

const axios = require('axios');
const currencyService = require('../src/services/currencyService');
const logger = require('../src/services/loggerService');

describe('CurrencyService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getExchangeRate', () => {
        test('deve retornar 1.0 para BRL', async () => {
            const rate = await currencyService.getExchangeRate('BRL');
            expect(rate).toBe(1);
            expect(axios.get).not.toHaveBeenCalled();
        });

        test('deve retornar 1.0 quando moeda não fornecida', async () => {
            const rate = await currencyService.getExchangeRate(null);
            expect(rate).toBe(1);
        });

        test('deve retornar 1.0 quando moeda é undefined', async () => {
            const rate = await currencyService.getExchangeRate(undefined);
            expect(rate).toBe(1);
        });

        test('deve buscar taxa de câmbio para USD', async () => {
            axios.get.mockResolvedValue({
                data: {
                    USDBRL: {
                        bid: '5.25',
                        ask: '5.26'
                    }
                }
            });

            const rate = await currencyService.getExchangeRate('USD');

            expect(rate).toBe(5.25);
            expect(axios.get).toHaveBeenCalledWith(
                'https://economia.awesomeapi.com.br/json/last/USD-BRL'
            );
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Taxa de câmbio obtida')
            );
        });

        test('deve buscar taxa para EUR', async () => {
            axios.get.mockResolvedValue({
                data: {
                    EURBRL: {
                        bid: '6.15'
                    }
                }
            });

            const rate = await currencyService.getExchangeRate('EUR');

            expect(rate).toBe(6.15);
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('EUR-BRL')
            );
        });

        test('deve retornar 1.0 quando API não retorna chave esperada', async () => {
            axios.get.mockResolvedValue({
                data: {
                    someOtherKey: {}
                }
            });

            const rate = await currencyService.getExchangeRate('USD');

            expect(rate).toBe(1);
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('não retornou a chave esperada')
            );
        });

        test('deve retornar 1.0 e logar erro quando API falha', async () => {
            axios.get.mockRejectedValue(new Error('Network error'));

            const rate = await currencyService.getExchangeRate('USD');

            expect(rate).toBe(1);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Falha ao obter câmbio'),
                expect.objectContaining({
                    error: 'Network error'
                })
            );
        });

        test('deve parsear corretamente taxa com decimais', async () => {
            axios.get.mockResolvedValue({
                data: {
                    USDBRL: {
                        bid: '5.123456'
                    }
                }
            });

            const rate = await currencyService.getExchangeRate('USD');

            expect(rate).toBe(5.123456);
        });
    });

    describe('convertValue', () => {
        test('deve converter valor de USD para BRL', async () => {
            axios.get.mockResolvedValue({
                data: {
                    USDBRL: {
                        bid: '5.00'
                    }
                }
            });

            const result = await currencyService.convertValue(100, 'USD');

            expect(result).toEqual({
                convertedValue: 500,
                exchangeRate: 5
            });
        });

        test('deve converter valor de EUR para BRL', async () => {
            axios.get.mockResolvedValue({
                data: {
                    EURBRL: {
                        bid: '6.00'
                    }
                }
            });

            const result = await currencyService.convertValue(50, 'EUR');

            expect(result).toEqual({
                convertedValue: 300,
                exchangeRate: 6
            });
        });

        test('deve manter valor quando moeda é BRL', async () => {
            const result = await currencyService.convertValue(100, 'BRL');

            expect(result).toEqual({
                convertedValue: 100,
                exchangeRate: 1
            });
            expect(axios.get).not.toHaveBeenCalled();
        });

        test('deve usar taxa 1.0 quando API falha', async () => {
            axios.get.mockRejectedValue(new Error('Timeout'));

            const result = await currencyService.convertValue(100, 'USD');

            expect(result).toEqual({
                convertedValue: 100,
                exchangeRate: 1
            });
        });

        test('deve converter valores decimais corretamente', async () => {
            axios.get.mockResolvedValue({
                data: {
                    USDBRL: {
                        bid: '5.25'
                    }
                }
            });

            const result = await currencyService.convertValue(12.50, 'USD');

            expect(result.convertedValue).toBe(65.625);
            expect(result.exchangeRate).toBe(5.25);
        });

        test('deve funcionar com valores zero', async () => {
            const result = await currencyService.convertValue(0, 'BRL');

            expect(result).toEqual({
                convertedValue: 0,
                exchangeRate: 1
            });
        });

        test('deve converter valores negativos', async () => {
            axios.get.mockResolvedValue({
                data: {
                    USDBRL: {
                        bid: '5.00'
                    }
                }
            });

            const result = await currencyService.convertValue(-10, 'USD');

            expect(result.convertedValue).toBe(-50);
        });
    });
});
