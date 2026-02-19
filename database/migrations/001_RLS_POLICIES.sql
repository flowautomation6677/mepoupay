-- SQL para Configuração de RLS (Row Level Security) no Supabase
-- OBJETIVO: Garantir que usuários só acessem seus próprios dados.

-- 1. Habilitar RLS nas tabelas principais
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- 2. Política para o BOT (Service Role)
-- IMPORTANTE: O Bot agora usa a 'Service Role Key' (Admin), então ele IGNORA o RLS automaticamente.
-- Isso permite que o Bot leia/escreva dados de qualquer usuário sem bloqueios.
-- Não precisa criar política para o Service Role.

-- 3. Política para o DASHBOARD (Usuário Público/Logado)
-- Esta política protege os dados quando acessados via 'anon' key (Frontend/Dashboard).

-- Cenário: 'transacoes' tem uma coluna 'user_id' que aponta para 'perfis.id'.
-- Precisamos garantir que o 'perfis.id' pertença ao usuário logado (auth.uid()).

-- Passo A: Adicione uma coluna 'owner_id' na tabela 'perfis' para linkar ao Supabase Auth
-- (Execute apenas se ainda não existir)
-- ALTER TABLE perfis ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Passo B: Crie a política de leitura
CREATE POLICY "Users can view own transactions"
ON transacoes
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM perfis 
    WHERE owner_id = auth.uid()
  )
);

-- Passo C: Política para Perfil
CREATE POLICY "Users can view own profile"
ON perfis
FOR SELECT
USING (owner_id = auth.uid());

-- 4. Função de Máscara de Dados (Opcional - Camada Extra)
-- Remove cartões de crédito antes de salvar no banco
CREATE OR REPLACE FUNCTION mask_sensitive_data() RETURNS TRIGGER AS $$
BEGIN
  -- Regex para mascarar cartão em 'descricao' (4 blocos de 4 digitos)
  NEW.descricao := REGEXP_REPLACE(NEW.descricao, '\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CARD REDACTED]', 'g');
  -- Regex para CPF (formatação básica)
  NEW.descricao := REGEXP_REPLACE(NEW.descricao, '\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b', '[CPF REDACTED]', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ativar Trigger
DROP TRIGGER IF EXISTS trigger_mask_sensitive ON transacoes;
CREATE TRIGGER trigger_mask_sensitive
BEFORE INSERT OR UPDATE ON transacoes
FOR EACH ROW EXECUTE FUNCTION mask_sensitive_data();
