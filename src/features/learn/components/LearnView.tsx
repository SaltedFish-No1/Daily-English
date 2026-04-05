'use client';

import Link from 'next/link';
import {
  Headphones,
  Mic,
  BookOpen,
  PenLine,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { motion } from 'framer-motion';


const skills = [
  {
    id: 'reading',
    title: '阅读',
    subtitle: 'Reading',
    description: '沉浸式英文阅读，积累地道表达与核心词汇',
    icon: BookOpen,
    color: 'emerald',
    href: '/reading',
    available: true,
  },
  {
    id: 'listening',
    title: '听力',
    subtitle: 'Listening',
    description: '精听泛听结合，提升听觉理解与辨音能力',
    icon: Headphones,
    color: 'sky',
    href: '#',
    available: false,
  },
  {
    id: 'speaking',
    title: '口语',
    subtitle: 'Speaking',
    description: 'AI对话练习，纠正发音与表达习惯',
    icon: Mic,
    color: 'amber',
    href: '#',
    available: false,
  },
  {
    id: 'writing',
    title: '写作',
    subtitle: 'Writing',
    description: '主题写作训练，AI实时批改与建议',
    icon: PenLine,
    color: 'violet',
    href: '/writing',
    available: true,
  },
] as const;

const colorMap = {
  emerald: {
    bg: 'bg-emerald-50',
    bgHover: 'group-hover:bg-emerald-100',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-100',
  },
  sky: {
    bg: 'bg-sky-50',
    bgHover: 'group-hover:bg-sky-100',
    icon: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700',
    border: 'border-sky-100',
  },
  amber: {
    bg: 'bg-amber-50',
    bgHover: 'group-hover:bg-amber-100',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-100',
  },
  violet: {
    bg: 'bg-violet-50',
    bgHover: 'group-hover:bg-violet-100',
    icon: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
    border: 'border-violet-100',
  },
} as const;

export function LearnView() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      <header className="pt-safe sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              学习中心
            </h1>
            <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              选择你要练习的技能
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-grow px-5 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {skills.map((skill, i) => {
            const colors = colorMap[skill.color];
            const Component = skill.available ? Link : 'div';

            return (
              <Component
                key={skill.id}
                href={skill.available ? skill.href : '#'}
                className={`group relative block overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
                  skill.available
                    ? `${colors.border} hover:shadow-lg active:scale-[0.98]`
                    : 'cursor-not-allowed border-slate-100 opacity-60'
                }`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div
                    className={`flex items-center gap-4 p-5 ${colors.bg} ${skill.available ? colors.bgHover : ''} transition-colors`}
                  >
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ${colors.icon}`}
                    >
                      <skill.icon size={28} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {skill.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.badge}`}
                        >
                          {skill.subtitle}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    {skill.available ? (
                      <span className="flex items-center text-sm font-bold text-emerald-600 transition-transform group-hover:translate-x-1">
                        进入学习
                        <ArrowRight size={16} className="ml-1" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
                        <Lock size={14} />
                        即将开放
                      </span>
                    )}
                  </div>
                </motion.div>
              </Component>
            );
          })}
        </div>
      </main>
    </div>
  );
}
