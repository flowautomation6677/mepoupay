const imageStrategy = require('../strategies/ImageStrategy');
const audioStrategy = require('../strategies/AudioStrategy');
const pdfStrategy = require('../strategies/PdfStrategy');
const ofxStrategy = require('../strategies/OfxStrategy');
const csvStrategy = require('../strategies/CsvStrategy');
const xlsxStrategy = require('../strategies/XlsxStrategy');
const pdfRetryStrategy = require('../strategies/PdfRetryStrategy');

class MediaStrategyFactory {
    constructor() {
        this.strategies = {
            'PROCESS_IMAGE': imageStrategy,
            'PROCESS_AUDIO': audioStrategy,
            'PROCESS_PDF': pdfStrategy,
            'PROCESS_OFX': ofxStrategy,
            'PROCESS_CSV': csvStrategy,
            'PROCESS_XLSX': xlsxStrategy,
            'RETRY_PDF_PASSWORD': pdfRetryStrategy
        };
    }

    getStrategy(type) {
        const strategy = this.strategies[type];
        if (!strategy) {
            throw new Error(`Unknown job type: ${type}`);
        }
        return strategy;
    }
}

module.exports = new MediaStrategyFactory();
