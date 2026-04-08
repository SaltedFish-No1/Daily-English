/**
 * @author SaltedFish-No1
 * @description 密码重置页面路由壳 — 委托 ResetPasswordView 处理业务逻辑。
 */

import { Suspense } from 'react';
import { ResetPasswordView } from '@/features/auth/components/ResetPasswordView';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
            <p className="text-sm font-bold text-slate-500">加载中...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordView />
    </Suspense>
  );
}
