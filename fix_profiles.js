const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // 1. The Auth User ID we want to move
    const AUTH_USER_ID = 'd8e7bc3e-6f8f-497c-963f-f3228cd11a86';

    // 2. The Old Profile (currently holding the Auth ID)
    const OLD_PROFILE_ID = 'f7e866bb-3980-40e5-8b8a-54b8e70f380d';

    // 3. The New Active Profile (Orphan, but has the data)
    const NEW_PROFILE_ID = '436831a5-37e2-46af-87d6-3e6c02f5d2a1';

    console.log("🔄 Starting Profile Migration...");

    // Step A: Detach Auth User from Old Profile
    console.log(`\nUnlinking Auth ID from Old Profile (${OLD_PROFILE_ID})...`);
    const { error: unlinkError } = await supabase
        .from('perfis')
        .update({ auth_user_id: null })
        .eq('id', OLD_PROFILE_ID);

    if (unlinkError) {
        console.error("❌ Failed to unlink:", unlinkError.message);
        return;
    }
    console.log("✅ Old Profile Unlinked.");

    // Step B: Attach Auth User to New Profile
    console.log(`\nLinking Auth ID to New Profile (${NEW_PROFILE_ID})...`);
    const { error: linkError } = await supabase
        .from('perfis')
        .update({ auth_user_id: AUTH_USER_ID })
        .eq('id', NEW_PROFILE_ID);

    if (linkError) {
        console.error("❌ Failed to link:", linkError.message);
        // Rollback attempt? Manual intervention needed if this fails.
    } else {
        console.log("✅ New Profile Linked Successfully!");
        console.log("🚀 Run checking script again to verify.");
    }

})();
