-- Lesson History table: stores quiz completion records per user.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS lesson_history (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  score         INT NOT NULL,
  total         INT NOT NULL,
  completed_at  BIGINT NOT NULL,
  PRIMARY KEY (user_id, slug)
);

ALTER TABLE lesson_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own lesson_history'
  ) THEN
    CREATE POLICY "Users read own lesson_history"
      ON lesson_history FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own lesson_history'
  ) THEN
    CREATE POLICY "Users insert own lesson_history"
      ON lesson_history FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users update own lesson_history'
  ) THEN
    CREATE POLICY "Users update own lesson_history"
      ON lesson_history FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
