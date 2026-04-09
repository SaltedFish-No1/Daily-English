'use client';

/**
 * @author SaltedFish-No1
 * @description 手机号 + 短信验证码登录表单，支持 60 秒倒计时。
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const COUNTDOWN_SECONDS = 60;

/**
 * @author SaltedFish-No1
 * @description 渲染手机号验证码登录表单。
 * @return 手机号登录表单组件。
 */
export const PhoneLoginForm: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const fullPhone = phone.startsWith('+') ? phone : `+86${phone}`;

  const sendOtp = useCallback(async () => {
    if (!phone.trim()) return;
    setIsLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    });
    if (authError) {
      toast.error(authError.message);
    } else {
      setStep('otp');
      setCountdown(COUNTDOWN_SECONDS);
    }
    setIsLoading(false);
  }, [phone, fullPhone]);

  const verifyOtp = useCallback(async () => {
    if (!otp.trim()) return;
    setIsLoading(true);
    const { error: authError } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms',
    });
    if (authError) {
      toast.error(authError.message);
    }
    setIsLoading(false);
  }, [otp, fullPhone]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <span className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-500">
          +86
        </span>
        <Input
          type="tel"
          placeholder="手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 transition-colors outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />
      </div>

      {step === 'otp' && (
        <Input
          type="text"
          inputMode="numeric"
          placeholder="输入验证码"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 transition-colors outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />
      )}

      {step === 'phone' ? (
        <Button
          disabled={isLoading || !phone.trim()}
          onClick={sendOtp}
          className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isLoading ? '发送中...' : '获取验证码'}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            disabled={countdown > 0 || isLoading}
            onClick={sendOtp}
            className="h-12 shrink-0 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {countdown > 0 ? `${countdown}s` : '重新发送'}
          </Button>
          <Button
            disabled={isLoading || !otp.trim()}
            onClick={verifyOtp}
            className="h-12 flex-1 rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? '验证中...' : '登录'}
          </Button>
        </div>
      )}
    </div>
  );
};
