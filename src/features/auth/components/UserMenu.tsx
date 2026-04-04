/**
 * @author SaltedFish-No1
 * @description Header 用户菜单组件：已登录时显示头像与登出下拉菜单，
 *   未登录时显示"登录"按钮链接到登录页。
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * @author SaltedFish-No1
 * @description 渲染 Header 用户菜单。
 * @return 用户菜单组件。
 */
export const UserMenu: React.FC = () => {
  const { user, isLoading, isGuest, signOut } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />;
  }

  if (isGuest) {
    return (
      <Link
        href="/login"
        className="flex h-9 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100"
      >
        <LogIn size={14} />
        登录
      </Link>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    '用户';

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-200 bg-emerald-50 transition-colors hover:border-emerald-400"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserIcon size={16} className="text-emerald-600" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-slate-100 bg-white py-2 shadow-lg">
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="truncate text-sm font-bold text-slate-900">
              {displayName}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
};
