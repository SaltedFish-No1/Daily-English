-- ==========================================================================
-- Daily-English 数据库表结构（重构版：16 表 → 9 表）
-- Run this in the Supabase SQL editor.
-- ==========================================================================

-- ==========================================================================
-- 表 1: lessons（课程 + 段落 + 重点词 + 测验题）
-- 原 lesson_paragraphs / lesson_focus_words / lesson_quiz_questions 合并为 JSONB 列
-- ==========================================================================
DROP TABLE IF EXISTS lesson_quiz_questions CASCADE;
DROP TABLE IF EXISTS lesson_focus_words CASCADE;
DROP TABLE IF EXISTS lesson_paragraphs CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;

CREATE TABLE lessons (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date            TEXT NOT NULL,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,
  teaser          TEXT NOT NULL,
  tag             TEXT NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('A1','A2','B1','B2','C1','C2')),
  published       BOOLEAN NOT NULL DEFAULT true,
  featured        BOOLEAN NOT NULL DEFAULT false,
  speech_enabled  BOOLEAN NOT NULL DEFAULT true,
  article_title   TEXT NOT NULL,
  quiz_title      TEXT NOT NULL DEFAULT 'Knowledge Check',

  -- JSONB: [{key, en, zh}]
  paragraphs      JSONB NOT NULL DEFAULT '[]',
  -- JSONB: [{key, forms[]}]
  focus_words     JSONB NOT NULL DEFAULT '[]',
  -- JSONB: [{question_key, question_type, prompt, rationale_en, rationale_zh, evidence_refs[], payload}]
  quiz_questions  JSONB NOT NULL DEFAULT '[]',

  -- 复习课程支持
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_review       BOOLEAN NOT NULL DEFAULT false,
  review_words    TEXT[] DEFAULT '{}',

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons (published, date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS lessons_date_unique_non_review ON lessons (date) WHERE is_review = false;
CREATE INDEX IF NOT EXISTS idx_lessons_user_review ON lessons (user_id, created_at DESC) WHERE is_review = true;

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published lessons') THEN
    CREATE POLICY "Public read published lessons"
      ON lessons FOR SELECT USING (published = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own review lessons') THEN
    CREATE POLICY "Users read own review lessons"
      ON lessons FOR SELECT
      USING (is_review = true AND user_id = auth.uid());
  END IF;
END
$$;

-- ==========================================================================
-- 表 2: words（全局单词表，替代 dictionary_cache）
-- 所有查询过的单词信息统一存储，全局共享
-- ==========================================================================
DROP TABLE IF EXISTS dictionary_cache CASCADE;

CREATE TABLE words (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word        TEXT NOT NULL UNIQUE,
  phonetic    TEXT,
  audio_url   TEXT,
  -- JSONB: [{pos, def, def_zh, examples[]}]
  meanings    JSONB NOT NULL DEFAULT '[]',
  source      TEXT NOT NULL DEFAULT 'cache',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_words_word ON words (word);

-- words 表使用 service role 访问，不开放给普通用户直接操作
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 允许所有已认证用户读取单词（查词典需要）
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read words') THEN
    CREATE POLICY "Authenticated users can read words"
      ON words FOR SELECT
      USING (true);
  END IF;
END
$$;

-- ==========================================================================
-- 表 3: user_words（用户收藏 + SM-2 复习状态）
-- 合并 saved_words + word_review_states，通过 word_id 引用 words 表
-- ==========================================================================
DROP TABLE IF EXISTS saved_words CASCADE;
DROP TABLE IF EXISTS word_review_states CASCADE;

CREATE TABLE user_words (
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id          UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,

  -- 收藏记录: [{lesson_slug, lesson_title, paragraph_index, saved_at, surface}]
  occurrences      JSONB NOT NULL DEFAULT '[]',

  -- SM-2 间隔重复算法字段
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

CREATE INDEX IF NOT EXISTS idx_user_words_review
  ON user_words (user_id, status, next_review_at)
  WHERE status != 'mastered';

ALTER TABLE user_words ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own user_words') THEN
    CREATE POLICY "Users manage own user_words"
      ON user_words FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- ==========================================================================
-- 表 4: lesson_history（课程完成记录）
-- 保持不变
-- ==========================================================================
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own lesson_history') THEN
    CREATE POLICY "Users manage own lesson_history"
      ON lesson_history FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- ==========================================================================
-- 表 5: user_preferences（用户偏好设置）
-- 保持不变
-- ==========================================================================
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own user_preferences') THEN
    CREATE POLICY "Users manage own user_preferences"
      ON user_preferences FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- ==========================================================================
-- 表 6: grading_criteria（评分标准，种子数据）
-- 保持不变
-- ==========================================================================
CREATE TABLE IF NOT EXISTS grading_criteria (
  id              TEXT PRIMARY KEY,
  label           TEXT NOT NULL,
  description     TEXT,
  grading_prompt  TEXT NOT NULL,
  dimensions      JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE grading_criteria ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read grading_criteria') THEN
    CREATE POLICY "Public read grading_criteria"
      ON grading_criteria FOR SELECT
      USING (true);
  END IF;
END
$$;

-- Seed default grading criteria
INSERT INTO grading_criteria (id, label, description, grading_prompt, dimensions) VALUES
(
  'ielts_task2',
  'IELTS Task 2',
  'IELTS Academic Writing Task 2: Essay (250 words minimum)',
  E'You are a senior IELTS examiner. Grade this Task 2 essay using the official IELTS Writing Band Descriptors.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Response (TR)**: Does the response address all parts of the task? Is the position clear throughout? Are main ideas extended and supported?\n2. **Coherence and Cohesion (CC)**: Is information and ideas logically organized? Is there clear progression throughout? Are cohesive devices used effectively?\n3. **Lexical Resource (LR)**: Is there a wide range of vocabulary? Are less common lexical items used with awareness of style and collocation? Are there spelling errors?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a wide range of structures? Are sentences error-free? Is punctuation accurate?\n\nFor each criterion provide a band score and specific feedback referencing the student''s actual text. Identify concrete grammar errors with corrections. Suggest vocabulary upgrades. Write a model answer that would achieve Band 8+.',
  '[{"key":"task_response","label":"Task Response","maxScore":9,"description":"Addresses all parts of the task with a clear position, extended and supported ideas"},{"key":"coherence_cohesion","label":"Coherence & Cohesion","maxScore":9,"description":"Logical organization, clear progression, effective use of cohesive devices"},{"key":"lexical_resource","label":"Lexical Resource","maxScore":9,"description":"Wide range of vocabulary, awareness of style and collocation, minimal spelling errors"},{"key":"grammatical_range","label":"Grammatical Range & Accuracy","maxScore":9,"description":"Wide range of structures, error-free sentences, accurate punctuation"}]'
),
(
  'ielts_task1',
  'IELTS Task 1',
  'IELTS Academic Writing Task 1: Report on visual information (150 words minimum)',
  E'You are a senior IELTS examiner. Grade this Task 1 report using the official IELTS Writing Band Descriptors.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Achievement (TA)**: Does the response cover the requirements of the task? Is there a clear overview? Are key features selected and adequately described?\n2. **Coherence and Cohesion (CC)**: Is information logically organized? Is there clear progression? Are referencing and cohesive devices used effectively?\n3. **Lexical Resource (LR)**: Is vocabulary adequate for the task? Are less common words attempted? Are there spelling errors?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a mix of simple and complex sentences? Are grammar and punctuation accurate?\n\nFor each criterion provide a band score and specific feedback. Identify grammar errors with corrections. Suggest vocabulary upgrades. Write a model answer that would achieve Band 8+.',
  '[{"key":"task_achievement","label":"Task Achievement","maxScore":9,"description":"Covers task requirements, clear overview, key features selected and described"},{"key":"coherence_cohesion","label":"Coherence & Cohesion","maxScore":9,"description":"Logical organization, clear progression, effective cohesive devices"},{"key":"lexical_resource","label":"Lexical Resource","maxScore":9,"description":"Adequate vocabulary for the task, less common words attempted, minimal spelling errors"},{"key":"grammatical_range","label":"Grammatical Range & Accuracy","maxScore":9,"description":"Mix of simple and complex sentences, accurate grammar and punctuation"}]'
),
(
  'general_essay',
  'General Essay',
  'General English essay writing practice with flexible criteria',
  E'You are an experienced English writing teacher. Grade this essay holistically.\n\nEvaluate on four criteria, each scored 0-10:\n\n1. **Content & Ideas**: Are ideas relevant, well-developed, and supported with examples?\n2. **Organization**: Is there a clear introduction, body, and conclusion? Is the flow logical?\n3. **Language Use**: Is vocabulary varied and appropriate? Are grammar and sentence structures accurate?\n4. **Style & Tone**: Is the writing engaging? Is the tone appropriate for the task?\n\nProvide specific feedback for each criterion. Identify grammar errors with corrections. Suggest vocabulary improvements. Write a model response.',
  '[{"key":"content_ideas","label":"Content & Ideas","maxScore":10,"description":"Relevant, well-developed ideas supported with examples"},{"key":"organization","label":"Organization","maxScore":10,"description":"Clear structure with introduction, body, conclusion and logical flow"},{"key":"language_use","label":"Language Use","maxScore":10,"description":"Varied vocabulary, accurate grammar and sentence structures"},{"key":"style_tone","label":"Style & Tone","maxScore":10,"description":"Engaging writing with appropriate tone for the task"}]'
),
(
  'letter',
  'Letter Writing',
  'Formal or informal letter writing practice',
  E'You are an experienced English writing teacher. Grade this letter.\n\nEvaluate on four criteria, each scored 0-10:\n\n1. **Purpose & Content**: Does the letter achieve its purpose? Are all required points addressed?\n2. **Organization & Format**: Does it follow appropriate letter conventions? Is information logically arranged?\n3. **Language & Register**: Is the tone appropriate (formal/informal)? Is vocabulary and grammar suitable?\n4. **Communication Effect**: Would the letter achieve the desired effect on the reader?\n\nProvide specific feedback for each criterion. Identify grammar errors with corrections. Suggest vocabulary improvements. Write a model letter.',
  '[{"key":"purpose_content","label":"Purpose & Content","maxScore":10,"description":"Achieves purpose, addresses all required points"},{"key":"organization_format","label":"Organization & Format","maxScore":10,"description":"Follows letter conventions, logically arranged information"},{"key":"language_register","label":"Language & Register","maxScore":10,"description":"Appropriate tone, suitable vocabulary and grammar"},{"key":"communication_effect","label":"Communication Effect","maxScore":10,"description":"Achieves desired effect on the reader"}]'
),
(
  'ielts_gt_task1',
  'IELTS GT Task 1',
  'IELTS General Training Writing Task 1: Letter (150 words minimum)',
  E'You are a senior IELTS examiner. Grade this General Training Task 1 letter using the official IELTS Writing Band Descriptors for GT Task 1.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Achievement (TA)**: Does the letter fully address the task? Is the purpose clear? Is the tone consistent and appropriate?\n2. **Coherence and Cohesion (CC)**: Is the letter logically organized into clear paragraphs? Is there a natural progression of ideas?\n3. **Lexical Resource (LR)**: Is vocabulary sufficient and appropriate for the letter type? Are less common words attempted?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a mix of simple and complex sentence structures? Are grammar and punctuation accurate?\n\nFor each criterion provide a band score and specific feedback. Identify grammar errors with corrections. Suggest vocabulary upgrades. Write a model letter that would achieve Band 8+.',
  '[{"key":"task_achievement","label":"Task Achievement","maxScore":9,"description":"Fully addresses the task, clear purpose, appropriate and consistent tone, all bullet points covered"},{"key":"coherence_cohesion","label":"Coherence & Cohesion","maxScore":9,"description":"Logical paragraph organization, natural progression, effective cohesive devices"},{"key":"lexical_resource","label":"Lexical Resource","maxScore":9,"description":"Sufficient and appropriate vocabulary for letter type, less common words attempted"},{"key":"grammatical_range","label":"Grammatical Range & Accuracy","maxScore":9,"description":"Mix of simple and complex structures, accurate grammar and punctuation"}]'
),
(
  'ielts_gt_task2',
  'IELTS GT Task 2',
  'IELTS General Training Writing Task 2: Essay (250 words minimum)',
  E'You are a senior IELTS examiner. Grade this General Training Task 2 essay using the official IELTS Writing Band Descriptors.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Response (TR)**: Does the response address all parts of the task? Is the position clear?\n2. **Coherence and Cohesion (CC)**: Is the essay logically organized with clear paragraphing?\n3. **Lexical Resource (LR)**: Is there sufficient range of vocabulary? Are words used with precision?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a variety of sentence structures?\n\nFor each criterion provide a band score and specific feedback. Identify grammar errors with corrections. Suggest vocabulary upgrades. Write a model essay that would achieve Band 8+.',
  '[{"key":"task_response","label":"Task Response","maxScore":9,"description":"Addresses all parts of the task, clear position, extended and supported ideas"},{"key":"coherence_cohesion","label":"Coherence & Cohesion","maxScore":9,"description":"Logical organization with clear paragraphing, effective cohesive devices"},{"key":"lexical_resource","label":"Lexical Resource","maxScore":9,"description":"Sufficient range of vocabulary, precise word use, minimal spelling errors"},{"key":"grammatical_range","label":"Grammatical Range & Accuracy","maxScore":9,"description":"Variety of sentence structures, complex sentences attempted, rare grammatical errors"}]'
),
(
  'toefl_integrated',
  'TOEFL Integrated Writing',
  'TOEFL iBT Integrated Writing Task: Summarize how the lecture relates to the reading (150-225 words, 20 minutes)',
  E'You are a senior TOEFL examiner. Grade this Integrated Writing response using the official ETS TOEFL iBT Integrated Writing Rubric (0-5 scale).\n\nEvaluate on three criteria, each scored 0-5 in 0.5 increments:\n\n1. **Content Accuracy & Completeness**: Does the response accurately convey key points from both sources?\n2. **Organization & Coherence**: Is the response well-organized with a clear structure?\n3. **Language Use**: Is the language generally clear and accurate?\n\nFor each criterion provide a score and specific feedback. Identify grammar errors with corrections. Write a model response that would score 5.',
  '[{"key":"content_accuracy","label":"Content Accuracy & Completeness","maxScore":5,"description":"Accurately conveys key points from both sources, clearly explains relationships"},{"key":"organization_coherence","label":"Organization & Coherence","maxScore":5,"description":"Well-organized structure, effective comparison/contrast, smooth transitions"},{"key":"language_use","label":"Language Use","maxScore":5,"description":"Clear and accurate language, appropriate academic vocabulary, minimal errors"}]'
),
(
  'toefl_independent',
  'TOEFL Independent Writing (Legacy)',
  'TOEFL iBT Independent Writing Task: Express and support an opinion (300+ words, 30 minutes)',
  E'You are a senior TOEFL examiner. Grade this Independent Writing essay using the official ETS TOEFL iBT Independent Writing Rubric (0-5 scale).\n\nEvaluate on three criteria, each scored 0-5 in 0.5 increments:\n\n1. **Development & Support**: Is the essay well-developed with clear explanations and examples?\n2. **Organization**: Is there a clear thesis and well-structured paragraphs?\n3. **Language Use**: Does the writer demonstrate syntactic variety and accurate vocabulary?\n\nFor each criterion provide a score and specific feedback. Identify grammar errors with corrections. Write a model essay that would score 5.',
  '[{"key":"development_support","label":"Development & Support","maxScore":5,"description":"Well-developed argument with clear explanations, specific examples, and convincing support"},{"key":"organization","label":"Organization","maxScore":5,"description":"Clear thesis, well-structured paragraphs, effective transitions, unified and coherent"},{"key":"language_use","label":"Language Use","maxScore":5,"description":"Syntactic variety, precise vocabulary, accurate grammar and mechanics"}]'
),
(
  'toefl_academic_discussion',
  'TOEFL Academic Discussion',
  'TOEFL iBT Writing for an Academic Discussion: Contribute to an online discussion (100+ words, 10 minutes)',
  E'You are a senior TOEFL examiner. Grade this Academic Discussion response using the official ETS TOEFL iBT Writing for an Academic Discussion Rubric (0-5 scale).\n\nEvaluate on three criteria, each scored 0-5 in 0.5 increments:\n\n1. **Relevance & Contribution**: Does the response make a relevant and meaningful contribution?\n2. **Development & Elaboration**: Is the position clearly explained with specific details?\n3. **Language Use**: Is language clear and effective for academic discussion?\n\nFor each criterion provide a score and specific feedback. Identify grammar errors with corrections. Write a model response that would score 5.',
  '[{"key":"relevance_contribution","label":"Relevance & Contribution","maxScore":5,"description":"Relevant and meaningful contribution, clear position, engages with classmates ideas"},{"key":"development_elaboration","label":"Development & Elaboration","maxScore":5,"description":"Well-elaborated position with specific details, examples, and reasoning"},{"key":"language_use","label":"Language Use","maxScore":5,"description":"Clear and effective academic language, precise vocabulary, accurate grammar"}]'
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================================
-- 表 7: writing_topics（作文题目）
-- 保持不变
-- ==========================================================================
CREATE TABLE IF NOT EXISTS writing_topics (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL,
  title             TEXT,
  writing_prompt    TEXT NOT NULL,
  grading_criteria  TEXT NOT NULL REFERENCES grading_criteria(id),
  word_limit        INT,
  image_url         TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_writing_topics_user ON writing_topics (user_id, created_at DESC);

ALTER TABLE writing_topics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own writing_topics') THEN
    CREATE POLICY "Users read own writing_topics"
      ON writing_topics FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- ==========================================================================
-- 表 8: writing_submissions（作文提交 + 批改成绩）
-- 合并 writing_grades 为 JSONB grade 列
-- ==========================================================================
DROP TABLE IF EXISTS writing_grades CASCADE;

CREATE TABLE IF NOT EXISTS writing_submissions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id            UUID NOT NULL REFERENCES writing_topics(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL,
  attempt_number      INT NOT NULL DEFAULT 1,
  content             TEXT NOT NULL,
  content_image_url   TEXT,
  word_count          INT NOT NULL DEFAULT 0,
  time_spent_seconds  INT,
  input_method        TEXT NOT NULL DEFAULT 'typed',

  -- 批改结果（null 表示未批改）
  -- JSONB: {dimension_scores[], grammar_errors[], vocabulary_suggestions[], overall_comment, model_answer, strengths[], improvements[], graded_at}
  grade               JSONB,
  -- 冗余字段，方便查询排序（从 grade 中提取）
  overall_score       NUMERIC(3,1),

  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_writing_submissions_topic ON writing_submissions (topic_id, attempt_number);
CREATE INDEX IF NOT EXISTS idx_writing_submissions_user ON writing_submissions (user_id, created_at DESC);

ALTER TABLE writing_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own writing_submissions') THEN
    CREATE POLICY "Users read own writing_submissions"
      ON writing_submissions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- ==========================================================================
-- 表 9: email_verifications（邮箱验证 OTP）
-- 保持不变，service-role only
-- ==========================================================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  used        BOOLEAN NOT NULL DEFAULT false,
  attempts    INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_lookup
  ON email_verifications (email, used, expires_at);

ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- ==========================================================================
-- 清理不再需要的表
-- ==========================================================================
DROP TABLE IF EXISTS quiz_progress CASCADE;
DROP TABLE IF EXISTS writing_drafts CASCADE;
