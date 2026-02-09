-- Migration: Schema Modernization (Part 1 - DDL)
-- -------------------------------------------------------------
-- DESCRIÇÃO: Criação das tabelas normalizadas (inglês) e policies.
-- -------------------------------------------------------------

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Define ENUMS
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles (Replacing Perfis)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    tier VARCHAR(50) DEFAULT 'FREE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Accounts (New Entity)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type account_type NOT NULL,
    currency CHAR(3) DEFAULT 'BRL',
    initial_balance NUMERIC(15, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 5. Categories (New Entity)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nullable for global defaults
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    is_system_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name) -- Prevent duplicates per user
);

-- 6. Transactions (Replacing Transacoes)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    
    amount NUMERIC(15, 2) NOT NULL CHECK (amount <> 0),
    type transaction_type NOT NULL,
    description VARCHAR(255),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    is_recurring BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'confirmed', -- confirmed, pending_review
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON public.transactions USING GIN (metadata);

-- 7. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs USING BRIN (performed_at);

-- 8. Analytics Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_monthly_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    type,
    category_id,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM public.transactions
GROUP BY user_id, DATE_TRUNC('month', date), type, category_id
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mat_view_lookup ON public.analytics_monthly_summary(user_id, month, type, category_id);

-- 9. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can verify their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can see their own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can see their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can see, create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can select own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
