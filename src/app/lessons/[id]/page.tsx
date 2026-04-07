import { LessonView } from '@/features/lesson/components/LessonView';
import { LessonListItem } from '@/types/lesson';
import { getLessonById, getLessonIds } from '@/lib/lessons-db';
import { getServerUserId } from '@/lib/supabase-rsc';
import { cookies } from 'next/headers';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

async function resolveLesson(id: string) {
  console.log('[resolveLesson] id:', id);

  try {
    const publicData = await getLessonById(id);
    console.log(
      '[resolveLesson] getLessonById(public):',
      publicData ? `found: ${publicData.meta.title}` : 'null'
    );
    if (publicData) return publicData;
  } catch (err) {
    console.error('[resolveLesson] getLessonById(public) threw:', err);
    throw err;
  }

  await cookies();
  console.log('[resolveLesson] cookies() done');

  let userId: string | null = null;
  try {
    userId = await getServerUserId();
  } catch (err) {
    console.error('[resolveLesson] getServerUserId threw:', err);
    throw err;
  }
  console.log('[resolveLesson] userId:', userId);

  if (!userId) return null;

  try {
    const data = await getLessonById(id, userId);
    console.log(
      '[resolveLesson] getLessonById(auth):',
      data ? `found: ${data.meta.title}` : 'null'
    );
    return data;
  } catch (err) {
    console.error('[resolveLesson] getLessonById(auth) threw:', err);
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await resolveLesson(id);
  if (!data) return { title: 'Lesson Not Found' };

  return {
    title: `${data.meta.title} - 薄荷外语`,
    description: data.meta.teaser,
  };
}

export async function generateStaticParams() {
  const ids = await getLessonIds();
  return ids.map((id) => ({ id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await resolveLesson(id);

  console.log('[LessonPage] data summary:', {
    hasData: !!data,
    hasArticle: !!data?.article,
    articleTitle: data?.article?.title ?? 'MISSING',
    paragraphCount: data?.article?.paragraphs?.length ?? 0,
    quizCount: data?.quiz?.questions?.length ?? 0,
  });

  if (!data) {
    return <div>Lesson not found</div>;
  }

  const overview: LessonListItem = {
    id: data.meta.id,
    date: data.meta.date,
    title: data.meta.title,
    category: data.meta.category,
    teaser: data.meta.teaser,
    published: data.meta.published,
    featured: data.meta.featured,
    tag: data.meta.tag,
    difficulty: data.meta.difficulty,
  };

  return <LessonView data={data} lessonSlug={id} overview={overview} />;
}
