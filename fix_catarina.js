/**
 * fix_catarina.js
 * Fix: Create missing profile for Catarina (whatsapp: 61996761655)
 * Run: node fix_catarina.js
 */
require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing credentials in prod.env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_WHATSAPP = '5561996761655'; // with country code 55

async function main() {
    console.log('🔍 Step 1: Looking for Catarina in Auth (by whatsapp in metadata)...');

    const { data: usersData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authError || !usersData?.users) {
        console.error('❌ Failed to list auth users:', authError?.message);
        return;
    }

    // Try to find by whatsapp in metadata OR by searching profiles
    let authUser = usersData.users.find(u =>
        u.user_metadata?.whatsapp === TARGET_WHATSAPP ||
        u.user_metadata?.whatsapp === '61996761655'
    );

    if (!authUser) {
        console.log('⚠️  Not found by whatsapp metadata. Listing recent users (last 5):');
        const recent = usersData.users.slice(-5);
        recent.forEach(u => console.log(`  - ${u.email} | created: ${u.created_at} | whatsapp: ${u.user_metadata?.whatsapp}`));
        console.log('\nPlease check the email above and re-run with the correct email if needed.');
        return;
    }

    console.log(`✅ Found Auth User: ${authUser.email} (ID: ${authUser.id})`);

    console.log('\n🔍 Step 2: Checking if profile exists in "profiles" table...');
    const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (existingProfile) {
        console.log('✅ Profile already exists:');
        console.log(existingProfile);

        // Ensure whatsapp_numbers is correct
        if (!existingProfile.whatsapp_numbers || existingProfile.whatsapp_numbers.length === 0) {
            console.log('\n🔧 Fixing empty whatsapp_numbers...');
            const { error: updateErr } = await supabase
                .from('profiles')
                .update({ whatsapp_numbers: [TARGET_WHATSAPP] })
                .eq('id', authUser.id);
            if (updateErr) console.error('❌ Update error:', updateErr.message);
            else console.log('✅ whatsapp_numbers updated!');
        }
    } else {
        console.log('⚠️  No profile found. Creating now...');
        const { error: insertError } = await supabase.from('profiles').insert([{
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || 'Catarina',
            whatsapp_numbers: [TARGET_WHATSAPP],
            is_admin: false
        }]);

        if (insertError) {
            console.error('❌ Failed to create profile:', insertError.message);
            console.error('Error code:', insertError.code);
            return;
        }
        console.log('✅ Profile created successfully!');
    }

    console.log('\n🔍 Step 3: Ensuring user has at least one account...');
    const { data: accounts } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('user_id', authUser.id);

    if (!accounts || accounts.length === 0) {
        console.log('⚠️  No accounts found. Creating "Carteira Principal"...');
        const { error: accErr } = await supabase.from('accounts').insert([{
            user_id: authUser.id,
            name: 'Carteira Principal',
            type: 'CASH',
            initial_balance: 0,
            is_active: true
        }]);
        if (accErr) console.error('❌ Account creation error:', accErr.message);
        else console.log('✅ Account created!');
    } else {
        console.log('✅ Accounts found:', accounts.map(a => a.name).join(', '));
    }

    console.log('\n✅ Fix complete! Catarina should now be able to access the dashboard.');
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Auth ID: ${authUser.id}`);
}

main().catch(console.error);
