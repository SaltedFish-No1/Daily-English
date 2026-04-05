/**
 * @description 课程数据领域类型：文章、图表、测验题型与列表元数据。
 */

export type LessonSchemaVersion = '2.1';

export interface LessonMeta {
  title: string;
}

export interface LessonSpeech {
  enabled: boolean;
}

export interface FocusWord {
  key: string;
  forms: string[];
}

export interface Paragraph {
  id: string;
  en: string;
  zh: string;
}

export interface LessonArticle {
  title: string;
  paragraphs: Paragraph[];
}

// ---------------------------------------------------------------------------
// Shared quiz types — live here so LessonQuiz can reference them without
// creating circular imports between @/types/lesson and feature modules.
// ---------------------------------------------------------------------------

export interface QuizRationale {
  en: string;
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
  id: string;
  type: IELTSQuestionType;
  prompt: string;
  rationale?: QuizRationale;
  skillTags?: string[];
  difficultyWeight?: number;
  evidenceRefs?: string[];
}

export type TFNGLabel = 'TRUE' | 'FALSE' | 'NOT_GIVEN';
export type YNNGLabel = 'YES' | 'NO' | 'NOT_GIVEN';

export interface TFNGQuestion extends BaseIELTSQuestion {
  type: 'tfng';
  mode: 'TFNG' | 'YNNG';
  statement: string;
  answer: TFNGLabel | YNNGLabel;
  trapType?: 'negation' | 'antonym' | 'exclusive' | 'inference_gap';
}

export interface MatchingHeadingOption {
  id: string;
  text: string;
  isDistractor?: boolean;
}

export interface MatchingHeadingsQuestion extends BaseIELTSQuestion {
  type: 'matching_headings';
  paragraphs: Array<{ id: string; label: string; textRef?: string }>;
  headings: MatchingHeadingOption[];
  answerMap: Record<string, string>;
  allowReuse?: boolean;
}

export interface MatchingInformationQuestion extends BaseIELTSQuestion {
  type: 'matching_information';
  items: Array<{ id: string; statement: string }>;
  targets: Array<{ id: string; label: string }>;
  answerMap: Record<string, string | string[]>;
  allowReuse?: boolean;
}

export interface CompletionBlank {
  id: string;
  acceptedAnswers: string[];
  wordLimit?: number;
  caseSensitive?: boolean;
  posHint?: string;
}

export interface CompletionQuestion extends BaseIELTSQuestion {
  type: 'completion';
  subtype: 'summary' | 'sentence' | 'table' | 'flowchart';
  instruction: string;
  contentTemplate: string;
  blanks: CompletionBlank[];
}

export interface MatchingFeaturesQuestion extends BaseIELTSQuestion {
  type: 'matching_features';
  statements: Array<{ id: string; text: string }>;
  features: Array<{ id: string; label: string }>;
  answerMap: Record<string, string>;
  allowReuse?: boolean;
}

export interface MultipleChoiceQuestion extends BaseIELTSQuestion {
  type: 'multiple_choice';
  selectionMode: 'single' | 'multiple';
  options: Array<{ id: string; text: string }>;
  correctOptionIds: string[];
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
  q: string;
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
  title: string;
  questions: AnyQuizQuestion[];
}

export interface LessonData {
  schemaVersion: LessonSchemaVersion;
  meta: LessonMeta;
  speech: LessonSpeech;
  article: LessonArticle;
  focusWords: FocusWord[];
  quiz: LessonQuiz;
}

export type LessonDifficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LessonListItem {
  date: string;
  path: string;
  title: string;
  category: string;
  teaser: string;
  published: boolean;
  featured: boolean;
  tag: string;
  difficulty: LessonDifficulty;
}

export interface LessonsList {
  lessons: LessonListItem[];
}
