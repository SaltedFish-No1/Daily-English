/**
 * @author SaltedFish-No1
 * @description 登录页主视图，提供邮箱 OTP 统一认证入口
 *   和访客模式跳过入口。
 */

'use client';

import React from 'react';
import { EmailLoginForm } from '@/features/auth/components/EmailLoginForm';

/**
 * @author SaltedFish-No1
 * @description 渲染完整的登录/注册页面。
 * @return 登录页视图组件。
 */
export const LoginView: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-sm">
        {/* Logo & Tagline */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            薄荷外语
          </h1>
          <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
            每日一课，轻松进步
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-6 text-center text-sm font-bold text-slate-500">
            输入邮箱，登录或创建账号
          </p>

          <EmailLoginForm />
        </div>
      </div>
    </div>
  );
};
