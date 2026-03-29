import fs from 'fs';
import path from 'path';
import { LessonView } from '@/features/lesson/components/LessonView';
import { LessonData } from '@/types/lesson';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'data', 'lessons', `${slug}.json`);
  if (!fs.existsSync(filePath)) return { title: 'Lesson Not Found' };

  const data: LessonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return {
    title: `${data.meta.title} - Daily English`,
    description: data.meta.summary,
  };
}

export async function generateStaticParams() {
  const lessonsDir = path.join(process.cwd(), 'data', 'lessons');
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
  const filePath = path.join(process.cwd(), 'data', 'lessons', `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return <div>Lesson not found</div>;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data: LessonData = JSON.parse(fileContent);

  return <LessonView data={data} />;
}
