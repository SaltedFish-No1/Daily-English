/**
 * @author SaltedFish-No1
 * @description 首页完整骨架屏 — 用于 DashboardView 初始加载和全局 loading 回退。
 */

import { Skeleton } from '@/components/ui/skeleton';
import { StatsCardSkeleton } from './StatsCardSkeleton';

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 px-5 pt-6 pb-28">
      <div className="mx-auto max-w-3xl">
        {/* 标题区域 */}
        <div className="mb-6">
          <Skeleton className="mb-2 h-4 w-20" />
          <Skeleton className="h-7 w-48" />
        </div>

        {/* 统计卡片 */}
        <div className="mb-6 grid grid-cols-3 gap-3 sm:mb-8">
          <StatsCardSkeleton count={3} />
        </div>

        {/* 最近活动 */}
        <div className="mb-6">
          <Skeleton className="mb-4 h-5 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近词汇 */}
        <div>
          <Skeleton className="mb-4 h-5 w-24" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-28 shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
