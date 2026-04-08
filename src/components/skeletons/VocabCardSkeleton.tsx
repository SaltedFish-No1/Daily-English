/**
 * @author SaltedFish-No1
 * @description 词汇卡片骨架屏 — 模拟 VocabLibraryView 中单词卡片的加载占位。
 */

import { Skeleton } from '@/components/ui/skeleton';

interface VocabCardSkeletonProps {
  count?: number;
}

function VocabCardSkeletonItem() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* 单词 */}
          <Skeleton className="mb-2 h-5 w-28" />
          {/* 音标 */}
          <Skeleton className="mb-1 h-3 w-20" />
          {/* 释义 */}
          <Skeleton className="h-3 w-40" />
        </div>
        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function VocabCardSkeleton({ count = 8 }: VocabCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <VocabCardSkeletonItem key={i} />
      ))}
    </div>
  );
}
