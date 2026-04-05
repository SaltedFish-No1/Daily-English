import { WritingWorkspace } from '@/features/writing/components/WritingWorkspace';

interface Props {
  params: Promise<{ topicId: string }>;
}

export default async function WritingTopicPage({ params }: Props) {
  const { topicId } = await params;
  return <WritingWorkspace topicId={topicId} />;
}
