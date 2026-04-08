/**
 * @author SaltedFish-No1
 * @description 鉴权相关类型定义：用户资料、登录方式与鉴权状态。
 */

import type { User, Session } from '@supabase/supabase-js';

/** Supabase profiles 表行类型 */
export interface UserProfile {
  /** 用户唯一标识（与 Supabase Auth UID 一致） */
  id: string;
  /** 用户显示名称，null 表示未设置 */
  display_name: string | null;
  /** 头像 URL，null 表示使用默认头像 */
  avatar_url: string | null;
  /** 账户创建时间（ISO 8601 格式） */
  created_at: string;
  /** 最后更新时间（ISO 8601 格式） */
  updated_at: string;
}

/** 支持的 OAuth 提供商 */
export type OAuthProvider = 'github' | 'google';

/** 登录方式标签 */
export type AuthMethod = 'oauth' | 'phone' | 'email';

/** 鉴权 Store 状态 */
export interface AuthState {
  /** 当前登录用户对象，null 表示未登录 */
  user: User | null;
  /** 当前会话信息，null 表示无有效会话 */
  session: Session | null;
  /** 是否正在加载鉴权状态（初始化或刷新 session 中） */
  isLoading: boolean;
  /** 是否为访客模式（未登录但允许浏览部分内容） */
  isGuest: boolean;
}
