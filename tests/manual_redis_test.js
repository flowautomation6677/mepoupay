const sessionService = require('../src/services/sessionService');

async function testSessionService() {
    console.log("--- Starting Manual Redis Test ---");

    const userId = "test_user_123";

    // 1. Test Context
    console.log("1. Testing Context...");
    await sessionService.clearContext(userId);
    let context = await sessionService.getContext(userId);
    console.log("Initial Context (should be empty array):", context);

    const newContext = [{ role: 'user', content: 'hello' }];
    await sessionService.setContext(userId, newContext, 10);

    context = await sessionService.getContext(userId);
    console.log("Updated Context (should have 1 item):", context);
    if (context.length === 1 && context[0].content === 'hello') {
        console.log("✅ Context Test Passed");
    } else {
        console.error("❌ Context Test Failed");
    }

    // 2. Test PDF State
    console.log("\n2. Testing PDF State...");
    await sessionService.clearPdfState(userId);
    let pdf = await sessionService.getPdfState(userId);
    console.log("Initial PDF (should be null):", pdf);

    const pdfData = "base64_fake_data";
    await sessionService.setPdfState(userId, pdfData, 10);

    pdf = await sessionService.getPdfState(userId);
    console.log("Updated PDF (should be 'base64_fake_data'):", pdf);
    if (pdf === pdfData) {
        console.log("✅ PDF State Test Passed");
    } else {
        console.error("❌ PDF State Test Failed");
    }

    console.log("\n--- Test Complete (Ctrl+C to exit if Redis connection keeps open) ---");
    process.exit(0);
}

testSessionService().catch(err => {
    console.error("Test execution error:", err);
    process.exit(1);
});
