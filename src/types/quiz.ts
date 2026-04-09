/**
 * @author SaltedFish-No1
 * @description 测验持久化状态类型，供 store 层引用以避免跨层依赖 feature 组件。
 */

import type {
  GradeResult,
  UserAnswer,
} from '@/features/lesson/components/quiz/types';

export interface QuizPersistState {
  /** 当前题目索引（从 0 开始） */
  currentIdx: number;
  /** 是否已完成全部测验 */
  isFinished: boolean;
  /** 用户作答记录，key 为题目 ID */
  answers: Record<string, UserAnswer>;
  /** 各题评分结果，key 为题目 ID */
  grades: Record<string, GradeResult>;
}
