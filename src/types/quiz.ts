/**
 * @description 测验持久化状态类型，供 store 层引用以避免跨层依赖 feature 组件。
 */

import type {
  GradeResult,
  UserAnswer,
} from '@/features/lesson/components/quiz/types';

export interface QuizPersistState {
  currentIdx: number;
  isFinished: boolean;
  answers: Record<string, UserAnswer>;
  grades: Record<string, GradeResult>;
}
