# Contexto do Projeto: Mepoupay (Porquim)

## Visão Geral
O Mepoupay é um sistema de gestão financeira pessoal e empresarial focado em automação e IA.
O "Porquim" é o assistente/bot que interage via WhatsApp.

## Tech Stack (Mandatório)
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Shadcn UI.
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Storage, Realtime).
- **Linguagem:** TypeScript estrito.
- **Integrações:** WhatsApp (WWebJS/Evolution API), OpenAI.

## Regras de Negócio Críticas
1. **Multi-tenancy:** Todo dado pertence a um `profile` (usuário) e deve ser protegido por RLS.
2. **Moeda:** Todos os valores monetários são armazenados em CENTAVOS (inteiros) no banco, mas exibidos formatados no front (BRL).
3. **Idioma:** Código em Inglês, Interface e Respostas do Bot em Português (BR).