/**
 * @description API 用量追踪与每日配额检查 — 基于 Supabase 数据库记录用量，
 *   内存缓存减少数据库查询。
 */

import type { RouteKey, UserTier, QuotaCheckResult } from '@/types/usage';
import { supabaseAdmin } from '@/lib/supabase-server';
import { TIER_LIMITS, ALL_ROUTE_KEYS } from '@/lib/tier';

// ---------------------------------------------------------------------------
// 配额缓存（60 秒 TTL）
// ---------------------------------------------------------------------------

const QUOTA_CACHE_TTL = 60 * 1000;

interface CachedQuota {
  /** 各路由今日调用次数 */
  calls: Record<string, number>;
  /** 今日总 token 用量 */
  totalTokens: number;
  expiresAt: number;
}

const quotaCache = new Map<string, CachedQuota>();

/** 获取今日用量（带缓存） */
async function getDailyUsage(userId: string): Promise<CachedQuota> {
  const now = Date.now();
  const cached = quotaCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached;
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data } = await supabaseAdmin
    .from('api_usage_daily')
    .select('route_key, call_count, token_input, token_output')
    .eq('user_id', userId)
    .eq('usage_date', today);

  const calls: Record<string, number> = {};
  let totalTokens = 0;

  if (data) {
    for (const row of data) {
      calls[row.route_key] = row.call_count;
      totalTokens += (row.token_input ?? 0) + (row.token_output ?? 0);
    }
  }

  const entry: CachedQuota = {
    calls,
    totalTokens,
    expiresAt: now + QUOTA_CACHE_TTL,
  };
  quotaCache.set(userId, entry);
  return entry;
}

// ---------------------------------------------------------------------------
// 配额检查
// ---------------------------------------------------------------------------

/**
 * 检查用户今日 token 配额是否仍有剩余。
 * @param userId 用户 ID
 * @param routeKey 路由键名（保留参数以便未来扩展）
 * @param tier 用户等级
 */
export async function checkDailyQuota(
  userId: string,
  routeKey: RouteKey,
  tier: UserTier
): Promise<QuotaCheckResult> {
  const config = TIER_LIMITS[tier];
  const usage = await getDailyUsage(userId);

  const currentTokens = usage.totalTokens;
  const maxTokens = config.dailyTokenLimit;

  return {
    allowed: currentTokens < maxTokens,
    currentTokens,
    maxTokens,
  };
}

// ---------------------------------------------------------------------------
// 用量记录（fire-and-forget）
// ---------------------------------------------------------------------------

/**
 * 异步记录一次 API 调用用量（不阻塞请求）。
 * @param userId 用户 ID
 * @param routeKey 路由键名
 * @param inputTokens AI 输入 token 数（可选，默认 0）
 * @param outputTokens AI 输出 token 数（可选，默认 0）
 */
export function recordUsage(
  userId: string,
  routeKey: string,
  inputTokens: number = 0,
  outputTokens: number = 0
): void {
  supabaseAdmin
    .rpc('increment_usage', {
      p_user_id: userId,
      p_route_key: routeKey,
      p_calls: inputTokens === 0 && outputTokens === 0 ? 1 : 0,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
    })
    .then(({ error }) => {
      if (error) {
        console.error('[Usage] increment_usage RPC error:', error);
      }
    });

  // 使缓存失效，下次查询将从数据库获取最新数据
  quotaCache.delete(userId);
}

// ---------------------------------------------------------------------------
// 查询接口（供 GET /api/usage 使用）
// ---------------------------------------------------------------------------

/**
 * 获取用户今日各路由的用量摘要（调用次数用于分析展示，不作限制）。
 */
export async function getUserDailyUsageSummary(
  userId: string,
  tier: UserTier
): Promise<{
  routes: Record<string, { calls: number }>;
  totalTokens: number;
  maxTokens: number;
}> {
  const config = TIER_LIMITS[tier];
  const usage = await getDailyUsage(userId);

  const routes: Record<string, { calls: number }> = {};
  for (const key of ALL_ROUTE_KEYS) {
    routes[key] = {
      calls: usage.calls[key] ?? 0,
    };
  }

  return {
    routes,
    totalTokens: usage.totalTokens,
    maxTokens: config.dailyTokenLimit,
  };
}
