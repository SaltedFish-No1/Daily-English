/**
 * @author SaltedFish-No1
 * @description 密码重置页面：用户通过邮件链接到达此页面，输入新密码并确认后完成重置。
 *   重置成功后 3 秒自动跳转至登录页。
 */

'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordWithToken } from '@/features/auth/lib/authApi';

const ResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 成功后 3s 跳转登录页
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => router.replace('/login'), 3000);
    return () => clearTimeout(timer);
  }, [success, router]);

  const handleSubmit = useCallback(async () => {
    setError(null);

    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    const { error: resetError } = await resetPasswordWithToken(
      email,
      token,
      password
    );
    if (resetError) {
      setError(resetError);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }, [email, token, password, confirmPassword]);

  const inputClass =
    'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400';

  // 参数缺失
  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-red-500">
              无效的重置链接，请从邮件中重新点击链接。
            </p>
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="mt-4 text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-700"
            >
              返回登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 重置成功
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              薄荷外语
            </h1>
            <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              每日一课，轻松进步
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <svg
                className="h-6 w-6 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-700">密码重置成功！</p>
            <p className="text-xs text-slate-400">3 秒后自动跳转到登录页...</p>
          </div>
        </div>
      </div>
    );
  }

  // 重置表单
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            薄荷外语
          </h1>
          <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
            每日一课，轻松进步
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-6 text-center text-sm font-bold text-slate-500">
            设置新密码
          </p>

          <div className="space-y-4">
            {/* 邮箱显示 */}
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">邮箱</p>
              <p className="text-sm font-bold text-slate-700">
                {decodeURIComponent(email)}
              </p>
            </div>

            <input
              type="password"
              placeholder="输入新密码（至少 6 位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />

            <input
              type="password"
              placeholder="再次确认新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className={inputClass}
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="button"
              disabled={
                loading || password.length < 6 || confirmPassword.length < 6
              }
              onClick={handleSubmit}
              className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? '重置中...' : '重置密码'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <ResetPasswordForm />
    </Suspense>
  );
}
