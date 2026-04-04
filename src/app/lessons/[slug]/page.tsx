import fs from 'fs';
import path from 'path';
import { LessonView } from '@/features/lesson/components/LessonView';
import { LessonData, LessonListItem, LessonsList } from '@/types/lesson';
import { Metadata } from 'next';

const lessonsDir = path.join(process.cwd(), 'data', 'lessons');
const lessonsListPath = path.join(process.cwd(), 'data', 'lessons.json');

const readLessonsList = (): LessonsList => {
  return JSON.parse(fs.readFileSync(lessonsListPath, 'utf8'));
};

const findLessonOverview = (slug: string): LessonListItem | null => {
  const { lessons } = readLessonsList();
  return lessons.find((lesson) => lesson.date === slug) ?? null;
};

const readLessonData = (slug: string): LessonData | null => {
  const filePath = path.join(lessonsDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
    title: `${data.meta.title} - Daily English`,
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

  return <LessonView data={data} lessonSlug={slug} overview={overview} />;
}
