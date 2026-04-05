-- Saved Words table: stores user's bookmarked vocabulary from lessons.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS saved_words (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word             TEXT NOT NULL,
  lesson_slug      TEXT NOT NULL,
  lesson_title     TEXT,
  paragraph_index  INT NOT NULL,
  saved_at         BIGINT NOT NULL,
  surface          TEXT,
  sense_headword   TEXT,
  sense_pos        TEXT,
  sense_def        TEXT,
  sense_def_zh     TEXT,
  sense_phonetic   TEXT,
  sense_audio      TEXT,
  UNIQUE(user_id, word, lesson_slug, paragraph_index)
);

CREATE INDEX IF NOT EXISTS idx_saved_words_user ON saved_words (user_id);

ALTER TABLE saved_words ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own saved_words'
  ) THEN
    CREATE POLICY "Users read own saved_words"
      ON saved_words FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own saved_words'
  ) THEN
    CREATE POLICY "Users insert own saved_words"
      ON saved_words FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users update own saved_words'
  ) THEN
    CREATE POLICY "Users update own saved_words"
      ON saved_words FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own saved_words'
  ) THEN
    CREATE POLICY "Users delete own saved_words"
      ON saved_words FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
