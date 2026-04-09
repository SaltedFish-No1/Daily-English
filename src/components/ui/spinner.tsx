/**
 * @author SaltedFish-No1
 * @description 统一加载指示器组件 — 替代散落在各处的自定义 spinner 样式。
 */
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-emerald-600', sizeMap[size], className)}
    />
  );
}

export { Spinner };
export type { SpinnerProps };
