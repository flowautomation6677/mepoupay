require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLegacyData() {
    console.log("🕵️ Investigando dados perdidos na tabela 'perfis'...");

    // 1. Check if 'perfis' exists
    const { data: perfis, error } = await supabase
        .from('perfis')
        .select('id, email, whatsapp_number');

    if (error) {
        console.log("⚠️ Tabela 'perfis' não encontrada ou erro:", error.message);
        return;
    }

    console.log(`📊 Encontrados ${perfis.length} registros na tabela antiga 'perfis'.`);

    // 2. Check current 'profiles'
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, whatsapp_numbers');

    // 3. Compare and Fix
    for (const p of perfis) {
        if (!p.whatsapp_number) continue;

        const current = profiles.find(prof => prof.id === p.id);
        if (current) {
            const hasNumber = current.whatsapp_numbers && current.whatsapp_numbers.length > 0;
            if (!hasNumber) {
                console.log(`🚨 DADOS FALTANDO para: ${p.email}`);
                console.log(`   Antigo: ${p.whatsapp_number}`);
                console.log(`   Novo:   ${JSON.stringify(current.whatsapp_numbers)}`);

                // FIX IT
                console.log("   🛠️ Corrigindo...");
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ whatsapp_numbers: [p.whatsapp_number] })
                    .eq('id', p.id);

                if (!updateError) console.log("   ✅ Corrigido!");
                else console.error("   ❌ Erro ao corrigir:", updateError.message);
            }
        }
    }
}

checkLegacyData();
