-- Migration: Add Discount Columns (Option C)
-- -------------------------------------------------------------
-- DESCRIÇÃO: Adiciona colunas para controle financeiro (gross_amount e discount_amount).
-- -------------------------------------------------------------

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15, 2) DEFAULT 0.00;

-- Optional: constraint to ensure logic consistency (discount should be >= 0)
ALTER TABLE public.transactions
ADD CONSTRAINT check_discount_positive CHECK (discount_amount >= 0);
