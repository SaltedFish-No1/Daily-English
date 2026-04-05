-- Email Verifications table: stores OTP codes and password reset tokens.
-- Accessed only via service role (supabaseAdmin), no user-facing RLS policies needed.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS email_verifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  used        BOOLEAN NOT NULL DEFAULT false,
  attempts    INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_lookup
  ON email_verifications (email, used, expires_at);

ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS policies: this table is accessed exclusively
-- via supabaseAdmin (service role), which bypasses RLS by default.
