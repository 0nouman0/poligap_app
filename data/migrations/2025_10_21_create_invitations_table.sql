-- Migration: create invitations table
-- Run this against your Postgres (Supabase) to add invitations support

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  token text NOT NULL DEFAULT gen_random_uuid()::text,
  sent_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure we don't insert duplicate invitations for same email
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_email ON invitations(LOWER(email));

-- Trigger to update updated_at on row change
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_timestamp ON invitations;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON invitations
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
