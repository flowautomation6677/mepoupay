-- Adiciona a coluna avatar_url na tabela profiles (se não existir)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Opcional: Garante que o bucket avatars existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;
