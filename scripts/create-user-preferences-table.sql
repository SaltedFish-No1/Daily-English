-- User Preferences table: syncs user settings across devices.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url       TEXT NOT NULL DEFAULT '',
  nickname         TEXT NOT NULL DEFAULT '薄荷学员',
  exam_goal        TEXT NOT NULL DEFAULT 'ielts',
  learning_lang    TEXT NOT NULL DEFAULT 'en',
  daily_goal       INT  NOT NULL DEFAULT 1,
  difficulty_pref  TEXT NOT NULL DEFAULT 'auto',
  updated_at       BIGINT NOT NULL DEFAULT 0
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own preferences'
  ) THEN
    CREATE POLICY "Users read own preferences"
      ON user_preferences FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own preferences'
  ) THEN
    CREATE POLICY "Users insert own preferences"
      ON user_preferences FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users update own preferences'
  ) THEN
    CREATE POLICY "Users update own preferences"
      ON user_preferences FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
