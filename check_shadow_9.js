require('dotenv').config({ path: 'prod.env' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkShadowProfileWith9() {
    const numberToCheck = '55219977186221';
    const result = { profiles: [], latest_txs: [] };

    console.log(`Checking for number: ${numberToCheck}`);

    // 1. Find ANY profile that has this number
    const { data: profs, error: profErr } = await supabase.from('profiles')
        .select('id, email, whatsapp_numbers')
        .contains('whatsapp_numbers', [numberToCheck]);

    if (profErr) {
        console.error("Profile query error:", profErr);
    }

    if (profs && profs.length > 0) {
        result.profiles.push(...profs);
        console.log(`Found ${profs.length} profiles matching the number.`);
    } else {
        console.log(`No profiles found for number ${numberToCheck}`);
    }

    // 2. See if there are any transactions recently strictly where user_id matches
    if (result.profiles.length > 0) {
        const ids = result.profiles.map(p => p.id);
        const { data: txs, error: txErr } = await supabase.from('transactions')
            .select('id, amount, description, created_at, user_id')
            .in('user_id', ids)
            .order('created_at', { ascending: false })
            .limit(10);

        if (txErr) {
            console.error("Transaction query error:", txErr);
        }

        if (txs) {
            result.latest_txs = txs;
            console.log(`Found ${txs.length} transactions for these profiles.`);
        }
    }

    // Export to JSON for safe reading
    fs.writeFileSync('check_shadow_with_9.json', JSON.stringify(result, null, 2));
    console.log("Results written to check_shadow_with_9.json");
}

checkShadowProfileWith9();
