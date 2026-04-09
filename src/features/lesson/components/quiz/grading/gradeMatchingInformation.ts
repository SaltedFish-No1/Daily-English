'use client';

/**
 * @author SaltedFish-No1
 * @description 信息匹配题评分，支持多正确答案。
 */

import { GradeResult, MatchingInformationQuestion } from '../types';

export const gradeMatchingInformation = (
  question: MatchingInformationQuestion,
  mapping: Record<string, string>
): GradeResult => {
  const itemIds = question.items.map((i) => i.id);
  const maxScore = itemIds.length;
  let score = 0;
  for (const itemId of itemIds) {
    const selected = mapping[itemId];
    const correct = question.answerMap[itemId];
    if (!selected || !correct) continue;
    if (Array.isArray(correct)) {
      if (correct.includes(selected)) score += 1;
    } else if (selected === correct) {
      score += 1;
    }
  }
  return {
    questionId: question.id,
    isCorrect: score === maxScore && maxScore > 0,
    score,
    maxScore,
    normalizedAnswer: { mapping },
  };
};
