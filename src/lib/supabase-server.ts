/**
 * @description 服务端 Supabase 客户端（Service Role），仅在 Route Handler 中使用。
 *   绕过 RLS，用于写入 dictionary_cache 等公共缓存表。
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
