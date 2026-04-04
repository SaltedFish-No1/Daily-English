import { describe, it, expect } from 'vitest';
import { gradeTFNG } from '@/features/lesson/components/quiz/grading/gradeTFNG';
import { TFNGQuestion } from '@/features/lesson/components/quiz/types';

const q: TFNGQuestion = {
  id: 'q1',
  type: 'tfng',
  mode: 'TFNG',
  prompt: 'Decide if the statement is True, False or Not Given.',
  statement: 'The sky is blue.',
  answer: 'TRUE',
};

describe('gradeTFNG', () => {
  it('returns isCorrect=true when answer matches', () => {
    const result = gradeTFNG(q, 'TRUE');
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(1);
    expect(result.maxScore).toBe(1);
  });

  it('returns isCorrect=false when answer does not match', () => {
    const result = gradeTFNG(q, 'FALSE');
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });

  it('returns isCorrect=false when selected is null', () => {
    const result = gradeTFNG(q, null);
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });

  it('sets feedbackKey=inference_gap when correct is NOT_GIVEN and selected is not', () => {
    const ngQ: TFNGQuestion = { ...q, answer: 'NOT_GIVEN' };
    const result = gradeTFNG(ngQ, 'TRUE');
    expect(result.feedbackKey).toBe('inference_gap');
  });

  it('does not set feedbackKey when answer is NOT_GIVEN and selection is also NOT_GIVEN', () => {
    const ngQ: TFNGQuestion = { ...q, answer: 'NOT_GIVEN' };
    const result = gradeTFNG(ngQ, 'NOT_GIVEN');
    expect(result.feedbackKey).toBeUndefined();
  });
});
