require('dotenv').config({ path: 'prod.env' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkShadowProfile() {
    const numbersToCheck = ['55219977186221', '5521977186221'];
    const result = { profiles: [], latest_txs: [] };

    // 1. Find ANY profile that has either of these numbers
    for (const num of numbersToCheck) {
        const { data: profs } = await supabase.from('profiles')
            .select('id, email, whatsapp_numbers')
            .contains('whatsapp_numbers', [num]);
        if (profs && profs.length > 0) {
            result.profiles.push(...profs);
        }
    }

    // 2. See if there are any transactions recently strictly where user_id matches
    if (result.profiles.length > 0) {
        const ids = result.profiles.map(p => p.id);
        const { data: txs } = await supabase.from('transactions')
            .select('id, amount, description, created_at, user_id')
            .in('user_id', ids)
            .order('created_at', { ascending: false })
            .limit(10);

        result.latest_txs = txs;
    }

    console.log(JSON.stringify(result, null, 2));
}

checkShadowProfile();
