// Mock das dependências
jest.mock('../../src/services/queueService');

const MediaHandler = require('../../src/handlers/MediaHandler');
const queueService = require('../../src/services/queueService');

describe('MediaHandler - handle() Integration Tests', () => {
    let handler;
    let mockMessage;
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();

        handler = new MediaHandler();

        mockUser = {
            id: 'user-test-456',
            whatsapp_id: '5511888888888@c.us'
        };

        // Mock padrão do queueService
        queueService.addJob = jest.fn().mockResolvedValue({
            id: 'job-123',
            status: 'queued'
        });
    });

    describe('Cenário 1: Processamento de Imagem', () => {
        test('deve processar imagem e adicionar job PROCESS_IMAGE', async () => {
            mockMessage = {
                type: 'image',
                hasMedia: true,
                _data: { size: 1024 * 1024 }, // 1MB
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'image/jpeg',
                    data: Buffer.from('fakeimagedata'),
                    filename: 'photo.jpg'
                }),
                reply: jest.fn()
            };

            const result = await handler.handle(mockMessage, mockUser);

            expect(result).toBe(true);
            expect(queueService.addJob).toHaveBeenCalledWith(
                'PROCESS_IMAGE',
                expect.objectContaining({
                    userId: mockUser.id,
                    media: expect.objectContaining({
                        mimetype: 'image/jpeg'
                    })
                })
            );
        });
    });

    describe('Cenário 2: Processamento de Áudio/PTT', () => {
        test('deve processar PTT e adicionar job PROCESS_AUDIO', async () => {
            mockMessage = {
                type: 'ptt',
                hasMedia: true,
                _data: { size: 500 * 1024 }, // 500KB
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'audio/ogg',
                    data: Buffer.from('fakeaudiodata'),
                    filename: 'audio.ogg'
                }),
                reply: jest.fn()
            };

            await handler.handle(mockMessage, mockUser);

            expect(queueService.addJob).toHaveBeenCalledWith(
                'PROCESS_AUDIO',
                expect.any(Object)
            );
        });

        test('deve processar áudio normal', async () => {
            mockMessage = {
                type: 'audio',
                hasMedia: true,
                _data: { size: 2 * 1024 * 1024 }, // 2MB
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'audio/mp3',
                    data: Buffer.from('mp3data'),
                    filename: 'song.mp3'
                }),
                reply: jest.fn()
            };

            await handler.handle(mockMessage, mockUser);

            expect(queueService.addJob).toHaveBeenCalledWith(
                'PROCESS_AUDIO',
                expect.any(Object)
            );
        });
    });

    describe('Cenário 3: Documentos (PDF, OFX, CSV, Excel)', () => {
        test('deve processar documento PDF', async () => {
            mockMessage = {
                type: 'document',
                hasMedia: true,
                _data: { size: 3 * 1024 * 1024 }, // 3MB
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'application/pdf',
                    data: Buffer.from('pdfdata'),
                    filename: 'invoice.pdf'
                }),
                reply: jest.fn(),
                body: ''
            };

            await handler.handle(mockMessage, mockUser);

            expect(queueService.addJob).toHaveBeenCalledWith(
                'PROCESS_PDF',
                expect.any(Object)
            );
        });

        test('deve processar arquivo OFX', async () => {
            mockMessage = {
                type: 'document',
                hasMedia: true,
                _data: { size: 100 * 1024 }, // 100KB
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'text/plain',
                    data: Buffer.from('ofxdata'),
                    filename: 'statement.ofx'
                }),
                reply: jest.fn(),
                body: ''
            };

            await handler.handle(mockMessage, mockUser);

            expect(queueService.addJob).toHaveBeenCalledWith(
                'PROCESS_OFX',
                expect.any(Object)
            );
        });

        test('deve processar arquivo CSV', async () => {
            mockMessage = {
                type: 'document',
                hasMedia: true,
                _data: { size: 200 * 1024 },
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'text/csv',
                    data: Buffer.from('csvdata'),
                    filename: 'export.csv'
                }),
                reply: jest.fn(),
                body: ''
            };

            await handler.handle(mockMessage, mockUser);

            expect(queueService.addJob).toHaveBeenCalledWith(
                'PROCESS_CSV',
                expect.any(Object)
            );
        });

        test('deve processar planilha Excel', async () => {
            mockMessage = {
                type: 'document',
                hasMedia: true,
                _data: { size: 1.5 * 1024 * 1024 },
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    data: Buffer.from('exceldata'),
                    filename: 'data.xlsx'
                }),
                reply: jest.fn(),
                body: ''
            };

            await handler.handle(mockMessage, mockUser);

            expect(queueService.addJob).toHaveBeenCalledWith(
                'PROCESS_XLSX',
                expect.any(Object)
            );
        });
    });

    describe('Cenário 4: Arquivo Muito Grande', () => {
        test('deve rejeitar arquivo maior que 15MB', async () => {
            mockMessage = {
                type: 'document',
                hasMedia: true,
                _data: { size: 20 * 1024 * 1024 }, // 20MB
                reply: jest.fn(),
                body: ''
            };

            const result = await handler.handle(mockMessage, mockUser);

            expect(result).toBe(true);
            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('muito grande')
            );
            expect(queueService.addJob).not.toHaveBeenCalled();
        });
    });

    describe('Cenário 5: Falha no Download', () => {
        test('deve tratar erro quando download retorna null', async () => {
            mockMessage = {
                type: 'image',
                hasMedia: true,
                _data: { size: 1024 * 1024 },
                downloadMedia: jest.fn().mockResolvedValue(null),
                reply: jest.fn()
            };

            await handler.handle(mockMessage, mockUser);

            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('Não consegui baixar')
            );
            expect(queueService.addJob).not.toHaveBeenCalled();
        });

        test('deve tratar erro quando downloadMedia lança exceção', async () => {
            mockMessage = {
                type: 'image',
                hasMedia: true,
                _data: { size: 1024 * 1024 },
                downloadMedia: jest.fn().mockRejectedValue(new Error('Download failed')),
                reply: jest.fn()
            };

            await handler.handle(mockMessage, mockUser);

            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('erro')
            );
        });
    });

    describe('Cenário 6: Tipo Não Suportado', () => {
        test('deve retornar false para tipo de mensagem não suportado', async () => {
            mockMessage = {
                type: 'sticker',
                hasMedia: true,
                _data: { size: 50 * 1024 },
                reply: jest.fn()
            };

            const result = await handler.handle(mockMessage, mockUser);

            expect(result).toBe(false);
            expect(queueService.addJob).not.toHaveBeenCalled();
        });

        test('deve retornar false para documento de tipo desconhecido', async () => {
            mockMessage = {
                type: 'document',
                hasMedia: true,
                _data: { size: 1024 * 1024 },
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'application/zip',
                    data: Buffer.from('zipdata'),
                    filename: 'archive.zip'
                }),
                reply: jest.fn(),
                body: ''
            };

            const result = await handler.handle(mockMessage, mockUser);

            expect(result).toBe(false);
            expect(queueService.addJob).not.toHaveBeenCalled();
        });
    });

    describe('Cenário 7: Mensagem Sem Mídia', () => {
        test('deve retornar false se hasMedia for false', async () => {
            mockMessage = {
                type: 'image',
                hasMedia: false,
                reply: jest.fn()
            };

            const result = await handler.handle(mockMessage, mockUser);

            expect(result).toBe(false);
        });
    });
});
