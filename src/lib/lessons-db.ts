/**
 * @description 课程数据访问层 — 供 Server Component 和 API route 共用。
 *
 *   规范化表结构：lessons + lesson_paragraphs + lesson_focus_words + lesson_quiz_questions
 *   此层负责将多表数据拼装为前端所需的 LessonData / LessonListItem。
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
// Types for raw DB rows
// ---------------------------------------------------------------------------

interface ParagraphRow {
  key: string;
  en: string;
  zh: string;
}

interface FocusWordRow {
  key: string;
  forms: string[];
}

interface QuizQuestionRow {
  question_key: string;
  question_type: string;
  prompt: string;
  rationale_en: string | null;
  rationale_zh: string | null;
  evidence_refs: string[] | null;
  payload: Record<string, unknown>;
}

interface LegacyLessonRow {
  id: string;
  slug: string;
  created_at: string | null;
  title: string;
  category: string;
  teaser: string;
  tag: string;
  difficulty: string;
  published: boolean;
  featured: boolean;
  content: LessonData | null;
}

function isMissingColumn(error: unknown, column: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  return message.includes(`column lessons.${column} does not exist`);
}

function toYyyyMmDd(input: string | null | undefined): string | undefined {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
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

  if (error && !isMissingColumn(error, 'date')) {
    throw new Error(`getLessons failed: ${error.message}`);
  }

  if (error && isMissingColumn(error, 'date')) {
    let legacyQuery = supabaseAdmin
      .from('lessons')
      .select(
        'id, slug, created_at, title, category, teaser, tag, difficulty, published, featured',
        { count: 'exact' }
      )
      .eq('published', true)
      .order('slug', { ascending: false })
      .range(from, to);

    if (difficulty) legacyQuery = legacyQuery.eq('difficulty', difficulty);
    if (tag) legacyQuery = legacyQuery.eq('tag', tag);
    if (featured !== undefined)
      legacyQuery = legacyQuery.eq('featured', featured);

    const {
      data: legacyData,
      count: legacyCount,
      error: legacyErr,
    } = await legacyQuery;

    if (legacyErr) throw new Error(`getLessons failed: ${legacyErr.message}`);

    const lessons: LessonListItem[] = (
      (legacyData as LegacyLessonRow[] | null) ?? []
    ).map((row) => ({
      id: row.id,
      date: row.slug,
      createdAt: toYyyyMmDd(row.created_at) ?? row.slug,
      title: row.title,
      category: row.category,
      teaser: row.teaser,
      published: row.published,
      featured: row.featured,
      tag: row.tag,
      difficulty: row.difficulty as LessonListItem['difficulty'],
    }));

    return { lessons, total: legacyCount ?? 0 };
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
// Detail — assemble LessonData from 4 tables
// ---------------------------------------------------------------------------

export async function getLessonById(id: string): Promise<LessonData | null> {
  console.log('[getLessonById] querying lesson, id:', id);

  const { data: lesson, error: lessonErr } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, date, title, category, teaser, tag, difficulty, published, featured, speech_enabled, article_title, quiz_title'
    )
    .eq('id', id)
    .eq('published', true)
    .single();

  console.log('[getLessonById] main query result:', {
    hasData: !!lesson,
    error: lessonErr ? lessonErr.message : null,
    errorCode: lessonErr?.code ?? null,
  });

  if (lessonErr && isMissingColumn(lessonErr, 'date')) {
    const { data: legacyLesson, error: legacyErr } = await supabaseAdmin
      .from('lessons')
      .select(
        'id, slug, title, category, teaser, tag, difficulty, published, featured, content'
      )
      .eq('id', id)
      .eq('published', true)
      .single();

    if (legacyErr || !legacyLesson) return null;

    const row = legacyLesson as LegacyLessonRow;
    const content = row.content ?? ({} as LessonData);

    return {
      schemaVersion: content.schemaVersion ?? '2.1',
      meta: {
        id: row.id,
        title: row.title,
        date: row.slug,
        category: row.category,
        teaser: row.teaser,
        published: row.published,
        featured: row.featured,
        tag: row.tag,
        difficulty: row.difficulty as LessonListItem['difficulty'],
      },
      speech: content.speech ?? { enabled: true },
      article: content.article ?? { title: row.title, paragraphs: [] },
      focusWords: content.focusWords ?? [],
      quiz: content.quiz ?? { title: 'Knowledge Check', questions: [] },
    };
  }

  if (lessonErr || !lesson) {
    console.log('[getLessonById] no published lesson found, returning null');
    return null;
  }

  console.log('[getLessonById] found lesson:', {
    id: lesson.id,
    title: lesson.title,
    date: lesson.date,
  });

  // 2. Fetch child tables in parallel
  const [paragraphsRes, focusWordsRes, questionsRes] = await Promise.all([
    supabaseAdmin
      .from('lesson_paragraphs')
      .select('key, en, zh')
      .eq('lesson_id', lesson.id)
      .order('position', { ascending: true }),
    supabaseAdmin
      .from('lesson_focus_words')
      .select('key, forms')
      .eq('lesson_id', lesson.id)
      .order('position', { ascending: true }),
    supabaseAdmin
      .from('lesson_quiz_questions')
      .select(
        'question_key, question_type, prompt, rationale_en, rationale_zh, evidence_refs, payload'
      )
      .eq('lesson_id', lesson.id)
      .order('position', { ascending: true }),
  ]);

  console.log('[getLessonById] child table results:', {
    paragraphs: {
      count: paragraphsRes.data?.length ?? 0,
      error: paragraphsRes.error?.message ?? null,
    },
    focusWords: {
      count: focusWordsRes.data?.length ?? 0,
      error: focusWordsRes.error?.message ?? null,
    },
    questions: {
      count: questionsRes.data?.length ?? 0,
      error: questionsRes.error?.message ?? null,
    },
  });

  // 3. Assemble paragraphs
  const paragraphs: Paragraph[] = (
    (paragraphsRes.data as ParagraphRow[] | null) ?? []
  ).map((row) => ({
    id: row.key,
    en: row.en,
    zh: row.zh,
  }));

  // 4. Assemble focus words
  const focusWords: FocusWord[] = (
    (focusWordsRes.data as FocusWordRow[] | null) ?? []
  ).map((row) => ({
    key: row.key,
    forms: row.forms,
  }));

  // 5. Assemble quiz questions
  const questions: AnyQuizQuestion[] = (
    (questionsRes.data as QuizQuestionRow[] | null) ?? []
  ).map((row) => {
    const rationale: QuizRationale | undefined =
      row.rationale_en && row.rationale_zh
        ? { en: row.rationale_en, zh: row.rationale_zh }
        : undefined;

    return {
      id: row.question_key,
      type: row.question_type,
      prompt: row.prompt,
      ...(rationale ? { rationale } : {}),
      ...(row.evidence_refs?.length ? { evidenceRefs: row.evidence_refs } : {}),
      ...row.payload,
    } as AnyQuizQuestion;
  });

  // 6. Build the full LessonData
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
      paragraphs,
    },
    focusWords,
    quiz: {
      title: lesson.quiz_title,
      questions,
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

  if (error && !isMissingColumn(error, 'date')) return [];
  if (data) return data.map((row) => row.id);

  const { data: legacyData, error: legacyError } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('published', true)
    .order('slug', { ascending: false });

  if (legacyError || !legacyData) return [];
  return legacyData.map((row) => row.id);
}

export async function getLessonIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error && !isMissingColumn(error, 'date')) return [];
  if (data) return data.map((row) => row.id);

  const { data: legacyData, error: legacyError } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('published', true)
    .order('slug', { ascending: false });

  if (legacyError || !legacyData) return [];
  return legacyData.map((row) => row.id);
}

// ---------------------------------------------------------------------------
// Review lessons — save & query
// ---------------------------------------------------------------------------

/**
 * 将 AI 生成的复习课程写入 lessons + 子表，关联到用户。
 * 使用 service-role 客户端绕过 RLS。
 */
