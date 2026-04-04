'use client';

/**
 * @description 多选题评分，使用集合运算判断精确匹配。
 */

import { GradeResult, MultipleChoiceQuestion } from '../types';

const unique = (arr: string[]) => Array.from(new Set(arr));

export const gradeMultipleChoice = (
  question: MultipleChoiceQuestion,
  selectedOptionIds: string[]
): GradeResult => {
  const correct = unique(question.correctOptionIds);
  const selected = unique(selectedOptionIds);
  const maxScore = 1;

  if (question.selectionMode === 'single') {
    const isCorrect =
      selected.length === 1 &&
      correct.length === 1 &&
      selected[0] === correct[0];
    return {
      questionId: question.id,
      isCorrect,
      score: isCorrect ? 1 : 0,
      maxScore,
      normalizedAnswer: { selectedOptionIds: selected },
    };
  }

  const correctSet = new Set(correct);
  const selectedSet = new Set(selected);
  const tp = selected.filter((id) => correctSet.has(id)).length;
  const fp = selected.filter((id) => !correctSet.has(id)).length;
  const fn = correct.filter((id) => !selectedSet.has(id)).length;
  const strictCorrect = fp === 0 && fn === 0;

  return {
    questionId: question.id,
    isCorrect: strictCorrect,
    score: strictCorrect ? 1 : 0,
    maxScore,
    normalizedAnswer: { selectedOptionIds: selected, tp, fp, fn },
  };
};
