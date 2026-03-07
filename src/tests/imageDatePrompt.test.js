/* eslint-disable no-undef */

describe('Vision API Date Verification', () => {
    let openaiService;
    let mockChatCompletionsCreate;

    beforeEach(() => {
        jest.resetModules(); // Limpa cache para podermos mockar a OpenAI

        // Setup the mock for openai
        mockChatCompletionsCreate = jest.fn().mockResolvedValue({
            choices: [{ message: { content: '{"transacoes":[]}' } }],
            usage: { total_tokens: 10 }
        });

        jest.mock('openai', () => {
            return jest.fn().mockImplementation(() => {
                return {
                    chat: {
                        completions: {
                            create: mockChatCompletionsCreate
                        }
                    }
                };
            });
        });

        // Nós temos que mockar os outros serviços que openaiService importa
        jest.mock('../services/loggerService', () => ({
            info: jest.fn(),
            error: jest.fn()
        }));

        jest.mock('../services/circuitBreakerService', () => ({
            createBreaker: (fn) => ({
                fire: (...args) => fn(...args)
            })
        }));

        jest.mock('../services/securityService', () => ({
            cleanPdfText: jest.fn(t => t),
            redactPII: jest.fn(t => t)
        }));

        process.env.OPENAI_API_KEY = "dummy";

        // Import da lib pós-mock
        openaiService = require('../services/openaiService');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('🔴 Deve conter a string de data atual no system prompt da Vision API', async () => {
        const dummyBase64 = "iVBORw0K...";
        const dummyMimetype = "image/png";

        await openaiService.analyzeImage(dummyBase64, dummyMimetype);

        // Verifica se chat.completions.create foi chamado
        expect(mockChatCompletionsCreate).toHaveBeenCalled();

        // Pega os parâmetros da chamada
        const callArgs = mockChatCompletionsCreate.mock.calls[0][0];
        const systemMessage = callArgs.messages.find(m => m.role === 'system');

        expect(systemMessage).toBeDefined();

        // A data de hoje extraída programaticamente para comparar
        const todayStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        // A mensagem de sistema DEVE conter a regra da data e a data do dia
        expect(systemMessage.content).toMatch(/Data de Hoje.*YYYY-MM-DD/i);
        expect(systemMessage.content).toContain(todayStr); // Isso deve falhar porque "todayStr" não está no prompt atual
    });
});
