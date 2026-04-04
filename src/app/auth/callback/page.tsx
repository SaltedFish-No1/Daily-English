/**
 * @author SaltedFish-No1
 * @description OAuth 回调页面：接收 Supabase 重定向带回的授权码，
 *   完成 PKCE 令牌交换后跳转回首页。
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      router.replace('/');
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
        <p className="text-sm font-bold text-slate-500">登录中...</p>
      </div>
    </div>
  );
}
