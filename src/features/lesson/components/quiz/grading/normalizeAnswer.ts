'use client';

/**
 * @author SaltedFish-No1
 * @description 答案文本规范化：空白合并、大小写折叠与字数统计。
 */

export const normalizeText = (value: string) => {
  return value.trim().replace(/\s+/g, ' ');
};

export const normalizeTextCasefold = (value: string) => {
  return normalizeText(value).toLowerCase();
};

export const countWords = (value: string) => {
  const normalized = normalizeText(value);
  if (!normalized) return 0;
  return normalized.split(' ').length;
};
