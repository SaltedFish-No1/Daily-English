import { describe, it, expect } from 'vitest';
import { gradeLegacySingle } from '@/features/lesson/components/quiz/grading/gradeLegacySingle';
import { LegacyQuizQuestion } from '@/features/lesson/components/quiz/types';

const q: LegacyQuizQuestion = {
  q: 'Which option is correct?',
  options: [
    { text: 'Wrong A', correct: false, rationale: { en: '', zh: '' } },
    { text: 'Right B', correct: true, rationale: { en: '', zh: '' } },
    { text: 'Wrong C', correct: false, rationale: { en: '', zh: '' } },
  ],
};

describe('gradeLegacySingle', () => {
  it('correct index gives score 1', () => {
    const r = gradeLegacySingle('q1', q, 1);
    expect(r.isCorrect).toBe(true);
    expect(r.score).toBe(1);
    expect(r.maxScore).toBe(1);
  });

  it('wrong index gives score 0', () => {
    const r = gradeLegacySingle('q1', q, 0);
    expect(r.isCorrect).toBe(false);
    expect(r.score).toBe(0);
  });

  it('null selection gives score 0', () => {
    const r = gradeLegacySingle('q1', q, null);
    expect(r.isCorrect).toBe(false);
    expect(r.score).toBe(0);
  });

  it('out-of-bounds index gives score 0', () => {
    const r = gradeLegacySingle('q1', q, 99);
    expect(r.isCorrect).toBe(false);
    expect(r.score).toBe(0);
  });
});
