/**
 * @author SaltedFish-No1
 * @description 写作批改报告详情页面，根据提交 ID 加载评分报告。
 */
import { GradeView } from '@/features/writing/components/GradeView';

interface Props {
  params: Promise<{ topicId: string; submissionId: string }>;
}

export default async function GradePage({ params }: Props) {
  const { topicId, submissionId } = await params;
  return <GradeView topicId={topicId} submissionId={submissionId} />;
}
