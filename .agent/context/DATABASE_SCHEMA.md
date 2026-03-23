# 🗄️ Database Schema Reference (Mepoupay)
> **INSTRUÇÃO CRÍTICA PARA A IA:** Sempre leia este schema ao construir rotas, repositories ou scripts SQL. Estas são as colunas em inglês literais do banco PostgreSQL no Supabase. Mocks do Jest devem obrigatoriamente seguir essa assinatura.

Este arquivo é um extrato das definições em TypeScript exportadas e validadas pelo Supabase.

## Tabelas Atuais (`public`)

### 1. `profiles`
Contém os dados dos usuários e sua hierarquia no sistema.
- `id` (uuid) - Chave primária
- `email` (string)
- `full_name` (string)
- `tier` (string) - Plano ou nível
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 2. `accounts`
Contas bancárias, carteiras ou cartões vinculados a um perfil.
- `id` (uuid) - Chave primária
- `user_id` (uuid) - Referência (FK) para `profiles.id`
- `name` (string)
- `type` (enum) - 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH'
- `currency` (string)
- `initial_balance` (number/float)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3. `categories`
Categorias utilizadas para classificar as transações.
- `id` (uuid) - Chave primária
- `user_id` (uuid | null) - FK opcional para categorias criadas pelo cliente. Nulo indica categoria de sistema.
- `name` (string)
- `icon` (string | null)
- `is_system_default` (boolean)
- `created_at` (timestamp)

### 4. `transactions`
**A Tabela Core do Sistema Financeiro.** Contém cada registro financeiro consolidado.
- `id` (uuid) - Chave primária
- `user_id` (uuid) - FK para `profiles.id`
- `account_id` (uuid) - FK para `accounts.id`
- `category_id` (uuid | null) - FK opcional para `categories.id`
- `amount` (number/float) - O valor decimal (Ex: 20.00)
- `type` (enum) - 'INCOME' | 'EXPENSE' | 'TRANSFER'
- `description` (string | null) - Descrição orgânica ou nome do gasto
- `date` (timestamp) - Quando a transação ocorreu
- `metadata` (JSON | null) - Objeto aberto para logs extras ou metadados da IA
- `is_recurring` (boolean)
- `status` (string | null)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Views Analíticas

### 1. `analytics_monthly_summary`
Uma view de agregação pronta do banco de dados, caso queira ignorar o motor do backend Node.js e usar cálculos SQL transacionais.
- `user_id` (uuid)
- `month` (string/date)
- `type` (enum) - 'INCOME' | 'EXPENSE' | 'TRANSFER'
- `category_id` (uuid | null)
- `total_amount` (number/float)
- `transaction_count` (integer)
