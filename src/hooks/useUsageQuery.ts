/**
 * @description 用量查询 Hook — 获取当前用户的等级和今日 API 用量摘要。
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { UsageResponse } from '@/types/usage';

async function fetchUsage(): Promise<UsageResponse | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const res = await fetch('/api/usage', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * @description 查询今日 API 用量。仅在用户已登录时启用。
 *   数据 60 秒内视为新鲜，每 2 分钟自动刷新。
 */
export function useUsageQuery() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.usage.today(),
    queryFn: fetchUsage,
    enabled: !!userId,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
