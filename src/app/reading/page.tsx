/**
 * @author SaltedFish-No1
 * @description 阅读练习页面，加载课程列表并委托 ReadingView 渲染。
 */
import { ReadingView } from '@/features/reading/components/ReadingView';
import { getLessons } from '@/lib/lessons-db';

export default async function ReadingPage() {
  const { lessons } = await getLessons();

  return <ReadingView lessons={lessons} />;
}
