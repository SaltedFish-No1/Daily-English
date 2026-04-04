import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  normalizeTextCasefold,
  countWords,
} from '@/features/lesson/components/quiz/grading/normalizeAnswer';

describe('normalizeText', () => {
  it('trims leading/trailing whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });

  it('collapses internal whitespace to single space', () => {
    expect(normalizeText('hello   world')).toBe('hello world');
  });

  it('returns empty string unchanged', () => {
    expect(normalizeText('')).toBe('');
  });
});

describe('normalizeTextCasefold', () => {
  it('lowercases the result', () => {
    expect(normalizeTextCasefold('HELLO World')).toBe('hello world');
  });

  it('trims and collapses whitespace before lowercasing', () => {
    expect(normalizeTextCasefold('  FOO   BAR  ')).toBe('foo bar');
  });
});

describe('countWords', () => {
  it('counts single word', () => {
    expect(countWords('hello')).toBe(1);
  });

  it('counts multiple words', () => {
    expect(countWords('the quick brown fox')).toBe(4);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('counts words after normalization', () => {
    expect(countWords('  two  words  ')).toBe(2);
  });
});
