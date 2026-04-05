/**
 * @description 课程数据访问层 — 供 Server Component 和 API route 共用。
 *   使用 service-role 客户端绕过 RLS，仅在服务端调用。
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { LessonData, LessonListItem } from '@/types/lesson';
import { validateLessonData } from '@/lib/lesson';

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
    .select('content')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !data) return null;

  return validateLessonData(data.content);
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
