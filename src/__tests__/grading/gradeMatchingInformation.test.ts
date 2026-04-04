import { describe, it, expect } from 'vitest';
import { gradeMatchingInformation } from '@/features/lesson/components/quiz/grading/gradeMatchingInformation';
import { MatchingInformationQuestion } from '@/features/lesson/components/quiz/types';

const q: MatchingInformationQuestion = {
  id: 'mi1',
  type: 'matching_information',
  prompt: 'Match the information.',
  items: [
    { id: 'i1', statement: 'First item' },
    { id: 'i2', statement: 'Second item' },
  ],
  targets: [
    { id: 'A', label: 'Paragraph A' },
    { id: 'B', label: 'Paragraph B' },
  ],
  answerMap: { i1: 'A', i2: ['B', 'C'] },
};

describe('gradeMatchingInformation', () => {
  it('correct single answer scores 1', () => {
    const r = gradeMatchingInformation(q, { i1: 'A', i2: 'B' });
    expect(r.score).toBe(2);
    expect(r.isCorrect).toBe(true);
  });

  it('accepts any of multiple correct answers', () => {
    const r = gradeMatchingInformation(q, { i1: 'A', i2: 'C' });
    expect(r.score).toBe(2);
  });

  it('wrong answer scores 0 for that item', () => {
    const r = gradeMatchingInformation(q, { i1: 'B', i2: 'B' });
    expect(r.score).toBe(1);
    expect(r.isCorrect).toBe(false);
  });

  it('empty mapping scores 0', () => {
    const r = gradeMatchingInformation(q, {});
    expect(r.score).toBe(0);
    expect(r.maxScore).toBe(2);
  });
});
