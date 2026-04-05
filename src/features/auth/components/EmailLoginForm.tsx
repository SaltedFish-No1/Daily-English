/**
 * @author SaltedFish-No1
 * @description 统一邮箱认证表单。通过 OTP 验证码实现登录与注册一体化：
 *   填写邮箱 → 发送验证邮件（Resend） → 输入验证码完成认证。
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
} from '../lib/authApi';

type Step = 'email' | 'verify';

/**
 * @author SaltedFish-No1
 * @description 渲染统一邮箱认证表单。
 * @return 邮箱认证表单组件。
 */
export const EmailLoginForm: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // 60s cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = useCallback(async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: sendError } = await apiSendOtp(email);
    if (sendError) {
      setError(sendError);
    } else {
      setStep('verify');
      setCooldown(60);
      setMessage('验证邮件已发送，请查收邮箱并在下方输入验证码。');
    }
    setLoading(false);
  }, [email]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otpCode.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: verifyError } = await apiVerifyOtp(email, otpCode);
    if (verifyError || !data?.token_hash) {
      setError(verifyError ?? '验证失败');
      setLoading(false);
      return;
    }

    // 使用 token_hash 建立 Supabase 会话
    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: 'magiclink',
    });
    if (sessionError) {
      setError(sessionError.message);
    } else {
      router.replace('/');
    }
    setLoading(false);
  }, [email, otpCode, router]);

  const handleResend = useCallback(async () => {
    setOtpCode('');
    setError(null);
    setMessage(null);
    await handleSendOtp();
  }, [handleSendOtp]);

  const handleChangeEmail = useCallback(() => {
    setStep('email');
    setOtpCode('');
    setCooldown(0);
    setError(null);
    setMessage(null);
  }, []);

  const inputClass =
    'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400';

  // ── Step 1: enter email ──
  if (step === 'email') {
    return (
      <div className="space-y-4">
        <input
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="button"
          disabled={loading || !email.trim()}
          onClick={handleSendOtp}
          className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? '发送中...' : '继续'}
        </button>
      </div>
    );
  }

  // ── Step 2: verify code ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs text-slate-400">验证邮箱</p>
          <p className="text-sm font-bold text-slate-700">{email}</p>
        </div>
        <button
          type="button"
          onClick={handleChangeEmail}
          className="text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
        >
          更换
        </button>
      </div>

      {message && <p className="text-xs text-emerald-600">{message}</p>}

      <input
        type="text"
        inputMode="numeric"
        placeholder="输入 6 位验证码"
        maxLength={6}
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
        className={inputClass}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        disabled={loading || otpCode.length < 6}
        onClick={handleVerifyOtp}
        className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? '验证中...' : '验证'}
      </button>

      <button
        type="button"
        disabled={loading || cooldown > 0}
        onClick={handleResend}
        className="w-full text-center text-xs font-bold text-slate-400 transition-colors hover:text-emerald-600 disabled:opacity-50"
      >
        {cooldown > 0 ? `重新发送 (${cooldown}s)` : '重新发送验证邮件'}
      </button>
    </div>
  );
};
