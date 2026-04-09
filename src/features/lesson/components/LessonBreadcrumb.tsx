'use client';

/**
 * @author SaltedFish-No1
 * @description 课程面包屑导航组件。
 */

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface LessonBreadcrumbProps {
  category: string;
}

export const LessonBreadcrumb: React.FC<LessonBreadcrumbProps> = ({
  category,
}) => {
  return (
    <div className="border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-3 sm:py-4">
        <nav className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase sm:text-xs">
          <Link
            href="/"
            replace
            className="-ml-1 flex items-center gap-1.5 rounded-lg py-1 pr-2 transition-colors hover:text-emerald-600 active:bg-slate-100"
          >
            <Home size={14} className="sm:size-3" />
            <span>首页</span>
          </Link>
          <ChevronRight size={12} className="flex-shrink-0 text-slate-300" />
          <span className="max-w-[150px] truncate text-slate-500 sm:max-w-none">
            {category}
          </span>
        </nav>
      </div>
    </div>
  );
};
