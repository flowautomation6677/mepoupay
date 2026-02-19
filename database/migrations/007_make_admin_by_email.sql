-- Atualiza o perfil para ADMIN baseando-se no email do Supabase Auth
UPDATE perfis
SET is_admin = TRUE
WHERE auth_user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'luizantonio6677@gmail.com'
);

-- Verifica se deu certo (Opcional)
-- SELECT * FROM perfis WHERE is_admin = TRUE;
