import { describe, it, expect } from 'vitest';
import {
  initReviewState,
  calculateNextReview,
  getWordsForReview,
  countDueWords,
  getMemoryStrength,
  WordReviewState,
} from '@/lib/spaced-repetition';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000; // fixed timestamp for deterministic tests

describe('initReviewState', () => {
  it('creates state with correct defaults', () => {
    const state = initReviewState(NOW);
    expect(state.interval).toBe(1);
    expect(state.easiness).toBe(2.5);
    expect(state.repetition).toBe(0);
    expect(state.nextReviewAt).toBe(NOW + MS_PER_DAY);
    expect(state.lastReviewedAt).toBe(0);
    expect(state.totalReviews).toBe(0);
    expect(state.totalCorrect).toBe(0);
    expect(state.status).toBe('new');
  });
});

describe('calculateNextReview', () => {
  const fresh = initReviewState(NOW);

  it('first correct answer sets interval to 1 day', () => {
    const next = calculateNextReview(4, fresh, NOW + MS_PER_DAY);
    expect(next.interval).toBe(1);
    expect(next.repetition).toBe(1);
    expect(next.totalReviews).toBe(1);
    expect(next.totalCorrect).toBe(1);
    expect(next.status).toBe('learning');
  });

  it('second correct answer sets interval to 6 days', () => {
    const after1 = calculateNextReview(4, fresh, NOW + MS_PER_DAY);
    const after2 = calculateNextReview(4, after1, NOW + 2 * MS_PER_DAY);
    expect(after2.interval).toBe(6);
    expect(after2.repetition).toBe(2);
    expect(after2.status).toBe('learning');
  });

  it('third correct answer uses interval * easiness', () => {
    const after1 = calculateNextReview(4, fresh, NOW + MS_PER_DAY);
    const after2 = calculateNextReview(4, after1, NOW + 2 * MS_PER_DAY);
    const after3 = calculateNextReview(4, after2, NOW + 8 * MS_PER_DAY);
    // interval = round(6 * easiness)
    expect(after3.interval).toBeGreaterThan(6);
    expect(after3.repetition).toBe(3);
    expect(after3.status).toBe('reviewing');
  });

  it('incorrect answer resets interval to 1 and repetition to 0', () => {
    const after1 = calculateNextReview(4, fresh, NOW + MS_PER_DAY);
    const after2 = calculateNextReview(4, after1, NOW + 2 * MS_PER_DAY);
    const afterFail = calculateNextReview(1, after2, NOW + 8 * MS_PER_DAY);
    expect(afterFail.interval).toBe(1);
    expect(afterFail.repetition).toBe(0);
    expect(afterFail.status).toBe('learning');
    expect(afterFail.totalCorrect).toBe(2); // still counts previous correct
  });

  it('quality=3 counts as correct (borderline)', () => {
    const next = calculateNextReview(3, fresh, NOW + MS_PER_DAY);
    expect(next.repetition).toBe(1);
    expect(next.totalCorrect).toBe(1);
  });

  it('quality=2 counts as incorrect', () => {
    const next = calculateNextReview(2, fresh, NOW + MS_PER_DAY);
    expect(next.repetition).toBe(0);
    expect(next.totalCorrect).toBe(0);
  });

  it('easiness never drops below 1.3', () => {
    let state = fresh;
    // Repeatedly fail to drive easiness down
    for (let i = 0; i < 20; i++) {
      state = calculateNextReview(0, state, NOW + i * MS_PER_DAY);
    }
    expect(state.easiness).toBeGreaterThanOrEqual(1.3);
  });

  it('perfect answers increase easiness', () => {
    const next = calculateNextReview(5, fresh, NOW + MS_PER_DAY);
    expect(next.easiness).toBeGreaterThan(fresh.easiness);
  });

  it('reaches mastered status after sufficient repetitions', () => {
    let state = fresh;
    let t = NOW;
    // Simulate many perfect reviews
    for (let i = 0; i < 10; i++) {
      t += state.interval * MS_PER_DAY;
      state = calculateNextReview(5, state, t);
    }
    // After many perfect reviews, interval should be large and status mastered
    expect(state.repetition).toBe(10);
    expect(state.interval).toBeGreaterThanOrEqual(30);
    expect(state.status).toBe('mastered');
  });

  it('clamps quality to 0-5 range', () => {
    const neg = calculateNextReview(-1, fresh, NOW + MS_PER_DAY);
    const over = calculateNextReview(10, fresh, NOW + MS_PER_DAY);
    expect(neg.totalReviews).toBe(1);
    expect(over.totalReviews).toBe(1);
    // quality -1 clamped to 0 → incorrect
    expect(neg.repetition).toBe(0);
    // quality 10 clamped to 5 → correct
    expect(over.repetition).toBe(1);
  });
});

