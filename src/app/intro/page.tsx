import { Suspense } from 'react';
import { IntroView } from '@/features/intro/components/IntroView';

export const metadata = {
  title: '薄荷外语 — 每日沉浸式英语学习',
  description:
    'AI 驱动的英语学习平台：沉浸阅读、智能复习、写作批改、拍照识词，轻松掌握地道外语表达。',
};

export default function IntroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
        </div>
      }
    >
      <IntroView />
    </Suspense>
  );
}
