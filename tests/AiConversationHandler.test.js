const {
    _parseAIResponse,
    _handleHITL,
    _processTransactionData
} = require('../src/handlers/AiConversationHandler');

describe('AiConversationHandler - Helper Functions', () => {
    describe('_parseAIResponse', () => {
        test('deve extrair JSON de texto com prefixo', () => {
            const text = 'Aqui está a resposta: {"gastos": []}';
            const result = _parseAIResponse(text);
            expect(result).toBe('{"gastos": []}');
        });

        test('deve extrair JSON de texto com prefixo e sufixo', () => {
            const text = 'Veja: {"resultado": "ok"} - Fim';
            const result = _parseAIResponse(text);
            expect(result).toBe('{"resultado": "ok"}');
        });

        test('deve retornar texto completo se for JSON puro', () => {
            const text = '{"data": "value"}';
            const result = _parseAIResponse(text);
            expect(result).toBe('{"data": "value"}');
        });

        test('deve retornar texto original se não houver JSON', () => {
            const text = 'Apenas texto sem JSON';
            const result = _parseAIResponse(text);
            expect(result).toBe('Apenas texto sem JSON');
        });

        test('deve extrair primeiro JSON se houver múltiplos', () => {
            const text = 'Primeiro: {"a": 1} Segundo: {"b": 2}';
            const result = _parseAIResponse(text);
            expect(result).toBe('{"a": 1} Segundo: {"b": 2}');
        });

        test('deve lidar com JSON aninhado complexo', () => {
            const text = 'Resposta: {"gastos": [{"desc": "item"}]} OK';
            const result = _parseAIResponse(text);
            expect(result).toBe('{"gastos": [{"desc": "item"}]}');
        });
    });

    describe('_handleHITL', () => {
        let mockMessage, mockUser, mockSessionService;

        beforeEach(() => {
            // Mock do sessionService
            mockSessionService = {
                setPendingCorrection: jest.fn().mockResolvedValue(true)
            };
            // Substituir módulo mockado
            jest.mock('../src/services/sessionService', () => mockSessionService);

            mockMessage = {
                reply: jest.fn().mockResolvedValue(true)
            };

            mockUser = {
                id: 'user123'
            };
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test('não deve acionar HITL se resultado não for pending_review', async () => {
            const processingResult = { status: 'success' };
            const result = await _handleHITL(processingResult, {}, 'content', mockUser, mockMessage);

            expect(result).toBe(false);
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('deve acionar HITL com pending_review', async () => {
            const processingResult = {
                status: 'pending_review',
                confidence: 0.65,
                transactions: [{
                    id: 'tx1',
                    descricao: 'Café',
                    valor: 12.50
                }]
            };

            const validationData = { gastos: [] };
            const content = 'Gastei 12,50 no café';

            const result = await _handleHITL(processingResult, validationData, content, mockUser, mockMessage);

            expect(result).toBe(true);
            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('Fiquei na dúvida')
            );
            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('Café')
            );
            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('R$ 12.50')
            );
        });
    });

    describe('_processTransactionData', () => {
        let mockMessage, mockUser, mockProcessExtractedData;

        beforeEach(() => {
            mockProcessExtractedData = jest.fn().mockResolvedValue({
                status: 'success',
                transactions: []
            });

            jest.mock('../src/services/dataProcessor', () => ({
                processExtractedData: mockProcessExtractedData
            }));

            mockMessage = {
                reply: jest.fn().mockResolvedValue(true)
            };

            mockUser = {
                id: 'user456'
            };
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test('deve processar dados de transação com prompt_version padrão', async () => {
            const validation = {
                data: {
                    gastos: [{
                        descricao: 'Almoço',
                        valor: 35.00
                    }]
                }
            };

            const content = 'Almocei e gastei 35';
            const responseMetadata = undefined;

            await _processTransactionData(validation, mockUser, mockMessage, content, responseMetadata);

            expect(mockProcessExtractedData).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt_version: 'v1_stable'
                }),
                mockUser.id,
                expect.any(Function)
            );
        });

        test('deve processar dados com prompt_version customizado', async () => {
            const validation = {
                data: {
                    gastos: []
                }
            };

            const responseMetadata = {
                prompt_version: 'v2_experimental'
            };

            await _processTransactionData(validation, mockUser, mockMessage, 'test', responseMetadata);

            expect(mockProcessExtractedData).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt_version: 'v2_experimental'
                }),
                mockUser.id,
                expect.any(Function)
            );
        });
    });
});
