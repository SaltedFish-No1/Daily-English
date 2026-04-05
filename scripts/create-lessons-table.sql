-- Create lessons table for storing daily English lesson data.
-- Run this in the Supabase SQL editor.
--
-- 设计原则：结构化列存元数据（可查询/筛选），content JSONB 仅存课程内容
-- （article, quiz, focusWords, speech），避免数据冗余。

CREATE TABLE IF NOT EXISTS lessons (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  teaser      TEXT NOT NULL,
  tag         TEXT NOT NULL,
  difficulty  TEXT NOT NULL CHECK (difficulty IN ('A1','A2','B1','B2','C1','C2')),
  published   BOOLEAN NOT NULL DEFAULT true,
  featured    BOOLEAN NOT NULL DEFAULT false,
  speech_enabled BOOLEAN NOT NULL DEFAULT true,
  article     JSONB NOT NULL,                -- { title, paragraphs[] }
  focus_words JSONB NOT NULL,                -- FocusWord[]
  quiz        JSONB NOT NULL,                -- { title, questions[] }
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons (published, slug DESC);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read published lessons'
  ) THEN
    CREATE POLICY "Public read published lessons"
      ON lessons FOR SELECT
      USING (published = true);
  END IF;
END
$$;
