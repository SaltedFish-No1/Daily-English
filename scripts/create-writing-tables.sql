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
),
-- ── IELTS General Training ──────────────────────────────────────────
(
  'ielts_gt_task1',
  'IELTS GT Task 1',
  'IELTS General Training Writing Task 1: Letter (150 words minimum)',
  E'You are a senior IELTS examiner. Grade this General Training Task 1 letter using the official IELTS Writing Band Descriptors for GT Task 1.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Achievement (TA)**: Does the letter fully address the task? Is the purpose clear? Is the tone consistent and appropriate (formal, semi-formal, or informal as required)? Are all bullet points covered with adequate detail?\n2. **Coherence and Cohesion (CC)**: Is the letter logically organized into clear paragraphs? Is there a natural progression of ideas? Are cohesive devices (linking words, pronouns) used effectively without being mechanical?\n3. **Lexical Resource (LR)**: Is vocabulary sufficient and appropriate for the letter type? Are less common words or idiomatic expressions attempted? Are there spelling or word-formation errors?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a mix of simple and complex sentence structures? Are grammar and punctuation accurate? Are errors frequent enough to impede communication?\n\nPay special attention to whether the register (formal/informal) is consistent throughout. For each criterion provide a band score and specific feedback referencing the student''s actual text. Identify concrete grammar errors with corrections. Suggest vocabulary upgrades appropriate to the letter''s register. Write a model letter that would achieve Band 8+.',
  '[{"key":"task_achievement","label":"Task Achievement","maxScore":9,"description":"Fully addresses the task, clear purpose, appropriate and consistent tone, all bullet points covered"},{"key":"coherence_cohesion","label":"Coherence & Cohesion","maxScore":9,"description":"Logical paragraph organization, natural progression, effective cohesive devices"},{"key":"lexical_resource","label":"Lexical Resource","maxScore":9,"description":"Sufficient and appropriate vocabulary for letter type, less common words attempted"},{"key":"grammatical_range","label":"Grammatical Range & Accuracy","maxScore":9,"description":"Mix of simple and complex structures, accurate grammar and punctuation"}]'
),
(
  'ielts_gt_task2',
  'IELTS GT Task 2',
  'IELTS General Training Writing Task 2: Essay (250 words minimum)',
  E'You are a senior IELTS examiner. Grade this General Training Task 2 essay using the official IELTS Writing Band Descriptors.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Response (TR)**: Does the response address all parts of the task? Is the writer''s position clear? Are main ideas extended and supported? Is the response relevant throughout?\n2. **Coherence and Cohesion (CC)**: Is the essay logically organized with clear paragraphing? Does each paragraph have a clear central topic? Are cohesive devices used accurately and appropriately?\n3. **Lexical Resource (LR)**: Is there sufficient range of vocabulary? Are words used with precision? Are there errors in spelling or word formation that cause difficulty for the reader?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a variety of sentence structures? Are complex sentences attempted? Are grammatical errors rare and do they impede communication?\n\nNote: GT Task 2 topics tend to be of general interest rather than academic. The writing style can be slightly less formal than Academic Task 2, but should still be well-structured.\n\nFor each criterion provide a band score and specific feedback referencing the student''s actual text. Identify concrete grammar errors with corrections. Suggest vocabulary upgrades. Write a model essay that would achieve Band 8+.',
  '[{"key":"task_response","label":"Task Response","maxScore":9,"description":"Addresses all parts of the task, clear position, extended and supported ideas"},{"key":"coherence_cohesion","label":"Coherence & Cohesion","maxScore":9,"description":"Logical organization with clear paragraphing, effective cohesive devices"},{"key":"lexical_resource","label":"Lexical Resource","maxScore":9,"description":"Sufficient range of vocabulary, precise word use, minimal spelling errors"},{"key":"grammatical_range","label":"Grammatical Range & Accuracy","maxScore":9,"description":"Variety of sentence structures, complex sentences attempted, rare grammatical errors"}]'
),
-- ── TOEFL iBT Writing ───────────────────────────────────────────────
(
  'toefl_integrated',
  'TOEFL Integrated Writing',
  'TOEFL iBT Integrated Writing Task: Summarize how the lecture relates to the reading (150-225 words, 20 minutes)',
  E'You are a senior TOEFL examiner. Grade this Integrated Writing response using the official ETS TOEFL iBT Integrated Writing Rubric (0-5 scale).\n\nThe student read an academic passage and listened to a lecture, then wrote a response explaining how the lecture challenges/supports the reading.\n\nEvaluate on three criteria, each scored 0-5 in 0.5 increments:\n\n1. **Content Accuracy & Completeness**: Does the response accurately convey the key points from both the lecture and the reading? Are the relationships between the lecture and reading clearly explained? Are all major points from the lecture addressed? Is information from both sources accurately represented without distortion?\n2. **Organization & Coherence**: Is the response well-organized with a clear structure? Does it effectively compare/contrast points from the lecture and reading? Are transitions between ideas smooth? Is there a logical flow from one point to the next?\n3. **Language Use**: Is the language generally clear and accurate? Are there grammatical errors that obscure meaning? Is vocabulary appropriate for academic writing? Can the reader understand the response without significant effort?\n\nScoring guidelines (per ETS rubric):\n- 5: Successfully selects important information from the lecture and coherently presents it in relation to the reading. Well-organized, occasional language errors.\n- 4: Generally good, but may have minor omissions, vagueness, or inaccuracies. Generally well-organized with occasional language errors.\n- 3: Contains some important information but may be vague, have omissions, or inaccuracies. Connection to reading may be unclear at times.\n- 2: Significant omissions or inaccuracies. Poor organization or unclear connections. Frequent language errors.\n- 1: Little relevant content. Fails to connect lecture and reading meaningfully.\n- 0: Off-topic, in wrong language, blank, or merely copies from sources.\n\nFor each criterion provide a score and specific feedback. Identify grammar errors with corrections. Suggest vocabulary improvements for academic writing. Write a model response that would score 5.',
  '[{"key":"content_accuracy","label":"Content Accuracy & Completeness","maxScore":5,"description":"Accurately conveys key points from both sources, clearly explains relationships"},{"key":"organization_coherence","label":"Organization & Coherence","maxScore":5,"description":"Well-organized structure, effective comparison/contrast, smooth transitions"},{"key":"language_use","label":"Language Use","maxScore":5,"description":"Clear and accurate language, appropriate academic vocabulary, minimal errors"}]'
),
(
  'toefl_independent',
  'TOEFL Independent Writing (Legacy)',
  'TOEFL iBT Independent Writing Task (Legacy format): Express and support an opinion (300+ words, 30 minutes)',
  E'You are a senior TOEFL examiner. Grade this Independent Writing essay using the official ETS TOEFL iBT Independent Writing Rubric (0-5 scale).\n\nThe student was given a topic and asked to write an essay expressing and supporting their opinion.\n\nEvaluate on three criteria, each scored 0-5 in 0.5 increments:\n\n1. **Development & Support**: Is the essay well-developed with clear explanations, examples, and details? Does the writer effectively address the topic? Is the argument convincing with specific support? Are ideas fully elaborated rather than just listed?\n2. **Organization**: Is there a clear thesis statement? Are body paragraphs well-structured with topic sentences? Is the essay unified and coherent? Are transitions effective? Is there a satisfying conclusion?\n3. **Language Use**: Does the writer demonstrate syntactic variety? Is vocabulary precise and appropriate? Are grammar, usage, and mechanics accurate? Do language errors interfere with meaning?\n\nScoring guidelines (per ETS rubric):\n- 5: Effectively addresses the topic. Well-organized and well-developed with specific reasons/examples. Displays consistent facility in language use with syntactic variety and appropriate vocabulary. Minor lexical or grammatical errors.\n- 4: Addresses the topic well. Generally well-organized and developed. Demonstrates facility in language use but may have occasional noticeable minor errors that do not interfere with meaning.\n- 3: Addresses the topic with some development. May demonstrate inconsistent organization. Errors in language use are noticeable but do not significantly obscure meaning.\n- 2: Limited development. Inadequate organization. Frequent errors in language use that sometimes obscure meaning.\n- 1: Serious disorganization or underdevelopment. Severe language errors throughout.\n- 0: Off-topic, in wrong language, blank, or merely copies the prompt.\n\nFor each criterion provide a score and specific feedback. Identify grammar errors with corrections. Suggest vocabulary improvements. Write a model essay that would score 5.',
  '[{"key":"development_support","label":"Development & Support","maxScore":5,"description":"Well-developed argument with clear explanations, specific examples, and convincing support"},{"key":"organization","label":"Organization","maxScore":5,"description":"Clear thesis, well-structured paragraphs, effective transitions, unified and coherent"},{"key":"language_use","label":"Language Use","maxScore":5,"description":"Syntactic variety, precise vocabulary, accurate grammar and mechanics"}]'
),
(
  'toefl_academic_discussion',
  'TOEFL Academic Discussion',
  'TOEFL iBT Writing for an Academic Discussion: Contribute to an online discussion (100+ words, 10 minutes)',
  E'You are a senior TOEFL examiner. Grade this Academic Discussion response using the official ETS TOEFL iBT Writing for an Academic Discussion Rubric (0-5 scale).\n\nThe student read a professor''s question and classmates'' responses in an online discussion board, then wrote their own contribution.\n\nEvaluate on three criteria, each scored 0-5 in 0.5 increments:\n\n1. **Relevance & Contribution**: Does the response make a relevant and meaningful contribution to the discussion? Does it clearly state and support the writer''s position? Does it engage with the ideas raised by classmates (agreeing, disagreeing, or building on them)? Does it add new information, examples, or perspectives?\n2. **Development & Elaboration**: Is the writer''s position clearly explained? Are supporting points well-elaborated with specific details, examples, or reasoning? Is the response substantive enough given the 100-word minimum? Does it go beyond surface-level response?\n3. **Language Use**: Is language clear and effective for academic discussion? Is vocabulary precise and appropriate? Are there grammatical errors? Does the writing flow naturally? Is the register appropriate for an academic discussion (neither too casual nor overly formal)?\n\nScoring guidelines (per ETS rubric):\n- 5: A relevant, well-elaborated contribution with clear position and specific support. Demonstrates effective language use with variety and accuracy. Engages meaningfully with the discussion.\n- 4: A relevant contribution with adequate elaboration. Occasional language errors that do not obscure meaning. Engages with the discussion.\n- 3: A mostly relevant contribution but may lack elaboration or specificity. Some language errors noticeable. Connection to discussion may be superficial.\n- 2: Limited relevance or development. Language errors may sometimes obscure meaning. Weak engagement with discussion.\n- 1: Minimal or irrelevant contribution. Severe language limitations.\n- 0: Off-topic, blank, or merely copies others'' responses.\n\nFor each criterion provide a score and specific feedback. Identify grammar errors with corrections. Suggest vocabulary improvements. Write a model response that would score 5.',
  '[{"key":"relevance_contribution","label":"Relevance & Contribution","maxScore":5,"description":"Relevant and meaningful contribution, clear position, engages with classmates ideas"},{"key":"development_elaboration","label":"Development & Elaboration","maxScore":5,"description":"Well-elaborated position with specific details, examples, and reasoning"},{"key":"language_use","label":"Language Use","maxScore":5,"description":"Clear and effective academic language, precise vocabulary, accurate grammar"}]'
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
