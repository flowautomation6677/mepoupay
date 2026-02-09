require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBackend() {
    console.log("🚀 Iniciando Verificação de Perfil (Debug WhatsApp)...");

    // Listar todos os usuários para ver o que temos
    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, whatsapp_numbers');

    if (error) {
        console.error("❌ Erro ao listar usuários:", error);
        return;
    }

    console.table(users);

    const targetUser = users.find(u => u.email && u.email.includes('joao'));
    if (targetUser) {
        console.log("\n👤 Usuário Alvo (Joao):", targetUser);
        console.log("📱 WhatsApp Numbers:", targetUser.whatsapp_numbers);
        console.log("   Is Array?", Array.isArray(targetUser.whatsapp_numbers));
        console.log("   Length:", targetUser.whatsapp_numbers?.length);
    } else {
        console.log("\n⚠️ Usuário 'joao' não encontrado.");
    }
}

verifyBackend();
