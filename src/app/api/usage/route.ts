/**
 * @description 用量查询 API — 返回当前用户的等级和今日各路由用量摘要。
 *
 * GET /api/usage
 * Response: UsageResponse
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { getUserTier } from '@/lib/tier';
import { getUserDailyUsageSummary } from '@/lib/usage';
import type { UsageResponse } from '@/types/usage';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request);
  if ('error' in auth) return auth.error;

  const tier = await getUserTier(auth.user.id);
  const todaySummary = await getUserDailyUsageSummary(auth.user.id, tier);

  const response: UsageResponse = {
    tier,
    today: todaySummary,
  };

  return NextResponse.json(response);
}
