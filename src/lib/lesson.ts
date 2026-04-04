/**
 * @description 课程 JSON 数据校验与 schema 迁移。
 */

import { FocusWord, LessonData } from '@/types/lesson';

// ---------------------------------------------------------------------------
// Schema migration
// ---------------------------------------------------------------------------

const CURRENT_SCHEMA_VERSION = '2.1';

type MigratorFn = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Add an entry here whenever the schema version is bumped.
 * Key = the FROM version; the function should return data at the next version.
 *
 * Example for a future 2.1 → 2.2 migration:
 *   '2.1': (data) => ({ ...data, schemaVersion: '2.2', newField: 'default' }),
 */
const MIGRATIONS: Record<string, MigratorFn> = {};

/**
 * Walks the migration chain until the data reaches CURRENT_SCHEMA_VERSION,
 * or returns null if the version is unknown / the chain is broken.
 */
const migrateToCurrentVersion = (
  value: Record<string, unknown>
): Record<string, unknown> | null => {
  let current = value;
  for (let step = 0; step < 20; step++) {
    if (current.schemaVersion === CURRENT_SCHEMA_VERSION) return current;
    if (typeof current.schemaVersion !== 'string') return null;
    const migrator = MIGRATIONS[current.schemaVersion];
    if (!migrator) return null;
    current = migrator(current);
  }
  return null; // exceeded max migration steps
};

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

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

// 防御性校验链：先迁移 schema 至当前版本，再逐字段验证，首次失败即返回 null（fail-fast）。
export const validateLessonData = (value: unknown): LessonData | null => {
  if (!isRecord(value)) return null;

  const migrated = migrateToCurrentVersion(value);
  if (!migrated) return null;

  const { meta, speech, article, focusWords, chart, quiz } = migrated;

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

  // 校验重点词唯一性：key 不可重复，form 跨词条全局不可重复。
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

    // 拒绝英文段落中的 HTML 标签，防止注入。
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

  return migrated as unknown as LessonData;
};
