const { z } = require('zod');

// Schema para um único gasto/transação
const TransactionItemSchema = z.object({
    descricao: z.string().describe("Nome ou descrição do item/transação"),
    valor: z.number().describe("Valor monetário da transação"),
    categoria: z.string().default("Outros").describe("Categoria do gasto (Ex: Alimentação, Transporte)"),
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
    resposta: z.string().optional()
});

module.exports = {
    TransactionItemSchema,
    AIResponseSchema
};
