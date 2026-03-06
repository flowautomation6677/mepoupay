import { extractCategoryFromCommand } from '../categoryFilter';

describe('extractCategoryFromCommand', () => {
    it('should map transportation keywords to "Transporte"', () => {
        expect(extractCategoryFromCommand('gastos com uber')).toBe('Transporte');
        expect(extractCategoryFromCommand('gasolina do mês')).toBe('Transporte');
        expect(extractCategoryFromCommand('99 pop')).toBe('Transporte');
        expect(extractCategoryFromCommand('ônibus')).toBe('Transporte');
    });

    it('should map food keywords to "Alimentação"', () => {
        expect(extractCategoryFromCommand('ifood da semana')).toBe('Alimentação');
        expect(extractCategoryFromCommand('jantar fora')).toBe('Alimentação');
        expect(extractCategoryFromCommand('restaurante caro')).toBe('Alimentação');
        expect(extractCategoryFromCommand('supermercado')).toBe('Alimentação');
        expect(extractCategoryFromCommand('comida')).toBe('Alimentação');
    });

    it('should map housing keywords to "Moradia"', () => {
        expect(extractCategoryFromCommand('aluguel')).toBe('Moradia');
        expect(extractCategoryFromCommand('conta de luz')).toBe('Moradia');
        expect(extractCategoryFromCommand('água e esgoto')).toBe('Moradia');
        expect(extractCategoryFromCommand('condomínio')).toBe('Moradia');
    });

    it('should map health keywords to "Saúde"', () => {
        expect(extractCategoryFromCommand('farmácia')).toBe('Saúde');
        expect(extractCategoryFromCommand('remédio')).toBe('Saúde');
        expect(extractCategoryFromCommand('médico')).toBe('Saúde');
        expect(extractCategoryFromCommand('consulta')).toBe('Saúde');
    });

    it('should map leisure keywords to "Lazer"', () => {
        expect(extractCategoryFromCommand('cinema')).toBe('Lazer');
        expect(extractCategoryFromCommand('festa')).toBe('Lazer');
        expect(extractCategoryFromCommand('jogo')).toBe('Lazer');
        expect(extractCategoryFromCommand('viagem')).toBe('Lazer');
    });

    it('should return null for unknown keywords', () => {
        expect(extractCategoryFromCommand('algo aleatório')).toBeNull();
        expect(extractCategoryFromCommand('12345')).toBeNull();
        expect(extractCategoryFromCommand('compras diversas')).toBeNull();
    });

    it('should handle case insensitivity', () => {
        expect(extractCategoryFromCommand('UBER')).toBe('Transporte');
        expect(extractCategoryFromCommand('IfOoD')).toBe('Alimentação');
    });

    it('should ignore accents in simple string matches if configured (or just match standard)', () => {
        expect(extractCategoryFromCommand('onibus')).toBe('Transporte');
        expect(extractCategoryFromCommand('agua')).toBe('Moradia');
    });
});
