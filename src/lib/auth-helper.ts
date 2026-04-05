/**
 * @description 服务端 API 路由鉴权辅助：从请求 Header 提取 Bearer token 并校验用户身份。
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export interface AuthUser {
  id: string;
}

/**
 * 从请求中提取并验证当前登录用户。
 * 返回 `{ id }` 或 `null`（未登录/token 无效）。
 */
export async function getAuthUser(
  request: NextRequest
): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;

  return { id: user.id };
}
