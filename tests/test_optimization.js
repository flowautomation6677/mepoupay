const routerService = require('../src/services/routerService');
const cacheService = require('../src/services/cacheService');
const redis = require('../src/services/redisClient');
const logger = require('../src/services/loggerService');

// Mock Logger to look nicer in test output
logger.info = (msg) => console.log(`[INFO] ${msg}`);
logger.debug = (msg) => console.log(`[DEBUG] ${msg}`);
logger.warn = (msg) => console.log(`[WARN] ${msg}`);

async function runTests() {
    console.log("🚀 Starting Optimization Verification...\n");

    // TEST 1: ROUTER
    console.log("--- TEST 1: Router Logic ---");
    const cases = [
        { input: "Oi", expected: "gpt-4o-mini" },
        { input: "Almoço 20,00", expected: "gpt-4o-mini" },
        { input: "Uber 15.50", expected: "gpt-4o-mini" },
        { input: "Analise este PDF e me diga o total gasto por categoria.", expected: "gpt-4o" },
        { input: "Comprei 3 itens: um abacaxi, um carro e um sonho.", expected: "gpt-4o" } // Complex sentence
    ];

    let routerPassed = true;
    for (const c of cases) {
        const result = routerService.route(c.input);
        const pass = result === c.expected;
        console.log(`Input: "${c.input.padEnd(30)}" | Expected: ${c.expected} | Got: ${result} | ${pass ? "✅" : "❌"}`);
        if (!pass) routerPassed = false;
    }

    // TEST 2: CACHE
    console.log("\n--- TEST 2: Cache Logic ---");
    const testKey = "Teste Cache " + Date.now();
    const mockResponse = { type: 'ai_response', content: "Resposta Cacheada" };

    // 2.1 Check Miss
    const miss = await cacheService.get(testKey);
    console.log(`Cache Miss Check: ${miss === null ? "✅ Passed (Null)" : "❌ Failed"}`);

    // 2.2 Set
    await cacheService.set(testKey, mockResponse);
    console.log("Cache Set: Called");

    // 2.3 Check Hit
    const hit = await cacheService.get(testKey);
    const deepEqual = JSON.stringify(hit) === JSON.stringify(mockResponse);
    console.log(`Cache Hit Check:  ${deepEqual ? "✅ Passed (Equal)" : "❌ Failed"}`);

    // Clean up
    await redis.quit();

    console.log("\n---------------------------------------------------");
    if (routerPassed && miss === null && deepEqual) {
        console.log("🎉 ALL OPTIMIZATION TESTS PASSED!");
    } else {
        console.error("💥 SOME TESTS FAILED.");
        process.exit(1);
    }
}

runTests();
