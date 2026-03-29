import fs from 'fs';
import path from 'path';
import { HomeView } from '@/features/home/components/HomeView';
import { LessonsList } from '@/types/lesson';

export default function Home() {
  const filePath = path.join(process.cwd(), 'data', 'lessons.json');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data: LessonsList = JSON.parse(fileContent);

  return <HomeView lessons={data.lessons} />;
}
