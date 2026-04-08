/**
 * @author SaltedFish-No1
 * @description 统计卡片骨架屏 — 模拟 DashboardView 中统计数据卡片的加载占位。
 */

import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardSkeletonProps {
  count?: number;
}

function StatsCardSkeletonItem() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
      <Skeleton className="mx-auto mb-2 h-5 w-5 rounded-full" />
      <Skeleton className="mx-auto mb-1 h-7 w-10" />
      <Skeleton className="mx-auto h-3 w-12" />
    </div>
  );
}

export function StatsCardSkeleton({ count = 3 }: StatsCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <StatsCardSkeletonItem key={i} />
      ))}
    </>
  );
}
