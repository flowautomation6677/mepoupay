require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera embedding para busca semântica
 * @param {string} text 
 * @returns {Promise<number[]|null>}
 */


/**
 * Gera embedding para busca semântica (Single)
 */
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });
        return response.data[0].embedding;
    } catch (e) {
        console.error("Erro ao gerar embedding:", e);
        return null;
    }
}

/**
 * Gera embeddings em lote (Batch)
 * @param {string[]} texts 
 * @returns {Promise<Array<number[]|null>>}
 */
async function generateBatchEmbeddings(texts) {
    try {
        // Remove empty strings to avoid API errors, but keep index sync? 
        // Better: Caller ensures valid strings.
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: texts,
            encoding_format: "float",
        });
        // Map back to guarantee order
        return response.data.map(d => d.embedding);
    } catch (e) {
        console.error("Erro ao gerar embedding batch:", e);
        return texts.map(() => null); // Fallback to avoid crash
    }
}

/**
 * Transcreve áudio usando Whisper
 * @param {string} filePath 
 * @returns {Promise<string>}
 */
async function transcribeAudio(filePath) {
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
            language: "pt"
        });
        return transcription.text;
    } catch (err) {
        console.error("Erro na transcrição Whisper:", err);
        throw err;
    }
}

/**
 * Analisa imagem para extração de dados
 * @param {string} base64Image 
 * @returns {Promise<string>} JSON string
 */
async function analyzeImage(base64Image, mimetype) {
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

    return completion.choices[0].message.content;
}

/**
 * Analisa texto extraído de PDF para buscar transações
 * @param {string} pdfText 
 * @returns {Promise<string>} JSON string
 * Analisa texto de PDF/Imagem para extrair transações e totais.
 */
async function analyzePdfText(text) {
    const prompt = `
    Analise o texto desta fatura de cartão de crédito e extraia os dados.
    
    1. Identifique o VALOR TOTAL DA FATURA ("Total a pagar", "Valor total", "Total desta fatura") e o VENCIMENTO.
    2. Extraia TODAS as transações novas, incluindo:
       - Compras (Lojas, serviços)
       - Juros, Multas, IOF, Encargos (Classifique como "Taxas/Juros")
       - Estornos (Valores negativos)
       - Parcelas de compras antigas (se listadas explicitamente com valor nesta fatura)
       
    IGNORE: "Saldo Anterior", "Pagamento Efetuado", "Pagamento Mínimo", "Total Parcelado" (apenas o total geral).

    Retorne JSON estrito:
    {
        "total_fatura": 1234.56,
        "vencimento": "YYYY-MM-DD",
        "transacoes": [
            {
                "descricao": "Nome do estabelecimento ou taxa",
                "valor": 10.50,
                "categoria": "Categoria sugerida (Ex: Alimentação, Transporte, Taxas/Juros)",
                "tipo": "despesa" (ou "receita" se for crédito/estorno),
                "data": "YYYY-MM-DD" (se não encontrar ano, assuma próximo vencimento ou ano corrente)
            }
        ]
    }
    
    Texto da Fatura:
    ${text.substring(0, 15000)} // Limit to avoid token overflow
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "gpt-4o",
            response_format: { type: "json_object" },
            temperature: 0
        });

        const result = JSON.parse(completion.choices[0].message.content);
        return result; // Retorna { total_fatura, vencimento, transacoes }
    } catch (error) {
        console.error("Erro na análise de PDF (OpenAI):", error);
        return { transacoes: [], error: "Falha na IA" };
    }
}

/**
 * Chat Completions para Texto/Tools
 * @param {Array} messages 
 * @param {Array} tools 
 * @returns {Promise<object>} OpenAI Response Object
 */
async function chatCompletion(messages, tools = []) {
    const params = {
        model: "gpt-4o",
        messages: messages,
    };

    if (tools.length > 0) {
        params.tools = tools;
        params.tool_choice = "auto";
    }

    return await openai.chat.completions.create(params);
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
