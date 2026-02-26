---
name: database-design
description: Database design principles specific to Mepoupay using Supabase. Focuses on PostgreSQL schema design, Row Level Security (RLS), and native SQL migrations.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Database Design (Supabase & PostgreSQL)

> **Core Philosophy:** O banco de dados do Mepoupay é o Supabase (PostgreSQL). Toda a segurança de acesso a dados e isolamento entre tenants (usuários) deve ser garantida na camada do banco via **Row Level Security (RLS)**.

## 1. Regras de Schema e Modelagem

- **Valores Monetários:** Todo valor monetário (`amount`, `saldo`, `valor`) deve ser armazenado como `BIGINT` (ou `integer` se apropriado) representando **CENTAVOS**. Exemplo: R$ 10,50 vira `1050`. Nunca utilize `float` ou `decimal` para evitar erros de precisão e arredondamento.
- **Relacionamentos e Foreign Keys:** Garanta a integridade referencial. Tabelas principais sempre devem possuir relacionamento com a tabela `profiles` (ou com a tabela de auth nativa do Supabase `auth.users`).
- **Nomenclatura (Snake Case):** Tabelas e colunas devem seguir o padrão `snake_case` do PostgreSQL nativo. (Ex: `user_id`, `created_at`).

## 2. Row Level Security (RLS)

- **Sempre Ativado:** Qualquer nova tabela que contenha dados de usuários **deve** ter o RLS habilitado:
  ```sql
  ALTER TABLE minha_tabela ENABLE ROW LEVEL SECURITY;
  ```
- **Políticas Restritivas:** As políticas (Policies) padrão devem garantir que um usuário só consiga fazer `SELECT`, `INSERT`, `UPDATE` ou `DELETE` em linhas onde `user_id = auth.uid()`.
- **Bypass de Service Role:** Nos Webhooks ou edge functions que não possuam contexto autenticado do próprio usuário realizando a requisição, utiliza-se a `SERVICE_ROLE_KEY` do Supabase para contornar o RLS e ler/escrever livremente (Exemplo: Worker inserindo despesas automáticas extraídas pelo bot do WhatsApp). 

## 3. SQL Migrations Nativas

- **Sem ORMs Abstratos:** O projeto Mepoupay prioriza o cliente oficial `@supabase/supabase-js`. Para gerenciamento de migrações, todas devem ser escritas em **SQL Nativo**.
- **Idempotência:** Migrações devem ser pensadas para rodar múltiplas vezes de forma segura (usando `IF NOT EXISTS`, ou blocos `DO $$`).
- **Padrão Transacional:** Cada arquivo de migração deve ser um pacote transacional confiável. Se adicionar RLS, inclua junto na mesma migração as políticas (`CREATE POLICY ...`).

---
## ❌ Anti-Patterns Absolutos

- ❌ Armazenar dinheiro como tipo genérico flutuante `float` ou `real`.
- ❌ Adicionar novas tabelas pulando a configuração da chave estrangeira de `user_id` -> `profiles`.
- ❌ Desligar RLS por preguiça ou dificuldade de escrever a policy adequada.
- ❌ Deixar a validação de escopo de tenant apenas no código Node.js (se esquecer um `WHERE`, vaza dado. O RLS é a última barreira).
