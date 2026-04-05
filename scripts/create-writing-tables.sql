-- Writing Practice tables: grading criteria, topics, submissions, grades.
-- Run this in the Supabase SQL editor.

-- 1. Grading criteria (evaluation standards)
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
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read grading_criteria'
  ) THEN
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
)
ON CONFLICT (id) DO NOTHING;

-- 2. Writing topics
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
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own writing_topics'
  ) THEN
    CREATE POLICY "Users read own writing_topics"
      ON writing_topics FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 3. Writing submissions
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
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_writing_submissions_topic ON writing_submissions (topic_id, attempt_number);
CREATE INDEX IF NOT EXISTS idx_writing_submissions_user ON writing_submissions (user_id, created_at DESC);

ALTER TABLE writing_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own writing_submissions'
  ) THEN
    CREATE POLICY "Users read own writing_submissions"
      ON writing_submissions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 4. Writing grades
CREATE TABLE IF NOT EXISTS writing_grades (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id           UUID NOT NULL UNIQUE REFERENCES writing_submissions(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL,
  overall_score           NUMERIC(3,1) NOT NULL,
  dimension_scores        JSONB NOT NULL DEFAULT '[]',
  grammar_errors          JSONB NOT NULL DEFAULT '[]',
  vocabulary_suggestions  JSONB NOT NULL DEFAULT '[]',
  overall_comment         TEXT NOT NULL,
  model_answer            TEXT NOT NULL,
  strengths               JSONB NOT NULL DEFAULT '[]',
  improvements            JSONB NOT NULL DEFAULT '[]',
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_writing_grades_user ON writing_grades (user_id, created_at DESC);

ALTER TABLE writing_grades ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own writing_grades'
  ) THEN
    CREATE POLICY "Users read own writing_grades"
      ON writing_grades FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;
