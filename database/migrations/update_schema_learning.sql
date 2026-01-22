-- Migration: Learning Loop & Feedback
-- Run this in Supabase SQL Editor

-- 1. Tabela para armazenar o aprendizado (Input -> Erro -> Correção)
CREATE TABLE IF NOT EXISTS public.transaction_learning (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    original_input text, -- O que o usuário escreveu/falou
    ai_response jsonb,   -- O que a IA extraiu originalmente
    user_correction text, -- O que o usuário corrigiu (texto ou JSON)
    is_processed boolean DEFAULT false,
    confidence_at_time float
);

-- 2. Adicionar coluna de status na tabela principal de transações
ALTER TABLE public.transacoes 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed'; -- 'confirmed' ou 'pending_review'

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_learning_processed ON  public.transaction_learning(is_processed);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes(status);
