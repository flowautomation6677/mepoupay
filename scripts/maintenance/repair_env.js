const fs = require('fs');

const envPath = '.env';

try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n'); // ou \r\n

    // Procura a linha da OpenAI (geralmente a primeira, ou filtro por startsWith)
    let openaiLine = lines.find(line => line.trim().startsWith('OPENAI_API_KEY='));

    if (!openaiLine) {
        console.error('ERRO: Não encontrei a linha OPENAI_API_KEY no arquivo .env!');
        // Fallback: Tenta salvar o que tem na primeira linha se não estiver vazio
        if (lines[0] && lines[0].trim().length > 10) {
            openaiLine = lines[0].trim();
        }
    }

    if (!openaiLine) {
        console.error('FALHA TOTAL: Não consegui recuperar a chave OpenAI. Não vou alterar o arquivo.');
        process.exit(1);
    }

    // Limpa caracteres estranhos que possam ter vindo do erro do PowerShell
    openaiLine = openaiLine.trim();

    const newContent = `${openaiLine}
SUPABASE_URL=https://okvizpzxcdxltqjmjruo.supabase.co
SUPABASE_KEY=sb_publishable_RTZykzbfn-FLoWaggM6vyg_ZCfMm6v6
`;

    fs.writeFileSync(envPath, newContent);
    console.log('Arquivo .env REPARADO com sucesso!');
    console.log('Conteúdo salvo (chaves ocultas):');
    console.log('Linha 1:', openaiLine.substring(0, 20) + '...');
    console.log('Linha 2: SUPABASE_URL=...');
    console.log('Linha 3: SUPABASE_KEY=...');

} catch (err) {
    console.error('Erro ao ler/gravar:', err);
}
