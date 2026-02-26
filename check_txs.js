require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTransactions() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));

    const phoneUserQuery = await supabase.from('profiles').select('*').contains('whatsapp_numbers', ['5528998822081']).single();
    console.log("Phone user lookup:", phoneUserQuery.data);
}
inspectTransactions();
