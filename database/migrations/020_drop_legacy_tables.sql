-- ATENÇÃO: RUN THIS IN SUPABASE SQL EDITOR AFTER DEPLOYING FRONTEND
-- Script to safely drop legacy tables now that the Next.js Dashboard
-- and Node.js Bot are correctly using `profiles` and `transactions`

DROP TABLE IF EXISTS public.transacoes CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;

-- Note: CASCADE will also drop any foreign keys, views, or functions 
-- that strictly depend on these old tables.
