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
    const systemPromptVision = `Atue como um extrator de dados financeiros de recibos/notas.
    Analise a imagem e extraia os itens de gasto.
    Retorne APENAS um JSON com este formato:
    {
        "gastos": [
            {
                "descricao": "Nome do item (NÃO use 'item', use 'descricao')",
                "valor": 10.50, 
                "categoria": "Categoria (Alimentação, Transporte, etc)",
                "data": "YYYY-MM-DD"
            }
        ]
    }
    Se não visível, { "gastos": [] }.`;

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
    transcribeAudio,
    analyzeImage,
    chatCompletion
};
