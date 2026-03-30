'use client';

import { GradeResult, MatchingHeadingsQuestion } from '../types';

export const gradeMatchingHeadings = (
  question: MatchingHeadingsQuestion,
  mapping: Record<string, string>
): GradeResult => {
  const paragraphIds = question.paragraphs.map((p) => p.id);
  const maxScore = paragraphIds.length;
  let score = 0;
  for (const pid of paragraphIds) {
    const selected = mapping[pid];
    const correct = question.answerMap[pid];
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
