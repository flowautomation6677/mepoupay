# 🧠 Lições do Projeto & Conhecimento Tribal (LESSONS.md)
> **INSTRUÇÃO CRÍTICA:** Leia este arquivo ANTES de escrever qualquer código. Se uma solução proposta contradizer este arquivo, ESTE ARQUIVO VENCE.

## 1. 🚨 Anti-Patterns & Falhas Passadas (NÃO REPITA)
* **[CRÍTICO] Violação de TDD (Caso: comando `/esquecer`):**
    * **O Erro:** A IA implementou a lógica em `ClearContextCommand.js` e atualizou o dispatcher *antes* de escrever qualquer teste, confiando apenas em teste manual no WhatsApp.
    * **A Correção:** NUNCA escreva lógica de negócio (implementação) sem ter um teste vermelho (falhando) antes.
    * **A Regra:** Para qualquer novo Comando/Handler, crie `src/tests/commands/[Nome].test.js` primeiro. Valide se o handler é chamado. Só *depois* implemente a lógica.

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