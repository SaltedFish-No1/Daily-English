/**
 * @author SaltedFish-No1
 * @description 写作提交 Mutation Hook — 基于 TanStack Query 封装 submitWriting。
 *   提交成功后自动 invalidate 题目列表与提交记录缓存。
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { submitWriting } from '@/features/writing/lib/writingApi';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * @description 提交作文并触发缓存刷新。
 *
 * @returns TanStack Query Mutation 结果，mutateAsync 接收 { topicId, content, timeSpentSeconds }
 */
export function useSubmitEssayMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: submitWriting,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.writing.topics(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.writing.submissions(variables.topicId),
      });
    },
  });
}
