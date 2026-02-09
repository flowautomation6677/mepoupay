const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log("🔍 Inspecting table 'perfis'...");

    // Attempt to select a single row to see keys
    const { data, error } = await supabase.from('perfis').select('*').limit(1);

    if (error) {
        console.error("Error accessing perfis:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("✅ Columns found in 'perfis':");
        console.log(JSON.stringify(Object.keys(data[0]), null, 2));
    } else {
        console.log("⚠️ Table 'perfis' is empty, cannot infer columns from data.");
    }
}

inspectTable();
