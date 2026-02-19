-- Força a atualização do perfil para testar o Onboarding (Passo 5)
-- ID obtido dos logs: f7e866bb-3980-40e5-8b8a-54b8e70f380d

UPDATE perfis
SET 
    monthly_income = 5000.00,
    savings_goal = 1000.00,
    onboarding_completed = TRUE
WHERE id = 'f7e866bb-3980-40e5-8b8a-54b8e70f380d';
