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

function SwipeReviewContent() {
  const searchParams = useSearchParams();
  const wordsParam = searchParams.get('words') || '';

  const words = wordsParam
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">没有待复习的词汇</p>
          <p className="mt-1 text-sm text-slate-500">
            收藏生词后，系统会根据遗忘曲线安排复习
          </p>
          <a
            href="/reading"
            className="mt-4 inline-block rounded-full bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            去阅读
          </a>
        </div>
      </div>
    );
  }

  return <SwipeReviewView words={words} />;
}

export default function SwipeReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      }
    >
      <SwipeReviewContent />
    </Suspense>
  );
}
