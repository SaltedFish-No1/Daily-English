/**
 * @author SaltedFish-No1
 * @description 计算当前用户待复习词汇，供首页和阅读页的复习推荐卡片使用。
 */

import { useMemo } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNow } from '@/hooks/useNow';
import { getWordsForReview, countDueWords } from '@/lib/spaced-repetition';

export function useReviewWords(limit = 12) {
  const wordReviewStates = useUserStore((s) => s.wordReviewStates);
  const now = useNow();

  return useMemo(() => {
    const dueCount = countDueWords(wordReviewStates, now);
    const dueWords = getWordsForReview(wordReviewStates, limit, now);
    return { dueCount, dueWords };
  }, [wordReviewStates, limit, now]);
}
