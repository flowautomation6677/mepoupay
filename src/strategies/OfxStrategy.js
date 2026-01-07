const ofx = require('node-ofx-parser');
const securityService = require('../services/securityService');
const logger = require('../services/loggerService');

// ===== HELPER FUNCTIONS =====

async function _downloadAndValidateMedia(message) {
    logger.debug("[OFX] Downloading media...");
    const media = await message.downloadMedia();

    logger.debug("[OFX] Download result:", media ? "Success" : "Failed");
    if (media) {
        logger.debug("[OFX] Mimetype:", media.mimetype);
        logger.debug("[OFX] Data length:", media.data ? media.data.length : 0);
    }

    if (!media || !media.data) {
        return null;
    }

    return media;
}

function _parseOfxData(mediaData) {
    const buffer = Buffer.from(mediaData, 'base64');
    const ofxString = buffer.toString('utf-8');
    return ofx.parse(ofxString);
}

function _extractTransactionList(parsedData) {
    // Navigate through OFX structure
    // Bank: OFX -> BANKMSGSRSV1 -> STMTTRNRS -> STMTRS -> BANKTRANLIST
    // Credit: OFX -> CREDITCARDMSGSRSV1 -> CCSTMTTRNRS -> CCSTMTRS -> BANKTRANLIST

    const bankMsg = parsedData.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST;
    const creditMsg = parsedData.OFX?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS?.BANKTRANLIST;

    return bankMsg || creditMsg;
}

function _formatOfxDate(rawDate) {
    // DTPOSTED format: YYYYMMDD
    const dateStr = rawDate.substring(0, 8);
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
}

function _mapTransaction(tx) {
    const valor = Number.parseFloat(tx.TRNAMT);

    return {
        descricao: securityService.redactPII(tx.MEMO || "Transação OFX"),
        valor: Math.abs(valor),
        tipo: valor < 0 ? 'despesa' : 'receita',
        categoria: 'Bancário',
        data: _formatOfxDate(tx.DTPOSTED),
        raw_id: tx.FITID
    };
}

function _processTransactions(bankTranList) {
    if (!bankTranList || !bankTranList.STMTTRN) {
        return [];
    }

    const rawTx = Array.isArray(bankTranList.STMTTRN)
        ? bankTranList.STMTTRN
        : [bankTranList.STMTTRN];

    return rawTx.map(_mapTransaction);
}

function _calculateBalance(transactions) {
    return transactions.reduce((acc, t) =>
        acc + (t.tipo === 'despesa' ? -t.valor : t.valor),
        0
    );
}

// ===== MAIN CLASS =====

class OfxStrategy {
    async execute(message) {
        try {
            // 1. Download and validate
            const media = await _downloadAndValidateMedia(message);
            if (!media) {
                return {
                    type: 'system_error',
                    content: "❌ Falha no download. O WhatsApp não retornou dados para este OFX."
                };
            }

            // 2. Parse OFX
            const parsedData = _parseOfxData(media.data);

            // 3. Extract transactions
            const bankTranList = _extractTransactionList(parsedData);
            const transactions = _processTransactions(bankTranList);

            // 4. Validate results
            if (transactions.length === 0) {
                return {
                    type: 'system_error',
                    content: "Não encontrei transações neste arquivo OFX."
                };
            }

            // 5. Calculate balance and return
            const total = _calculateBalance(transactions);

            return {
                type: 'data_extraction',
                content: {
                    transacoes: transactions,
                    total_fatura: null,
                    saldo_calculado: total
                }
            };

        } catch (error) {
            logger.error("OFX Strategy Error:", error);
            return {
                type: 'system_error',
                content: "Erro ao ler arquivo OFX."
            };
        }
    }
}

module.exports = {
    OfxStrategy: new OfxStrategy(),
    // Exporting helpers for testing
    _downloadAndValidateMedia,
    _parseOfxData,
    _extractTransactionList,
    _formatOfxDate,
    _mapTransaction,
    _processTransactions,
    _calculateBalance
};
