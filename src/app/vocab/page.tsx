/**
 * @author SaltedFish-No1
 * @description 词汇库页面，加载课程标题映射并委托 VocabLibraryView 渲染。
 */
import { VocabLibraryView } from '@/features/vocab/components/VocabLibraryView';
import { getLessonTitleMap } from '@/lib/lessons-db';

export default async function VocabPage() {
  const lessonTitleMap = await getLessonTitleMap();

  return <VocabLibraryView lessonTitleMap={lessonTitleMap} />;
}
