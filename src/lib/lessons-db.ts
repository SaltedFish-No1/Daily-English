/**
 * @description 课程数据访问层 — 供 Server Component 和 API route 共用。
 *
 *   新结构：lessons 表包含 paragraphs / focus_words / quiz_questions 三个 JSONB 列，
 *   无需拼装子表数据。
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  LessonData,
  LessonListItem,
  Paragraph,
  FocusWord,
  AnyQuizQuestion,
  QuizRationale,
} from '@/types/lesson';
import { type GeneratedLesson } from '@/types/review';

// ---------------------------------------------------------------------------
// Types for JSONB rows stored in lessons table
// ---------------------------------------------------------------------------

interface ParagraphJson {
  key: string;
  en: string;
  zh: string;
}

interface FocusWordJson {
  key: string;
  forms: string[];
}

interface QuizQuestionJson {
  question_key: string;
  question_type: string;
  prompt: string;
  rationale_en?: string | null;
  rationale_zh?: string | null;
  evidence_refs?: string[] | null;
  payload?: Record<string, unknown>;
  // Allow spread of payload fields at top level (from review generation)
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toYyyyMmDd(input: string | null | undefined): string | undefined {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function mapParagraphs(jsonArr: ParagraphJson[] | null): Paragraph[] {
  return (jsonArr ?? []).map((p) => ({ id: p.key, en: p.en, zh: p.zh }));
}

function mapFocusWords(jsonArr: FocusWordJson[] | null): FocusWord[] {
  return (jsonArr ?? []).map((fw) => ({ key: fw.key, forms: fw.forms }));
}

function mapQuizQuestions(
  jsonArr: QuizQuestionJson[] | null
): AnyQuizQuestion[] {
  return (jsonArr ?? []).map((q) => {
    const rationale: QuizRationale | undefined =
      q.rationale_en && q.rationale_zh
        ? { en: q.rationale_en, zh: q.rationale_zh }
        : undefined;

    // Extract known fields, rest is payload
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      question_key,
      question_type,
      prompt,
      rationale_en: _re,
      rationale_zh: _rz,
      evidence_refs,
      payload,
      ...rest
    } = q;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    // payload can be either a dedicated object or spread at top level
    const payloadData = payload ?? rest;

    return {
      id: question_key,
      type: question_type,
      prompt,
      ...(rationale ? { rationale } : {}),
      ...(evidence_refs?.length ? { evidenceRefs: evidence_refs } : {}),
      ...payloadData,
    } as AnyQuizQuestion;
  });
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

interface GetLessonsOptions {
  difficulty?: string;
  tag?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

interface GetLessonsResult {
  lessons: LessonListItem[];
  total: number;
}

export async function getLessons(
  opts: GetLessonsOptions = {}
): Promise<GetLessonsResult> {
  const { difficulty, tag, featured, page = 1, limit = 50 } = opts;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('lessons')
    .select(
      'id, date, created_at, title, category, teaser, tag, difficulty, published, featured',
      { count: 'exact' }
    )
    .eq('published', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (difficulty) query = query.eq('difficulty', difficulty);
  if (tag) query = query.eq('tag', tag);
  if (featured !== undefined) query = query.eq('featured', featured);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`getLessons failed: ${error.message}`);
  }

  const lessons: LessonListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    createdAt: toYyyyMmDd(row.created_at) ?? row.date,
    title: row.title,
    category: row.category,
    teaser: row.teaser,
    published: row.published,
    featured: row.featured,
    tag: row.tag,
    difficulty: row.difficulty,
  }));

  return { lessons, total: count ?? 0 };
}

// ---------------------------------------------------------------------------
// Detail — read JSONB columns directly from lessons table
// ---------------------------------------------------------------------------

export async function getLessonById(id: string): Promise<LessonData | null> {
  const { data: lesson, error: lessonErr } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, date, title, category, teaser, tag, difficulty, published, featured, speech_enabled, article_title, quiz_title, paragraphs, focus_words, quiz_questions'
    )
    .eq('id', id)
    .eq('published', true)
    .single();

  if (lessonErr || !lesson) return null;

  return {
    schemaVersion: '2.2',
    meta: {
      id: lesson.id,
      title: lesson.title,
      date: lesson.date,
      category: lesson.category,
      teaser: lesson.teaser,
      published: lesson.published,
      featured: lesson.featured,
      tag: lesson.tag,
      difficulty: lesson.difficulty,
    },
    speech: { enabled: lesson.speech_enabled },
    article: {
      title: lesson.article_title,
      paragraphs: mapParagraphs(lesson.paragraphs as ParagraphJson[]),
    },
    focusWords: mapFocusWords(lesson.focus_words as FocusWordJson[]),
    quiz: {
      title: lesson.quiz_title,
      questions: mapQuizQuestions(lesson.quiz_questions as QuizQuestionJson[]),
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function getLessonDates(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => row.id);
}

export async function getLessonIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => row.id);
}

// ---------------------------------------------------------------------------
// Review lessons — save & query
// ---------------------------------------------------------------------------

/**
 * 将 AI 生成的复习课程写入 lessons 表（JSONB 列），关联到用户。
 * 使用 service-role 客户端绕过 RLS。
 */
