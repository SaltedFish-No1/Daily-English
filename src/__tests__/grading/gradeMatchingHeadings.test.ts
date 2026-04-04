import { describe, it, expect } from 'vitest';
import { gradeMatchingHeadings } from '@/features/lesson/components/quiz/grading/gradeMatchingHeadings';
import { MatchingHeadingsQuestion } from '@/features/lesson/components/quiz/types';

const q: MatchingHeadingsQuestion = {
  id: 'mh1',
  type: 'matching_headings',
  prompt: 'Match the headings.',
  paragraphs: [
    { id: 'p1', label: 'A' },
    { id: 'p2', label: 'B' },
  ],
  headings: [
    { id: 'h1', text: 'Introduction' },
    { id: 'h2', text: 'Conclusion' },
  ],
  answerMap: { p1: 'h1', p2: 'h2' },
};

describe('gradeMatchingHeadings', () => {
  it('all correct gives full score', () => {
    const r = gradeMatchingHeadings(q, { p1: 'h1', p2: 'h2' });
    expect(r.score).toBe(2);
    expect(r.isCorrect).toBe(true);
  });

  it('partial correct gives partial score', () => {
    const r = gradeMatchingHeadings(q, { p1: 'h1', p2: 'h1' });
    expect(r.score).toBe(1);
    expect(r.isCorrect).toBe(false);
  });

  it('empty mapping scores 0', () => {
    const r = gradeMatchingHeadings(q, {});
    expect(r.score).toBe(0);
    expect(r.maxScore).toBe(2);
  });
});
