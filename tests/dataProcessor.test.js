const {
    _parseContent,
    _normalizeTransactions,
    _generatePayload
} = require('../src/services/dataProcessor');

jest.mock('../src/services/supabaseClient', () => {
    return {
        adminClient: {
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 'mocked-id' } })
            })
        }
    };
});
describe('_parseContent', () => {
    test('deve parsear JSON string simples', () => {
        const content = '{"gastos": [{"valor": 10}]}';
        const result = _parseContent(content);
        expect(result).toEqual({ gastos: [{ valor: 10 }] });
    });

    test('deve parsear JSON com markdown delimiters', () => {
        const content = '```json\n{"transacoes": []}\n```';
        const result = _parseContent(content);
        expect(result).toEqual({ transacoes: [] });
    });

    test('deve parsear objeto JavaScript diretamente', () => {
        const content = { valor: 100, descricao: 'Teste' };
        const result = _parseContent(content);
        expect(result).toEqual(content);
    });

    test('deve parsear JSON duplamente stringified', () => {
        const content = '"{\\"valor\\": 50}"';
        const result = _parseContent(content);
        expect(result).toEqual({ valor: 50 });
    });

    test('deve retornar null para conteúdo inválido', () => {
        const result = _parseContent('invalid json {]');
        expect(result).toBeNull();
    });

    test('deve retornar null para string vazia', () => {
        const result = _parseContent('');
        expect(result).toBeNull();
    });
});

describe('_normalizeTransactions', () => {
    test('deve usar array transacoes quando disponível', () => {
        const data = {
            transacoes: [
                { descricao: 'Item 1', valor: 10 },
                { descricao: 'Item 2', valor: 20 }
            ]
        };
        const result = _normalizeTransactions(data);
        expect(result).toHaveLength(2);
        expect(result[0].descricao).toBe('Item 1');
    });

    test('deve usar array gastos quando disponível', () => {
        const data = {
            gastos: [
                { descricao: 'Gasto 1', valor: 15 }
            ]
        };
        const result = _normalizeTransactions(data);
        expect(result).toHaveLength(1);
        expect(result[0].descricao).toBe('Gasto 1');
    });

    test('deve mesclar transacoes e gastos', () => {
        const data = {
            transacoes: [{ descricao: 'TX1', valor: 10 }],
            gastos: [{ descricao: 'G1', valor: 20 }]
        };
        const result = _normalizeTransactions(data);
        expect(result).toHaveLength(2);
        expect(result[0].descricao).toBe('TX1');
        expect(result[1].descricao).toBe('G1');
    });

    test('deve criar transação única a partir de valor legacy', () => {
        const data = {
            valor: 100,
            descricao: 'Pagamento',
            categoria: 'Teste'
        };
        const result = _normalizeTransactions(data);
        expect(result).toHaveLength(1);
        expect(result[0].valor).toBe(100);
        expect(result[0].descricao).toBe('Pagamento');
    });

    test('deve criar transação de fatura quando total_fatura presente', () => {
        const data = {
            total_fatura: 500,
            vencimento: '2026-01-15'
        };
        const result = _normalizeTransactions(data);
        expect(result).toHaveLength(1);
        expect(result[0].descricao).toContain('Pagamento de Fatura');
        expect(result[0].valor).toBe(500);
        expect(result[0].categoria).toBe('Pagamento de Fatura');
    });

    test('deve retornar array vazio quando não houver dados', () => {
        const data = {};
        const result = _normalizeTransactions(data);
        expect(result).toHaveLength(0);
    });
});

