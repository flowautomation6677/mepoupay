-- RLS Policy para permitir que usuários atualizem seu próprio perfil (necessário para o /setup)
CREATE POLICY "Users can update own profile"
ON perfis
FOR UPDATE
USING (
  auth.uid() = auth_user_id
)
WITH CHECK (
  auth.uid() = auth_user_id
);
