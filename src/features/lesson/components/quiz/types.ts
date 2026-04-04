import { QuizRationale } from '@/types/lesson';

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

export interface LegacyQuizQuestion {
  q: string;
  options: Array<{
    text: string;
    correct: boolean;
    rationale: QuizRationale;
  }>;
}

export type AnyQuizQuestion = IELTSQuestion | LegacyQuizQuestion;

export interface GradeResult {
  questionId: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  feedbackKey?: string;
  normalizedAnswer?: unknown;
}

export interface ReviewRow {
  questionId: string;
  questionText: string;
  userAnswerText: string;
  correctAnswerText: string;
  rationale?: QuizRationale;
  isCorrect: boolean;
}

export type UserAnswer =
  | {
      questionId: string;
      type: 'legacy_single';
      payload: { selectedIndex: number | null };
    }
  | {
      questionId: string;
      type: 'tfng';
      payload: { selected: TFNGLabel | YNNGLabel | null };
    }
  | {
      questionId: string;
      type: 'matching_headings';
      payload: { mapping: Record<string, string> };
    }
  | {
      questionId: string;
      type: 'matching_information';
      payload: { mapping: Record<string, string> };
    }
  | {
      questionId: string;
      type: 'completion';
      payload: { blanks: Record<string, string> };
    }
  | {
      questionId: string;
      type: 'matching_features';
      payload: { mapping: Record<string, string> };
    }
  | {
      questionId: string;
      type: 'multiple_choice';
      payload: { selectedOptionIds: string[] };
    };

export const isIELTSQuestion = (q: AnyQuizQuestion): q is IELTSQuestion => {
  return typeof (q as IELTSQuestion).type === 'string';
};

export const toStableQuestionId = (idx: number) => `q-${idx + 1}`;

export interface QuizPersistState {
  currentIdx: number;
  isFinished: boolean;
  answers: Record<string, UserAnswer>;
  grades: Record<string, GradeResult>;
}
