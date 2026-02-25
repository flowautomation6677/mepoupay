const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Connecting to: ${supabaseUrl}`);


if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in environment.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBruno() {
    console.log("Searching for Bruno's profile (brunopaiva055@gmail.com)...");

    // Find by email
    const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'brunopaiva055@gmail.com')
        .single();

    if (searchError) {
        console.error("Error finding profile:", searchError);
        return;
    }

    if (!profile) {
        console.error("Profile not found for brunopaiva055@gmail.com");
        return;
    }

    console.log("Profile found:", profile.id);

    const targetNumber = '556183031031';
    let numbers = profile.whatsapp_numbers || [];

    if (!numbers.includes(targetNumber)) {
        numbers.push(targetNumber);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ whatsapp_numbers: numbers })
            .eq('id', profile.id);

        if (updateError) {
            console.error("Failed to update profile:", updateError);
        } else {
            console.log("Successfully added 556183031031 to Bruno's profile!");
        }
    } else {
        console.log("Bruno's profile already has the number 556183031031.");
    }
}

fixBruno();
