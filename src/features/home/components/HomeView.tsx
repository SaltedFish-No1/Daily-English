'use client';

import React from 'react';
import { LessonListItem } from '@/types/lesson';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HomeViewProps {
  lessons: LessonListItem[];
}

/**
 * @author SuperQ
 * @description 渲染首页课程列表与入口卡片。
 * @param props 课程清单数据。
 * @return 首页视图组件。
 */
export const HomeView: React.FC<HomeViewProps> = ({ lessons }) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="pt-safe sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:py-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Daily English
            </h1>
            <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase sm:text-sm">
              Elevate Your Language
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
            <span className="text-sm font-bold text-emerald-600">DE</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-grow px-5 py-8 sm:py-12">
        <section className="mb-10 sm:mb-12">
          <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            最新课程
          </h2>
          <p className="max-w-2xl text-base leading-relaxed font-medium text-slate-500 sm:text-lg">
            通过沉浸式的交互式体验，每日学习地道的英语表达和专业领域知识。
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {lessons.map((lesson, i) => (
            <motion.a
              key={lesson.date}
              href={`/lessons/${lesson.date}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl active:scale-95"
            >
              <div className="flex h-44 items-center justify-center bg-emerald-50/50 p-6 transition-colors group-hover:bg-emerald-50 sm:h-48 sm:p-8">
                <div className="text-center">
                  <span className="mb-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-emerald-700 uppercase">
                    {lesson.tag}
                  </span>
                  <h3 className="text-lg leading-tight font-bold text-slate-900 transition-colors group-hover:text-emerald-900 sm:text-xl">
                    {lesson.title}
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-3 flex items-center justify-between text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {lesson.date}
                  </span>
                  <span className="flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-500">
                    <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                    Interactive
                  </span>
                </div>
                <p className="mb-5 line-clamp-2 text-sm leading-relaxed font-medium text-slate-500">
                  {lesson.summary}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm font-bold text-emerald-600 transition-transform group-hover:translate-x-1">
                    立即开始
                    <ArrowRight size={16} className="ml-1" />
                  </div>
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[8px] font-bold text-slate-400"
                      >
                        {j}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </main>

      <footer className="pb-safe border-t border-slate-100 bg-white py-12 text-center">
        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
          © 2026 DAILY ENGLISH · DESIGNED FOR LEARNING
        </p>
      </footer>
    </div>
  );
};
