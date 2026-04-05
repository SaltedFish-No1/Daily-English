import { HomeView } from '@/features/home/components/HomeView';
import { getLessons } from '@/lib/lessons-db';

export default async function Home() {
  const { lessons } = await getLessons();

  return <HomeView lessons={lessons} />;
}