describe('_generatePayload', () => {
    test('deve gerar payload com status confirmed para alta confiança', async () => {
        const validItems = [
            {
                valor: 10.50,
                valor_original: 10.50,
                moeda_original: 'BRL',
                taxa_cambio: 1,
                descricao: 'Café',
                categoria: 'Alimentação',
                data: '2026-01-03',
                tipo: 'despesa'
            }
        ];
        const embeddings = [[0.1, 0.2, 0.3]];
        const userId = 'user123';
        const data = { confidence_score: 0.95 };

        const result = await _generatePayload(validItems, embeddings, userId, data);

        expect(result.status).toBe('confirmed');
        expect(result.confidenceScore).toBe(0.95);
        expect(result.payload).toHaveLength(1);
        expect(result.payload[0].status).toBe('confirmed');
    });

    test('deve gerar payload com status pending_review para baixa confiança', async () => {
        const validItems = [
            {
                valor: 20,
                valor_original: 20,
                moeda_original: 'BRL',
                taxa_cambio: 1,
                descricao: 'Item',
                categoria: 'Outros',
                data: '2026-01-03',
                tipo: 'despesa'
            }
        ];
        const embeddings = [[0.4, 0.5]];
        const userId = 'user456';
        const data = { confidence_score: 0.65 };

        const result = await _generatePayload(validItems, embeddings, userId, data);

        expect(result.status).toBe('pending_review');
        expect(result.confidenceScore).toBe(0.65);
        expect(result.payload[0].status).toBe('pending_review');
    });

    test('deve usar confidence_score padrão 1.0 quando não fornecido', async () => {
        const validItems = [{
            valor: 5,
            valor_original: 5,
            moeda_original: 'BRL',
            taxa_cambio: 1,
            descricao: 'Test',
            categoria: 'Test',
            data: '2026-01-03',
            tipo: 'despesa'
        }];
        const embeddings = [[0.1]];
        const userId = 'user789';
        const data = {};

        const result = await _generatePayload(validItems, embeddings, userId, data);

        expect(result.confidenceScore).toBe(1.0);
        expect(result.status).toBe('confirmed');
    });

    test('deve incluir prompt_version no payload', async () => {
        const validItems = [{
            valor: 15,
            valor_original: 15,
            moeda_original: 'BRL',
            taxa_cambio: 1,
            descricao: 'Almoço',
            categoria: 'Alimentação',
            data: '2026-01-03',
            tipo: 'despesa'
        }];
        const embeddings = [[0.2, 0.3]];
        const userId = 'user101';
        const data = { prompt_version: 'v2_experimental' };

        const result = await _generatePayload(validItems, embeddings, userId, data);

        expect(result.payload[0].metadata.prompt_version).toBe('v2_experimental');
    });

    test('deve usar prompt_version padrão quando não fornecido', async () => {
        const validItems = [{
            valor: 25,
            valor_original: 25,
            moeda_original: 'BRL',
            taxa_cambio: 1,
            descricao: 'Compras',
            categoria: 'Mercado',
            data: '2026-01-03',
            tipo: 'despesa'
        }];
        const embeddings = [[0.5]];
        const userId = 'user202';
        const data = {};

        const result = await _generatePayload(validItems, embeddings, userId, data);

        expect(result.payload[0].metadata.prompt_version).toBe('v1_stable');
    });

    test('deve mapear corretamente todos os campos do payload', async () => {
        const validItems = [{
            valor: 35.75,
            valor_original: 30,
            moeda_original: 'USD',
            taxa_cambio: 5.25,
            descricao: 'Produto Importado',
            categoria: 'Compras Online',
            data: '2026-01-03',
            tipo: 'despesa'
        }];
        const embeddings = [[0.7, 0.8, 0.9]];
        const userId = 'user303';
        const data = { confidence_score: 0.8 };

        const result = await _generatePayload(validItems, embeddings, userId, data);

        const item = result.payload[0];
        expect(item.user_id).toBe('user303');
        expect(item.amount).toBe(35.75);
        expect(item.metadata.valor_original).toBe(30);
        expect(item.metadata.moeda_original).toBe('USD');
        expect(item.metadata.taxa_cambio).toBe(5.25);
        expect(item.description).toBe('Produto Importado');
        expect(item.type).toBe('EXPENSE');
        expect(item.metadata.embedding).toEqual([0.7, 0.8, 0.9]);
        expect(item.metadata.confidence_score).toBe(0.8);
    });
});
