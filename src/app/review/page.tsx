'use client';

/**
 * @author SaltedFish-No1
 * @description 复习课程入口页 — 从 URL query 读取待复习词列表，调用 AI 生成文章。
 *
 * URL: /review?words=elaborate,sustainability,incentive&difficulty=B1
 */

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ReviewView } from '@/features/review/components/ReviewView';
import { Spinner } from '@/components/ui/spinner';

function ReviewContent() {
  const searchParams = useSearchParams();
  const wordsParam = searchParams.get('words') || '';
  const difficulty = searchParams.get('difficulty') || 'B1';

  const words = wordsParam
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

  return <ReviewView words={words} difficulty={difficulty} />;
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Spinner size="md" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