describe('getWordsForReview', () => {
  it('returns words whose nextReviewAt <= now, sorted by urgency', () => {
    const states: Record<string, WordReviewState> = {
      apple: { ...initReviewState(NOW - 3 * MS_PER_DAY) }, // due 2 days ago
      banana: { ...initReviewState(NOW - 1 * MS_PER_DAY) }, // due just now
      cherry: { ...initReviewState(NOW + 1 * MS_PER_DAY) }, // not due yet
    };
    const result = getWordsForReview(states, 10, NOW);
    expect(result).toEqual(['apple', 'banana']);
  });

  it('excludes mastered words', () => {
    const mastered: WordReviewState = {
      ...initReviewState(NOW - 2 * MS_PER_DAY),
      status: 'mastered',
    };
    const states: Record<string, WordReviewState> = {
      known: mastered,
      unknown: initReviewState(NOW - 2 * MS_PER_DAY),
    };
    const result = getWordsForReview(states, 10, NOW);
    expect(result).toEqual(['unknown']);
  });

  it('respects the limit parameter', () => {
    const states: Record<string, WordReviewState> = {};
    for (let i = 0; i < 20; i++) {
      states[`word${i}`] = initReviewState(NOW - 2 * MS_PER_DAY);
    }
    const result = getWordsForReview(states, 5, NOW);
    expect(result).toHaveLength(5);
  });

  it('returns empty array when nothing is due', () => {
    const states: Record<string, WordReviewState> = {
      future: initReviewState(NOW + 10 * MS_PER_DAY),
    };
    expect(getWordsForReview(states, 10, NOW + 10 * MS_PER_DAY)).toEqual([]);
  });
});

describe('countDueWords', () => {
  it('counts only due, non-mastered words', () => {
    const states: Record<string, WordReviewState> = {
      due: initReviewState(NOW - 2 * MS_PER_DAY),
      notDue: initReviewState(NOW + 2 * MS_PER_DAY),
      mastered: {
        ...initReviewState(NOW - 2 * MS_PER_DAY),
        status: 'mastered',
      },
    };
    expect(countDueWords(states, NOW)).toBe(1);
  });
});

describe('getMemoryStrength', () => {
  it('returns 0 for new words', () => {
    expect(getMemoryStrength(initReviewState(NOW))).toBe(0);
  });

  it('returns 100 for mastered words', () => {
    const mastered: WordReviewState = {
      ...initReviewState(NOW),
      status: 'mastered',
      interval: 60,
      repetition: 8,
    };
    expect(getMemoryStrength(mastered)).toBe(100);
  });

  it('returns value between 5 and 80 for learning/reviewing words', () => {
    const learning: WordReviewState = {
      ...initReviewState(NOW),
      status: 'learning',
      interval: 3,
      repetition: 1,
    };
    const strength = getMemoryStrength(learning);
    expect(strength).toBeGreaterThanOrEqual(5);
    expect(strength).toBeLessThanOrEqual(80);
  });
});
