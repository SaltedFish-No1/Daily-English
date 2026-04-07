/**
 * @description Server Component 用 Supabase 客户端 — 通过 next/headers 读取 cookie 获取用户会话。
 *   仅用于 Server Component / Server Action，不可在客户端导入。
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseRscClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server Components 不能写 cookie，忽略即可
        },
      },
    }
  );
}

/**
 * 在 Server Component 中获取当前登录用户 ID，未登录返回 null。
 */
export async function getServerUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseRscClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch (error) {
    // Re-throw Next.js internal errors (redirects, dynamic rendering bailouts, notFound).
    // These carry a `digest` property that the framework relies on for control flow.
    if (typeof error === 'object' && error !== null && 'digest' in error) {
      throw error;
    }
    console.error('[getServerUserId] swallowed error:', error);
    return null;
  }
}