export async function saveReviewLesson(
  userId: string,
  object: GeneratedLesson,
  words: string[],
  difficulty: string
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);

  // 将 paragraphs/focusWords/quizQuestions 序列化为 JSONB 格式
  const paragraphsJson = object.paragraphs.map((p) => ({
    key: p.id,
    en: p.en,
    zh: p.zh,
  }));

  const focusWordsJson = object.focusWords.map((fw) => ({
    key: fw.key,
    forms: fw.forms,
  }));

  const quizQuestionsJson = object.quizQuestions.map((q) => {
    const { id: qId, type, prompt, rationale, ...rest } = q;
    return {
      question_key: qId,
      question_type: type,
      prompt,
      rationale_en: rationale?.en ?? null,
      rationale_zh: rationale?.zh ?? null,
      evidence_refs: [] as string[],
      payload: rest,
    };
  });

  const { data: lesson, error: lessonErr } = await supabaseAdmin
    .from('lessons')
    .insert({
      date: today,
      title: object.title,
      category: object.category,
      teaser: object.teaser,
      tag: 'Review',
      difficulty,
      published: false,
      featured: false,
      speech_enabled: true,
      article_title: object.title,
      quiz_title: 'Vocabulary & Comprehension Check',
      paragraphs: paragraphsJson,
      focus_words: focusWordsJson,
      quiz_questions: quizQuestionsJson,
      user_id: userId,
      is_review: true,
      review_words: words,
    })
    .select('id')
    .single();

  if (lessonErr || !lesson) {
    throw new Error(
      `Failed to insert review lesson: ${lessonErr?.message ?? 'unknown'}`
    );
  }

  return lesson.id;
}

/**
 * 获取指定用户的复习课程列表（按时间倒序）。
 */
export async function getUserReviewLessons(
  userId: string,
  opts: { page?: number; limit?: number } = {}
): Promise<{ lessons: LessonListItem[]; total: number }> {
  const { page = 1, limit = 20 } = opts;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, date, created_at, title, category, teaser, tag, difficulty, published, featured, review_words',
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .eq('is_review', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`getUserReviewLessons failed: ${error.message}`);
  }

  const lessons: LessonListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    createdAt: toYyyyMmDd(row.created_at) ?? row.date,
    title: row.title,
    category: row.category,
    teaser: row.teaser,
    published: row.published,
    featured: row.featured,
    tag: row.tag,
    difficulty: row.difficulty,
  }));

  return { lessons, total: count ?? 0 };
}

/**
 * 获取用户自己的复习课程详情（不检查 published）。
 */
export async function getReviewLessonById(
  lessonId: string,
  userId: string
): Promise<LessonData | null> {
  const { data: lesson, error: lessonErr } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, date, title, category, teaser, tag, difficulty, published, featured, speech_enabled, article_title, quiz_title, paragraphs, focus_words, quiz_questions, is_review, review_words'
    )
    .eq('id', lessonId)
    .eq('user_id', userId)
    .eq('is_review', true)
    .single();

  if (lessonErr || !lesson) return null;

  return {
    schemaVersion: '2.2',
    meta: {
      id: lesson.id,
      title: lesson.title,
      date: lesson.date,
      category: lesson.category,
      teaser: lesson.teaser,
      published: lesson.published,
      featured: lesson.featured,
      tag: lesson.tag,
      difficulty: lesson.difficulty,
      isReview: true,
      reviewWords: lesson.review_words ?? [],
    },
    speech: { enabled: lesson.speech_enabled },
    article: {
      title: lesson.article_title,
      paragraphs: mapParagraphs(lesson.paragraphs as ParagraphJson[]),
    },
    focusWords: mapFocusWords(lesson.focus_words as FocusWordJson[]),
    quiz: {
      title: lesson.quiz_title,
      questions: mapQuizQuestions(lesson.quiz_questions as QuizQuestionJson[]),
    },
  };
}

// ---------------------------------------------------------------------------
// Title map
// ---------------------------------------------------------------------------

export async function getLessonTitleMap(): Promise<Record<string, string>> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('id, date, title')
    .eq('published', true);

  if (error || !data) return {};
  return Object.fromEntries(
    data.flatMap((row) => [
      [row.id, row.title] as [string, string],
      [row.date, row.title] as [string, string],
    ])
  );
}
