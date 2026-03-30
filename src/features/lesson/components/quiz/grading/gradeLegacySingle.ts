'use client';

import { GradeResult, LegacyQuizQuestion } from '../types';

export const gradeLegacySingle = (
  questionId: string,
  question: LegacyQuizQuestion,
  selectedIndex: number | null
): GradeResult => {
  const maxScore = 1;
  if (selectedIndex === null || selectedIndex < 0) {
    return {
      questionId,
      isCorrect: false,
      score: 0,
      maxScore,
      normalizedAnswer: { selectedIndex: null },
    };
  }
  const option = question.options[selectedIndex];
  const isCorrect = Boolean(option?.correct);
  return {
    questionId,
    isCorrect,
    score: isCorrect ? 1 : 0,
    maxScore,
    normalizedAnswer: { selectedIndex },
  };
};
