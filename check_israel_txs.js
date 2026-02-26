require('dotenv').config({ path: 'prod.env' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTxs() {
    const { data: anyTxs } = await supabase.from('transactions')
        .select('id, amount, description, created_at, user_id, profiles!inner(email, whatsapp_numbers)')
        .order('created_at', { ascending: false })
        .limit(20);

    fs.writeFileSync('clean_israel_txs.json', JSON.stringify(anyTxs, null, 2));
}

checkTxs();
