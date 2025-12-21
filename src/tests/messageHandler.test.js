/* eslint-disable no-undef */
// 🧪 Testes Unitários para messageHandler.js
// Framework sugerido: Jest (`npm install --save-dev jest`)

// --- MOCKS ---
const mockMessage = {
    from: '5511999999999@c.us',
    body: 'Teste 123',
    reply: jest.fn(),
    hasMedia: false,
    type: 'chat'
};

// Mocks dos módulos importados
jest.mock('../repositories/UserRepository', () => ({
    findByPhone: jest.fn(),
    create: jest.fn()
}));

jest.mock('../strategies/ImageStrategy', () => ({
    execute: jest.fn()
}));

jest.mock('../strategies/TextStrategy', () => ({
    execute: jest.fn()
}));

// Importação do handler APÓS os mocks
const { handleMessage } = require('../handlers/messageHandler');
const userRepo = require('../repositories/UserRepository');
const imageStrategy = require('../strategies/ImageStrategy');
const textStrategy = require('../strategies/TextStrategy');

describe('MessageHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve criar usuário se não existir', async () => {
        userRepo.findByPhone.mockResolvedValue(null);
        userRepo.create.mockResolvedValue({ id: 1, whatsapp_number: mockMessage.from });

        await handleMessage(mockMessage);

        expect(userRepo.create).toHaveBeenCalledWith(mockMessage.from);
    });

    test('Deve processar mensagem de TEXTO chamando TextStrategy', async () => {
        userRepo.findByPhone.mockResolvedValue({ id: 1 });
        userRepo.create.mockResolvedValue(null); // Não deve chamar

        // Mock do retorno da strategy
        textStrategy.execute.mockResolvedValue({ type: 'ai_response', content: 'Olá!' });

        await handleMessage(mockMessage);

        expect(textStrategy.execute).toHaveBeenCalled();
        expect(mockMessage.reply).toHaveBeenCalledWith('Olá!');
    });

    test('Deve processar mensagem de IMAGEM chamando ImageStrategy', async () => {
        userRepo.findByPhone.mockResolvedValue({ id: 1 });
        const imgMessage = { ...mockMessage, hasMedia: true, type: 'image' };

        imageStrategy.execute.mockResolvedValue(null); // Strategy assume resposta

        await handleMessage(imgMessage);

        expect(imageStrategy.execute).toHaveBeenCalledWith(imgMessage);
    });

    test('Deve lidar com erro fatal graciosamente', async () => {
        userRepo.findByPhone.mockRejectedValue(new Error("DB Down"));

        console.error = jest.fn(); // Silencia console.error

        await handleMessage(mockMessage);

        expect(console.error).toHaveBeenCalled();
        // Em um cenário real, talvez o bot devesse responder "Erro interno"
    });
});
