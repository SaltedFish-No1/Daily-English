/**
 * @author SaltedFish-No1
 * @description 写作题目列表查询 Hook — 基于 TanStack Query 封装 fetchTopics。
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchTopics } from '@/features/writing/lib/writingApi';
import { useAuthStore } from '@/store/useAuthStore';

/** 导出 queryKey 工厂，供外部 invalidation 使用 */
export const writingTopicsKey = queryKeys.writing.topics;

/**
 * @description 查询当前用户的写作题目列表。
 *   仅在用户已登录时启用查询。
 *
 * @returns TanStack Query 结果，包含 data / isLoading / error
 */
export function useWritingTopicsQuery() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: writingTopicsKey(userId),
    queryFn: fetchTopics,
    enabled: !!userId,
  });
}
