-- Migration: Add WhatsApp Array (Max 2)
-- -------------------------------------------------------------
-- DESCRIÇÃO: Adiciona coluna whatsapp_numbers (Array) com limite de 2 itens.
-- -------------------------------------------------------------

BEGIN;

-- Remove singular column if it exists (cleanup)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS whatsapp;

-- Add Array column with Check Constraint
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_numbers TEXT[] DEFAULT '{}'::text[];

-- Add Constraint to ensure max 2 numbers
DO $$ BEGIN
    ALTER TABLE public.profiles
    ADD CONSTRAINT check_whatsapp_limit CHECK (cardinality(whatsapp_numbers) <= 2);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMIT;
