/**
 * @author SaltedFish-No1
 * @description 写作提交记录查询 Hook — 基于 TanStack Query 封装 fetchSubmissions。
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchSubmissions } from '@/features/writing/lib/writingApi';
import { useAuthStore } from '@/store/useAuthStore';

/** 导出 queryKey 工厂，供外部 invalidation 使用 */
export const writingSubmissionsKey = queryKeys.writing.submissions;

/**
 * @description 查询指定题目的历史提交记录与对应评分。
 *   仅在用户已登录且 topicId 存在时启用查询。
 *
 * @param topicId 写作题目 ID
 * @returns TanStack Query 结果，data 包含 { submissions, grades }
 */
export function useWritingSubmissionsQuery(topicId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: writingSubmissionsKey(topicId),
    queryFn: () => fetchSubmissions(topicId),
    enabled: !!userId && !!topicId,
  });
}
