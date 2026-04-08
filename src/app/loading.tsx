/**
 * @author SaltedFish-No1
 * @description 全局加载状态回退组件，使用 DashboardSkeleton 提供更有意义的占位。
 */
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

export default function Loading() {
  return <DashboardSkeleton />;
}
