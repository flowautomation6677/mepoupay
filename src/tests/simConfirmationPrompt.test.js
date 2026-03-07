/* eslint-disable no-undef */
const { _buildSystemPrompts, _buildFewShotExamples } = require('../strategies/TextStrategy');

describe('Sim Confirmation Prompt', () => {
    test('🔴 Deve conter exemplo few-shot especifico para respostas curtas como "Sim" apos uma pergunta do assistente', () => {
        const fewShotStr = _buildFewShotExamples();

        // Procuramos por um padrão onde o usuário responde "Sim" e o assistente retorna a intenção de registrar com raciocínio lógico e lista de gastos
        const expectedPattern = /Sim[\s\S]*gastos/i;

        expect(fewShotStr).toMatch(expectedPattern);
    });

    test('🔴 O System Prompt v1_stable e v2_experimental devem conter a regra explícita sobre a palavra "Sim"', () => {
        const prompts = _buildSystemPrompts("Contexto Fake", new Date());

        const rulePattern = /Sim.*Pode registrar/i;

        expect(prompts.v1_stable).toMatch(rulePattern);
        expect(prompts.v2_experimental).toMatch(rulePattern);
    });
});
