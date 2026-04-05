/**
 * @description 课程数据访问层 — 供 Server Component 和 API route 共用。
 *   使用 service-role 客户端绕过 RLS，仅在服务端调用。
 *
 *   表结构：结构化列存元数据，article/focus_words/quiz 分列存储（JSONB），
 *   数据访问层负责拼装为前端所需的 LessonData / LessonListItem。
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  LessonData,
  LessonListItem,
  LessonArticle,
  FocusWord,
  LessonQuiz,
} from '@/types/lesson';

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

export async function getLessonBySlug(
  slug: string
): Promise<LessonData | null> {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, slug, title, category, teaser, tag, difficulty, published, featured, speech_enabled, article, focus_words, quiz'
    )
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !data) return null;

  const lesson: LessonData = {
    schemaVersion: '2.2',
    meta: {
      id: data.id,
      title: data.title,
      date: data.slug,
      category: data.category,
      teaser: data.teaser,
      published: data.published,
      featured: data.featured,
      tag: data.tag,
      difficulty: data.difficulty,
    },
    speech: { enabled: data.speech_enabled },
    article: data.article as LessonArticle,
    focusWords: data.focus_words as FocusWord[],
    quiz: data.quiz as LessonQuiz,
  };

  return lesson;
}

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
