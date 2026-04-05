/**
 * @description 写作练习领域类型：评分标准、题目、作答与 AI 批改报告。
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Grading criteria
// ---------------------------------------------------------------------------

export interface GradingCriteriaDimension {
  key: string;
  label: string;
  maxScore: number;
  description: string;
}

export interface GradingCriteria {
  id: string;
  label: string;
  description: string | null;
  gradingPrompt: string;
  dimensions: GradingCriteriaDimension[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Writing topic
// ---------------------------------------------------------------------------

export interface WritingTopic {
  id: string;
  userId: string;
  title: string | null;
  writingPrompt: string;
  gradingCriteria: string;
  wordLimit: number | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Extended with aggregated submission stats for list views. */
export interface WritingTopicWithStats extends WritingTopic {
  submissionCount: number;
  bestScore: number | null;
  latestScore: number | null;
}

// ---------------------------------------------------------------------------
// Writing submission
// ---------------------------------------------------------------------------

export type InputMethod = 'typed' | 'handwritten';

export interface WritingSubmission {
  id: string;
  topicId: string;
  userId: string;
  attemptNumber: number;
  content: string;
  contentImageUrl: string | null;
  wordCount: number;
  timeSpentSeconds: number | null;
  inputMethod: InputMethod;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Writing grade
// ---------------------------------------------------------------------------

export interface DimensionScore {
  key: string;
  score: number;
  feedback: string;
}

export interface GrammarError {
  sentence: string;
  correction: string;
  explanation: string;
}

export interface VocabularySuggestion {
  original: string;
  suggested: string;
  reason: string;
}

export interface WritingGrade {
  id: string;
  submissionId: string;
  userId: string;
  overallScore: number;
  dimensionScores: DimensionScore[];
  grammarErrors: GrammarError[];
  vocabularySuggestions: VocabularySuggestion[];
  overallComment: string;
  modelAnswer: string;
  strengths: string[];
  improvements: string[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Zod schemas — used by generateObject() for AI structured output
// ---------------------------------------------------------------------------

/** Vision model output when extracting a writing topic from an image. */
export const TopicExtractionSchema = z.object({
  title: z
    .string()
    .describe('A short title summarizing the writing topic (10 words max)'),
  writingPrompt: z
    .string()
    .describe(
      'The full writing prompt/question extracted from the image, preserving all details and instructions'
    ),
  wordLimit: z
    .number()
    .nullable()
    .describe(
      'The suggested or required word count if mentioned in the prompt, otherwise null'
    ),
});

export type TopicExtraction = z.infer<typeof TopicExtractionSchema>;

/** AI grading output schema. */
export const WritingGradeSchema = z.object({
  overallScore: z
    .number()
    .describe('Overall score — average of dimension scores, rounded to 0.5'),
  dimensionScores: z
    .array(
      z.object({
        key: z.string().describe('Dimension key matching grading_criteria'),
        score: z.number().describe('Score for this dimension'),
        feedback: z
          .string()
          .describe(
            'Specific feedback for this dimension, referencing the student text'
          ),
      })
    )
    .describe('One entry per grading dimension'),
  grammarErrors: z
    .array(
      z.object({
        sentence: z
          .string()
          .describe('The original sentence containing the error'),
        correction: z.string().describe('The corrected sentence'),
        explanation: z
          .string()
          .describe('Brief explanation of the grammar rule'),
      })
    )
    .describe('List of specific grammar errors found in the essay'),
  vocabularySuggestions: z
    .array(
      z.object({
        original: z.string().describe('The original word or phrase'),
        suggested: z.string().describe('A better alternative'),
        reason: z.string().describe('Why the alternative is better'),
      })
    )
    .describe('Vocabulary improvement suggestions'),
  overallComment: z
    .string()
    .describe(
      'A comprehensive overall comment in Chinese summarizing strengths and weaknesses'
    ),
  modelAnswer: z
    .string()
    .describe('A model answer that would achieve the highest band/score'),
  strengths: z
    .array(z.string())
    .describe('2-4 specific strengths of the essay (in Chinese)'),
  improvements: z
    .array(z.string())
    .describe('2-4 specific areas for improvement (in Chinese)'),
});

export type WritingGradeResult = z.infer<typeof WritingGradeSchema>;

// ---------------------------------------------------------------------------
// DB row → domain object mappers
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapGradingCriteriaRow(row: any): GradingCriteria {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    gradingPrompt: row.grading_prompt,
    dimensions: row.dimensions as GradingCriteriaDimension[],
    createdAt: row.created_at,
  };
}

export function mapWritingTopicRow(row: any): WritingTopic {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    writingPrompt: row.writing_prompt,
    gradingCriteria: row.grading_criteria,
    wordLimit: row.word_limit,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWritingSubmissionRow(row: any): WritingSubmission {
  return {
    id: row.id,
    topicId: row.topic_id,
    userId: row.user_id,
    attemptNumber: row.attempt_number,
    content: row.content,
    contentImageUrl: row.content_image_url,
    wordCount: row.word_count,
    timeSpentSeconds: row.time_spent_seconds,
    inputMethod: row.input_method,
    createdAt: row.created_at,
  };
}

export function mapWritingGradeRow(row: any): WritingGrade {
  return {
    id: row.id,
    submissionId: row.submission_id,
    userId: row.user_id,
    overallScore: Number(row.overall_score),
    dimensionScores: row.dimension_scores as DimensionScore[],
    grammarErrors: row.grammar_errors as GrammarError[],
    vocabularySuggestions: row.vocabulary_suggestions as VocabularySuggestion[],
    overallComment: row.overall_comment,
    modelAnswer: row.model_answer,
    strengths: row.strengths as string[],
    improvements: row.improvements as string[],
    createdAt: row.created_at,
  };
}
