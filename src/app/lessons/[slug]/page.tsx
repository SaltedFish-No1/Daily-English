import { LessonView } from '@/features/lesson/components/LessonView';
import { LessonListItem } from '@/types/lesson';
import { getLessonBySlug, getLessonSlugs } from '@/lib/lessons-db';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLessonBySlug(slug);
  if (!data) return { title: 'Lesson Not Found' };

  return {
    title: `${data.meta.title} - 薄荷外语`,
    description: data.meta.teaser,
  };
}

export async function generateStaticParams() {
  const slugs = await getLessonSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getLessonBySlug(slug);

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

  return <LessonView data={data} lessonSlug={slug} overview={overview} />;
}
