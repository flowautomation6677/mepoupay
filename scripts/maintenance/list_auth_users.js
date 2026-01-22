const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Must be SERVICE_ROLE key to list users

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log("🔍 Listing Auth Users...");

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error.message);
        return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
        console.log(`- ${u.email} | ID: ${u.id} | Phone: ${u.phone || 'N/A'}`);
    });

    const specificProfileId = '436831a5-37e2-46af-87d6-3e6c02f5d2a1';
    console.log(`\nChecking Profile ${specificProfileId}...`);
    const { data: profile } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', specificProfileId)
        .single();

    console.log("Profile:", profile);

})();
