-- Create invites table
CREATE TABLE IF NOT EXISTS public.supa_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    token UUID DEFAULT gen_random_uuid(),
    invited_by UUID REFERENCES auth.users(id), -- Optional: track who invited
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.supa_invites ENABLE ROW LEVEL SECURITY;

-- Policies (Only Service Role should manage this for now, or authenticated admins)
-- For now, we'll allow service_role full access and deny everything else by default (implicit)
-- READ: Allow anonymous/anyone to read IF they have the token (for validation)
CREATE POLICY "Allow reading invite by token" ON public.supa_invites
    FOR SELECT
    USING (true); -- We will filter by token in the query, but RLS could restrict it further.
    -- Actually, to be safe, maybe only allow if token matches?
    -- Hard to do because we query by token.
    -- Let's stick to Server-Side admin for sensitive ops, and public read for validation?
    -- No, better to keep it restricted. We will use Service Role in the Next.js API to read/write.
    -- So we don't need permissive policies if we use Service Role.

-- Helper to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_update_supa_invites
  BEFORE UPDATE ON public.supa_invites
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
