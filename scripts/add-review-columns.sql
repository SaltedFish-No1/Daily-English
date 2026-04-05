-- 为 lessons 表添加复习课程支持
-- Run this in the Supabase SQL editor.

-- ==========================================================================
-- 1. 添加列：user_id, is_review, review_words
-- ==========================================================================
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_review BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS review_words TEXT[] DEFAULT '{}';

-- ==========================================================================
-- 2. 调整 date UNIQUE 约束：仅对非复习课程生效
--    复习课程同一天可以多次生成，不受 date 唯一约束限制。
-- ==========================================================================
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS lessons_date_unique_non_review ON lessons (date) WHERE is_review = false;

-- ==========================================================================
-- 3. 索引：按用户查询复习课程
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_lessons_user_review ON lessons (user_id, created_at DESC) WHERE is_review = true;

-- ==========================================================================
-- 4. RLS 策略：用户可以读取 / 插入自己的复习课程
-- ==========================================================================
DO $$
BEGIN
  -- 用户读取自己的复习课程
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own review lessons') THEN
    CREATE POLICY "Users read own review lessons"
      ON lessons FOR SELECT
      USING (is_review = true AND user_id = auth.uid());
  END IF;

  -- 用户读取自己复习课程的段落
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own review paragraphs') THEN
    CREATE POLICY "Users read own review paragraphs"
      ON lesson_paragraphs FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.id = lesson_paragraphs.lesson_id
          AND lessons.is_review = true
          AND lessons.user_id = auth.uid()
      ));
  END IF;

  -- 用户读取自己复习课程的重点词
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own review focus words') THEN
    CREATE POLICY "Users read own review focus words"
      ON lesson_focus_words FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.id = lesson_focus_words.lesson_id
          AND lessons.is_review = true
          AND lessons.user_id = auth.uid()
      ));
  END IF;

  -- 用户读取自己复习课程的测验题
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own review quiz questions') THEN
    CREATE POLICY "Users read own review quiz questions"
      ON lesson_quiz_questions FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM lessons
        WHERE lessons.id = lesson_quiz_questions.lesson_id
          AND lessons.is_review = true
          AND lessons.user_id = auth.uid()
      ));
  END IF;
END
$$;
