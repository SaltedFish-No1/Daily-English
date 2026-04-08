/**
 * @author SaltedFish-No1
 * @description 学习统计 hook，聚合已完成课程、已收藏词汇等学习数据。
 */
import { useMemo } from 'react';
import { useUserStore } from '@/store/useUserStore';

export function useLearningStats() {
  const { savedWords, history, wordReviewStates } = useUserStore();

  return useMemo(() => {
    const completedLessons = Object.values(history);
    const lessonCount = completedLessons.length;
    const wordCount = Object.keys(savedWords).filter(
      (k) => savedWords[k].length > 0
    ).length;
    const avgScore =
      lessonCount > 0
        ? Math.round(
            completedLessons.reduce(
              (sum, h) => sum + (h.score / h.total) * 100,
              0
            ) / lessonCount
          )
        : 0;

    const masteredCount = Object.values(wordReviewStates).filter(
      (s) => s.status === 'mastered'
    ).length;

    return { lessonCount, wordCount, avgScore, masteredCount };
  }, [history, savedWords, wordReviewStates]);
}
