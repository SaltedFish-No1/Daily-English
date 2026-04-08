/**
 * @author SaltedFish-No1
 * @description 写作练习领域类型：评分标准、题目、作答与 AI 批改报告。
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Grading criteria
// ---------------------------------------------------------------------------

export interface GradingCriteriaDimension {
  /** 评分维度标识，如 "grammar"、"coherence" */
  key: string;
  /** 评分维度显示名称 */
  label: string;
  /** 该维度满分值 */
  maxScore: number;
  /** 该维度的评分说明 */
  description: string;
}

export interface GradingCriteria {
  /** 评分标准唯一标识 */
  id: string;
  /** 评分标准显示名称，如 "IELTS Task 2" */
  label: string;
  /** 评分标准描述，null 表示无额外说明 */
  description: string | null;
  /** 传给 AI 的评分 prompt 模板 */
  gradingPrompt: string;
  /** 评分维度列表 */
  dimensions: GradingCriteriaDimension[];
  /** 创建时间（ISO 8601 格式） */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Writing topic
// ---------------------------------------------------------------------------

export interface WritingTopic {
  /** 题目唯一标识 */
  id: string;
  /** 创建者用户 ID */
  userId: string;
  /** 题目标题，null 表示由系统自动生成或未设定 */
  title: string | null;
  /** 写作题目要求/提示语 */
  writingPrompt: string;
  /** 关联的评分标准 ID */
  gradingCriteria: string;
  /** 建议字数限制，null 表示不限字数 */
  wordLimit: number | null;
  /** 题目图片 URL（如拍照上传的题目图片），null 表示无图片 */
  imageUrl: string | null;
  /** 创建时间（ISO 8601 格式） */
  createdAt: string;
  /** 最后更新时间（ISO 8601 格式） */
  updatedAt: string;
}

/** Extended with aggregated submission stats for list views. */
export interface WritingTopicWithStats extends WritingTopic {
  /** 该题目下的提交次数 */
  submissionCount: number;
  /** 历史最高分，null 表示尚无评分 */
  bestScore: number | null;
  /** 最近一次评分，null 表示尚无评分 */
  latestScore: number | null;
}

// ---------------------------------------------------------------------------
// Writing submission
// ---------------------------------------------------------------------------

export type InputMethod = 'typed' | 'handwritten';

export interface WritingSubmission {
  /** 提交记录唯一标识 */
  id: string;
  /** 关联的写作题目 ID */
  topicId: string;
  /** 提交者用户 ID */
  userId: string;
  /** 该题目下的第几次提交（从 1 开始） */
  attemptNumber: number;
  /** 作文正文内容 */
  content: string;
  /** 手写作文图片 URL，null 表示键盘输入 */
  contentImageUrl: string | null;
  /** 作文实际字数 */
  wordCount: number;
  /** 写作用时（秒），null 表示未记录 */
  timeSpentSeconds: number | null;
  /** 输入方式：键盘输入或手写拍照 */
  inputMethod: InputMethod;
  /** 提交时间（ISO 8601 格式） */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Writing grade
// ---------------------------------------------------------------------------

export interface DimensionScore {
  /** 评分维度标识，与 GradingCriteriaDimension.key 对应 */
  key: string;
  /** 该维度得分 */
  score: number;
  /** 该维度的具体反馈意见 */
  feedback: string;
}

export interface GrammarError {
  /** 包含语法错误的原句 */
  sentence: string;
  /** 修改后的正确句子 */
  correction: string;
  /** 语法规则说明 */
  explanation: string;
}

export interface VocabularySuggestion {
  /** 原文中的用词或短语 */
  original: string;
  /** 建议替换为的更佳用词 */
  suggested: string;
  /** 建议替换的原因 */
  reason: string;
}

export interface WritingGrade {
  /** 评分记录唯一标识 */
  id: string;
  /** 关联的提交记录 ID */
  submissionId: string;
  /** 被评分的用户 ID */
  userId: string;
  /** 总分（各维度分数的加权平均，精确到 0.5） */
  overallScore: number;
  /** 各维度的分项评分 */
  dimensionScores: DimensionScore[];
  /** AI 检出的语法错误列表 */
  grammarErrors: GrammarError[];
  /** AI 提供的词汇改进建议列表 */
  vocabularySuggestions: VocabularySuggestion[];
  /** 总评（中文），概述优缺点 */
  overallComment: string;
  /** AI 生成的范文 */
  modelAnswer: string;
  /** 2-4 条作文亮点（中文） */
  strengths: string[];
  /** 2-4 条待改进点（中文） */
  improvements: string[];
  /** 评分时间（ISO 8601 格式） */
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

/**
 * @description 将 grading_criteria 数据库行映射为 GradingCriteria 领域对象。
 *
 * @param row 数据库原始行数据（snake_case 字段）
 * @returns GradingCriteria 领域对象（camelCase 字段）
 */
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

/**
 * @description 将 writing_topics 数据库行映射为 WritingTopic 领域对象。
 *
 * @param row 数据库原始行数据（snake_case 字段）
 * @returns WritingTopic 领域对象（camelCase 字段）
 */
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

/**
 * @description 将 writing_submissions 数据库行映射为 WritingSubmission 领域对象。
 *
 * @param row 数据库原始行数据（snake_case 字段）
 * @returns WritingSubmission 领域对象（camelCase 字段）
 */
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

/**
 * @description 将 writing_grades 数据库行映射为 WritingGrade 领域对象。
 *
 * @param row 数据库原始行数据（snake_case 字段）
 * @returns WritingGrade 领域对象（camelCase 字段）
 */
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
