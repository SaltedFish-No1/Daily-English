/**
 * @description 用户等级配置 — 定义各等级的 API 调用限额，提供带缓存的等级查询。
 */

import type { UserTier, TierLimitsMap, RouteKey } from '@/types/usage';
import { supabaseAdmin } from '@/lib/supabase-server';

// ---------------------------------------------------------------------------
// 等级限额配置
// ---------------------------------------------------------------------------

export const TIER_LIMITS: TierLimitsMap = {
  free: {
    ratePerMinute: 20,
    dailyTokenLimit: 200_000,
  },
  pro: {
    ratePerMinute: 60,
    dailyTokenLimit: 2_000_000,
  },
};

/** 所有路由键（用于用量记录与分析） */
export const ALL_ROUTE_KEYS: RouteKey[] = [
  'review-generate',
  'writing-grade',
  'writing-ocr',
  'writing-parse-topic-image',
  'writing-submit-vision',
  'photo-capture',
  'dictionary',
  'tts',
];

// ---------------------------------------------------------------------------
// 带 TTL 缓存的用户等级查询
// ---------------------------------------------------------------------------

const TIER_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

interface CachedTier {
  tier: UserTier;
  expiresAt: number;
}

const tierCache = new Map<string, CachedTier>();

/**
 * 查询用户等级（带 5 分钟内存缓存）。
 * 无记录时默认返回 'free'。
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  const now = Date.now();
  const cached = tierCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.tier;
  }

  const { data } = await supabaseAdmin
    .from('user_tiers')
    .select('tier, expires_at')
    .eq('user_id', userId)
    .single();

  let tier: UserTier = 'free';
  if (data) {
    // 如果 pro 已过期，视为 free
    if (
      data.tier === 'pro' &&
      data.expires_at &&
      new Date(data.expires_at).getTime() < now
    ) {
      tier = 'free';
    } else {
      tier = data.tier as UserTier;
    }
  }

  tierCache.set(userId, { tier, expiresAt: now + TIER_CACHE_TTL });
  return tier;
}

/** 清除指定用户的等级缓存（用于等级变更后立即生效） */
export function invalidateTierCache(userId: string): void {
  tierCache.delete(userId);
}
