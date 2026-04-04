/**
 * @author SaltedFish-No1
 * @description 鉴权状态管理 Store：维护当前用户、会话与加载状态。
 *   不做持久化——认证令牌由 Supabase SDK 自行管理。
 */

import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthStoreState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  setAuth: (user: User | null, session: Session | null) => void;
  setLoading: (loading: boolean) => void;
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
    set({ user: null, session: null, isGuest: true });
  },
}));
