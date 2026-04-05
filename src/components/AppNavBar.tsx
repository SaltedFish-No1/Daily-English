'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, GraduationCap, Camera, BookMarked, User } from 'lucide-react';

interface NavTab {
  id: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  isSpecial?: boolean;
}

const tabs: NavTab[] = [
  { id: 'home', href: '/', label: '首页', icon: Home },
  { id: 'learn', href: '/learn', label: '学习', icon: GraduationCap },
  {
    id: 'camera',
    href: '#camera',
    label: '拍照',
    icon: Camera,
    isSpecial: true,
  },
  { id: 'vocab', href: '/vocab', label: '生词', icon: BookMarked },
  { id: 'profile', href: '/profile', label: '我的', icon: User },
];

function isActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  if (href === '/learn')
    return pathname.startsWith('/learn') || pathname.startsWith('/reading');
  return pathname.startsWith(href);
}

export function AppNavBar() {
  const pathname = usePathname();

  // Hide nav bar on login page
  if (pathname === '/login' || pathname === '/auth/callback') return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/95 backdrop-blur-md lg:hidden">
      <div className="flex items-end justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        {tabs.map((tab) => {
          const active = isActive(tab.href, pathname);

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                type="button"
                className="-mt-4 flex flex-col items-center"
                onClick={() => {
                  // Camera feature - placeholder
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95">
                  <Camera size={24} />
                </div>
                <span className="mt-1 text-[10px] font-bold text-emerald-600">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex min-w-[3.5rem] flex-col items-center gap-0.5 py-1 transition-colors ${
                active
                  ? 'text-emerald-600'
                  : 'text-slate-400 active:text-slate-600'
              }`}
            >
              <tab.icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span
                className={`text-[10px] ${active ? 'font-bold' : 'font-semibold'}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/auth/callback') return null;

  return (
    <aside className="fixed top-0 left-0 z-40 hidden h-full w-20 flex-col items-center border-r border-slate-100 bg-white py-8 lg:flex">
      <Link href="/" className="mb-8 text-xl font-black text-emerald-600">
        薄荷
      </Link>
      <div className="flex flex-1 flex-col items-center gap-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href, pathname);

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                type="button"
                className="my-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 transition-transform hover:scale-105 active:scale-95"
                onClick={() => {
                  // Camera feature - placeholder
                }}
              >
                <Camera size={22} />
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl transition-all ${
                active
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <tab.icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span
                className={`text-[9px] ${active ? 'font-bold' : 'font-semibold'}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
