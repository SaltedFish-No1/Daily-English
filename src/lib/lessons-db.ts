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
      'id, slug, title, category, teaser, tag, difficulty, published, featured',
      { count: 'exact' }
    )
    .eq('published', true)
    .order('slug', { ascending: false })
    .range(from, to);

  if (difficulty) query = query.eq('difficulty', difficulty);
  if (tag) query = query.eq('tag', tag);
  if (featured !== undefined) query = query.eq('featured', featured);

  const { data, count, error } = await query;

  if (error) throw new Error(`getLessons failed: ${error.message}`);

  const lessons: LessonListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    date: row.slug,
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

export async function getLessonBySlug(
  slug: string
): Promise<LessonData | null> {
  // 1. Main lesson row
  const { data: lesson, error: lessonErr } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, slug, title, category, teaser, tag, difficulty, published, featured, speech_enabled, article_title, quiz_title'
    )
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (lessonErr || !lesson) return null;

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
      date: lesson.slug,
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

export async function getLessonSlugs(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('slug')
    .eq('published', true)
    .order('slug', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => row.slug);
}

export async function getLessonTitleMap(): Promise<Record<string, string>> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('slug, title')
    .eq('published', true);

  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.slug, row.title]));
}
