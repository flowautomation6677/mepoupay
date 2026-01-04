const routerService = require('../src/services/routerService');
const logger = require('../src/services/loggerService');

jest.mock('../src/services/loggerService');

describe('RouterService - Improved Regex', () => {

    describe('Simplificação de Regex', () => {
        test('deve identificar padrão "Palavra Numero" (ex: Almoço 20)', () => {
            const result = routerService.route('Almoço 20');
            expect(result).toBe('gpt-4o-mini');
        });

        test('deve identificar padrão "Numero Palavra" (ex: 20 Almoço)', () => {
            const result = routerService.route('20 Almoço');
            expect(result).toBe('gpt-4o-mini');
        });

        test('deve identificar padrão com decimais (ex: Uber 15.50)', () => {
            const result = routerService.route('Uber 15.50');
            expect(result).toBe('gpt-4o-mini');
        });

        test('deve identificar padrão com vírgula (ex: Padaria 10,90)', () => {
            const result = routerService.route('Padaria 10,90');
            expect(result).toBe('gpt-4o-mini');
        });

        test('deve identificar padrão com acentos (ex: Pão 5)', () => {
            const result = routerService.route('Pão 5');
            expect(result).toBe('gpt-4o-mini');
        });

        test('deve identificar padrão com cedilha (ex: Açaí 20)', () => {
            const result = routerService.route('Açaí 20');
            expect(result).toBe('gpt-4o-mini');
        });
    });

    describe('Complex Cases (Default High Reasoning)', () => {
        test('deve rotear texto complexo para high reasoning', () => {
            const result = routerService.route('Gastei 20 no almoço e 30 no jantar');
            expect(result).toBe('gpt-4o');
        });

        test('deve rotear texto ambíguo para high reasoning', () => {
            const result = routerService.route('Transferência para João');
            expect(result).toBe('gpt-4o');
        });
    });

    describe('Short/Conversational', () => {
        test('deve rotear conversa curta para low cost', () => {
            const result = routerService.route('Oi');
            expect(result).toBe('gpt-4o-mini');
        });
    });
});
