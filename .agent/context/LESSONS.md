# 🧠 Lições do Projeto & Conhecimento Tribal (LESSONS.md)
> **INSTRUÇÃO CRÍTICA:** Leia este arquivo ANTES de escrever qualquer código. Se uma solução proposta contradizer este arquivo, ESTE ARQUIVO VENCE.

## 1. 🚨 Anti-Patterns & Falhas Passadas (NÃO REPITA)
* **[CRÍTICO] Violação de TDD (Caso: comando `/esquecer`):**
    * **O Erro:** A IA implementou a lógica em `ClearContextCommand.js` e atualizou o dispatcher *antes* de escrever qualquer teste, confiando apenas em teste manual no WhatsApp.
    * **A Correção:** NUNCA escreva lógica de negócio (implementação) sem ter um teste vermelho (falhando) antes.
    * **A Regra:** Para qualquer novo Comando/Handler, crie `src/tests/commands/[Nome].test.js` primeiro. Valide se o handler é chamado. Só *depois* implemente a lógica.
* **[CRÍTICO] Correção de Bug Frontend SEM Teste:**
    * **O Erro:** A IA corrigiu um bug de fuso horário em `TransactionFeed.tsx` mas não criou um teste unitário para garantir que a regressão não ocorra.
    * **A Correção:** NENHUMA alteração (nova feature ou correção de bug) no Frontend deve ser feita sem ser acompanhada pelo seu respectivo teste em `__tests__`.
    * **A Regra:** Se você alterar a renderização baseada em lógica de um componente (ex: manipulação de datas), crie ou atualize o teste unitário do componente com a string exata que causou o bug ANTES ou JUNTO da correção.

## 2. 🧪 Estratégia de Testes (Mandatos XP)
* **Sem APIs Reais nos Testes:** Nunca chame endpoints reais da OpenAI, Evolution API ou Supabase durante o `npm test`. Sempre use mocks do Jest.
* **Mock do Redis:** O sistema de filas depende muito do Redis. Os testes devem mockar o `redisClient` para evitar conexões pendentes (hanging handles).
* **Localização dos Testes:**
    * Lógica de Backend vai em `src/tests/`.
    * Componentes Frontend vão em `web-dashboard/src/__tests__/` (ou colocalizados).

## 3. 🏗️ Arquitetura & Backend (Node.js/Express)
* **Service Pattern:** Não escreva regras de negócio dentro de Controllers ou Rotas. Use a camada `src/services/`.
* **Estabilidade de Webhook:** Webhooks podem falhar ou vir duplicados (veja `webhook_fix.js`). Garanta que todos os handlers sejam **idempotentes** (processar o mesmo evento duas vezes não pode quebrar os dados).
* **Formatação de Telefone:**
    * **Regra:** Sempre sanitize os números para o formato `5521999999999` (País + DDD + Número) antes de inserir no banco.
    * **Armadilha:** Não confie cegamente no formato que vem do Webhook do WhatsApp. Use `utils/phoneSanitizer.js`.
* **Parsing de PDF:** A estratégia padrão falha frequentemente. Sempre prefira `PdfRetryStrategy` ou garanta lógica de fallback.

## 4. 🖥️ Frontend (Next.js App Router)
* **Supabase Client:** NÃO use `createClient` genérico. Use `src/utils/supabase/server.ts` (Server Components) ou `src/utils/supabase/client.ts` (Client Components).
* **Server Actions:** Prefira Server Actions em vez de rotas de API para mutações de formulário.

## 5. 🛡️ Segurança & Auth
* **Políticas RLS:** O Row Level Security (RLS) deve ser ativado imediatamente na criação de tabelas no Supabase.
* **Limpeza de Contexto:** Ao usar `/esquecer`, NÃO delete o registro do usuário (`users` table). Apenas limpe o histórico de sessão/thread no Redis e Supabase.

## 6. 📜 Protocolos Operacionais (Manual de Execução XP)
> **GUIA DE SOBREVIVÊNCIA:** Siga este roteiro exato para cada tipo de tarefa. Não pule etapas.

### 🟢 CENÁRIO 1: Nova Feature (New Feature)
**Objetivo:** Criar algo novo (ex: Rotas, Componentes, Tabelas).
1.  **A Ordem (Navigator):** Espere o usuário definir *o que* ele quer. Não assuma a implementação.
2.  **🔴 RED (O Teste):**
    * **Ação:** Proponha e escreva *apenas* o arquivo de teste (ex: `*.test.js` ou `*.spec.tsx`).
    * **Regra:** Não crie o arquivo de implementação ainda.
    * **Validação:** Rode o teste e mostre o erro (`FAIL`). Se passar de primeira, o teste está errado.
3.  **🟢 GREEN (A Solução):**
    * **Ação:** Escreva a implementação mínima para passar no teste.
    * **Validação:** Rode o teste novamente (`PASS`).
4.  **🔵 REFACTOR:** Melhore o código apenas após o verde.

### 🟠 CENÁRIO 2: Correção de Bug (Bug Fix)
**Objetivo:** Consertar algo quebrado sem criar novos bugs.
1.  **A Denúncia:** O usuário reporta o erro.
2.  **🔴 Reprodução (A Vacina):**
    * **Ação:** Crie um caso de teste que *simule* o bug relatado.
    * **Obrigatório:** O teste **DEVE FALHAR** primeiro. Isso prova que o bug existe e que você o entendeu.
3.  **🟢 A Correção:**
    * **Ação:** Ajuste o código para tratar o caso.
    * **Validação:** O teste deve passar.
4.  **Regressão:** Rode testes relacionados para garantir que nada mais quebrou.

### 🟣 CENÁRIO 3: Governança (Atualização de Regras)
**Objetivo:** Quando o usuário ensina algo novo ou corrige seu comportamento.
1.  **Gatilho:** O usuário diz "Não use X", "Use Y" ou "Você errou Z".
2.  **Ação Imediata:** Não apenas peça desculpas.
3.  **Registro:** Adicione uma nova linha neste arquivo (`LESSONS.md`) na seção apropriada documentando o erro e a solução correta.
4.  **Confirmação:** Avise ao usuário: "Regra adicionada ao LESSONS.md".