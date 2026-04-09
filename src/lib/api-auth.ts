/**
 * @author SaltedFish-No1
 * @description API 路由鉴权辅助：优先从 cookie 读取 Supabase session，
 *   回退到 Authorization Bearer token（兼容 writing 模块的 authFetch）。
 *   提供带速率限制和配额检查的增强版本。
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAuthUser, type AuthUser } from './auth-helper';
import { clientEnv } from '@/lib/env/client';
import type { RouteKey, UserTier } from '@/types/usage';
import { getUserTier, TIER_LIMITS } from '@/lib/tier';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkDailyQuota, recordUsage } from '@/lib/usage';

type AuthSuccess = { user: AuthUser };
type AuthWithLimitsSuccess = { user: AuthUser; tier: UserTier };
type AuthFailure = { error: NextResponse };

/**
 * 验证 API 请求的用户身份。
 * 成功返回 `{ user }`, 失败返回 `{ error }` (401 Response)。
 */
export async function requireApiAuth(
  request: NextRequest
): Promise<AuthSuccess | AuthFailure> {
  // 1. 尝试 cookie-based 认证（与 middleware 一致）
  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // API route 中不需要写 cookie，只做验证
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { user: { id: user.id } };
  }

  // 2. 回退到 Bearer token（兼容已有的 authFetch 模式）
  const authUser = await getAuthUser(request);
  if (authUser) {
    return { user: authUser };
  }

  return {
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
}

// ---------------------------------------------------------------------------
// 带速率限制 + 配额检查的增强鉴权（供 AI 路由使用）
// ---------------------------------------------------------------------------

/**
 * 鉴权 + 速率限制 + 每日配额检查。
 * 通过后自动记录一次调用计数（fire-and-forget）。
 *
 * 成功返回 `{ user, tier }`，失败返回 `{ error }` (401 / 429)。
 */
export async function requireApiAuthWithLimits(
  request: NextRequest,
  routeKey: RouteKey
): Promise<AuthWithLimitsSuccess | AuthFailure> {
  // 1. 基础鉴权
  const auth = await requireApiAuth(request);
  if ('error' in auth) return auth;

  // 2. 查询用户等级（带缓存）
  const tier = await getUserTier(auth.user.id);
  const config = TIER_LIMITS[tier];

  // 3. 速率限制检查（内存，快速）
  const rateResult = checkRateLimit(auth.user.id, config.ratePerMinute);
  if (!rateResult.allowed) {
    const retryAfterSec = Math.ceil((rateResult.retryAfterMs ?? 1000) / 1000);
    return {
      error: NextResponse.json(
        {
          error: '请求过于频繁，请稍后再试',
          retryAfterMs: rateResult.retryAfterMs,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) },
        }
      ),
    };
  }

  // 4. 每日 token 配额检查（缓存 + DB）
  const quotaResult = await checkDailyQuota(auth.user.id, routeKey, tier);
  if (!quotaResult.allowed) {
    return {
      error: NextResponse.json(
        {
          error: '今日用量已达上限，请明天再试或升级套餐',
          quota: {
            currentTokens: quotaResult.currentTokens,
            maxTokens: quotaResult.maxTokens,
          },
        },
        { status: 429 }
      ),
    };
  }

  // 5. 预记录调用次数（fire-and-forget，用于产品分析）
  recordUsage(auth.user.id, routeKey);

  return { user: auth.user, tier };
}

/**
 * getAuthUser 的增强版本 — 用于仅支持 Bearer token 的路由。
 * 通过后自动记录调用计数。
 *
 * 成功返回 `{ user, tier }`，失败返回 `{ error }` (401 / 429)。
 */
export async function getAuthUserWithLimits(
  request: NextRequest,
  routeKey: RouteKey
): Promise<AuthWithLimitsSuccess | AuthFailure> {
  const user = await getAuthUser(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const tier = await getUserTier(user.id);
  const config = TIER_LIMITS[tier];

  const rateResult = checkRateLimit(user.id, config.ratePerMinute);
  if (!rateResult.allowed) {
    const retryAfterSec = Math.ceil((rateResult.retryAfterMs ?? 1000) / 1000);
    return {
      error: NextResponse.json(
        {
          error: '请求过于频繁，请稍后再试',
          retryAfterMs: rateResult.retryAfterMs,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) },
        }
      ),
    };
  }

  const quotaResult = await checkDailyQuota(user.id, routeKey, tier);
  if (!quotaResult.allowed) {
    return {
      error: NextResponse.json(
        {
          error: '今日用量已达上限，请明天再试或升级套餐',
          quota: {
            currentTokens: quotaResult.currentTokens,
            maxTokens: quotaResult.maxTokens,
          },
        },
        { status: 429 }
      ),
    };
  }

  recordUsage(user.id, routeKey);

  return { user, tier };
}
