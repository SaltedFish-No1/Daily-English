/**
 * @author SaltedFish-No1
 * @description 服务端 Supabase Admin 客户端（使用 service role key），
 *   仅用于 API Route Handler，绕过 RLS 并可调用 auth.admin 方法。
 *   ⚠️ 严禁在客户端组件中导入此模块。
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
