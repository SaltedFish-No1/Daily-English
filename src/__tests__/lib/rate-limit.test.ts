import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, _resetForTest } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetForTest();
  });

  it('allows requests within the limit', () => {
    const result = checkRateLimit('user-1', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('tracks remaining count accurately', () => {
    checkRateLimit('user-1', 3);
    checkRateLimit('user-1', 3);
    const result = checkRateLimit('user-1', 3);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('denies requests when limit is reached', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-1', 3);
    }
    const result = checkRateLimit('user-1', 3);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('isolates rate limits between different users', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-1', 3);
    }
    const result1 = checkRateLimit('user-1', 3);
    const result2 = checkRateLimit('user-2', 3);

    expect(result1.allowed).toBe(false);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(2);
  });

  it('allows max=1 for a single request', () => {
    const first = checkRateLimit('user-1', 1);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(0);

    const second = checkRateLimit('user-1', 1);
    expect(second.allowed).toBe(false);
  });

  it('retryAfterMs is positive when denied', () => {
    checkRateLimit('user-1', 1);
    const result = checkRateLimit('user-1', 1);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThanOrEqual(1);
    // Should be close to 60 seconds (window size)
    expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
  });
});
