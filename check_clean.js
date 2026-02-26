require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.from('transactions')
        .select('id, user_id, amount, description, date, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
    console.table(data);
}
check();
