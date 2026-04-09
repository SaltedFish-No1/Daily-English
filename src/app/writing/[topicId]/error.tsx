'use client';

/**
 * @author SaltedFish-No1
 * @description 写作练习页错误边界，捕获渲染错误并上报 Sentry，提供返回写作列表操作。
 */
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WritingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-5 text-center">
      <h2 className="mb-2 font-serif text-3xl font-bold text-slate-900">
        Something went wrong!
      </h2>
      <p className="mb-8 max-w-sm text-slate-500">
        加载写作练习时发生了一些错误，请重试。
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
        >
          <RotateCcw size={20} />
          重试
        </Button>
        <Link
          href="/writing"
          className="rounded-xl border border-slate-200 bg-white px-8 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          返回写作列表
        </Link>
      </div>
    </div>
  );
}
