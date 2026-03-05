require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in prod.env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAuthUser(email) {
    const { data: usersData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError || !usersData?.users) {
        console.error("Failed to list Auth users:", authError);
        return null;
    }
    return usersData.users.find(u => u.email === email);
}

async function getOldProfile(userId) {
    const { data: oldProfile, error: oldError } = await supabase
        .from('perfis')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

    if (oldError) {
        console.error("-> Erro ao buscar em perfis:", oldError.message);
    } else {
        console.log("-> Encontrado em perfis! is_admin:", oldProfile.is_admin);
    }
    return oldProfile;
}

async function createNewProfile(user, oldProfile) {
    console.log("-> Perfil não existe na tabela nova. Criando agora...");
    const { error: insertError } = await supabase.from('profiles').insert([{
        id: user.id,
        email: user.email,
        is_admin: true,
        full_name: user.user_metadata?.full_name || 'Admin',
        whatsapp_numbers: oldProfile?.whatsapp_number ? [oldProfile.whatsapp_number] : []
    }]);
    if (insertError) {
        console.error("Falha ao criar profile:", insertError.message);
    } else {
        console.log("✅ Profile criado com sucesso como Admin!");
    }
}

async function updateExistingProfile(user, currentProfile, oldProfile) {
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

async function fixAdmin() {
    const targetEmail = 'luizantonio6677@gmail.com';
    console.log(`--- 1. Procurando usuário ${targetEmail} no Auth ---`);

    const user = await findAuthUser(targetEmail);
    if (!user) {
        console.error(`User ${targetEmail} not found in Auth system.`);
        return;
    }

    console.log("-> Encontrado! Auth ID:", user.id);

    console.log("--- 2. Buscando dados na tabela antiga 'perfis' ---");
    const oldProfile = await getOldProfile(user.id);

    console.log("--- 3. Verificando tabela nova 'profiles' ---");
    const { data: currentProfile, error: currentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (currentError && currentError.code === 'PGRST116') {
        await createNewProfile(user, oldProfile);
    } else if (currentProfile) {
        await updateExistingProfile(user, currentProfile, oldProfile);
    }
}

fixAdmin().catch(console.error);
