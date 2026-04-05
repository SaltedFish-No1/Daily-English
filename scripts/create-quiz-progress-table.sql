-- Quiz Progress table: stores in-progress quiz state per user.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS quiz_progress (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persist_key  TEXT NOT NULL,
  state        JSONB NOT NULL,
  PRIMARY KEY (user_id, persist_key)
);

ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own quiz_progress'
  ) THEN
    CREATE POLICY "Users read own quiz_progress"
      ON quiz_progress FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own quiz_progress'
  ) THEN
    CREATE POLICY "Users insert own quiz_progress"
      ON quiz_progress FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users update own quiz_progress'
  ) THEN
    CREATE POLICY "Users update own quiz_progress"
      ON quiz_progress FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own quiz_progress'
  ) THEN
    CREATE POLICY "Users delete own quiz_progress"
      ON quiz_progress FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
