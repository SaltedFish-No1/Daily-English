-- Create lessons table for storing daily English lesson data.
-- Run this in the Supabase SQL editor.

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
  content     JSONB NOT NULL,
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
