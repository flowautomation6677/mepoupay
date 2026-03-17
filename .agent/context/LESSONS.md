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
* **[CRÍTICO] Perda de Contexto em Confirmações ("Sim"):**
    * **O Erro:** Quando a IA fazia uma pergunta para confirmar um gasto ("Devo registrar?") e o usuário respondia apenas "Sim", a IA perdia o contexto e respondia com uma saudação genérica.
    * **A Correção:** Adicionado few-shot examples específicos para respostas curtas ("Sim", "Pode registrar") e instruções explícitas nos system prompts (`v1_stable` e `v2_experimental`) para retornar IMEDIATAMENTE o JSON com os gastos da pergunta anterior, extraídos do RAG da conversa.
    * **A Regra:** Se você alterar a renderização baseada em lógica de um componente (ex: manipulação de datas), crie ou atualize o teste unitário do componente com a string exata que causou o bug ANTES ou JUNTO da correção.
* **[CRÍTICO] Perda de Contexto em Confirmações ("Sim"):**
    * **O Erro:** Quando a IA fazia uma pergunta para confirmar um gasto ("Devo registrar?") e o usuário respondia apenas "Sim", a IA perdia o contexto e respondia com uma saudação genérica.
    * **A Correção:** Adicionado few-shot examples específicos para respostas curtas ("Sim", "Pode registrar") e instruções explícitas nos system prompts (`v1_stable` e `v2_experimental`) para retornar IMEDIATAMENTE o JSON com os gastos da pergunta anterior, extraídos do RAG da conversa.
    * **A Regra:** Sempre que adicionar novos fluxos conversacionais (ex: perguntas de confirmação), garanta que o modelo saiba exatamente como lidar com as respostas isoladas ("Sim", "Não") usando o histórico da conversa e explicitly instruindo o retorno do JSON correto.
* **[CRÍTICO] Alucinação de Datas na Extração de Imagens:**
    * **O Erro:** Ao enviar fotos de recibos sem uma data escrita manual (ex: caderno de anotações), o gpt-4o (Vision API) inferia datas do passado e alucinava o ano (ex: 2023).
    * **A Correção:** A função `_analyzeImage` foi refatorada para injetar programaticamente a string com a data *de hoje*, exigindo que se o recibo não tiver data, o preenchimento seja a data vigente.
    * **A Regra:** TODA requisição feita a modelos gerativos financeiros (GPT-4o para texto ou imagens) DEVE conter, incondicionalmente, a "Data de Hoje" no system prompt (timezone `America/Sao_Paulo`) para prevenir alucinações cronológicas.
* **[CRÍTICO] Localização Incorreta das Migrações (Supabase):**
    * **O Erro:** Arquivos SQL de migração foram criados dentro da pasta local do Front-End (`web-dashboard/supabase/migrations/`), ferindo a arquitetura Monorepo onde o banco é compartilhado com os Bots.
    * **A Correção:** Os scripts foram movidos para a pasta raiz `database/migrations/`.
    * **A Regra:** NUNCA crie novos scripts de migração do Supabase dentro do web-dashboard. Todas as Migrations do projeto MePoupay DEVEM ser salvas e sequenciadas numericamente obrigatoriamente na pasta `database/migrations/` na raiz do projeto.
* **[CRÍTICO] Validação de Administrador Incorreta (Role vs Boolean):**
    * **O Erro:** A IA gerou um erro `Forbidden` por validar o privilégio de administrador do Supabase checando por `role = 'admin'` na tabela `profiles`.
    * **A Correção:** A validação e as *RLS Policies* foram atualizadas para checar a coluna correta existente na arquitetura atual: `is_admin = true`.
    * **A Regra:** Em TODO e QUALQUER lugar do sistema onde for necessário validar se um usuário é administrador (seja nas Policies do SQL de Migração ou em Rotas de API), SEMPRE verifique o campo booleano `is_admin = true` na tabela `profiles`, ignorando qualquer uso de string `role`.

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
* **[CRÍTICO] Inconsistência de Tema (Light/Dark Mode) no Shadcn UI:**
    * **O Erro:** Telas e componentes (como relatórios) foram construídos usando utilitários de cor absolutos do Tailwind (ex: `bg-slate-950`, `text-slate-50`, `border-slate-800`), o que "engessava" o componente no modo escuro, quebrando a legibilidade quando o app estava no tema claro.
    * **A Correção:** Refatoração de todo o dashboard substituindo as cores fixas por variáveis semânticas do tema (ex: `bg-slate-950` → `bg-background`, `text-slate-50` → `text-foreground`, `border-slate-800` → `border-border`, `bg-slate-900/50` → `bg-card`).
    * **A Regra:** NUNCA utilize cores de paleta estática (como `slate-900`, `gray-100`) para estruturar contêineres principais, fundos, bordas e textos em projetos com suporte a modos Claro/Escuro. SEMPRE utilize as variáveis semânticas (ex: `bg-background`, `text-primary`, `border-border`, `text-muted-foreground`) injetadas via classe `.dark` no `globals.css`.
* **[CRÍTICO] Hooks após `return` condicional (Rules of Hooks):**
    * **O Erro:** `useState`/`useCallback` foram escritos **depois** de um `if (!profile) return null`. O React viola silenciosamente — sem erro no console, sem aviso visível — e o estado nunca atualiza.
    * **A Regra:** SEMPRE declare todos os hooks no **topo** da função, antes de qualquer `return` condicional. A ordem dos hooks nunca pode ser condicional.
* **[ATENÇÃO] Nunca use match exato (`===`) contra strings geradas por IA/banco:**
    * **O Erro:** Filtro usava `t.category === aiFilter`. Categorias vêm do nome livre criado pela IA no banco (pode ser "Uber", "uber", "TRANSPORTE") — o match sempre falhava silenciosamente.
    * **A Regra:** Em filtros de texto que comparam com dados vindos do banco via IA, sempre use `.toLowerCase().includes(...)` — nunca `===`.

## 5. 🛡️ Segurança & Auth
* **Políticas RLS para Tabelas:** O Row Level Security (RLS) deve ser ativado imediatamente na criação de tabelas no Supabase.
* **[CRÍTICO] Supabase Storage RLS (Upload de Arquivos Bloqueado):**
    * **O Erro:** Ao criar um novo Storage Bucket (ex: `avatars`), o envio de imagens via UI falhou silenciosamente. Buckets criados com `public: true` apenas liberam a **leitura** (Select). As operações de mutação (Insert/Update/Delete) vêm estritamente bloqueadas pelo banco de dados por padrão na tabela `storage.objects`.
    * **A Correção:** Escrever um script/migração SQL para criar as `POLICY` na tabela `storage.objects` permitindo `FOR INSERT TO authenticated`.
    * **A Regra:** TODA vez que você planejar usar o Supabase Storage para uploads via Client-Side, OBRIGATORIAMENTE preveja e aplique as políticas RLS (`INSERT`, `UPDATE`, `DELETE`) em `storage.objects` amarradas ao `USING (bucket_id = 'nome_do_bucket')`.
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