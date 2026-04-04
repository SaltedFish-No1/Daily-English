import { describe, it, expect } from 'vitest';
import { gradeCompletion } from '@/features/lesson/components/quiz/grading/gradeCompletion';
import { CompletionQuestion } from '@/features/lesson/components/quiz/types';

const q: CompletionQuestion = {
  id: 'cq1',
  type: 'completion',
  subtype: 'summary',
  prompt: 'Fill in the blanks.',
  instruction: 'Use NO MORE THAN TWO WORDS.',
  contentTemplate: 'The __b1__ runs __b2__.',
  blanks: [
    { id: 'b1', acceptedAnswers: ['river', 'stream'] },
    { id: 'b2', acceptedAnswers: ['fast', 'quickly'], caseSensitive: false },
  ],
};

describe('gradeCompletion', () => {
  it('all correct gives full score', () => {
    const r = gradeCompletion(q, { b1: 'river', b2: 'fast' });
    expect(r.score).toBe(2);
    expect(r.isCorrect).toBe(true);
  });

  it('partial answers give partial score', () => {
    const r = gradeCompletion(q, { b1: 'river', b2: 'wrong' });
    expect(r.score).toBe(1);
    expect(r.isCorrect).toBe(false);
  });

  it('empty blanks score 0', () => {
    const r = gradeCompletion(q, {});
    expect(r.score).toBe(0);
    expect(r.maxScore).toBe(2);
  });

  it('case-insensitive matching works', () => {
    const r = gradeCompletion(q, { b1: 'river', b2: 'FAST' });
    expect(r.score).toBe(2);
  });

  it('accepts alternative answer from acceptedAnswers list', () => {
    const r = gradeCompletion(q, { b1: 'stream', b2: 'quickly' });
    expect(r.score).toBe(2);
  });

  it('respects word limit', () => {
    const qWithLimit: CompletionQuestion = {
      ...q,
      blanks: [{ id: 'b1', acceptedAnswers: ['big river'], wordLimit: 1 }],
    };
    const r = gradeCompletion(qWithLimit, { b1: 'big river' });
    expect(r.score).toBe(0);
  });

  it('maxScore equals number of blanks', () => {
    const r = gradeCompletion(q, {});
    expect(r.maxScore).toBe(2);
  });
});
