require('dotenv').config({ path: 'web-dashboard/.env.local' });
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    console.error('❌ Erro: RESEND_API_KEY não encontrado em web-dashboard/.env.local');
    process.exit(1);
}

console.log(`🔑 Usando API Key: ${apiKey.substring(0, 5)}...`);

const resend = new Resend(apiKey);

console.log('🔄 Tentando enviar email...');
try {
    const data = await resend.emails.send({
        from: 'Me Poupey <nao-responda@mepoupay.app.br>',
        to: 'iacriasite@gmail.com', // Trying a likely real email or self
        subject: `Teste de Envio - Me Poupey - ${new Date().toLocaleTimeString('pt-BR')}`,
        html: `
            <h1>Teste de Verificação ✅</h1>
            <p>Este é um teste enviado às ${new Date().toLocaleTimeString('pt-BR')}.</p>
            <p>Se você recebeu isso, a configuração está 100% correta! 🚀</p>
        `
    });
    console.log('📨 Resposta da API:', JSON.stringify(data, null, 2));


    if (data.error) {
        console.error('❌ Erro da API do Resend:', data.error);
    } else {
        console.log('✅ Email enviado com sucesso!', data);
    }
} catch (error) {
    console.error('❌ Erro ao executar envio:', error);
}
