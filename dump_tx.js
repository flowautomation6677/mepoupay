require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
async function test() {
    const tx = await supabase.from('transactions').select('*').limit(1);
    require('fs').writeFileSync('tx_debug.json', JSON.stringify(tx.data, null, 2));
}
test();
