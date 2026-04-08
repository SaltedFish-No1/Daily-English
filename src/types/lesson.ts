/**
 * @author SaltedFish-No1
 * @description 课程数据领域类型：文章、图表、测验题型与列表元数据。
 */

export type LessonSchemaVersion = '2.1' | '2.2';

export type LessonDifficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LessonMeta {
  /** 课程唯一标识（UUID） */
  id: string;
  /** 课程标题 */
  title: string;
  /** 课程日期，格式 YYYY-MM-DD */
  date: string;
  /** 课程分类，如 "Science"、"Culture" */
  category: string;
  /** 课程简介/导语，用于列表卡片预览 */
  teaser: string;
  /** 是否已发布，未发布的课程仅作者可见 */
  published: boolean;
  /** 是否为精选课程，精选课程在首页优先展示 */
  featured: boolean;
  /** 课程标签，如 "General"、"Review" */
  tag: string;
  /** CEFR 难度等级 */
  difficulty: LessonDifficulty;
  /** 是否为间隔重复生成的复习课程 */
  isReview?: boolean;
  /** 本课程复习的目标词列表 */
  reviewWords?: string[];
}

export interface LessonSpeech {
  /** 是否启用语音朗读功能 */
  enabled: boolean;
}

export interface FocusWord {
  /** 重点词的基础形式（词元），用作唯一标识 */
  key: string;
  /** 该词在正文中可能出现的所有词形变体，用于高亮匹配 */
  forms: string[];
}

export interface Paragraph {
  /** 段落唯一标识 */
  id: string;
  /** 英文原文内容，不允许包含 HTML 标签 */
  en: string;
  /** 中文翻译 */
  zh: string;
}

export interface LessonArticle {
  /** 文章标题 */
  title: string;
  /** 文章段落列表，按顺序排列 */
  paragraphs: Paragraph[];
}

// ---------------------------------------------------------------------------
// Shared quiz types — live here so LessonQuiz can reference them without
// creating circular imports between @/types/lesson and feature modules.
// ---------------------------------------------------------------------------

export interface QuizRationale {
  /** 英文解题说明 */
  en: string;
  /** 中文解题说明 */
  zh: string;
}

// --- IELTS question types ---------------------------------------------------

export type IELTSQuestionType =
  | 'tfng'
  | 'matching_headings'
  | 'matching_information'
  | 'completion'
  | 'matching_features'
  | 'multiple_choice';

export interface BaseIELTSQuestion {
  /** 题目唯一标识 */
  id: string;
  /** IELTS 题型标识 */
  type: IELTSQuestionType;
  /** 题目指令/提示语 */
  prompt: string;
  /** 解题说明（中英双语），未提供时不显示解析 */
  rationale?: QuizRationale;
  /** 考查技能标签，如 "scanning"、"inference"，用于学习分析 */
  skillTags?: string[];
  /** 难度权重，用于计分加权，未设置时按等权处理 */
  difficultyWeight?: number;
  /** 引用的原文段落 ID 列表，用于定位答案依据 */
  evidenceRefs?: string[];
}

export type TFNGLabel = 'TRUE' | 'FALSE' | 'NOT_GIVEN';
export type YNNGLabel = 'YES' | 'NO' | 'NOT_GIVEN';

export interface TFNGQuestion extends BaseIELTSQuestion {
  /** 固定为 'tfng' */
  type: 'tfng';
  /** 判断模式：TFNG (True/False/Not Given) 或 YNNG (Yes/No/Not Given) */
  mode: 'TFNG' | 'YNNG';
  /** 需要判断真伪的陈述句 */
  statement: string;
  /** 正确答案标签 */
  answer: TFNGLabel | YNNGLabel;
  /** 干扰项陷阱类型，用于分析学生易错点，未设置时无特殊陷阱 */
  trapType?: 'negation' | 'antonym' | 'exclusive' | 'inference_gap';
}

export interface MatchingHeadingOption {
  /** 选项唯一标识 */
  id: string;
  /** 标题文本 */
  text: string;
  /** 是否为干扰选项，true 表示该标题不与任何段落匹配 */
  isDistractor?: boolean;
}

export interface MatchingHeadingsQuestion extends BaseIELTSQuestion {
  /** 固定为 'matching_headings' */
  type: 'matching_headings';
  /** 待匹配的段落列表，textRef 指向原文段落 ID */
  paragraphs: Array<{ id: string; label: string; textRef?: string }>;
  /** 可选的标题选项列表（含干扰项） */
  headings: MatchingHeadingOption[];
  /** 正确答案映射：段落 ID → 标题 ID */
  answerMap: Record<string, string>;
  /** 是否允许一个标题匹配多个段落，默认 false */
  allowReuse?: boolean;
}

