import { useMemo } from 'react';
import { useUserStore } from '@/store/useUserStore';

export function useLearningStats() {
  const { savedWords, history } = useUserStore();

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

    return { lessonCount, wordCount, avgScore };
  }, [history, savedWords]);
}
