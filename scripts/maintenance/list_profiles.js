const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from root
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log("🔍 Listing ALL Profiles in 'perfis'...");

    const { data: profiles, error } = await supabase
        .from('perfis')
        .select('*');

    if (error) {
        console.error("Error fetching profiles:", error.message);
    } else {
        console.log(`Found ${profiles.length} profiles:`);
        profiles.forEach(p => {
            console.log(`\n------------------------------------------------`);
            console.log(`ID: ${p.id}`);
            console.log(`Name: ${p.name || 'N/A'}`);
            console.log(`Phone: ${p.whatsapp_number || 'N/A'}`);
            console.log(`Auth User ID: ${p.auth_user_id || 'NULL (<-- ORPHAN)'}`);
            console.log(`Created At: ${p.created_at}`);
        });
    }

})();
