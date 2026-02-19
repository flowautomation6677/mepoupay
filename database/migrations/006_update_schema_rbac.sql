-- Adiciona a coluna de administrador na tabela de perfis
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- (Opcional) Define um usuário inicial como admin
-- UPDATE perfis SET is_admin = TRUE WHERE whatsapp_number = 'SEU_NUMERO';
