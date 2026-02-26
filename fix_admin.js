require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in prod.env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdmin() {
    console.log("--- 1. Procurando usuário luizantonio6677@gmail.com no Auth ---");
    const { data: usersData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !usersData?.users) {
        console.error("Failed to list Auth users:", authError);
        return;
    }

    const user = usersData.users.find(u => u.email === 'luizantonio6677@gmail.com');
    if (!user) {
        console.error("User luizantonio6677@gmail.com not found in Auth system.");
        return;
    }

    console.log("-> Encontrado! Auth ID:", user.id);

    console.log("--- 2. Buscando dados na tabela antiga 'perfis' ---");
    const { data: oldProfile, error: oldError } = await supabase
        .from('perfis')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

    if (oldError) {
        console.error("-> Erro ao buscar em perfis:", oldError.message);
        // Don't exit, maybe we just need to set is_admin to true in profiles directly
    } else {
        console.log("-> Encontrado em perfis! is_admin:", oldProfile.is_admin);
    }

    console.log("--- 3. Verificando tabela nova 'profiles' ---");
    const { data: currentProfile, error: currentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (currentError && currentError.code === 'PGRST116') {
        console.log("-> Perfil não existe na tabela nova. Criando agora...");
        // Have to create it
        const { error: insertError } = await supabase.from('profiles').insert([{
            id: user.id,
            email: user.email,
            is_admin: true,
            full_name: user.user_metadata?.full_name || 'Admin',
            whatsapp_numbers: oldProfile?.whatsapp_number ? [oldProfile.whatsapp_number] : []
        }]);
        if (insertError) console.error("Falha ao criar profile:", insertError.message);
        else console.log("✅ Profile criado com sucesso como Admin!");
    } else if (currentProfile) {
        console.log("-> Perfil já existe na tabela nova. Atualizando permissão para is_admin = true...");
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', user.id);

        if (updateError) console.error("Falha ao atualizar profile:", updateError.message);
        else console.log("✅ Permissão de admin concedida ao usuário luizantonio6677@gmail.com na nova tabela 'profiles'!");

        // Fix WhatsApp Numbers if empty
        if (!currentProfile.whatsapp_numbers || currentProfile.whatsapp_numbers.length === 0) {
            if (oldProfile?.whatsapp_number) {
                await supabase.from('profiles').update({ whatsapp_numbers: [oldProfile.whatsapp_number] }).eq('id', user.id);
                console.log("✅ Número de WhatsApp migrado com sucesso.");
            }
        }
    }
}

fixAdmin();
