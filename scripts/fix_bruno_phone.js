const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../prod.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Connecting to: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in environment.");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function forceCreateBruno() {
    console.log("Forcing creation of Bruno's profile (brunopaiva055@gmail.com)...");

    const email = 'brunopaiva055@gmail.com';
    const password = 'Password@123!';
    const name = 'Bruno Paiva';
    const formattedPhone = '556183031031';

    // 1. Create User in Auth
    console.log("Creating user in Supabase Auth...");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: name,
            whatsapp: formattedPhone
        }
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log("User already exists in Auth, trying to fetch ID...");
            // Alternative: we could fetch the ID if we really need to recover it
        } else {
            console.error("Auth Create Error:", authError);
            return;
        }
    }

    const userId = authUser?.user?.id;

    if (!userId) {
        console.error("Could not obtain User ID.");
        return;
    }

    // 2. Insert into Profiles
    console.log(`Inserting into Profiles with ID: ${userId}...`);
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: userId,
            email: email,
            full_name: name,
            whatsapp_numbers: [formattedPhone]
        });

    if (profileError) {
        console.error("Failed to insert profile:", profileError);
    } else {
        console.log("Profile created successfully!");
    }

    // 3. Create initial account
    console.log("Creating initial 'Conta Principal'...");
    const { error: accountError } = await supabaseAdmin
        .from('accounts')
        .insert({
            user_id: userId,
            name: 'Conta Principal',
            type: 'CASH',
            initial_balance: 0.00,
            is_active: true
        });

    if (accountError) {
        console.error("Failed to create account:", accountError);
    } else {
        console.log("Conta Principal created!");
    }

    console.log("✅ Done! Bruno should now be able to use the bot.");
}

forceCreateBruno();
