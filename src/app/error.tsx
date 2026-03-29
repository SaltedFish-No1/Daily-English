'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-5 text-center">
      <h2 className="mb-2 font-serif text-3xl font-bold text-slate-900">
        Something went wrong!
      </h2>
      <p className="mb-8 max-w-sm text-slate-500">加载页面时发生了一些错误。</p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
      >
        <RotateCcw size={20} />
        重试
      </button>
    </div>
  );
}
