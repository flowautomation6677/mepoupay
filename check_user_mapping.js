const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from root
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Service Role key preferred if available, else Anon

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const authUserId = 'd8e7bc3e-6f8f-497c-963f-f3228cd11a86';

    console.log(`🔍 Checking Profile for Auth User: ${authUserId}`);

    // Check 'perfis' table
    const { data: profile, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

    if (error) {
        console.error("Error fetching profile:", error.message);
    } else {
        console.log("✅ Profile Found linked to Auth User:", profile);

        // Check transactions for this profile
        if (profile) {
            const { data: txs, error: txError } = await supabase
                .from('transacoes')
                .select('count')
                .eq('user_id', profile.id);

            if (txError) {
                console.error("Error fetching transactions:", txError.message);
            } else {
                console.log("📦 Transactions Linked to Dashboard User:", txs.length);
            }
        }
    }
})();