export interface MatchingInformationQuestion extends BaseIELTSQuestion {
  /** 固定为 'matching_information' */
  type: 'matching_information';
  /** 待匹配的信息条目列表 */
  items: Array<{ id: string; statement: string }>;
  /** 匹配目标（段落/选项）列表 */
  targets: Array<{ id: string; label: string }>;
  /** 正确答案映射：条目 ID → 目标 ID（允许一对多时值为数组） */
  answerMap: Record<string, string | string[]>;
  /** 是否允许一个目标被多个条目匹配，默认 false */
  allowReuse?: boolean;
}

export interface CompletionBlank {
  /** 填空位唯一标识 */
  id: string;
  /** 可接受的正确答案列表（支持多种表达） */
  acceptedAnswers: string[];
  /** 填空最大词数限制，未设置时不限制 */
  wordLimit?: number;
  /** 是否区分大小写，默认 false */
  caseSensitive?: boolean;
  /** 词性提示，如 "noun"、"verb"，帮助学生缩小答案范围 */
  posHint?: string;
}

export interface CompletionQuestion extends BaseIELTSQuestion {
  /** 固定为 'completion' */
  type: 'completion';
  /** 填空题子类型：摘要填空、句子填空、表格填空、流程图填空 */
  subtype: 'summary' | 'sentence' | 'table' | 'flowchart';
  /** 答题指导说明 */
  instruction: string;
  /** 包含占位符的内容模板，占位符格式由前端解析 */
  contentTemplate: string;
  /** 各填空位定义 */
  blanks: CompletionBlank[];
}

export interface MatchingFeaturesQuestion extends BaseIELTSQuestion {
  /** 固定为 'matching_features' */
  type: 'matching_features';
  /** 待匹配的陈述列表 */
  statements: Array<{ id: string; text: string }>;
  /** 可选的特征/人物/类别列表 */
  features: Array<{ id: string; label: string }>;
  /** 正确答案映射：陈述 ID → 特征 ID */
  answerMap: Record<string, string>;
  /** 是否允许一个特征匹配多个陈述，默认 false */
  allowReuse?: boolean;
}

export interface MultipleChoiceQuestion extends BaseIELTSQuestion {
  /** 固定为 'multiple_choice' */
  type: 'multiple_choice';
  /** 选择模式：单选或多选 */
  selectionMode: 'single' | 'multiple';
  /** 选项列表 */
  options: Array<{ id: string; text: string }>;
  /** 正确选项的 ID 列表 */
  correctOptionIds: string[];
  /** 干扰项元数据，记录每个错误选项的陷阱类型，用于学习分析 */
  distractorMeta?: Array<{
    optionId: string;
    trapType:
      | 'surface_match'
      | 'reversed_causality'
      | 'overstatement'
      | 'concept_swap';
  }>;
}

export type IELTSQuestion =
  | TFNGQuestion
  | MatchingHeadingsQuestion
  | MatchingInformationQuestion
  | CompletionQuestion
  | MatchingFeaturesQuestion
  | MultipleChoiceQuestion;

// --- Legacy question format -------------------------------------------------

export interface LegacyQuizQuestion {
  /** 题目文本 */
  q: string;
  /** 选项列表，包含文本、正确性标记和解析 */
  options: Array<{
    text: string;
    correct: boolean;
    rationale: QuizRationale;
  }>;
}

export type AnyQuizQuestion = IELTSQuestion | LegacyQuizQuestion;

/** Type guard — available here so lesson data consumers don't need a feature import. */
export const isIELTSQuestion = (q: AnyQuizQuestion): q is IELTSQuestion =>
  typeof (q as IELTSQuestion).type === 'string';

// ---------------------------------------------------------------------------

export interface LessonQuiz {
  /** 测验标题 */
  title: string;
  /** 测验题目列表，支持 IELTS 题型和 Legacy 题型混合 */
  questions: AnyQuizQuestion[];
}

export interface LessonData {
  /** 数据 schema 版本号，用于迁移兼容 */
  schemaVersion: LessonSchemaVersion;
  /** 课程元数据 */
  meta: LessonMeta;
  /** 语音朗读配置 */
  speech: LessonSpeech;
  /** 课程文章内容 */
  article: LessonArticle;
  /** 重点词汇列表，key 全局不可重复 */
  focusWords: FocusWord[];
  /** 课程测验 */
  quiz: LessonQuiz;
}

export interface LessonListItem {
  /** 课程唯一标识（UUID） */
  id: string;
  /** 课程日期，格式 YYYY-MM-DD */
  date: string;
  /** 创建时间（YYYY-MM-DD），Legacy 数据可能缺失 */
  createdAt?: string;
  /** 课程标题 */
  title: string;
  /** 课程分类 */
  category: string;
  /** 课程简介/导语 */
  teaser: string;
  /** 是否已发布 */
  published: boolean;
  /** 是否为精选课程 */
  featured: boolean;
  /** 课程标签 */
  tag: string;
  /** CEFR 难度等级 */
  difficulty: LessonDifficulty;
}

export interface LessonsList {
  /** 课程列表项数组 */
  lessons: LessonListItem[];
}
