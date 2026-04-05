-- Word Review States table: spaced repetition (SM-2) tracking per user.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS word_review_states (
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word             TEXT NOT NULL,
  interval_days    NUMERIC NOT NULL DEFAULT 0,
  easiness         NUMERIC NOT NULL DEFAULT 2.5,
  repetition       INT NOT NULL DEFAULT 0,
  next_review_at   BIGINT NOT NULL DEFAULT 0,
  last_reviewed_at BIGINT,
  total_reviews    INT NOT NULL DEFAULT 0,
  total_correct    INT NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','learning','reviewing','mastered')),
  PRIMARY KEY (user_id, word)
);

ALTER TABLE word_review_states ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own word_review_states'
  ) THEN
    CREATE POLICY "Users read own word_review_states"
      ON word_review_states FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own word_review_states'
  ) THEN
    CREATE POLICY "Users insert own word_review_states"
      ON word_review_states FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users update own word_review_states'
  ) THEN
    CREATE POLICY "Users update own word_review_states"
      ON word_review_states FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
