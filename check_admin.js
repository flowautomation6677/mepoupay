require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAdminCol() {
    const { data, error } = await supabase.from('profiles').select('is_admin').limit(1);
    if (error) {
        console.error("Column check error:", error);
    } else {
        console.log("Success! Data:", data);
    }
}
checkAdminCol();
