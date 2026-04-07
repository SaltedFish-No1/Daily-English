/**
 * @author SaltedFish-No1
 * @description 服务端 Supabase Admin 客户端（使用 service role key），
 *   仅用于 API Route Handler，绕过 RLS 并可调用 auth.admin 方法。
 *   ⚠️ 严禁在客户端组件中导入此模块。
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { clientEnv, serverEnv } from '@/lib/env/server';

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _client;
}

/** 便捷别名，延迟初始化避免构建阶段副作用。 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[
      prop
    ];
  },
});
