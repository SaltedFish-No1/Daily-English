'use client';

/**
 * @author SaltedFish-No1
 * @description 特征匹配题评分。
 */

import { GradeResult, MatchingFeaturesQuestion } from '../types';

export const gradeMatchingFeatures = (
  question: MatchingFeaturesQuestion,
  mapping: Record<string, string>
): GradeResult => {
  const statementIds = question.statements.map((s) => s.id);
  const maxScore = statementIds.length;
  let score = 0;
  for (const sid of statementIds) {
    const selected = mapping[sid];
    const correct = question.answerMap[sid];
    if (selected && correct && selected === correct) score += 1;
  }
  return {
    questionId: question.id,
    isCorrect: score === maxScore && maxScore > 0,
    score,
    maxScore,
    normalizedAnswer: { mapping },
  };
};
