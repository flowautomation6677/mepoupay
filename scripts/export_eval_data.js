require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Erro: SUPABASE_URL e SUPABASE_KEY necessárias no .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportLearningData() {
    console.log("📥 Buscando dados de aprendizado (transaction_learning)...");

    // Busca apenas onde houve correção (assumindo que tudo na tabela é digno de nota, 
    // ou filtrar por is_processed se tivermos lógica de processamento posterior)
    const { data, error } = await supabase
        .from('transaction_learning')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error("❌ Erro ao buscar dados:", error.message);
        return;
    }

    console.log(`✅ Encontrados ${data.length} registros.`);

    // Transforma para formato amigável de Dataset
    const dataset = data.map(item => ({
        id: item.id,
        timestamp: item.created_at,
        input: item.original_input,
        ai_output_original: item.ai_response,
        human_correction: item.user_correction,
        confidence_at_time: item.confidence_at_time,
        // Sugestão de formato para o Golden Dataset futuro
        notes: "Verificar qual o JSON correto baseado na correção humana."
    }));

    const outputPath = path.join(__dirname, '..', 'evaluation.json');

    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));

    console.log(`💾 Arquivo salvo em: ${outputPath}`);
    console.log("🚀 Agora você pode usar esses exemplos para aprimorar o 'tests/golden_dataset.json'");
}

exportLearningData();
