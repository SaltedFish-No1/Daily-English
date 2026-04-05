-- Dictionary Cache table: caches word definitions and TTS audio URLs.
-- Accessed only via service role (supabaseAdmin), no user-facing RLS policies needed.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS dictionary_cache (
  word        TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  audio_url   TEXT,
  source      TEXT NOT NULL DEFAULT 'cache',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dictionary_cache ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS policies: this table is accessed exclusively
-- via supabaseAdmin (service role), which bypasses RLS by default.
