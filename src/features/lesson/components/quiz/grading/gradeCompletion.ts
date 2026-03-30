'use client';

import {
  countWords,
  normalizeText,
  normalizeTextCasefold,
} from './normalizeAnswer';
import { CompletionQuestion, GradeResult } from '../types';

export const gradeCompletion = (
  question: CompletionQuestion,
  blanks: Record<string, string>
): GradeResult => {
  const maxScore = question.blanks.length;
  let score = 0;

  for (const blank of question.blanks) {
    const raw = blanks[blank.id] ?? '';
    const normalized = blank.caseSensitive
      ? normalizeText(raw)
      : normalizeTextCasefold(raw);

    if (blank.wordLimit && countWords(normalized) > blank.wordLimit) {
      continue;
    }

    const accepted = blank.acceptedAnswers.map((ans) =>
      blank.caseSensitive ? normalizeText(ans) : normalizeTextCasefold(ans)
    );
    if (accepted.includes(normalized)) score += 1;
  }

  return {
    questionId: question.id,
    isCorrect: score === maxScore && maxScore > 0,
    score,
    maxScore,
    normalizedAnswer: { blanks },
  };
};
