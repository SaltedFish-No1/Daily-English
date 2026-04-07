/**
 * @author SaltedFish-No1
 * @description Supabase 客户端单例（懒初始化），供全应用客户端组件使用。
 *   使用 @supabase/ssr 的 createBrowserClient 以支持 cookie 存储，
 *   从而让 Next.js middleware 能够读取会话信息进行路由保护。
 */

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { clientEnv } from '@/lib/env/client';

let _supabase: SupabaseClient | null = null;

/**
 * @author SaltedFish-No1
 * @description 获取 Supabase 客户端单例。
 * @return Supabase 客户端实例。
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createBrowserClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.supabaseAnonKey
    );
  }
  return _supabase;
}

/** 便捷别名，与既有代码保持兼容。 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
