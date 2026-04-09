/**
 * @author SaltedFish-No1
 * @description 写作题目卡片骨架屏 — 模拟 WritingView 中题目卡片的加载占位。
 */

import { Skeleton } from '@/components/ui/skeleton';

interface TopicCardSkeletonProps {
  count?: number;
}

function TopicCardSkeletonItem() {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        {/* 图标占位 */}
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          {/* 标题 */}
          <Skeleton className="mb-2 h-4 w-3/4" />
          {/* 描述两行 */}
          <Skeleton className="mb-1 h-3 w-full" />
          <Skeleton className="mb-3 h-3 w-2/3" />
          {/* 底部标签 */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        {/* 箭头占位 */}
        <Skeleton className="mt-1 h-4 w-4 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

export function TopicCardSkeleton({ count = 3 }: TopicCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <TopicCardSkeletonItem key={i} />
      ))}
    </div>
  );
}
