/**
 * @author SaltedFish-No1
 * @description API 路由鉴权辅助：优先从 cookie 读取 Supabase session，
 *   回退到 Authorization Bearer token（兼容 writing 模块的 authFetch）。
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAuthUser, type AuthUser } from './auth-helper';
import { clientEnv } from '@/lib/env/client';

type AuthSuccess = { user: AuthUser };
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
