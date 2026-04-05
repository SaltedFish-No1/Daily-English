import { VocabLibraryView } from '@/features/vocab/components/VocabLibraryView';
import { getLessonTitleMap } from '@/lib/lessons-db';

export default async function VocabPage() {
  const lessonTitleMap = await getLessonTitleMap();

  return <VocabLibraryView lessonTitleMap={lessonTitleMap} />;
}
