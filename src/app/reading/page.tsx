import { ReadingView } from '@/features/reading/components/ReadingView';
import { getLessons } from '@/lib/lessons-db';

export default async function ReadingPage() {
  const { lessons } = await getLessons();

  return <ReadingView lessons={lessons} />;
}
