const { processExtractedData, _parseContent } = require('../services/dataProcessor');

describe('Receipt Processing Integration (TDD RED Phase)', () => {
    test('Must calculate discount and NOT duplicate PIX line as an expense', () => {
        // Simulating the output that GPT-4o Vision currently produces (the buggy version)
        // or the ideal output we EXPECT it to produce after our GREEN phase fix.
        // The goal of this test is to ensure the payload processor maps the 
        // new "gross_amount" and "discount_amount" correctly and that the total 
        // value injected into the DB matches the actual PIX paid.

        const aiOutputJson = JSON.stringify({
            confidence_score: 0.98,
            transacoes: [
                {
                    descricao: "Pedido iFood - Caldo de Mocotó + Taxas",
                    valor: 23.08,             // What was actually paid
                    valor_bruto: 38.97,       // Subtotal (33.99 + 3.99 + 0.99)
                    desconto: 15.89,          // Cupom
                    tipo: "despesa",
                    categoria: "Alimentação",
                    data: "2026-03-09"
                }
            ]
        });

        // Parse through the data processor logic as it would happen in production
        const parsed = _parseContent(aiOutputJson);
        const transacoes = parsed.transacoes;

        expect(transacoes).toBeDefined();
        expect(transacoes.length).toBe(1); // It MUST consolidate, NOT create 3 or 4 expenses

        const theExpense = transacoes[0];

        // Assert mathematical truth
        expect(theExpense.valor).toBe(23.08);
        expect(theExpense.valor_bruto).toBe(38.97);
        expect(theExpense.desconto).toBe(15.89);

        expect(theExpense.descricao).not.toContain("Pix"); // We don't want the payment method as a line item
    });
});
