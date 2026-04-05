/**
 * @author SaltedFish-No1
 * @description Supabase 客户端单例（懒初始化），供全应用客户端组件使用。
 *   延迟到首次访问时才创建，避免模块加载阶段的副作用。
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

let _supabase: SupabaseClient | null = null;

/**
 * @author SaltedFish-No1
 * @description 获取 Supabase 客户端单例。
 * @return Supabase 客户端实例。
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

/** 便捷别名，与既有代码保持兼容。 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
