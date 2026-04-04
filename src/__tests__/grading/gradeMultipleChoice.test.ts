import { describe, it, expect } from 'vitest';
import { gradeMultipleChoice } from '@/features/lesson/components/quiz/grading/gradeMultipleChoice';
import { MultipleChoiceQuestion } from '@/features/lesson/components/quiz/types';

const singleQ: MultipleChoiceQuestion = {
  id: 'mc1',
  type: 'multiple_choice',
  prompt: 'Which is correct?',
  selectionMode: 'single',
  options: [
    { id: 'a', text: 'Alpha' },
    { id: 'b', text: 'Beta' },
    { id: 'c', text: 'Gamma' },
  ],
  correctOptionIds: ['b'],
};

const multiQ: MultipleChoiceQuestion = {
  ...singleQ,
  id: 'mc2',
  selectionMode: 'multiple',
  correctOptionIds: ['a', 'c'],
};

describe('gradeMultipleChoice — single mode', () => {
  it('correct selection scores 1', () => {
    const r = gradeMultipleChoice(singleQ, ['b']);
    expect(r.isCorrect).toBe(true);
    expect(r.score).toBe(1);
  });

  it('wrong selection scores 0', () => {
    const r = gradeMultipleChoice(singleQ, ['a']);
    expect(r.isCorrect).toBe(false);
    expect(r.score).toBe(0);
  });

  it('no selection scores 0', () => {
    const r = gradeMultipleChoice(singleQ, []);
    expect(r.isCorrect).toBe(false);
  });
});

describe('gradeMultipleChoice — multiple mode', () => {
  it('all correct scores 1', () => {
    const r = gradeMultipleChoice(multiQ, ['a', 'c']);
    expect(r.isCorrect).toBe(true);
    expect(r.score).toBe(1);
  });

  it('partial correct scores 0', () => {
    const r = gradeMultipleChoice(multiQ, ['a']);
    expect(r.isCorrect).toBe(false);
    expect(r.score).toBe(0);
  });

  it('extra wrong selection scores 0', () => {
    const r = gradeMultipleChoice(multiQ, ['a', 'b', 'c']);
    expect(r.isCorrect).toBe(false);
  });
});
