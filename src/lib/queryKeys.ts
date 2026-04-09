/**
 * @author SaltedFish-No1
 * @description TanStack Query Key 集中管理 — 按领域分组的工厂函数，保证类型安全与一致性。
 *   所有 useQuery / useMutation 的 queryKey 必须从此模块引用。
 */

import type { LessonDifficulty } from '@/types/lesson';

/** @description 课程列表筛选参数 */
export interface LessonFilters {
  difficulty?: LessonDifficulty;
  category?: string;
}

/**
 * @description 集中式 Query Key 工厂。
 *   层级结构：[领域, 操作, ...参数]，使用 as const 保证类型安全。
 */
export const queryKeys = {
  lessons: {
    all: ['lessons'] as const,
    list: (filters?: LessonFilters) => ['lessons', 'list', filters] as const,
    detail: (id: string) => ['lessons', 'detail', id] as const,
  },
  writing: {
    topics: (userId?: string) => ['writing', 'topics', userId] as const,
    submissions: (topicId: string) =>
      ['writing', 'submissions', topicId] as const,
    criteria: () => ['writing', 'criteria'] as const,
  },
  review: {
    lessons: () => ['review', 'lessons'] as const,
    lessonDetail: (id: string) => ['review', 'lessons', id] as const,
  },
  dictionary: {
    lookup: (word: string) => ['dictionary', word] as const,
  },
  usage: {
    today: () => ['usage', 'today'] as const,
  },
} as const;
