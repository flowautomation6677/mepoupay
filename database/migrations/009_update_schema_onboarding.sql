-- Adiciona colunas para o fluxo de Onboarding
ALTER TABLE perfis 
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS savings_goal DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- (Opcional) Trigger para garantir que usuários criados via Auth tenham perfil?
-- Geralmente já existe 'handle_new_user', mas vamos garantir que o onboarding comece como FALSE.
