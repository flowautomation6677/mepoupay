const fs = require('fs');
const path = require('path');
const openaiService = require('../src/services/openaiService');
const routerService = require('../src/services/routerService');
const logger = require('../src/services/loggerService');

// Valid Models
const datasetPath = path.join(__dirname, 'golden_dataset.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

async function runBenchmark() {
    console.log("📊 Starting Accuracy Benchmark...");
    console.log(`📂 Dataset Size: ${dataset.length} items`);

    let correct = 0;
    let total = 0;
    let totalConfidence = 0;

    for (const item of dataset) {
        total++;
        console.log(`\n🔹 Processing [${item.id}]...`);
        let result = null;

        try {
            if (item.type === 'text') {
                // Simulate Text Strategy Logic manually to test AI core
                const model = routerService.route(item.input);
                const messages = [{ role: "user", content: item.input }];

                // Add system prompt to match real behavior
                const systemPrompt = "Você é um assistente financeiro. Extraia gastos em JSON.";
                messages.unshift({ role: "system", content: systemPrompt });

                const completion = await openaiService.chatCompletion(messages, [], model);
                const content = completion.choices[0].message.content;

                // Try parse JSON
                try {
                    result = JSON.parse(content);
                    // Handle "gastos" wrapper often used
                    if (result.gastos) result = { transacoes: result.gastos };
                } catch (e) {
                    result = content; // Raw text fail
                }
            }

            // Validation Logic (Simplified Exact Match on Values)
            if (result && result.transacoes) {
                const expectedTx = item.expected.transacoes;
                const actualTx = result.transacoes;

                if (actualTx.length === expectedTx.length) {
                    const valueMatch = actualTx[0].valor === expectedTx[0].valor;
                    if (valueMatch) {
                        console.log("✅ MATCH");
                        correct++;
                    } else {
                        console.log(`❌ VALUE MISMATCH (Exp: ${expectedTx[0].valor}, Got: ${actualTx[0].valor})`);
                    }
                } else {
                    console.log("❌ COUNT MISMATCH");
                }
            } else {
                console.log("❌ PARSE FAIL");
            }

        } catch (error) {
            console.error("❌ ERROR", error.message);
        }
    }

    const accuracy = (correct / total) * 100;
    console.log("\n==================================");
    console.log(`🎯 Final Accuracy: ${accuracy.toFixed(2)}%`);
    console.log("==================================");
}

runBenchmark();
