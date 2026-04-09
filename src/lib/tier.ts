/**
 * @description 用户等级配置 — 定义各等级的 API 调用限额，提供带缓存的等级查询。
 */

import type {
  UserTier,
  TierLimitsMap,
  RouteKey,
  TierLimitConfig,
} from '@/types/usage';
import { supabaseAdmin } from '@/lib/supabase-server';

// ---------------------------------------------------------------------------
// 等级限额配置
// ---------------------------------------------------------------------------

export const TIER_LIMITS: TierLimitsMap = {
  free: {
    ratePerMinute: 20,
    daily: {
      'review-generate': 3,
      'writing-grade': 5,
      'writing-ocr': 10,
      'writing-parse-topic-image': 5,
      'writing-submit-vision': 5,
      'photo-capture': 10,
      dictionary: 50,
      tts: 100,
    },
    dailyTokenLimit: 200_000,
  },
  pro: {
    ratePerMinute: 60,
    daily: {
      'review-generate': 20,
      'writing-grade': 30,
      'writing-ocr': 50,
      'writing-parse-topic-image': 30,
      'writing-submit-vision': 30,
      'photo-capture': 50,
      dictionary: 500,
      tts: 500,
    },
    dailyTokenLimit: 2_000_000,
  },
};

/** 所有受限路由键 */
export const ALL_ROUTE_KEYS: RouteKey[] = Object.keys(
  TIER_LIMITS.free.daily
) as RouteKey[];

/** 获取指定等级的限额配置 */
export function getTierConfig(tier: UserTier): TierLimitConfig {
  return TIER_LIMITS[tier];
}

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
