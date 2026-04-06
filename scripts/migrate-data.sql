-- ==========================================================================
-- 数据迁移脚本：从旧表结构迁移到新表结构
-- 在 create-all-tables.sql 之前运行（旧表仍存在时）
-- ==========================================================================

-- ==========================================================================
-- 1. 迁移 lessons: 将子表数据合并为 JSONB 列
-- ==========================================================================
-- 先添加 JSONB 列（如果旧 lessons 表还存在）
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS paragraphs JSONB NOT NULL DEFAULT '[]';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS focus_words JSONB NOT NULL DEFAULT '[]';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS quiz_questions JSONB NOT NULL DEFAULT '[]';

-- 填充 paragraphs
UPDATE lessons SET paragraphs = COALESCE((
  SELECT json_agg(
    json_build_object('key', lp.key, 'en', lp.en, 'zh', lp.zh)
    ORDER BY lp.position
  )
  FROM lesson_paragraphs lp WHERE lp.lesson_id = lessons.id
), '[]'::json);

-- 填充 focus_words
UPDATE lessons SET focus_words = COALESCE((
  SELECT json_agg(
    json_build_object('key', lfw.key, 'forms', lfw.forms)
    ORDER BY lfw.position
  )
  FROM lesson_focus_words lfw WHERE lfw.lesson_id = lessons.id
), '[]'::json);

-- 填充 quiz_questions
UPDATE lessons SET quiz_questions = COALESCE((
  SELECT json_agg(
    json_build_object(
      'question_key', lqq.question_key,
      'question_type', lqq.question_type,
      'prompt', lqq.prompt,
      'rationale_en', lqq.rationale_en,
      'rationale_zh', lqq.rationale_zh,
      'evidence_refs', lqq.evidence_refs,
      'payload', lqq.payload
    )
    ORDER BY lqq.position
  )
  FROM lesson_quiz_questions lqq WHERE lqq.lesson_id = lessons.id
), '[]'::json);

