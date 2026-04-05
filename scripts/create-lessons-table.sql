-- 课程数据库表结构（完全规范化，每个字段只存一次）
-- Run this in the Supabase SQL editor.

-- ==========================================================================
-- 1. 主表：课程元数据 + 文章标题 + 语音开关
-- ==========================================================================
CREATE TABLE IF NOT EXISTS lessons (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,          -- 日期字符串，如 "2026-04-02"
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,
  teaser          TEXT NOT NULL,
  tag             TEXT NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('A1','A2','B1','B2','C1','C2')),
  published       BOOLEAN NOT NULL DEFAULT true,
  featured        BOOLEAN NOT NULL DEFAULT false,
  speech_enabled  BOOLEAN NOT NULL DEFAULT true,
  article_title   TEXT NOT NULL,                 -- article.title（可能与 title 不同）
  quiz_title      TEXT NOT NULL DEFAULT 'Knowledge Check',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons (published, slug DESC);

-- ==========================================================================
-- 2. 文章段落表
-- ==========================================================================
CREATE TABLE IF NOT EXISTS lesson_paragraphs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position    SMALLINT NOT NULL,               -- 段落顺序 0, 1, 2, ...
  key         TEXT NOT NULL,                   -- 段落标识 "p1", "p2", ...
  en          TEXT NOT NULL,
  zh          TEXT NOT NULL,
  UNIQUE(lesson_id, position)
);

CREATE INDEX IF NOT EXISTS idx_paragraphs_lesson ON lesson_paragraphs (lesson_id, position);

-- ==========================================================================
-- 3. 重点词表
-- ==========================================================================
CREATE TABLE IF NOT EXISTS lesson_focus_words (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position    SMALLINT NOT NULL,               -- 词条顺序
  key         TEXT NOT NULL,                   -- 标准形式
  forms       TEXT[] NOT NULL,                 -- 词形变化数组
  UNIQUE(lesson_id, position)
);

CREATE INDEX IF NOT EXISTS idx_focus_words_lesson ON lesson_focus_words (lesson_id, position);

-- ==========================================================================
-- 4. 测验题表（多态：公共字段为列，题型特有数据为 payload）
-- ==========================================================================
CREATE TABLE IF NOT EXISTS lesson_quiz_questions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position        SMALLINT NOT NULL,           -- 题目顺序
  question_key    TEXT NOT NULL,                -- "q-1", "q-2", ...
  question_type   TEXT NOT NULL,                -- tfng, matching_headings, completion, ...
  prompt          TEXT NOT NULL,
  rationale_en    TEXT,
  rationale_zh    TEXT,
  evidence_refs   TEXT[],                       -- ["Paragraph A", "Paragraph B"]
  payload         JSONB NOT NULL DEFAULT '{}',  -- 题型特有字段
  UNIQUE(lesson_id, position)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson ON lesson_quiz_questions (lesson_id, position);

-- ==========================================================================
-- 5. RLS 策略
-- ==========================================================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_paragraphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_focus_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_quiz_questions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- lessons: 公开读取已发布课程
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published lessons') THEN
    CREATE POLICY "Public read published lessons"
      ON lessons FOR SELECT USING (published = true);
  END IF;

  -- 子表：通过 lesson_id 关联判断是否已发布
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read lesson paragraphs') THEN
    CREATE POLICY "Public read lesson paragraphs"
      ON lesson_paragraphs FOR SELECT
      USING (EXISTS (SELECT 1 FROM lessons WHERE lessons.id = lesson_paragraphs.lesson_id AND lessons.published = true));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read lesson focus words') THEN
    CREATE POLICY "Public read lesson focus words"
      ON lesson_focus_words FOR SELECT
      USING (EXISTS (SELECT 1 FROM lessons WHERE lessons.id = lesson_focus_words.lesson_id AND lessons.published = true));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read lesson quiz questions') THEN
    CREATE POLICY "Public read lesson quiz questions"
      ON lesson_quiz_questions FOR SELECT
      USING (EXISTS (SELECT 1 FROM lessons WHERE lessons.id = lesson_quiz_questions.lesson_id AND lessons.published = true));
  END IF;
END
$$;
