-- Migration: Data Migration (Part 2 - DML) - FIXED (Null Email)
-- -------------------------------------------------------------
-- DESCRIÇÃO: Migra dados das tabelas antigas para as novas.
-- CORREÇÕES: 
-- 1. Busca email de auth.users se perfis.email for nulo.
-- 2. Ignora usuários que não tenham email em lugar nenhum (dados corrompidos).
-- -------------------------------------------------------------

BEGIN;

-- 1. Migrate Profiles
-- Join with auth.users to rescue missing emails
INSERT INTO public.profiles (id, email, full_name, created_at)
SELECT 
    p.auth_user_id, 
    -- Try perfis.email, fallback to auth.users.email
    COALESCE(p.email, u.email) as final_email,
    -- Generate name from the found email
    SPLIT_PART(COALESCE(p.email, u.email), '@', 1) as derived_name,
    p.created_at
FROM public.perfis p
LEFT JOIN auth.users u ON u.id = p.auth_user_id
WHERE p.auth_user_id IS NOT NULL 
  AND COALESCE(p.email, u.email) IS NOT NULL -- MUST have an email
ON CONFLICT (id) DO NOTHING;

-- 2. Create Default 'Conta Principal'
INSERT INTO public.accounts (user_id, name, type, initial_balance)
SELECT id, 'Conta Principal', 'CHECKING', 0.00
FROM public.profiles
ON CONFLICT (user_id, name) DO NOTHING;

-- 3. Extract Categories
-- Now we are safe because we only migrated valid profiles
INSERT INTO public.categories (user_id, name, icon)
SELECT DISTINCT 
    p.auth_user_id, 
    t.categoria, 
    'circle'
FROM public.transacoes t
JOIN public.perfis p ON p.id = t.user_id
-- Ensure the user actually exists in our new profiles table
JOIN public.profiles new_p ON new_p.id = p.auth_user_id
WHERE t.categoria IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- 4. Migrate Transactions
INSERT INTO public.transactions (
    id, user_id, account_id, category_id, 
    amount, type, description, date, 
    metadata, created_at
)
SELECT 
    t.id,
    p.auth_user_id, -- New User ID
    a.id as account_id,
    c.id as category_id,
    t.valor as amount,
    CASE 
        WHEN t.tipo = 'receita' THEN 'INCOME'::transaction_type
        WHEN t.tipo = 'despesa' THEN 'EXPENSE'::transaction_type
        ELSE 'EXPENSE'::transaction_type -- Fallback
    END as type,
    t.descricao as description,
    t.data,
    '{}'::jsonb as metadata,
    t.created_at
FROM public.transacoes t
JOIN public.perfis p ON p.id = t.user_id
JOIN public.profiles new_p ON new_p.id = p.auth_user_id -- Valid users only
JOIN public.accounts a ON a.user_id = p.auth_user_id AND a.name = 'Conta Principal'
LEFT JOIN public.categories c ON c.user_id = p.auth_user_id AND c.name = t.categoria
ON CONFLICT (id) DO NOTHING;

-- 5. Populate Materialized View
REFRESH MATERIALIZED VIEW public.analytics_monthly_summary;

COMMIT;
