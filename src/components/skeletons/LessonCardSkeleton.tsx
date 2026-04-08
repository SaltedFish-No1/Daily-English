/**
 * @author SaltedFish-No1
 * @description 课程卡片骨架屏 — 模拟 ReadingView 中课程卡片的加载占位。
 */

import { Skeleton } from '@/components/ui/skeleton';

interface LessonCardSkeletonProps {
  count?: number;
}

function LessonCardSkeletonItem() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      {/* 卡片头部区域 */}
      <div className="flex h-44 flex-col items-center justify-center bg-emerald-50/30 p-6 sm:h-48">
        <Skeleton className="mb-3 h-5 w-20 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      {/* 卡片底部信息 */}
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <Skeleton className="mb-2 h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}

export function LessonCardSkeleton({ count = 6 }: LessonCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <LessonCardSkeletonItem key={i} />
      ))}
    </>
  );
}
