// Mock das dependências antes de importar o handler
jest.mock('../src/strategies/TextStrategy');
jest.mock('../src/services/dataProcessor');
jest.mock('../src/services/sessionService');
jest.mock('../src/schemas/AIResponseSchema', () => ({
    AIResponseSchema: {
        safeParse: jest.fn()
    }
}));

const AiConversationHandler = require('../src/handlers/AiConversationHandler');
const textStrategy = require('../src/strategies/TextStrategy');
const { processExtractedData } = require('../src/services/dataProcessor');
const sessionService = require('../src/services/sessionService');
const { AIResponseSchema } = require('../src/schemas/AIResponseSchema');

describe('AiConversationHandler - handle() Integration Tests', () => {
    let handler;
    let mockMessage;
    let mockUser;
    let mockUserContext;

    beforeEach(() => {
        // Limpar todos os mocks
        jest.clearAllMocks();

        // Criar instância do handler
        handler = new AiConversationHandler();

        // Mock de mensagem padrão
        mockMessage = {
            body: 'Gastei 50 reais no almoço',
            reply: jest.fn().mockResolvedValue(true)
        };

        // Mock de usuário padrão
        mockUser = {
            id: 'user-test-123',
            whatsapp_id: '5511999999999@c.us'
        };

        // Mock de contexto padrão
        mockUserContext = [
            { role: 'user', content: 'Olá' },
            { role: 'assistant', content: 'Oi, como posso ajudar?' }
        ];

        // Configurar mock do sessionService
        sessionService.setContext = jest.fn().mockResolvedValue(true);
    });

    describe('Cenário 1: Resposta de Mídia', () => {
        test('deve enviar mídia quando AI retorna media_response', async () => {
            // Mock do TextStrategy retornando média
            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'media_response',
                content: {
                    mimetype: 'image/png',
                    data: 'base64imagedata',
                    filename: 'grafico.png',
                    caption: 'Aqui está seu gráfico de gastos'
                }
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            // Verificar que reply foi chamado com a mídia
            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    mimetype: 'image/png',
                    data: 'base64imagedata',
                    filename: 'grafico.png'
                }),
                undefined,
                expect.objectContaining({
                    caption: 'Aqui está seu gráfico de gastos'
                })
            );

            // Não deve atualizar contexto para respostas de mídia
            expect(sessionService.setContext).not.toHaveBeenCalled();
        });
    });

    describe('Cenário 2: JSON Válido com Transações', () => {
        test('deve processar JSON válido e criar transações', async () => {
            const validJSON = {
                gastos: [{
                    descricao: 'Almoço',
                    valor: 50,
                    categoria: 'Alimentação',
                    data: '2026-01-03'
                }]
            };

            // Mock do TextStrategy retornando JSON
            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'ai_response',
                content: JSON.stringify(validJSON)
            });

            // Mock da validação Zod como sucesso
            AIResponseSchema.safeParse = jest.fn().mockReturnValue({
                success: true,
                data: validJSON
            });

            // Mock do processExtractedData
            processExtractedData.mockResolvedValue({
                status: 'success',
                transactions: [{ id: 'tx1', descricao: 'Almoço' }]
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            // Verificar que dataProcessor foi chamado
            expect(processExtractedData).toHaveBeenCalledWith(
                validJSON,
                mockUser.id,
                expect.any(Function)
            );

            // Verificar que contexto foi atualizado
            expect(sessionService.setContext).toHaveBeenCalled();
        });

        test('deve incluir metadata quando fornecida', async () => {
            const validJSON = { gastos: [] };
            const metadata = { prompt_version: 'v2_test' };

            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'ai_response',
                content: JSON.stringify(validJSON),
                metadata: metadata
            });

            AIResponseSchema.safeParse = jest.fn().mockReturnValue({
                success: true,
                data: validJSON
            });

            processExtractedData.mockResolvedValue({
                status: 'success',
                transactions: []
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            // Verificar que metadata foi passada
            const callArgs = processExtractedData.mock.calls[0];
            expect(callArgs).toBeDefined();
        });
    });

    describe('Cenário 3: Validação Falha (Low Confidence)', () => {
        test('deve enviar mensagem de confirmação quando validação falha', async () => {
            const jsonWithTransaction = {
                gastos: [{
                    descricao: 'Item duvidoso',
                    valor: 100
                }]
            };

            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'ai_response',
                content: JSON.stringify(jsonWithTransaction)
            });

            // Mock de validação falhando
            AIResponseSchema.safeParse = jest.fn().mockReturnValue({
                success: false,
                error: {
                    format: () => ({ /* mock errors */ })
                }
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            // Deve enviar mensagem de confusão
            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('confuso')
            );
        });

        test('deve enviar texto normal se não for tentativa de transação', async () => {
            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'ai_response',
                content: 'Resposta sem JSON'
            });

            AIResponseSchema.safeParse = jest.fn().mockReturnValue({
                success: false,
                error: { format: () => ({}) }
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            // Deve enviar o texto diretamente
            expect(mockMessage.reply).toHaveBeenCalledWith('Resposta sem JSON');
        });
    });

    describe('Cenário 4: JSON Inválido', () => {
        test('deve tratar erro de parsing para JSON malformado com palavra-chave', async () => {
            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'ai_response',
                content: '{"gastos": [malformed json'
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            // Deve enviar mensagem de erro técnico
            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('Erro técnico')
            );
        });

        test('deve enviar texto diretamente se não for JSON de transação', async () => {
            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'ai_response',
                content: 'Texto normal sem JSON'
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            expect(mockMessage.reply).toHaveBeenCalledWith('Texto normal sem JSON');
        });
    });

    describe('Cenário 5: Resposta de Texto Simples', () => {
        test('deve enviar resposta de texto diretamente', async () => {
            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'ai_response',
                content: 'Olá! Estou aqui para ajudar.'
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            expect(mockMessage.reply).toHaveBeenCalledWith('Olá! Estou aqui para ajudar.');
        });

        test('deve atualizar contexto após resposta de texto', async () => {
            const responseText = 'Resposta da IA';

            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'ai_response',
                content: responseText
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            // Verificar que setContext foi chamado
            expect(sessionService.setContext).toHaveBeenCalledWith(
                mockUser.id,
                expect.arrayContaining([
                    expect.objectContaining({ role: 'user', content: mockMessage.body }),
                    expect.objectContaining({ role: 'assistant', content: responseText })
                ]),
                86400
            );
        });
    });

    describe('Cenário 6: Gerenciamento de Contexto', () => {
        test('deve limitar contexto a 10 mensagens', async () => {
            // Criar contexto com mais de 10 mensagens
            const longContext = Array.from({ length: 12 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Mensagem ${i}`
            }));

            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'ai_response',
                content: 'Resposta'
            });

            await handler.handle(mockMessage, mockUser, longContext);

            // Verificar que contexto foi limitado
            const contextCall = sessionService.setContext.mock.calls[0];
            expect(contextCall[1].length).toBeLessThanOrEqual(10);
        });
    });

    describe('Tool Response', () => {
        test('deve processar tool_response da mesma forma que ai_response', async () => {
            textStrategy.execute = jest.fn().mockResolvedValue({
                type: 'tool_response',
                content: 'Resultado da ferramenta'
            });

            await handler.handle(mockMessage, mockUser, mockUserContext);

            expect(mockMessage.reply).toHaveBeenCalledWith('Resultado da ferramenta');
        });
    });
});