export async function saveReviewLesson(
  userId: string,
  object: GeneratedLesson,
  words: string[],
  difficulty: string
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);

  // 1. Insert main lesson row
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

  const lessonId = lesson.id;

  // 2. Insert child rows in parallel
  const paragraphRows = object.paragraphs.map((p, i) => ({
    lesson_id: lessonId,
    position: i,
    key: p.id,
    en: p.en,
    zh: p.zh,
  }));

  const focusWordRows = object.focusWords.map((fw, i) => ({
    lesson_id: lessonId,
    position: i,
    key: fw.key,
    forms: fw.forms,
  }));

  const questionRows = object.quizQuestions.map((q, i) => {
    const { id: qId, type, prompt, rationale, ...rest } = q;
    return {
      lesson_id: lessonId,
      position: i,
      question_key: qId,
      question_type: type,
      prompt,
      rationale_en: rationale?.en ?? null,
      rationale_zh: rationale?.zh ?? null,
      evidence_refs: [],
      payload: rest,
    };
  });

  const results = await Promise.all([
    paragraphRows.length > 0
      ? supabaseAdmin.from('lesson_paragraphs').insert(paragraphRows)
      : null,
    focusWordRows.length > 0
      ? supabaseAdmin.from('lesson_focus_words').insert(focusWordRows)
      : null,
    questionRows.length > 0
      ? supabaseAdmin.from('lesson_quiz_questions').insert(questionRows)
      : null,
  ]);

  for (const res of results) {
    if (res?.error) {
      console.error('[saveReviewLesson] child insert failed:', res.error);
    }
  }

  return lessonId;
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
  console.log(
    '[getReviewLessonById] querying, lessonId:',
    lessonId,
    'userId:',
    userId
  );

  const { data: lesson, error: lessonErr } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, date, title, category, teaser, tag, difficulty, published, featured, speech_enabled, article_title, quiz_title, is_review, review_words'
    )
    .eq('id', lessonId)
    .eq('user_id', userId)
    .eq('is_review', true)
    .single();

  console.log('[getReviewLessonById] query result:', {
    hasData: !!lesson,
    error: lessonErr ? lessonErr.message : null,
    errorCode: lessonErr?.code ?? null,
  });

  if (lessonErr || !lesson) return null;

  const [paragraphsRes, focusWordsRes, questionsRes] = await Promise.all([
    supabaseAdmin
      .from('lesson_paragraphs')
      .select('key, en, zh')
      .eq('lesson_id', lesson.id)
      .order('position', { ascending: true }),
    supabaseAdmin
      .from('lesson_focus_words')
      .select('key, forms')
      .eq('lesson_id', lesson.id)
      .order('position', { ascending: true }),
    supabaseAdmin
      .from('lesson_quiz_questions')
      .select(
        'question_key, question_type, prompt, rationale_en, rationale_zh, evidence_refs, payload'
      )
      .eq('lesson_id', lesson.id)
      .order('position', { ascending: true }),
  ]);

  const paragraphs: Paragraph[] = (
    (paragraphsRes.data as ParagraphRow[] | null) ?? []
  ).map((row) => ({ id: row.key, en: row.en, zh: row.zh }));

  const focusWords: FocusWord[] = (
    (focusWordsRes.data as FocusWordRow[] | null) ?? []
  ).map((row) => ({ key: row.key, forms: row.forms }));

  const questions: AnyQuizQuestion[] = (
    (questionsRes.data as QuizQuestionRow[] | null) ?? []
  ).map((row) => {
    const rationale: QuizRationale | undefined =
      row.rationale_en && row.rationale_zh
        ? { en: row.rationale_en, zh: row.rationale_zh }
        : undefined;
    return {
      id: row.question_key,
      type: row.question_type,
      prompt: row.prompt,
      ...(rationale ? { rationale } : {}),
      ...(row.evidence_refs?.length ? { evidenceRefs: row.evidence_refs } : {}),
      ...row.payload,
    } as AnyQuizQuestion;
  });

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
    article: { title: lesson.article_title, paragraphs },
    focusWords,
    quiz: { title: lesson.quiz_title, questions },
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

  if (error && !isMissingColumn(error, 'date')) return {};
  if (data) {
    return Object.fromEntries(
      data.flatMap((row) => [
        [row.id, row.title] as [string, string],
        [row.date, row.title] as [string, string],
      ])
    );
  }

  const { data: legacyData, error: legacyError } = await supabaseAdmin
    .from('lessons')
    .select('id, slug, title')
    .eq('published', true);

  if (legacyError || !legacyData) return {};
  return Object.fromEntries(
    legacyData.flatMap((row) => [
      [row.id, row.title] as [string, string],
      [row.slug, row.title] as [string, string],
    ])
  );
}
