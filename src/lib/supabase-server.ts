/**
 * @description 服务端 Supabase 客户端（Service Role），仅在 Route Handler 中使用。
 *   绕过 RLS，用于写入 dictionary_cache 等公共缓存表。
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { clientEnv, serverEnv } from '@/lib/env/server';

let _client: SupabaseClient | null = null;

function getSupabaseServer(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _client;
}

/** 便捷别名，延迟初始化避免构建阶段副作用。 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseServer() as unknown as Record<string | symbol, unknown>)[
      prop
    ];
  },
});
