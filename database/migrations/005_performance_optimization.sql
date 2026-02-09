-- Migration: Performance Optimization (Balance Trigger & Indexes)
-- -------------------------------------------------------------
-- DESCRIÇÃO: 
-- 1. Adiciona coluna 'current_balance' em accounts.
-- 2. Cria Trigger para manter 'current_balance' atualizado.
-- 3. Garante índices para RLS performático.
-- -------------------------------------------------------------

BEGIN;

-- 1. Add current_balance to accounts
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS current_balance NUMERIC(15, 2) DEFAULT 0.00;

-- Initialize current_balance with initial_balance + sum of transactions
UPDATE public.accounts a
SET current_balance = COALESCE(initial_balance, 0) + COALESCE((
    SELECT SUM(amount) 
    FROM public.transactions t 
    WHERE t.account_id = a.id
    AND t.type = 'INCOME'
), 0) - COALESCE((
    SELECT SUM(amount) 
    FROM public.transactions t 
    WHERE t.account_id = a.id
    AND t.type = 'EXPENSE'
), 0) - COALESCE((
    SELECT SUM(amount) 
    FROM public.transactions t 
    WHERE t.account_id = a.id
    AND t.type = 'TRANSFER' -- Assuming transfer out for now, or handle logic
), 0);

-- 2. Function to Update Balance
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.accounts
        SET current_balance = current_balance + 
            CASE 
                WHEN NEW.type = 'INCOME' THEN NEW.amount
                ELSE -NEW.amount
            END,
            updated_at = NOW()
        WHERE id = NEW.account_id;
        RETURN NEW;
    
    -- Handle DELETE
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.accounts
        SET current_balance = current_balance - 
            CASE 
                WHEN OLD.type = 'INCOME' THEN OLD.amount
                ELSE -OLD.amount
            END,
            updated_at = NOW()
        WHERE id = OLD.account_id;
        RETURN OLD;

    -- Handle UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Revert OLD, Apply NEW
        UPDATE public.accounts
        SET current_balance = current_balance 
            - (CASE WHEN OLD.type = 'INCOME' THEN OLD.amount ELSE -OLD.amount END)
            + (CASE WHEN NEW.type = 'INCOME' THEN NEW.amount ELSE -NEW.amount END),
            updated_at = NOW()
        WHERE id = NEW.account_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS trg_update_balance ON public.transactions;
CREATE TRIGGER trg_update_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- 4. Ensure Indexes for RLS (Already in 001 but reinforcing)
-- RLS uses: auth.uid() = user_id
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

COMMIT;
