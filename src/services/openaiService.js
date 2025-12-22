require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const logger = require('./loggerService'); // Adjusted path context

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const { createBreaker } = require('./circuitBreakerService');

// --- IMPLEMENTAÇÃO PURA (Internal) ---

async function _generateEmbedding(text) {
    const start = Date.now();
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
    });
    const duration = Date.now() - start;
    logger.info('Embedding Generated', { duration, model: "text-embedding-3-small", tokens: response.usage.total_tokens });
    return response.data[0].embedding;
}

async function _generateBatchEmbeddings(texts) {
    const start = Date.now();
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
        encoding_format: "float",
    });
    const duration = Date.now() - start;
    logger.info('Batch Embedding Generated', { duration, count: texts.length, tokens: response.usage.total_tokens });
    return response.data.map(d => d.embedding);
}

async function _transcribeAudio(filePath) {
    const start = Date.now();
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
        language: "pt"
    });
    const duration = Date.now() - start;
    logger.info('Audio Transcribed', { duration, model: "whisper-1" });
    return transcription.text;
}

async function _analyzeImage(base64Image, mimetype) {
    const start = Date.now();
    const systemPromptVision = `Atue como um extrator de dados financeiros de recibos, comprovantes e anotações.
    Analise a imagem e extraia TODAS as transações (Receitas e Despesas).
    
    Regras:
    1. "SALÁRIO", "VENDA", "PIX RECEBIDO", "DÍZIMO" (se for entrada), etc -> tipo: 'receita'.
    2. "MERCADO", "COMPRA", "PAGAMENTO", "DÍZIMO" (se for saída) -> tipo: 'despesa'.
    3. Retorne JSON no formato:
    {
        "transacoes": [
            {
                "descricao": "Nome do item (Ex: 'Coca Cola', 'Salário')",
                "valor": 10.50, 
                "categoria": "Alimentação, Transporte, Salário, Lazer...",
                "tipo": "receita" | "despesa",
                "data": "YYYY-MM-DD"
            }
                "data": "YYYY-MM-DD"
            }
        ],
        "confidence_score": 0.95 // 0 a 1. Se o input for ambíguo ou imagem ruim, use valores abaixo de 0.7.
    }
    Se nada for visível: { "transacoes": [], "confidence_score": 0.0 }`;

    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: systemPromptVision },
            { role: "user", content: [{ type: "image_url", image_url: { url: `data:${mimetype};base64,${base64Image}` } }] }
        ],
        model: "gpt-4o",
        max_tokens: 1000,
        response_format: { type: "json_object" }
    });

    const duration = Date.now() - start;
    logger.info('Image Analyzed', { duration, model: "gpt-4o", tokens: completion.usage?.total_tokens });
    return completion.choices[0].message.content;
}

const securityService = require('./securityService');
// ... existings imports ...

async function _analyzePdfText(text) {
    const start = Date.now();

    // 1. Pre-processing & Governance (PII Redaction + Cleaning)
    const sanitizedText = securityService.cleanPdfText(text);

    const prompt = `
    Analise o texto deste documento financeiro (Fatura de Cartão, Extrato Bancário OFX/CSV ou Planilha) e extraia os dados.
    
    1. Identifique o VALOR TOTAL (se for fatura) e o VENCIMENTO.
    2. Extraia TODAS as transações, incluindo:
       - Compras / Saídas
       - Recebimentos / Entradas (Pix, Salário, Depósitos)
       - Taxas, Juros, Multas (Classifique como "Taxas/Juros")
       - Estornos
       
    IGNORE: "Saldo Anterior", "Saldo Final" (apenas transações ou total a pagar).

    Retorne JSON estrito:
    {
        "total_fatura": 1234.56 (ou null se for extrato conta corrente),
        "vencimento": "YYYY-MM-DD" (ou null),
        "transacoes": [
            {
                "descricao": "Nome do estabelecimento ou transação",
                "valor": 10.50,
                "categoria": "Categoria sugerida (Ex: Alimentação, Transporte, Taxas/Juros, Salário)",
                "tipo": "despesa" | "receita",
                "data": "YYYY-MM-DD"
            }
        ],
        "confidence_score": 0.95 // 0.0 - 1.0 (Low if text is garbled or missing dates)
    }
    
    Texto do Documento:
    ${sanitizedText.substring(0, 15000)}
    `;

    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0
    });

    const duration = Date.now() - start;
    logger.info('PDF Analyzed', { duration, model: "gpt-4o", tokens: completion.usage?.total_tokens });

    return JSON.parse(completion.choices[0].message.content);
}

async function _chatCompletion(messages, tools = [], model = "gpt-4o") {
    const start = Date.now();

    // 1. Governance: Redact PII from User Messages
    const safeMessages = messages.map(m => {
        // Inject Confidence Instruction into System Prompt if present
        if (m.role === 'system') {
            return { ...m, content: m.content + `\n\n[IMPORTANTE] Adicione ao JSON de retorno o campo confidence_score: um valor de 0 a 1 indicando sua certeza sobre os dados extraídos. Se o input for ambíguo, use valores abaixo de 0.7.` };
        }
        if (m.role === 'user' && typeof m.content === 'string') {
            return { ...m, content: securityService.redactPII(m.content) };
        }
        return m;
    });

    const params = {
        model: model,
        messages: safeMessages,
    };

    if (tools.length > 0) {
        params.tools = tools;
        params.tool_choice = "auto";
    }

    const completion = await openai.chat.completions.create(params);
    const duration = Date.now() - start;
    logger.info('Chat Completion', { duration, model: model, tokens: completion.usage?.total_tokens });
    return completion;
}

// --- CIRCUIT BREAKERS ---

const embeddingBreaker = createBreaker(_generateEmbedding, 'OpenAI-Embedding');
const batchEmbeddingBreaker = createBreaker(_generateBatchEmbeddings, 'OpenAI-BatchEmbedding');
const transcribeBreaker = createBreaker(_transcribeAudio, 'OpenAI-Whisper');
const visionBreaker = createBreaker(_analyzeImage, 'OpenAI-Vision');
const pdfBreaker = createBreaker(_analyzePdfText, 'OpenAI-PDF');
const chatBreaker = createBreaker(_chatCompletion, 'OpenAI-Chat');

// --- EXPORTS (Wrapped) ---

module.exports = {
    openai,
    generateEmbedding: (text) => embeddingBreaker.fire(text),
    generateBatchEmbeddings: (texts) => batchEmbeddingBreaker.fire(texts),
    transcribeAudio: (filePath) => transcribeBreaker.fire(filePath),
    analyzeImage: (base64, mime) => visionBreaker.fire(base64, mime),
    analyzePdfText: (text) => pdfBreaker.fire(text),
    chatCompletion: (msgs, tools, model) => chatBreaker.fire(msgs, tools, model)
};
