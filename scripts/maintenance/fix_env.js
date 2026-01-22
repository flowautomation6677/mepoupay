const fs = require('fs');

const envPath = '.env';
let content = '';

if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
}

console.log('Conteúdo atual:', content);

// Adiciona quebra de linha se não tiver no final
if (content && !content.endsWith('\n')) {
    content += '\n';
}

const supabaseUrl = 'SUPABASE_URL=https://okvizpzxcdxltqjmjruo.supabase.co';
const supabaseKey = 'SUPABASE_KEY=sb_publishable_RTZykzbfn-FLoWaggM6vyg_ZCfMm6v6';

// Verifica se já existe para não duplicar (embora dotenv pegue o primeiro, limpeza é bom)
if (!content.includes('SUPABASE_URL')) {
    content += supabaseUrl + '\n';
}
if (!content.includes('SUPABASE_KEY')) {
    content += supabaseKey + '\n';
}

fs.writeFileSync(envPath, content);
console.log('Arquivo .env atualizado com sucesso!');
