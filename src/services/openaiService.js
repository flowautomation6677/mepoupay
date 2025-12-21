require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const logger = require('./loggerService'); // Adjusted path context

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera embedding para busca semântica (Single)
 */
async function generateEmbedding(text) {
    const start = Date.now();
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });
        const duration = Date.now() - start;
        logger.info('Embedding Generated', { duration, model: "text-embedding-3-small", tokens: response.usage.total_tokens });
        return response.data[0].embedding;
    } catch (e) {
        logger.error("Erro ao gerar embedding", { error: e });
        return null;
    }
}

/**
 * Gera embeddings em lote (Batch)
 */
async function generateBatchEmbeddings(texts) {
    const start = Date.now();
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: texts,
            encoding_format: "float",
        });
        const duration = Date.now() - start;
        logger.info('Batch Embedding Generated', { duration, count: texts.length, tokens: response.usage.total_tokens });
        return response.data.map(d => d.embedding);
    } catch (e) {
        logger.error("Erro ao gerar embedding batch", { error: e });
        return texts.map(() => null);
    }
}

/**
 * Transcreve áudio usando Whisper
 */
async function transcribeAudio(filePath) {
    const start = Date.now();
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
            language: "pt"
        });
        const duration = Date.now() - start;
        logger.info('Audio Transcribed', { duration, model: "whisper-1" });
        return transcription.text;
    } catch (err) {
        logger.error("Erro na transcrição Whisper", { error: err });
        throw err;
    }
}

/**
 * Analisa imagem para extração de dados
 */
async function analyzeImage(base64Image, mimetype) {
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
        ]
    }
    Se nada for visível: { "transacoes": [] }`;

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
} catch (e) {
    logger.error("Erro na análise de imagem", { error: e });
    throw e;
}
}

/**
 * Analisa texto extraído de PDF para buscar transações
 */
async function analyzePdfText(text) {
    const start = Date.now();
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
        ]
    }
    
    Texto do Documento:
    ${text.substring(0, 15000)}
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "gpt-4o",
            response_format: { type: "json_object" },
            temperature: 0
        });

        const duration = Date.now() - start;
        logger.info('PDF Analyzed', { duration, model: "gpt-4o", tokens: completion.usage?.total_tokens });

        const result = JSON.parse(completion.choices[0].message.content);
        return result;
    } catch (error) {
        logger.error("Erro na análise de PDF", { error: error });
        return { transacoes: [], error: "Falha na IA" };
    }
}

/**
 * Chat Completions para Texto/Tools
 */
async function chatCompletion(messages, tools = []) {
    const start = Date.now();
    const params = {
        model: "gpt-4o",
        messages: messages,
    };

    if (tools.length > 0) {
        params.tools = tools;
        params.tool_choice = "auto";
    }

    try {
        const completion = await openai.chat.completions.create(params);
        const duration = Date.now() - start;
        logger.info('Chat Completion', { duration, model: "gpt-4o", tokens: completion.usage?.total_tokens });
        return completion;
    } catch (e) {
        logger.error("Erro no Chat Completion", { error: e });
        throw e;
    }
}

module.exports = {
    openai,
    generateEmbedding,
    generateBatchEmbeddings,
    transcribeAudio,
    analyzeImage,
    analyzePdfText,
    chatCompletion
};
