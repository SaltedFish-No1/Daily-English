import { describe, it, expect } from 'vitest';
import { buildRenderableTokens, createFocusWordMap } from '@/lib/focusWords';
import { FocusWord } from '@/types/lesson';

const focusWords: FocusWord[] = [
  { key: 'run', forms: ['run', 'running', 'ran'] },
  { key: 'fast', forms: ['fast', 'faster', 'fastest'] },
];

describe('createFocusWordMap', () => {
  it('maps each form to its key', () => {
    const map = createFocusWordMap(focusWords);
    expect(map.get('run')).toBe('run');
    expect(map.get('running')).toBe('run');
    expect(map.get('fast')).toBe('fast');
  });

  it('ignores empty focus words list', () => {
    const map = createFocusWordMap([]);
    expect(map.size).toBe(0);
  });
});

describe('buildRenderableTokens', () => {
  it('marks focus word tokens correctly', () => {
    const tokens = buildRenderableTokens('She was running fast.', focusWords);
    const focusTokens = tokens.filter((t) => t.isFocusWord);
    const texts = focusTokens.map((t) => t.text);
    expect(texts).toContain('running');
    expect(texts).toContain('fast');
  });

  it('marks non-focus words as isFocusWord=false', () => {
    const tokens = buildRenderableTokens('She was running.', focusWords);
    const sheToken = tokens.find((t) => t.text === 'She');
    expect(sheToken?.isFocusWord).toBe(false);
  });

  it('returns tokens for plain text with no focus words', () => {
    const tokens = buildRenderableTokens('Hello world', []);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every((t) => !t.isFocusWord)).toBe(true);
  });

  it('focus word token has correct query (the key)', () => {
    const tokens = buildRenderableTokens('She ran quickly.', focusWords);
    const ranToken = tokens.find((t) => t.isFocusWord && t.text === 'ran');
    expect(ranToken?.query).toBe('run');
  });

  it('handles empty text', () => {
    const tokens = buildRenderableTokens('', focusWords);
    expect(tokens).toEqual([]);
  });

  it('longer form matches before shorter form (greedy)', () => {
    const words: FocusWord[] = [{ key: 'run', forms: ['run', 'running'] }];
    const tokens = buildRenderableTokens('She is running.', words);
    const match = tokens.find((t) => t.isFocusWord);
    expect(match?.text).toBe('running');
  });
});
