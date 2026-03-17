-- Execute este script no SQL Editor do Supabase 
-- APENAS SE você já tiver rodado a migração 018 antiga antes da correção do erro Forbidden.

-- Atualizar Policies da Tabela
DROP POLICY IF EXISTS "Admins can view all shared links" ON public.shared_invite_links;
CREATE POLICY "Admins can view all shared links"
    ON public.shared_invite_links
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = created_by OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

DROP POLICY IF EXISTS "Admins can insert shared links" ON public.shared_invite_links;
CREATE POLICY "Admins can insert shared links"
    ON public.shared_invite_links
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = created_by OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

DROP POLICY IF EXISTS "Admins can update shared links" ON public.shared_invite_links;
CREATE POLICY "Admins can update shared links"
    ON public.shared_invite_links
    FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = created_by OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Atualiza a referência de role na Function
CREATE OR REPLACE FUNCTION public.consume_shared_link(link_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  link_record RECORD;
BEGIN
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

  UPDATE public.shared_invite_links
  SET used_count = used_count + 1
  WHERE id = link_record.id;
  
  IF link_record.max_uses IS NOT NULL AND (link_record.used_count + 1) >= link_record.max_uses THEN
    UPDATE public.shared_invite_links
    SET is_active = false
    WHERE id = link_record.id;
  END IF;

  RETURN jsonb_build_object('success', true, 'link_id', link_record.id, 'role', link_record.role);
END;
$$;
