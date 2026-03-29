import fs from 'fs';
import path from 'path';
import { VocabLibraryView } from '@/features/vocab/components/VocabLibraryView';
import { LessonsList } from '@/types/lesson';

export default function VocabPage() {
  const listPath = path.join(process.cwd(), 'data', 'lessons.json');
  const listRaw = fs.readFileSync(listPath, 'utf8');
  const listData: LessonsList = JSON.parse(listRaw);
  const lessonTitleMap = listData.lessons.reduce<Record<string, string>>(
    (acc, lesson) => {
      acc[lesson.date] = lesson.title;
      return acc;
    },
    {}
  );

  return <VocabLibraryView lessonTitleMap={lessonTitleMap} />;
}
