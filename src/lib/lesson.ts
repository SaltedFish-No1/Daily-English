import { LessonData, VocabEntry } from '@/types/lesson';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(isString);
};

const isVocabEntry = (value: unknown): value is VocabEntry => {
  if (!isRecord(value)) return false;
  if (!isString(value.key)) return false;
  if (!isString(value.pos)) return false;
  if (!isString(value.def)) return false;
  if (!isString(value.trans)) return false;
  if (value.lemma !== undefined && !isString(value.lemma)) return false;
  if (value.forms !== undefined && !isStringArray(value.forms)) return false;
  if (value.speakText !== undefined && !isString(value.speakText)) return false;
  if (value.notes !== undefined && typeof value.notes !== 'string')
    return false;

  return true;
};

export const validateLessonData = (value: unknown): LessonData | null => {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== '2.0') return null;

  const { meta, speech, article, vocab, chart, quiz } = value;

  if (!isRecord(meta) || !isString(meta.title)) return null;
  if (!isRecord(speech) || !isBoolean(speech.enabled)) return null;

  if (!isRecord(article) || !isString(article.title)) return null;
  if (!Array.isArray(article.paragraphs) || article.paragraphs.length === 0) {
    return null;
  }

  if (
    !Array.isArray(vocab) ||
    vocab.length === 0 ||
    !vocab.every(isVocabEntry)
  ) {
    return null;
  }

  const vocabKeySet = new Set<string>();
  for (const entry of vocab) {
    if (vocabKeySet.has(entry.key)) return null;
    vocabKeySet.add(entry.key);
  }

  for (const paragraph of article.paragraphs) {
    if (
      !isRecord(paragraph) ||
      !isString(paragraph.id) ||
      !isString(paragraph.zh)
    ) {
      return null;
    }

    if (!isRecord(paragraph.en) || !isString(paragraph.en.text)) return null;
    if (!Array.isArray(paragraph.en.highlights)) return null;

    let lastEnd = -1;
    for (const highlight of paragraph.en.highlights) {
      if (!isRecord(highlight)) return null;
      if (
        !isNumber(highlight.start) ||
        !isNumber(highlight.end) ||
        !isString(highlight.key)
      ) {
        return null;
      }
      if (
        highlight.start < 0 ||
        highlight.start >= highlight.end ||
        highlight.end > paragraph.en.text.length ||
        highlight.start < lastEnd ||
        !vocabKeySet.has(highlight.key)
      ) {
        return null;
      }
      lastEnd = highlight.end;
    }
  }

  if (
    !isRecord(chart) ||
    !isString(chart.type) ||
    !['line', 'bar'].includes(chart.type) ||
    !isString(chart.title) ||
    !isString(chart.description) ||
    !isStringArray(chart.labels) ||
    !Array.isArray(chart.datasets) ||
    !Array.isArray(chart.insights)
  ) {
    return null;
  }

  for (const dataset of chart.datasets) {
    if (!isRecord(dataset)) return null;
    if (!isString(dataset.label) || !isString(dataset.borderColor)) return null;
    if (
      dataset.backgroundColor !== undefined &&
      !isString(dataset.backgroundColor)
    ) {
      return null;
    }
    if (!Array.isArray(dataset.data) || !dataset.data.every(isNumber))
      return null;
    if (dataset.data.length !== chart.labels.length) return null;
  }

  for (const insight of chart.insights) {
    if (!isRecord(insight)) return null;
    if (
      !isString(insight.icon) ||
      !isString(insight.title) ||
      !isString(insight.text)
    ) {
      return null;
    }
  }

  if (
    !isRecord(quiz) ||
    !isString(quiz.title) ||
    !Array.isArray(quiz.questions)
  ) {
    return null;
  }

  return value as unknown as LessonData;
};
