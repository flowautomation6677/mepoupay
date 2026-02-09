require('dotenv').config();
const UserRepository = require('../src/repositories/UserRepository');

async function verifyBackend() {
    console.log("🚀 Iniciando Verificação do Backend (UserRepository)...");

    const testPhone = '5511999999999'; // Número de teste
    const testName = 'Backend Tester';

    try {
        // 1. Tentar criar usuário
        console.log(`\n1. Testando User.create(${testPhone})...`);
        const newUser = await UserRepository.create(testPhone, testName);
        console.log("✅ Usuário criado:", newUser.id);
        console.log("   Whatsapp Numbers:", newUser.whatsapp_numbers);

        if (!newUser.whatsapp_numbers || !newUser.whatsapp_numbers.includes(testPhone)) {
            console.error("❌ ERRO: Número não salvo corretamente no array.");
        }

        // 2. Tentar buscar usuário
        console.log(`\n2. Testando User.findByPhone(${testPhone})...`);
        const foundUser = await UserRepository.findByPhone(testPhone);

        if (foundUser && foundUser.id === newUser.id) {
            console.log("✅ Usuário encontrado com sucesso pelo número.");
        } else {
            console.error("❌ ERRO: Usuário não encontrado ou ID incorreto.");
            console.log("   Encontrado:", foundUser);
        }

        // 3. Limpeza
        console.log("\n3. Deletando usuário de teste...");
        await UserRepository.delete(newUser.id);
        console.log("✅ Limpeza concluída.");

    } catch (error) {
        console.error("❌ ERRO NO TESTE:", error);
    }
}

verifyBackend();
