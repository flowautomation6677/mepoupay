const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        console.log("🔍 Checking Puppeteer...");
        let path;
        try {
            path = puppeteer.executablePath();
        } catch (e) {
            console.log("Warning: Could not get executablePath directly:", e.message);
        }

        console.log("📂 Executable Path detected:", path);

        if (!path) {
            console.error("❌ executablePath is missing.");
            // Proceed to try launch anyway, maybe it finds it?
        } else if (!fs.existsSync(path)) {
            console.error("❌ File does not exist at path:", path);
        } else {
            console.log("✅ File exists at path.");
        }

        console.log("🚀 Attempting to launch browser...");
        const browser = await puppeteer.launch({
            headless: false, // "new" is also valid but let's try false for visibility
            executablePath: path,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        console.log("✅ Browser launched successfully!");
        const version = await browser.version();
        console.log("Browser Version:", version);
        await browser.close();
        console.log("✅ Browser closed.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Critical Error launching browser:", error);
        process.exit(1);
    }
})();
