/**
 * @author SaltedFish-No1
 * @description Supabase 客户端单例（懒初始化），供全应用客户端组件使用。
 *   使用 @supabase/ssr 的 createBrowserClient 以支持 cookie 存储，
 *   从而让 Next.js middleware 能够读取会话信息进行路由保护。
 */

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder';

let _supabase: SupabaseClient | null = null;

/**
 * @author SaltedFish-No1
 * @description 获取 Supabase 客户端单例。
 * @return Supabase 客户端实例。
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

/** 便捷别名，与既有代码保持兼容。 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
