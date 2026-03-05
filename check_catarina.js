require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const catarina = data?.users?.find(u =>
        u.user_metadata?.whatsapp?.includes('61996761655') ||
        u.user_metadata?.whatsapp === '5561996761655'
    );
    if (!catarina) { console.log('AUTH USER NOT FOUND'); return; }
    console.log('AUTH USER:', catarina.email, catarina.id, catarina.created_at);

    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', catarina.id).single();
    if (error) console.log('PROFILE ERROR:', error.message, error.code);
    else console.log('PROFILE:', JSON.stringify(profile, null, 2));

    const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', catarina.id);
    console.log('ACCOUNTS:', JSON.stringify(accounts));
}
check().catch(console.error);
