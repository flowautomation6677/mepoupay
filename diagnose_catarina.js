require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnose() {
    const PHONE = '61996761655';

    console.log('=== DIAGNÓSTICO COMPLETO - CATARINA ===\n');

    // 1. Find auth user
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) { console.error('ERRO listUsers:', listErr.message); return; }

    const catarina = users.find(u =>
        u.user_metadata?.whatsapp?.includes(PHONE) ||
        u.email?.toLowerCase().includes('catarina')
    );

    if (!catarina) {
        console.log('❌ USUÁRIO NÃO ENCONTRADO no Auth!');
        console.log('Últimos 10 usuários criados:');
        const last10 = users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
        last10.forEach(u => console.log(`  ${u.email} | ${u.created_at} | wpp: ${u.user_metadata?.whatsapp}`));
        return;
    }

    console.log('--- AUTH USER ---');
    console.log('Email:', catarina.email);
    console.log('ID:', catarina.id);
    console.log('Created:', catarina.created_at);
    console.log('Confirmed:', catarina.email_confirmed_at);
    console.log('Metadata:', JSON.stringify(catarina.user_metadata));
    console.log('Last sign in:', catarina.last_sign_in_at);

    // 2. Check profiles table
    console.log('\n--- TABELA profiles ---');
    const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', catarina.id)
        .single();

    if (profErr) {
        console.log('❌ PROFILE NÃO EXISTE:', profErr.message, '| code:', profErr.code);
    } else {
        console.log('✅ Profile encontrado:');
        console.log(JSON.stringify(profile, null, 2));
    }

    // 3. Check perfis (legacy)
    console.log('\n--- TABELA perfis (legada) ---');
    const { data: oldProfile, error: oldErr } = await supabase
        .from('perfis')
        .select('*')
        .contains('whatsapp_number', PHONE);

    if (oldErr || !oldProfile?.length) {
        // try by auth_user_id
        const { data: byId } = await supabase
            .from('perfis')
            .select('*')
            .eq('auth_user_id', catarina.id);
        console.log('Por auth_user_id:', byId?.length ? JSON.stringify(byId, null, 2) : 'NADA');
    } else {
        console.log(JSON.stringify(oldProfile, null, 2));
    }

    // 4. Check accounts
    console.log('\n--- ACCOUNTS ---');
    const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', catarina.id);
    console.log(accs?.length ? JSON.stringify(accs, null, 2) : '❌ Sem contas');

    // 5. Check supa_invites
    console.log('\n--- INVITE STATUS ---');
    const { data: inv } = await supabase.from('supa_invites').select('*').eq('email', catarina.email);
    console.log(inv?.length ? JSON.stringify(inv, null, 2) : 'Sem convite');
}

diagnose().catch(console.error);
