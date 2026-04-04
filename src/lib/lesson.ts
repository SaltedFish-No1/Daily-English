import { FocusWord, LessonData } from '@/types/lesson';

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

const isFocusWord = (value: unknown): value is FocusWord => {
  if (!isRecord(value)) return false;
  if (!isString(value.key)) return false;
  if (!isStringArray(value.forms) || value.forms.length === 0) return false;

  return true;
};

export const validateLessonData = (value: unknown): LessonData | null => {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== '2.1') return null;

  const { meta, speech, article, focusWords, chart, quiz } = value;

  if (!isRecord(meta) || !isString(meta.title)) return null;
  if (!isRecord(speech) || !isBoolean(speech.enabled)) return null;

  if (!isRecord(article) || !isString(article.title)) return null;
  if (!Array.isArray(article.paragraphs) || article.paragraphs.length === 0) {
    return null;
  }

  if (
    !Array.isArray(focusWords) ||
    focusWords.length === 0 ||
    !focusWords.every(isFocusWord)
  ) {
    return null;
  }

  const focusWordKeySet = new Set<string>();
  const formSet = new Set<string>();
  for (const focusWord of focusWords) {
    const normalizedKey = focusWord.key.trim().toLowerCase();
    if (!normalizedKey || focusWordKeySet.has(normalizedKey)) return null;
    focusWordKeySet.add(normalizedKey);

    const normalizedForms = focusWord.forms.map((form) =>
      form.trim().toLowerCase()
    );
    if (normalizedForms.some((form) => !form)) return null;
    if (new Set(normalizedForms).size !== normalizedForms.length) return null;

    for (const form of normalizedForms) {
      if (formSet.has(form)) return null;
      formSet.add(form);
    }
  }

  for (const paragraph of article.paragraphs) {
    if (
      !isRecord(paragraph) ||
      !isString(paragraph.id) ||
      !isString(paragraph.zh)
    ) {
      return null;
    }

    if (!isString(paragraph.en) || /<[^>]+>/.test(paragraph.en)) return null;
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
