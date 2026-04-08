/**
 * @author SaltedFish-No1
 * @description 鉴权状态管理 Store：维护当前用户、会话与加载状态。
 *   不做持久化——认证令牌由 Supabase SDK 自行管理。
 */

import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { usePreferenceStore } from '@/store/usePreferenceStore';
import { useWritingStore } from '@/store/useWritingStore';

/**
 * @description 鉴权状态接口：维护当前用户、会话及加载标志。
 */
interface AuthStoreState {
  /** 当前登录用户对象，未登录时为 null */
  user: User | null;
  /** 当前 Supabase 会话，未登录时为 null */
  session: Session | null;
  /** 鉴权初始化是否正在进行，初始值 true */
  isLoading: boolean;
  /** 是否为游客（未登录），user 为 null 时自动设为 true */
  isGuest: boolean;
  /** 设置用户与会话，同时根据 user 是否为 null 更新 isGuest */
  setAuth: (user: User | null, session: Session | null) => void;
  /** 设置加载状态标志 */
  setLoading: (loading: boolean) => void;
  /** 登出：清除 Supabase 会话并重置所有持久化 Store（User、Preference、Writing） */
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>()((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isGuest: true,

  setAuth: (user, session) => set({ user, session, isGuest: user === null }),

  setLoading: (loading) => set({ isLoading: loading }),

  signOut: async () => {
    await supabase.auth.signOut();
    // 清理所有持久化的用户数据，防止下一个登录用户看到旧数据
    useUserStore.getState().resetStore();
    usePreferenceStore.getState().resetStore();
    useWritingStore.getState().resetStore();
    set({ user: null, session: null, isGuest: true });
  },
}));
