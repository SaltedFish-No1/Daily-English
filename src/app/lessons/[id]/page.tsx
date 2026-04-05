import { LessonView } from '@/features/lesson/components/LessonView';
import { LessonListItem } from '@/types/lesson';
import { getLessonById, getLessonIds } from '@/lib/lessons-db';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getLessonById(id);
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
  const data = await getLessonById(id);

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
