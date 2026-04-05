-- Writing Drafts table: syncs current writing draft across devices.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS writing_drafts (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id         TEXT,
  draft_text       TEXT NOT NULL DEFAULT '',
  updated_at       BIGINT NOT NULL DEFAULT 0
);

ALTER TABLE writing_drafts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own drafts'
  ) THEN
    CREATE POLICY "Users read own drafts"
      ON writing_drafts FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own drafts'
  ) THEN
    CREATE POLICY "Users insert own drafts"
      ON writing_drafts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users update own drafts'
  ) THEN
    CREATE POLICY "Users update own drafts"
      ON writing_drafts FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
