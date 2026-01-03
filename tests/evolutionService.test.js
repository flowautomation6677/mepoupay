// Mock axios antes de importar o service
jest.mock('axios');
const axios = require('axios');

// Agora importa o service que usa axios
const evolutionService = require('../src/services/evolutionService');

describe('EvolutionService', () => {
    let mockAxiosInstance;

    beforeEach(() => {
        // Cria mock da instância axios
        mockAxiosInstance = {
            post: jest.fn(),
            get: jest.fn()
        };

        // Configura axios.create para retornar nossa instância mockada
        axios.create.mockReturnValue(mockAxiosInstance);

        // Limpa os mocks antes de cada teste
        jest.clearAllMocks();
    });

    describe('sendText', () => {
        test('deve enviar mensagem de texto com sucesso', async () => {
            const mockResponse = {
                data: {
                    key: { id: 'msg123' },
                    status: 'sent'
                }
            };
            mockAxiosInstance.post.mockResolvedValue(mockResponse);

            const result = await evolutionService.sendText(
                '5511999999999@c.us',
                'Olá, teste!',
                'TestInstance'
            );

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/message/sendText/TestInstance',
                expect.objectContaining({
                    number: '5511999999999@c.us',
                    text: 'Olá, teste!',
                    delay: 1200,
                    linkPreview: false,
                    presence: 'composing'
                })
            );
            expect(result).toEqual(mockResponse.data);
        });

        test('deve usar instanceName padrão quando não fornecido', async () => {
            mockAxiosInstance.post.mockResolvedValue({ data: { status: 'sent' } });

            await evolutionService.sendText('5511999999999@c.us', 'Teste');

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                expect.stringContaining('FinanceBot_v3'),
                expect.any(Object)
            );
        });

        test('deve lançar erro quando API falha', async () => {
            const apiError = new Error('API Error');
            apiError.response = { data: { message: 'Unauthorized' } };
            mockAxiosInstance.post.mockRejectedValue(apiError);

            await expect(
                evolutionService.sendText('5511999999999@c.us', 'Teste')
            ).rejects.toThrow('API Error');
        });

        test('deve fazer URL encode do instanceName', async () => {
            mockAxiosInstance.post.mockResolvedValue({ data: {} });

            await evolutionService.sendText(
                '5511999999999@c.us',
                'Test',
                'Instance With Spaces'
            );

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                expect.stringContaining('Instance%20With%20Spaces'),
                expect.any(Object)
            );
        });
    });

    describe('sendMedia', () => {
        test('deve enviar imagem com sucesso', async () => {
            const media = {
                mimetype: 'image/jpeg',
                data: 'base64string',
                filename: 'photo.jpg',
                caption: 'Minha foto'
            };
            mockAxiosInstance.post.mockResolvedValue({ data: { status: 'sent' } });

            await evolutionService.sendMedia(
                '5511999999999@c.us',
                media,
                'TestInstance',
                'image'
            );

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/message/sendMedia/TestInstance',
                expect.objectContaining({
                    number: '5511999999999@c.us',
                    mediaMessage: expect.objectContaining({
                        mediatype: 'image',
                        caption: 'Minha foto',
                        media: 'base64string',
                        fileName: 'photo.jpg'
                    })
                })
            );
        });

        test('deve usar tipo padrão "document" quando não fornecido', async () => {
            const media = {
                data: 'base64',
                filename: 'file.pdf'
            };
            mockAxiosInstance.post.mockResolvedValue({ data: {} });

            await evolutionService.sendMedia('5511999999999@c.us', media);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    mediaMessage: expect.objectContaining({
                        mediatype: 'document'
                    })
                })
            );
        });

        test('deve usar caption vazia quando não fornecida', async () => {
            const media = {
                data: 'base64',
                filename: 'audio.mp3'
            };
            mockAxiosInstance.post.mockResolvedValue({ data: {} });

            await evolutionService.sendMedia(
                '5511999999999@c.us',
                media,
                undefined,
                'audio'
            );

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    mediaMessage: expect.objectContaining({
                        caption: ''
                    })
                })
            );
        });

        test('deve lançar erro ao falhar envio de mídia', async () => {
            const error = new Error('Media upload failed');
            mockAxiosInstance.post.mockRejectedValue(error);

            await expect(
                evolutionService.sendMedia('5511999999999@c.us', { data: 'test' })
            ).rejects.toThrow('Media upload failed');
        });
    });

    describe('checkConnection', () => {
        test('deve retornar true quando instância está conectada', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: {
                    instance: {
                        state: 'open'
                    }
                }
            });

            const result = await evolutionService.checkConnection();

            expect(result).toBe(true);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(
                expect.stringContaining('/instance/connectionState/')
            );
        });

        test('deve retornar false quando instância não está conectada', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: {
                    instance: {
                        state: 'close'
                    }
                }
            });

            const result = await evolutionService.checkConnection();

            expect(result).toBe(false);
        });

        test('deve retornar false quando API falha', async () => {
            mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

            const result = await evolutionService.checkConnection();

            expect(result).toBe(false);
        });

        test('deve retornar false quando resposta não tem estado', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: {}
            });

            const result = await evolutionService.checkConnection();

            expect(result).toBe(false);
        });
    });

    describe('getBase64FromMedia', () => {
        test('deve obter base64 de mídia com sucesso', async () => {
            const messageObject = {
                key: { id: 'msg123' },
                message: { imageMessage: {} }
            };
            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    base64: 'base64encodeddata'
                }
            });

            const result = await evolutionService.getBase64FromMedia(messageObject);

            expect(result).toBe('base64encodeddata');
            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                expect.stringContaining('/chat/getBase64FromMediaMessage/'),
                expect.objectContaining({
                    message: messageObject,
                    convertToMp4: false
                })
            );
        });

        test('deve usar instanceName customizado', async () => {
            mockAxiosInstance.post.mockResolvedValue({
                data: { base64: 'data' }
            });

            await evolutionService.getBase64FromMedia({}, 'CustomInstance');

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                expect.stringContaining('CustomInstance'),
                expect.any(Object)
            );
        });

        test('deve retornar null quando API falha', async () => {
            mockAxiosInstance.post.mockRejectedValue(new Error('Failed'));

            const result = await evolutionService.getBase64FromMedia({});

            expect(result).toBeNull();
        });
    });
});
