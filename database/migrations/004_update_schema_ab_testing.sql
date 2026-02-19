-- Migration: Shadow Prompting (A/B Testing)
-- Run this in Supabase SQL Editor

ALTER TABLE public.transacoes 
ADD COLUMN IF NOT EXISTS prompt_version text DEFAULT 'v1_stable',
ADD COLUMN IF NOT EXISTS is_human_corrected boolean DEFAULT false;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_transacoes_prompt_version ON public.transacoes(prompt_version);
