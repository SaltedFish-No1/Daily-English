'use client';

import { GradeResult, TFNGQuestion } from '../types';

export const gradeTFNG = (
  question: TFNGQuestion,
  selected: TFNGQuestion['answer'] | null
): GradeResult => {
  const maxScore = 1;
  if (selected === null) {
    return {
      questionId: question.id,
      isCorrect: false,
      score: 0,
      maxScore,
      normalizedAnswer: { selected: null },
    };
  }
  const isCorrect = selected === question.answer;
  return {
    questionId: question.id,
    isCorrect,
    score: isCorrect ? 1 : 0,
    maxScore,
    feedbackKey:
      !isCorrect && selected !== 'NOT_GIVEN' && question.answer === 'NOT_GIVEN'
        ? 'inference_gap'
        : undefined,
    normalizedAnswer: { selected },
  };
};
