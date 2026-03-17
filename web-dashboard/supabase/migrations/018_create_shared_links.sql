-- Migração 018: Tabela de Links de Convite Compartilhados

CREATE TABLE IF NOT EXISTS public.shared_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID DEFAULT gen_random_uuid() UNIQUE,
    created_by UUID REFERENCES auth.users(id), -- Quem gerou o link
    role TEXT DEFAULT 'user', -- Qual papel o usuário terá ao se cadastrar
    max_uses INT DEFAULT 1, -- Limite de pessoas que podem usar o link (NULL = Ilimitado)
    used_count INT DEFAULT 0, -- Quantas pessoas já usaram
    expires_at TIMESTAMPTZ, -- (NULL = Sem expiração)
    is_active BOOLEAN DEFAULT true, -- Permite desativar o link manualmente
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.shared_invite_links ENABLE ROW LEVEL SECURITY;

-- Exemplo RLS Polices:
-- Admins (ou quem criou) podem visualizar e gerenciar:
CREATE POLICY "Admins can view all shared links"
    ON public.shared_invite_links
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = created_by OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert shared links"
    ON public.shared_invite_links
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = created_by AND
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update shared links"
    ON public.shared_invite_links
    FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = created_by OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Serviço / Auth public route can select valid token (we'll query using Service Role so this policy is optional, but good for Client-Side validation if needed)
CREATE POLICY "Public can view active links by token"
    ON public.shared_invite_links
    FOR SELECT
    TO anon, authenticated
    USING (
      is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (max_uses IS NULL OR used_count < max_uses)
    );

-- Trigger de updated_at
CREATE TRIGGER on_update_shared_invite_links
  BEFORE UPDATE ON public.shared_invite_links
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RPC for atomic consumption (Race Condition protection)
CREATE OR REPLACE FUNCTION public.consume_shared_link(link_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  link_record RECORD;
BEGIN
  -- Locking the row to prevent race conditions
  SELECT * INTO link_record
  FROM public.shared_invite_links
  WHERE token = link_token AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found_or_inactive');
  END IF;

  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  IF link_record.max_uses IS NOT NULL AND link_record.used_count >= link_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'reason', 'limit_reached');
  END IF;

  -- Consume one use
  UPDATE public.shared_invite_links
  SET used_count = used_count + 1
  WHERE id = link_record.id;
  
  -- If it hit the limit AFTER this use, deactivate it
  IF link_record.max_uses IS NOT NULL AND (link_record.used_count + 1) >= link_record.max_uses THEN
    UPDATE public.shared_invite_links
    SET is_active = false
    WHERE id = link_record.id;
  END IF;

  RETURN jsonb_build_object('success', true, 'link_id', link_record.id, 'role', link_record.role);
END;
$$;
