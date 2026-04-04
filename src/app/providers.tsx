'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataSync } from '@/features/auth/hooks/useDataSync';

/**
 * @author SaltedFish-No1
 * @description 初始化 Supabase 鉴权状态监听，保持 useAuthStore 与 Supabase SDK 同步。
 */
function AuthListener() {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const { setAuth, setLoading } = useAuthStore.getState();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      setAuth(session?.user ?? null, session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      useAuthStore.getState().setAuth(session?.user ?? null, session);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  useDataSync();

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      {children}
    </QueryClientProvider>
  );
}
