-- Política para permitir que Admins vejam TODOS os perfis
-- (Padrão RLS geralmente bloqueia ver dados de outros)

-- 1. Habilitar RLS na tabela (caso não esteja, mas provavelmente está)
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- 2. Criar política de leitura irrestrita para Admins
CREATE POLICY "Admins can view all profiles"
ON perfis
FOR SELECT
USING (
  (SELECT is_admin FROM perfis WHERE auth_user_id = auth.uid()) = TRUE
);

-- 3. (Opcional) Política para Admins DELETAREM usuários
CREATE POLICY "Admins can delete users"
ON perfis
FOR DELETE
USING (
   (SELECT is_admin FROM perfis WHERE auth_user_id = auth.uid()) = TRUE
);
