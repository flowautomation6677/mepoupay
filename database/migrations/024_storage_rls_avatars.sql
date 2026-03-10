-- Remover as políticas caso já existam para evitar conflito na criação
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete to Avatars" ON storage.objects;

-- Select (Público) -> Qualquer pessoa pode ver os avatares (necessário para o fallback publicUrl funcionar corretamente)
CREATE POLICY "Public Access to Avatars" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- Insert (Autenticado) -> Qualquer usuário logado pode fazer upload
CREATE POLICY "Authenticated Upload to Avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Update (Autenticado) -> Necessário caso sobrescrevam arquivos num futuro
CREATE POLICY "Authenticated Update to Avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars');

-- Delete (Autenticado) -> Permite apagar a foto para limpar storage depois
CREATE POLICY "Authenticated Delete to Avatars" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars');
