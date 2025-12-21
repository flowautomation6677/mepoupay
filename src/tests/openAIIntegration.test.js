/* eslint-disable no-undef */
// 🧪 Testes de Integração com IA (Mocking Avançado)
// Foco: Robustez do TextStrategy contra falhas da OpenAI

// --- MOCKS ---
// Mockamos o módulo de serviço INTEIRO para controlar as respostas
jest.mock('../services/openaiService', () => ({
    chatCompletion: jest.fn(),
    generateEmbedding: jest.fn()
}));

jest.mock('../repositories/TransactionRepository', () => ({
    searchSimilar: jest.fn().mockResolvedValue([])
}));

jest.mock('../repositories/UserRepository', () => ({
    getFinancialGoal: jest.fn()
}));

const { chatCompletion, generateEmbedding } = require('../services/openaiService');
const textStrategy = require('../strategies/TextStrategy');

// Dados fake
const mockUser = { id: 1, name: 'Tester' };
const mockMemory = [];

describe('OpenAI Integration (Robustness Check)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]); // Sempre retorna embedding valido pra não travar antes
    });

    test('✅ Sucesso: OpenAI retorna JSON perfeito', async () => {
        // Cenário: IA responde bonitinho com JSON
        chatCompletion.mockResolvedValue({
            choices: [{
                message: {
                    content: JSON.stringify({
                        gastos: [{ descricao: "Pizza", valor: 50.00, categoria: "Alimentação", data: "2024-12-20" }]
                    })
                }
            }]
        });

        console.log("TEST DEBUG: Calling execute...");
        try {
            const result = await textStrategy.execute("Gastei 50 na pizza", {}, mockUser, mockMemory);
            console.log("TEST DEBUG: Result received", result);

            expect(result).toBeDefined();
            expect(result.type).toBe('ai_response');
            expect(result.content).toContain('Pizza');
        } catch (e) {
            console.error("TEST DEBUG: Error in execute:", e);
            throw e;
        }
    });

    test('⚠️ Malformed JSON: OpenAI retorna JSON quebrado', async () => {
        // Cenário: IA corta o JSON no meio (ex: limite de tokens)
        chatCompletion.mockResolvedValue({
            choices: [{
                message: {
                    content: '{ "gastos": [{ "descricao": "Piz' // Falta fechar
                }
            }]
        });

        // O Strategy deve lidar e retornar o texto cru ou erro, mas NÃO CRASHAR
        const result = await textStrategy.execute("Gastei 50...", {}, mockUser, mockMemory);

        // Aqui esperamos que ele devolva como content o texto quebrado (para o handler tentar processar ou responder)
        expect(result.type).toBe('ai_response');
        expect(typeof result.content).toBe('string');
    });

    test('🔥 Caos: OpenAI fora do ar (Timeout/Error)', async () => {
        // Cenário: API caiu ou deu 500
        chatCompletion.mockRejectedValue(new Error("OpenAI API Error: 503 Service Unavailable"));

        // O teste passa se a função rejeitar o erro (para ser pego no try/catch do handler) 
        // ou retornar uma resposta de erro amigável.
        // Assumindo que TextStrategy deixa o erro subir ou trata.

        await expect(textStrategy.execute("Oi", {}, mockUser, mockMemory))
            .rejects
            .toThrow("OpenAI API Error");
    });

    test('🛡️ Injeção de Texto: IA mistura conversa com JSON', async () => {
        // Cenário: IA "fala demais" antes do JSON
        chatCompletion.mockResolvedValue({
            choices: [{
                message: {
                    content: 'Claro! Aqui está: { "gastos": [{ "descricao": "Uber", "valor": 20 }] }'
                }
            }]
        });

        const result = await textStrategy.execute("Uber 20", {}, mockUser, mockMemory);

        // O result.content vai ter o lixo "Claro!...", mas o nosso MessageHandler (que consome isso) 
        // É QUEM TEM O REGEX FILTER. O Strategy só repassa o que a IA disse.
        // Então o teste é se o strategy repassa corretamente.
        expect(result.content).toContain('Claro!');
        expect(result.content).toContain('Uber');
    });
});
