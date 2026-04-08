/**
 * @author SaltedFish-No1
 * @description 复习文章生成的 Zod schema（服务端 + 客户端共享）。
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const ParagraphSchema = z.object({
  id: z.string(),
  en: z.string(),
  zh: z.string(),
});

const FocusWordSchema = z.object({
  key: z.string(),
  forms: z.array(z.string()),
});

const CompletionBlankSchema = z.object({
  id: z.string(),
  acceptedAnswers: z.array(z.string()),
  wordLimit: z.number().nullable(),
});

const CompletionQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('completion'),
  subtype: z.enum(['summary', 'sentence']),
  prompt: z.string(),
  instruction: z.string(),
  contentTemplate: z.string(),
  blanks: z.array(CompletionBlankSchema),
  rationale: z.object({ en: z.string(), zh: z.string() }).nullable(),
});

const MultipleChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

const MultipleChoiceQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('multiple_choice'),
  selectionMode: z.enum(['single', 'multiple']),
  prompt: z.string(),
  options: z.array(MultipleChoiceOptionSchema),
  correctOptionIds: z.array(z.string()),
  rationale: z.object({ en: z.string(), zh: z.string() }).nullable(),
});

const TFNGQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('tfng'),
  mode: z.enum(['TFNG', 'YNNG']),
  prompt: z.string(),
  statement: z.string(),
  answer: z.enum(['TRUE', 'FALSE', 'NOT_GIVEN']),
  rationale: z.object({ en: z.string(), zh: z.string() }).nullable(),
});

// Use z.union (produces JSON Schema `anyOf`) instead of z.discriminatedUnion
// (produces `oneOf`) because OpenAI structured outputs do not support `oneOf`.
const QuizQuestionSchema = z.union([
  CompletionQuestionSchema,
  MultipleChoiceQuestionSchema,
  TFNGQuestionSchema,
]);

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

export const GeneratedLessonSchema = z.object({
  title: z.string(),
  category: z.string(),
  teaser: z.string(),
  paragraphs: z.array(ParagraphSchema),
  focusWords: z.array(FocusWordSchema),
  quizQuestions: z.array(QuizQuestionSchema),
});

export type GeneratedLesson = z.infer<typeof GeneratedLessonSchema>;
