const { z } = require('zod');

// Schema para um único gasto/transação
const TransactionItemSchema = z.object({
    descricao: z.string().describe("Nome ou descrição do item/transação"),
    valor: z.number().describe("Valor monetário da transação"),
    categoria: z.string().default("Outros").describe("Categoria do gasto (Ex: Alimentação, Transporte)"),
    moeda: z.string().length(3).default("BRL").describe("Código ISO 4217 da moeda (Ex: BRL, USD, EUR)"),
    tipo: z.enum(['receita', 'despesa']).default('despesa').describe("Tipo da transação"),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional().describe("Data da transação YYYY-MM-DD")
});

// Schema para a resposta completa da IA
const AIResponseSchema = z.object({
    raciocinio_logico: z.string().optional().describe("Explicação do raciocínio da IA"),
    total_fatura: z.number().optional().nullable().describe("Valor total se for uma fatura"),
    vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().describe("Data de vencimento YYYY-MM-DD"),
    transacoes: z.array(TransactionItemSchema).default([]).describe("Lista de transações identificadas"),
    gastos: z.array(TransactionItemSchema).optional().describe("Alias para transacoes (legado/flexibilidade)"),
    valor: z.number().optional().describe("Campo legado para valor único (será convertido para transação)"),
    pergunta: z.string().optional(),
    ignorar: z.boolean().optional(),
    resposta: z.string().optional(),

    // Reliability & HITL Fields
    confidence_score: z.number().min(0).max(1).optional().describe("0.0 to 1.0 score of AI confidence"),
    is_validated: z.boolean().default(false).describe("If human validated this data"),
    raw_ai_metadata: z.record(z.any()).optional().describe("Drift analysis metadata"),

    // A/B Testing & Tracking
    prompt_version: z.string().optional().default('v1_stable'),
    is_human_corrected: z.boolean().default(false).describe("If manually corrected by user")
});

module.exports = {
    TransactionItemSchema,
    AIResponseSchema
};
