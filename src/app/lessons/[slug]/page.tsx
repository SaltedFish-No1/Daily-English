import fs from 'fs';
import path from 'path';
import { LessonView } from '@/features/lesson/components/LessonView';
import { LessonData, LessonListItem, LessonsList } from '@/types/lesson';
import { validateLessonData } from '@/lib/lesson';
import { Metadata } from 'next';

const lessonsDir = path.join(process.cwd(), 'data', 'lessons');
const lessonsListPath = path.join(process.cwd(), 'data', 'lessons.json');

const readLessonsList = (): LessonsList | null => {
  try {
    return JSON.parse(fs.readFileSync(lessonsListPath, 'utf8'));
  } catch {
    return null;
  }
};

const findLessonOverview = (slug: string): LessonListItem | null => {
  const list = readLessonsList();
  if (!list) return null;
  return list.lessons.find((lesson) => lesson.date === slug) ?? null;
};

/**
 * Find the next lesson (newer date) in the sorted list.
 * lessons.json is sorted newest-first, so "next" = previous index.
 */
const findNextLesson = (
  slug: string
): { slug: string; title: string } | null => {
  const list = readLessonsList();
  if (!list) return null;
  const idx = list.lessons.findIndex((lesson) => lesson.date === slug);
  if (idx <= 0) return null; // already newest or not found
  const next = list.lessons[idx - 1];
  return { slug: next.date, title: next.title };
};

const readLessonData = (slug: string): LessonData | null => {
  const filePath = path.join(lessonsDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    return validateLessonData(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } catch {
    return null;
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = readLessonData(slug);
  const overview = findLessonOverview(slug);
  if (!data) return { title: 'Lesson Not Found' };

  return {
    title: `${data.meta.title} - 薄荷外语`,
    description: overview?.teaser ?? data.article.title,
  };
}

export async function generateStaticParams() {
  const files = fs.readdirSync(lessonsDir);

  return files
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({
      slug: file.replace('.json', ''),
    }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = readLessonData(slug);
  const overview = findLessonOverview(slug);

  if (!data || !overview) {
    return <div>Lesson not found</div>;
  }

  const nextLesson = findNextLesson(slug);

  return (
    <LessonView
      data={data}
      lessonSlug={slug}
      overview={overview}
      nextLessonSlug={nextLesson?.slug ?? null}
      nextLessonTitle={nextLesson?.title ?? null}
    />
  );
}
