-- Migration: Add Reliability & HITL Columns
-- Run this in Supabase SQL Editor

ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS raw_ai_metadata JSONB DEFAULT '{}'::jsonb;

-- Index for querying low confidence items easily
CREATE INDEX IF NOT EXISTS idx_transacoes_confidence ON transacoes(confidence_score);
CREATE INDEX IF NOT EXISTS idx_transacoes_validated ON transacoes(is_validated);
