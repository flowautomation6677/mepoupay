const fs = require('fs');
const path = require('path');
require('dotenv').config();

// MOCK Strategies (Import real ones)
const ofxStrategy = require('./src/strategies/OfxStrategy');
const csvStrategy = require('./src/strategies/CsvStrategy');

// Mock Message Factory
function createMockMessage(filename, folder) {
    const filePath = path.join(folder, filename);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const ext = path.extname(filename).toLowerCase();

    let mimetype = 'application/octet-stream';
    if (ext === '.ofx') mimetype = 'application/x-ofx';
    if (ext === '.csv') mimetype = 'text/csv';

    return {
        body: filename,
        _data: { mimetype: mimetype, filename: filename },
        downloadMedia: async () => {
            console.log(`[MOCK] downloadMedia called for ${filename}`);
            return {
                data: base64Data,
                mimetype: mimetype,
                filename: filename
            };
        },
        reply: async (text) => console.log(`[MOCK REPLY]: ${text}`)
    };
}

async function runTests() {
    const testFolder = path.join(__dirname, 'teste_arquivos');

    // 1. TEST OFX
    console.log('\n--- TESTING OFX ---');
    const ofxFile = 'Extrato-01-10-2025-a-19-12-2025-OFX.ofx';
    if (fs.existsSync(path.join(testFolder, ofxFile))) {
        const msg = createMockMessage(ofxFile, testFolder);
        const result = await ofxStrategy.execute(msg);
        console.log('OFX Result:', JSON.stringify(result, null, 2));
    } else {
        console.log(`OFX file not found: ${ofxFile}`);
    }

    // 2. TEST CSV
    console.log('\n--- TESTING CSV ---');
    const csvFile = 'Extrato-01-10-2025-a-19-12-2025-CSV.csv';
    if (fs.existsSync(path.join(testFolder, csvFile))) {
        const msg = createMockMessage(csvFile, testFolder);
        // Ensure CsvStrategy uses the mock downloadMedia!
        const result = await csvStrategy.execute(msg);
        console.log('CSV Result:', JSON.stringify(result, null, 2));
    } else {
        console.log(`CSV file not found: ${csvFile}`);
    }
}

runTests();
