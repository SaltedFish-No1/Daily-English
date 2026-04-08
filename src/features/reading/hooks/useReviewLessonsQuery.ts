/**
 * @author SaltedFish-No1
 * @description 复习课程列表查询 Hook — 基于 TanStack Query 获取已生成的复习文章。
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { LessonListItem } from '@/types/lesson';

/**
 * @description 从 API 获取复习课程列表。
 *
 * @returns 复习课程数组
 */
async function fetchReviewLessons(): Promise<LessonListItem[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return [];

  const res = await fetch('/api/review/lessons?limit=6', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.lessons ?? [];
}

/** 导出 queryKey 工厂，供外部 invalidation 使用 */
export const reviewLessonsKey = queryKeys.review.lessons;

/**
 * @description 查询已生成的复习课程列表。
 *   仅在用户已登录时启用查询。
 *
 * @returns TanStack Query 结果，data 为 LessonListItem[]
 */
export function useReviewLessonsQuery() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: reviewLessonsKey(),
    queryFn: fetchReviewLessons,
    enabled: !!userId,
  });
}
