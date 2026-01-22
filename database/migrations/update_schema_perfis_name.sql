-- Add 'name' column to 'perfis' table if it doesn't exist
ALTER TABLE perfis 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Optional: Update existing rows with a placeholder if needed, or leave null.
-- We can try to backfill from Auth Metadata if possible, but for now just schema.
