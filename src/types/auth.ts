/**
 * @author SaltedFish-No1
 * @description 鉴权相关类型定义：用户资料、登录方式与鉴权状态。
 */

import type { User, Session } from '@supabase/supabase-js';

/** Supabase profiles 表行类型 */
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/** 支持的 OAuth 提供商 */
export type OAuthProvider = 'github' | 'google';

/** 登录方式标签 */
export type AuthMethod = 'oauth' | 'phone' | 'email';

/** 鉴权 Store 状态 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
}
