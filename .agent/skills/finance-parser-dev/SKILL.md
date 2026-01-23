---
name: finance-parser-dev
description: Creation and maintenance of financial import strategies (PDF, OFX, CSV, etc.) using the Strategy pattern.
---

# Finance Parser Dev

## Goal
Implement robust financial parsers to extract transaction data from various file formats (PDF, OFX, CSV, Images) ensuring data integrity and type safety.

## Instructions
1.  **Strategy Pattern**: Every new parser MUST be a class that implements an `execute(message)` method.
2.  **Validation**:
    *   Verify file MIME type before processing.
    *   Handle encrypted files (e.g., PDFs with passwords) gracefully by returning a `needsPassword` state if possible.
3.  **Output Format**: The `execute` method must return a standard object:
    *   Success: `{ type: 'data_extraction', content: { ... } }`
    *   Failure: `{ type: 'system_error', content: "Error message" }`
    *   Password Request: `{ type: 'pdf_password_request', ... }`
4.  **Security**:
    *   Redact PII (Personally Identifiable Information) where possible.
    *   Do not log full raw content of sensitive financial files.
5.  **Testing**: Create a unit test in `src/tests/` for every new strategy.

## Examples

### 1. Template for a New Strategy
```javascript
// src/strategies/MyNewStrategy.js
const logger = require('../services/loggerService');

class MyNewStrategy {
    /**
     * Parsing logic
     * @param {Buffer} buffer
     */
    async processData(buffer) {
        // ... implementation ...
        return { success: true, text: "extracted text" };
    }

    /**
     * Main entry point
     * @param {Object} message - WhatsApp message object
     */
    async execute(message) {
        try {
            const media = await message.downloadMedia();
            if (!media) return { type: 'system_error', content: "No media found" };

            const buffer = Buffer.from(media.data, 'base64');
            const result = await this.processData(buffer);

            if (!result.success) {
                return { type: 'system_error', content: result.error };
            }

            // Return standardized format
            return { 
                type: 'data_extraction', 
                content: { raw_text: result.text } 
            };

        } catch (error) {
            logger.error("MyNewStrategy Error", error);
            return { type: 'system_error', content: "Failed to process file." };
        }
    }
}

module.exports = new MyNewStrategy();
```

### 2. Handling OFX (Real Example)
See how `src/strategies/OfxStrategy.js` handles parsing and validation:

```javascript
// src/strategies/OfxStrategy.js
// ... imports

class OfxStrategy {
    async execute(message) {
        try {
            // 1. Download
            const media = await _downloadAndValidateMedia(message);
            
            // 2. Parse
            const parsedData = _parseOfxData(media.data);
            
            // 3. Extract Validation
            const transactions = _processTransactions(parsedData);
            if (transactions.length === 0) {
                return { type: 'system_error', content: "No transactions found" };
            }

            // 4. Return
            return {
                type: 'data_extraction',
                content: {
                    transacoes: transactions,
                    saldo_calculado: _calculateBalance(transactions)
                }
            };
        } catch (error) {
            // ... handle error
        }
    }
}
```

### 3. Factory Integration
Ensure your strategy is registered in `src/factories/MediaStrategyFactory.js` (or created if not exists):

```javascript
// src/factories/MediaStrategyFactory.js
// ...
const pdfStrategy = require('../strategies/PdfStrategy');
const ofxStrategy = require('../strategies/OfxStrategy');

class MediaStrategyFactory {
    getStrategy(mimetype) {
        if (mimetype === 'application/pdf') return pdfStrategy;
        if (mimetype === 'text/plain' || mimetype.includes('ofx')) return ofxStrategy;
        // ...
    }
}
```
