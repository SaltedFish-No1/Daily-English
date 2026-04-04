/**
 * @author SaltedFish-No1
 * @description 鉴权操作 Hook：封装 Supabase 登录、注册、登出方法，
 *   并暴露当前鉴权状态。
 */

import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import type { OAuthProvider } from '@/types/auth';

/**
 * @author SaltedFish-No1
 * @description 提供鉴权相关操作与状态的 Hook。
 * @return 鉴权操作方法与当前状态。
 */
export function useAuth() {
  const { user, session, isLoading, isGuest, signOut } = useAuthStore();

  const signInWithOAuth = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    return { error };
  };

  const signInWithPhone = async (phone: string) => {
    const fullPhone = phone.startsWith('+') ? phone : `+86${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    return { error };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const fullPhone = phone.startsWith('+') ? phone : `+86${phone}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token,
      type: 'sms',
    });
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signUpWithEmailOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error };
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error };
  };

  return {
    user,
    session,
    isLoading,
    isGuest,
    signOut,
    signInWithOAuth,
    signInWithPhone,
    verifyPhoneOtp,
    signInWithEmail,
    signUpWithEmail,
    signUpWithEmailOtp,
    verifyEmailOtp,
  };
}
