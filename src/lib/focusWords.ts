/**
 * @description 重点词分词器：将正文按重点词表拆分为可交互 token 序列。
 */

import { FocusWord } from '@/types/lesson';
import { normalizeDictionaryQuery } from '@/lib/dictionary';

export interface RenderToken {
  type: 'text' | 'word';
  text: string;
  isFocusWord: boolean;
  query?: string;
}

const ENGLISH_WORD_PATTERN = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g;

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const tokenizePlainSegment = (segment: string): RenderToken[] => {
  const tokens: RenderToken[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null = null;

  while ((match = ENGLISH_WORD_PATTERN.exec(segment)) !== null) {
    if (match.index > cursor) {
      tokens.push({
        type: 'text',
        text: segment.slice(cursor, match.index),
        isFocusWord: false,
      });
    }

    const word = match[0];
    const query = normalizeDictionaryQuery(word);

    tokens.push({
      type: query ? 'word' : 'text',
      text: word,
      isFocusWord: false,
      query: query || undefined,
    });

    cursor = match.index + word.length;
  }

  if (cursor < segment.length) {
    tokens.push({
      type: 'text',
      text: segment.slice(cursor),
      isFocusWord: false,
    });
  }

  return tokens;
};

export const createFocusWordMap = (focusWords: FocusWord[]) => {
  const formToKey = new Map<string, string>();

  for (const focusWord of focusWords) {
    const normalizedKey = normalizeDictionaryQuery(focusWord.key);
    if (!normalizedKey) continue;

    for (const form of focusWord.forms) {
      const normalizedForm = normalizeDictionaryQuery(form);
      if (!normalizedForm || formToKey.has(normalizedForm)) continue;
      formToKey.set(normalizedForm, normalizedKey);
    }
  }

  return formToKey;
};

// 两步分词器：先用最长优先的正则按重点词边界断句，再将非重点段拆为单词和间隔。
// 采用游标递进避免遗漏两个重点词之间的普通文本。
export const buildRenderableTokens = (
  text: string,
  focusWords: FocusWord[]
) => {
  const formToKey = createFocusWordMap(focusWords);
  const forms = Array.from(formToKey.keys()).sort((a, b) => {
    return b.length - a.length || a.localeCompare(b);
  });

  if (forms.length === 0) {
    return tokenizePlainSegment(text);
  }

  const matcher = new RegExp(
    `\\b(?:${forms.map(escapeRegex).join('|')})\\b`,
    'gi'
  );
  const tokens: RenderToken[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null = null;

  while ((match = matcher.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push(...tokenizePlainSegment(text.slice(cursor, match.index)));
    }

    const surface = match[0];
    const key = formToKey.get(normalizeDictionaryQuery(surface));

    if (key) {
      tokens.push({
        type: 'word',
        text: surface,
        isFocusWord: true,
        query: key,
      });
    } else {
      tokens.push(...tokenizePlainSegment(surface));
    }

    cursor = match.index + surface.length;
  }

  if (cursor < text.length) {
    tokens.push(...tokenizePlainSegment(text.slice(cursor)));
  }

  return tokens;
};