-- ==========================================================================
-- 2. 迁移 dictionary_cache → words
-- ==========================================================================
CREATE TABLE IF NOT EXISTS words (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word        TEXT NOT NULL UNIQUE,
  phonetic    TEXT,
  audio_url   TEXT,
  meanings    JSONB NOT NULL DEFAULT '[]',
  source      TEXT NOT NULL DEFAULT 'cache',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO words (word, audio_url, meanings, source, updated_at)
SELECT
  dc.word,
  dc.audio_url,
  -- 从 data JSONB 中提取 meanings（data 存储的是 DictionaryEntry[] 格式）
  COALESCE(dc.data, '[]'::jsonb),
  dc.source,
  dc.updated_at
FROM dictionary_cache dc
ON CONFLICT (word) DO NOTHING;

-- ==========================================================================
-- 3. 迁移 saved_words + word_review_states → user_words
-- ==========================================================================
CREATE TABLE IF NOT EXISTS user_words (
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id          UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  occurrences      JSONB NOT NULL DEFAULT '[]',
  interval_days    NUMERIC NOT NULL DEFAULT 1,
  easiness         NUMERIC NOT NULL DEFAULT 2.5,
  repetition       INT NOT NULL DEFAULT 0,
  next_review_at   BIGINT NOT NULL DEFAULT 0,
  last_reviewed_at BIGINT,
  total_reviews    INT NOT NULL DEFAULT 0,
  total_correct    INT NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','learning','reviewing','mastered')),
  PRIMARY KEY (user_id, word_id)
);

-- 首先确保所有 saved_words 中的单词存在于 words 表中
INSERT INTO words (word, phonetic, audio_url, meanings, source)
SELECT DISTINCT
  COALESCE(sw.sense_headword, sw.word),
  sw.sense_phonetic,
  sw.sense_audio,
  CASE
    WHEN sw.sense_pos IS NOT NULL THEN
      json_build_array(json_build_object(
        'pos', sw.sense_pos,
        'def', sw.sense_def,
        'def_zh', sw.sense_def_zh
      ))::jsonb
    ELSE '[]'::jsonb
  END,
  'cache'
FROM saved_words sw
WHERE NOT EXISTS (
  SELECT 1 FROM words w WHERE w.word = COALESCE(sw.sense_headword, sw.word)
)
ON CONFLICT (word) DO NOTHING;

-- 合并 saved_words（按 user_id + word 分组为 occurrences）与 word_review_states
INSERT INTO user_words (user_id, word_id, occurrences, interval_days, easiness, repetition, next_review_at, last_reviewed_at, total_reviews, total_correct, status)
SELECT
  sw_grouped.user_id,
  w.id AS word_id,
  sw_grouped.occurrences,
  COALESCE(wrs.interval_days, 1),
  COALESCE(wrs.easiness, 2.5),
  COALESCE(wrs.repetition, 0),
  COALESCE(wrs.next_review_at, 0),
  wrs.last_reviewed_at,
  COALESCE(wrs.total_reviews, 0),
  COALESCE(wrs.total_correct, 0),
  COALESCE(wrs.status, 'new')
FROM (
  SELECT
    sw.user_id,
    COALESCE(sw.sense_headword, sw.word) AS headword,
    json_agg(json_build_object(
      'lesson_slug', sw.lesson_slug,
      'lesson_title', sw.lesson_title,
      'paragraph_index', sw.paragraph_index,
      'saved_at', sw.saved_at,
      'surface', sw.surface
    ))::jsonb AS occurrences
  FROM saved_words sw
  GROUP BY sw.user_id, COALESCE(sw.sense_headword, sw.word)
) sw_grouped
JOIN words w ON w.word = sw_grouped.headword
LEFT JOIN word_review_states wrs
  ON wrs.user_id = sw_grouped.user_id AND wrs.word = sw_grouped.headword
ON CONFLICT (user_id, word_id) DO NOTHING;

-- 也迁移那些在 word_review_states 中但不在 saved_words 中的记录
INSERT INTO user_words (user_id, word_id, interval_days, easiness, repetition, next_review_at, last_reviewed_at, total_reviews, total_correct, status)
SELECT
  wrs.user_id,
  w.id AS word_id,
  wrs.interval_days,
  wrs.easiness,
  wrs.repetition,
  wrs.next_review_at,
  wrs.last_reviewed_at,
  wrs.total_reviews,
  wrs.total_correct,
  wrs.status
FROM word_review_states wrs
JOIN words w ON w.word = wrs.word
WHERE NOT EXISTS (
  SELECT 1 FROM user_words uw WHERE uw.user_id = wrs.user_id AND uw.word_id = w.id
)
ON CONFLICT (user_id, word_id) DO NOTHING;

-- ==========================================================================
-- 4. 迁移 writing_grades → writing_submissions.grade
-- ==========================================================================
ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS grade JSONB;
ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS overall_score NUMERIC(3,1);

UPDATE writing_submissions ws SET
  grade = json_build_object(
    'dimension_scores', wg.dimension_scores,
    'grammar_errors', wg.grammar_errors,
    'vocabulary_suggestions', wg.vocabulary_suggestions,
    'overall_comment', wg.overall_comment,
    'model_answer', wg.model_answer,
    'strengths', wg.strengths,
    'improvements', wg.improvements,
    'graded_at', wg.created_at
  )::jsonb,
  overall_score = wg.overall_score
FROM writing_grades wg
WHERE wg.submission_id = ws.id;

-- ==========================================================================
-- 5. 清理旧表（谨慎操作，确认迁移成功后再执行）
-- ==========================================================================
-- DROP TABLE IF EXISTS lesson_quiz_questions CASCADE;
-- DROP TABLE IF EXISTS lesson_focus_words CASCADE;
-- DROP TABLE IF EXISTS lesson_paragraphs CASCADE;
-- DROP TABLE IF EXISTS dictionary_cache CASCADE;
-- DROP TABLE IF EXISTS saved_words CASCADE;
-- DROP TABLE IF EXISTS word_review_states CASCADE;
-- DROP TABLE IF EXISTS writing_grades CASCADE;
-- DROP TABLE IF EXISTS quiz_progress CASCADE;
-- DROP TABLE IF EXISTS writing_drafts CASCADE;
