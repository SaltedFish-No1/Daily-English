/**
 * @author SaltedFish-No1
 * @description OAuth 社交登录按钮组，支持 GitHub 和 Google 登录。
 */

'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import type { OAuthProvider } from '@/types/auth';

const providerConfig: Record<
  OAuthProvider,
  { label: string; icon: React.ReactNode }
> = {
  github: {
    label: 'GitHub',
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 fill-current"
      >
        <path d="M12 1.5C6.201 1.5 1.5 6.201 1.5 12c0 4.64 3.01 8.577 7.186 9.966.525.097.717-.228.717-.507 0-.25-.01-1.082-.014-1.962-2.924.636-3.54-1.241-3.54-1.241-.478-1.214-1.168-1.537-1.168-1.537-.955-.652.072-.639.072-.639 1.056.074 1.611 1.084 1.611 1.084.938 1.607 2.46 1.143 3.06.874.095-.68.367-1.144.667-1.407-2.335-.266-4.79-1.168-4.79-5.198 0-1.148.41-2.088 1.082-2.824-.109-.266-.469-1.337.102-2.787 0 0 .882-.282 2.89 1.078A9.96 9.96 0 0 1 12 6.337a9.95 9.95 0 0 1 2.633.354c2.007-1.36 2.888-1.078 2.888-1.078.572 1.45.212 2.521.104 2.787.673.736 1.08 1.676 1.08 2.824 0 4.04-2.458 4.929-4.8 5.19.378.326.714.967.714 1.95 0 1.408-.013 2.543-.013 2.889 0 .282.189.61.722.506A10.503 10.503 0 0 0 22.5 12c0-5.799-4.701-10.5-10.5-10.5Z" />
      </svg>
    ),
  },
  google: {
    label: 'Google',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
};

const providers: OAuthProvider[] = ['github', 'google'];

/**
 * @author SaltedFish-No1
 * @description 渲染 OAuth 社交登录按钮组。
 * @return OAuth 按钮组组件。
 */
export const OAuthButtons: React.FC = () => {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setLoading(provider);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    if (authError) {
      setError(authError.message);
    }
    setLoading(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {providers.map((provider) => {
          const config = providerConfig[provider];
          return (
            <Button
              key={provider}
              variant="outline"
              disabled={loading !== null}
              onClick={() => handleOAuthLogin(provider)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-50"
            >
              {loading === provider ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
              ) : (
                config.icon
              )}
              {config.label}
            </Button>
          );
        })}
      </div>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
};
