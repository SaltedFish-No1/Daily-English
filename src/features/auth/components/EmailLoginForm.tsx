/**
 * @author SaltedFish-No1
 * @description Twitter 风格邮箱认证表单。根据邮箱是否已注册自动分流：
 *   已有账号 → 密码登录（支持忘记密码 / OTP 验证码登录）
 *   新账号 → 验证码注册 + 设置密码
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  checkUserExists,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  sendResetLink,
} from '../lib/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Step = 'email' | 'login-password' | 'login-otp' | 'register-verify';

export const EmailLoginForm: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // 60s cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ── 输入邮箱，点击继续 ──
  const handleContinue = useCallback(async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: checkError } = await checkUserExists(email);
    if (checkError) {
      setError(checkError);
      setIsLoading(false);
      return;
    }

    if (data?.exists) {
      // 已有账号 → 密码登录
      setStep('login-password');
    } else {
      // 新账号 → 发送验证码，进入注册流程
      const { error: sendError } = await apiSendOtp(email);
      if (sendError) {
        setError(sendError);
        setIsLoading(false);
        return;
      }
      setCooldown(60);
      setMessage('验证邮件已发送，请查收邮箱并在下方输入验证码。');
      setStep('register-verify');
    }
    setIsLoading(false);
  }, [email]);

  // ── 密码登录 ──
  const handlePasswordLogin = useCallback(async () => {
    if (!password.trim()) return;
    setIsLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? '密码错误，请重试'
          : signInError.message
      );
    } else {
      router.replace('/');
    }
    setIsLoading(false);
  }, [email, password, router]);

  // ── OTP 验证（登录 / 注册共用） ──
  const handleVerifyOtp = useCallback(async () => {
    if (!otpCode.trim()) return;
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: verifyError } = await apiVerifyOtp(email, otpCode);
    if (verifyError || !data?.token_hash) {
      setError(verifyError ?? '验证失败');
      setIsLoading(false);
      return;
    }

    // 使用 token_hash 建立 Supabase 会话
    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: 'magiclink',
    });

    if (sessionError) {
      setError(sessionError.message);
      setIsLoading(false);
      return;
    }

    // 如果是注册流程，设置密码
    if (step === 'register-verify' && password.trim()) {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) {
        setError(pwError.message);
        setIsLoading(false);
        return;
      }
    }

    router.replace('/');
    setIsLoading(false);
  }, [email, otpCode, password, step, router]);

  // ── 发送 OTP ──
  const handleSendOtp = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setOtpCode('');

    const { error: sendError } = await apiSendOtp(email);
    if (sendError) {
      setError(sendError);
    } else {
      setCooldown(60);
      setMessage('验证邮件已发送，请查收邮箱并在下方输入验证码。');
    }
    setIsLoading(false);
  }, [email]);

  // ── 忘记密码：发送重置链接 ──
  const handleForgotPassword = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { error: sendError } = await sendResetLink(email);
    if (sendError) {
      setError(sendError);
    } else {
      setMessage('密码重置链接已发送到你的邮箱，请查收。');
    }
    setIsLoading(false);
  }, [email]);

  // ── 切换回邮箱输入 ──
  const handleChangeEmail = useCallback(() => {
    setStep('email');
    setPassword('');
    setOtpCode('');
    setCooldown(0);
    setError(null);
    setMessage(null);
  }, []);

  const inputClass =
    'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400';

  // ── 邮箱显示栏（各步骤复用） ──
  const emailBar = (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <div>
        <p className="text-xs text-slate-400">邮箱</p>
        <p className="text-sm font-bold text-slate-700">{email}</p>
      </div>
      <Button
        variant="ghost"
        type="button"
        onClick={handleChangeEmail}
        className="text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
      >
        更换
      </Button>
    </div>
  );

  // ════════════════════════════════
  // Step 1: 输入邮箱
  // ════════════════════════════════
  if (step === 'email') {
    return (
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
          className={inputClass}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button
          type="button"
          disabled={isLoading || !email.trim()}
          onClick={handleContinue}
          className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isLoading ? '检查中...' : '继续'}
        </Button>
      </div>
    );
  }

  // ════════════════════════════════
  // Step 2: 密码登录（已有账号）
  // ════════════════════════════════
  if (step === 'login-password') {
    return (
      <div className="space-y-4">
        {emailBar}

        <Input
          type="password"
          placeholder="输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
          className={inputClass}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}
        {message && <p className="text-xs text-emerald-600">{message}</p>}

        <Button
          type="button"
          disabled={isLoading || !password.trim()}
          onClick={handlePasswordLogin}
          className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isLoading ? '登录中...' : '登录'}
        </Button>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            type="button"
            disabled={isLoading}
            onClick={handleForgotPassword}
            className="text-xs font-bold text-slate-400 transition-colors hover:text-emerald-600 disabled:opacity-50"
          >
            忘记密码？
          </Button>
          <Button
            variant="ghost"
            type="button"
            disabled={isLoading}
            onClick={async () => {
              await handleSendOtp();
              if (!error) setStep('login-otp');
            }}
            className="text-xs font-bold text-slate-400 transition-colors hover:text-emerald-600 disabled:opacity-50"
          >
            使用验证码登录
          </Button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════
  // Step 3: OTP 登录（已有账号备选）
  // ════════════════════════════════
  if (step === 'login-otp') {
    return (
      <div className="space-y-4">
        {emailBar}

        {message && <p className="text-xs text-emerald-600">{message}</p>}

        <Input
          type="text"
          inputMode="numeric"
          placeholder="输入 6 位验证码"
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
          className={inputClass}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button
          type="button"
          disabled={isLoading || otpCode.length < 6}
          onClick={handleVerifyOtp}
          className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isLoading ? '验证中...' : '验证'}
        </Button>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            type="button"
            disabled={isLoading || cooldown > 0}
            onClick={handleSendOtp}
            className="text-xs font-bold text-slate-400 transition-colors hover:text-emerald-600 disabled:opacity-50"
          >
            {cooldown > 0 ? `重新发送 (${cooldown}s)` : '重新发送验证码'}
          </Button>
          <Button
            variant="ghost"
            type="button"
            disabled={isLoading}
            onClick={() => {
              setError(null);
              setMessage(null);
              setOtpCode('');
              setStep('login-password');
            }}
            className="text-xs font-bold text-slate-400 transition-colors hover:text-emerald-600 disabled:opacity-50"
          >
            使用密码登录
          </Button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════
  // Step 4: 注册验证（新账号）
  // ════════════════════════════════
  return (
    <div className="space-y-4">
      {emailBar}

      {message && <p className="text-xs text-emerald-600">{message}</p>}

      <Input
        type="text"
        inputMode="numeric"
        placeholder="输入 6 位验证码"
        maxLength={6}
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
        className={inputClass}
      />

      <Input
        type="password"
        placeholder="设置密码（至少 6 位）"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
        className={inputClass}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        type="button"
        disabled={isLoading || otpCode.length < 6 || password.length < 6}
        onClick={handleVerifyOtp}
        className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {isLoading ? '创建中...' : '创建账号'}
      </Button>

      <Button
        variant="ghost"
        type="button"
        disabled={isLoading || cooldown > 0}
        onClick={handleSendOtp}
        className="w-full text-center text-xs font-bold text-slate-400 transition-colors hover:text-emerald-600 disabled:opacity-50"
      >
        {cooldown > 0 ? `重新发送 (${cooldown}s)` : '重新发送验证码'}
      </Button>
    </div>
  );
};
