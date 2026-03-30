'use client';

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
