/**
 * @author shadcn/ui
 * @description shadcn/ui Skeleton 组件 — 加载态占位块，使用 pulse 动画模拟内容加载。
 */

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-slate-200/60', className)}
      {...props}
    />
  );
}

export { Skeleton };
