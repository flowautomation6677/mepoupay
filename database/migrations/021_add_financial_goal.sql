-- Migration: Add Financial Goal
-- -------------------------------------------------------------
-- DESCRIÇÃO: Adiciona a coluna financial_goal na tabela profiles para corrigir erro no formulário de conta.
-- -------------------------------------------------------------

BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS financial_goal NUMERIC(15, 2) DEFAULT 0.00;

COMMIT;
