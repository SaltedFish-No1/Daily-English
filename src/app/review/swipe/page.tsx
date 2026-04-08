'use client';

/**
 * @author SaltedFish-No1
 * @description 滑动卡片复习入口 — 从 URL query 读取待复习词列表。
 *
 * URL: /review/swipe?words=elaborate,sustainability,incentive
 */

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SwipeReviewView } from '@/features/review/components/SwipeReviewView';
import { Spinner } from '@/components/ui/spinner';

function SwipeReviewContent() {
  const searchParams = useSearchParams();
  const wordsParam = searchParams.get('words') || '';

  const words = wordsParam
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

  return <SwipeReviewView words={words} />;
}

export default function SwipeReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Spinner size="md" />
        </div>
      }
    >
      <SwipeReviewContent />
    </Suspense>
  );
}
