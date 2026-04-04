import { describe, it, expect } from 'vitest';
import { gradeMatchingFeatures } from '@/features/lesson/components/quiz/grading/gradeMatchingFeatures';
import { MatchingFeaturesQuestion } from '@/features/lesson/components/quiz/types';

const q: MatchingFeaturesQuestion = {
  id: 'mf1',
  type: 'matching_features',
  prompt: 'Match the features.',
  statements: [
    { id: 's1', text: 'First statement' },
    { id: 's2', text: 'Second statement' },
  ],
  features: [
    { id: 'f1', label: 'Feature 1' },
    { id: 'f2', label: 'Feature 2' },
  ],
  answerMap: { s1: 'f1', s2: 'f2' },
};

describe('gradeMatchingFeatures', () => {
  it('all correct gives full score', () => {
    const r = gradeMatchingFeatures(q, { s1: 'f1', s2: 'f2' });
    expect(r.score).toBe(2);
    expect(r.isCorrect).toBe(true);
  });

  it('partial correct gives partial score', () => {
    const r = gradeMatchingFeatures(q, { s1: 'f1', s2: 'f1' });
    expect(r.score).toBe(1);
    expect(r.isCorrect).toBe(false);
  });

  it('empty mapping scores 0', () => {
    const r = gradeMatchingFeatures(q, {});
    expect(r.score).toBe(0);
    expect(r.maxScore).toBe(2);
  });
});
