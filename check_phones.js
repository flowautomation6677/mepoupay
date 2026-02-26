require('dotenv').config({ path: 'prod.env' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfiles() {
    const result = {};

    const { data: p1 } = await supabase.from('profiles').select('id, email, whatsapp_numbers').ilike('email', '%israel%');
    result.email_match = p1;

    const { data: p2 } = await supabase.from('profiles').select('id, email, whatsapp_numbers').contains('whatsapp_numbers', ['5521977186221']);
    result.phone_without_9 = p2;

    const { data: p3 } = await supabase.from('profiles').select('id, email, whatsapp_numbers').contains('whatsapp_numbers', ['55219977186221']);
    result.phone_with_9 = p3;

    const { data: p4 } = await supabase.from('profiles').select('id, email, whatsapp_numbers').eq('id', 'd8e7bc3e-6f8f-497c-963f-f3228cd11a86');
    result.bot_shadow_profile = p4;

    // What about 5521990149660?
    const { data: p5 } = await supabase.from('profiles').select('id, email, whatsapp_numbers').contains('whatsapp_numbers', ['5521990149660']);
    result.phone_99014 = p5;

    fs.writeFileSync('phones_debug.json', JSON.stringify(result, null, 2));
}

checkProfiles();
