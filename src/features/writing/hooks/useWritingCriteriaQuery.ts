/**
 * @author SaltedFish-No1
 * @description 评分标准查询 Hook — 基于 TanStack Query 封装 fetchCriteria。
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchCriteria } from '@/features/writing/lib/writingApi';

/** 导出 queryKey 工厂，供外部 invalidation 使用 */
export const writingCriteriaKey = queryKeys.writing.criteria;

/**
 * @description 查询所有评分标准维度配置。
 *   无需登录即可获取（公共数据），默认 staleTime 较长。
 *
 * @returns TanStack Query 结果，data 为 GradingCriteria[]
 */
export function useWritingCriteriaQuery() {
  return useQuery({
    queryKey: writingCriteriaKey(),
    queryFn: fetchCriteria,
    staleTime: 5 * 60 * 1000,
  });
}
