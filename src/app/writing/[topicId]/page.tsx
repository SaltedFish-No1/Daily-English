/**
 * @author SaltedFish-No1
 * @description 写作练习详情页面，根据主题 ID 加载写作工作区。
 */
import { WritingWorkspace } from '@/features/writing/components/WritingWorkspace';

interface Props {
  params: Promise<{ topicId: string }>;
}

export default async function WritingTopicPage({ params }: Props) {
  const { topicId } = await params;
  return <WritingWorkspace topicId={topicId} />;
}
