require('dotenv').config({ path: 'prod.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const email = 'israelsgic@gmail.com';
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (userError || !user) {
        console.error("User not found or error:", userError);

        // Fallback: check auth.users directly via admin api
        const { data: usersData, error: adminErr } = await supabase.auth.admin.listUsers();
        if (!adminErr && usersData.users) {
            const found = usersData.users.find(u => u.email === email);
            if (found) {
                console.log("Found in auth.users but not profiles:", found.id);
            }
        }
        return;
    }

    console.log("Profile Data:", { id: user.id, email: user.email, whatsapp_numbers: user.whatsapp_numbers });

    // Check transactions
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    console.log(`Found ${transactions?.length || 0} transactions for user ${user.id}`);
    if (transactions && transactions.length > 0) {
        console.log("Latest transaction:", transactions[0]);
    } else {
        if (txError) console.error("Error fetching txs (if any):", txError);
    }
}

checkUser();
