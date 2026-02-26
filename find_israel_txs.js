require('dotenv').config({ path: 'prod.env' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findIsraelTxs() {

    // Find all profiles that have his phone number (with or without 9)
    const { data: profiles } = await supabase.from('profiles').select('id, email, whatsapp_numbers')
        .or('whatsapp_numbers.cs.{"5521977186221"},whatsapp_numbers.cs.{"55219977186221"}');

    console.log("Profiles matching Israel's phones:", profiles);

    if (profiles && profiles.length > 0) {
        const profileIds = profiles.map(p => p.id);
        const { data: txs } = await supabase.from('transactions').select('*').in('user_id', profileIds);
        console.log(`Found ${txs ? txs.length : 0} total transactions across these profiles.`);
    }

    // Now let's just search the last 100 transactions to see if there are other profiles we missed
    const { data: recentTxs } = await supabase.from('transactions')
        .select('id, created_at, user_id, profiles!inner(email, whatsapp_numbers)')
        .order('created_at', { ascending: false })
        .limit(100);

    const uniqueSenders = new Set();
    recentTxs.forEach(t => {
        if (t.profiles && t.profiles.whatsapp_numbers) {
            uniqueSenders.add(t.profiles.whatsapp_numbers[0]);
        }
    });

    console.log("Unique senders in last 100 transactions:", Array.from(uniqueSenders));
}

findIsraelTxs();
