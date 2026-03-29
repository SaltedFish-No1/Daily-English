'use client';

import React from 'react';
import { LessonData } from '@/types/lesson';
import { useLessonStore } from '@/store/useLessonStore';
import { Article } from './Article';
import { Chart } from './Chart';
import { Quiz } from './Quiz';
import { VocabSheet } from './VocabSheet';
import {
  BookOpen,
  BarChart3,
  HelpCircle,
  ChevronRight,
  Home,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface LessonViewProps {
  data: LessonData;
}

export const LessonView: React.FC<LessonViewProps> = ({ data }) => {
  const { activeTab, setActiveTab } = useLessonStore();

  const tabs = [
    {
      id: 'article',
      desktopLabel: data.ui.desktopArticleTabLabel,
      mobileLabel: data.ui.mobileArticleTabLabel,
      icon: BookOpen,
    },
    {
      id: 'chart',
      desktopLabel: data.ui.desktopDataTabLabel,
      mobileLabel: data.ui.mobileDataTabLabel,
      icon: BarChart3,
    },
    {
      id: 'quiz',
      desktopLabel: data.ui.desktopQuizTabLabel,
      mobileLabel: data.ui.mobileQuizTabLabel,
      icon: HelpCircle,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="pt-safe sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-5 py-4 sm:py-6">
          <nav className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase sm:mb-4 sm:text-xs">
            <Link
              href="/"
              className="-ml-1 flex items-center gap-1.5 rounded-lg py-1 pr-2 transition-colors hover:text-emerald-600 active:bg-slate-100"
            >
              <Home size={14} className="sm:size-3" />
              <span>首页</span>
            </Link>
            <ChevronRight size={12} className="flex-shrink-0 text-slate-300" />
            <span className="max-w-[150px] truncate text-slate-500 sm:max-w-none">
              {data.meta.category}
            </span>
          </nav>

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="w-full sm:w-auto">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {data.meta.title}
              </h1>
              <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase sm:text-sm">
                {data.meta.subtitle}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto grid w-full max-w-5xl flex-grow grid-cols-1 gap-8 px-5 py-8 sm:py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'article' && (
              <motion.div
                key="article"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Article article={data.article} ui={data.ui} />
              </motion.div>
            )}
            {activeTab === 'chart' && (
              <motion.div
                key="chart"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Chart chart={data.chart} />
              </motion.div>
            )}
            {activeTab === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Quiz quiz={data.quiz} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Vocab Panel */}
        <div className="hidden lg:block">
          <VocabSheet vocab={data.vocab} speech={data.speech} ui={data.ui} />
        </div>
      </main>

      {/* Mobile Vocab Sheet */}
      <div className="lg:hidden">
        <VocabSheet vocab={data.vocab} speech={data.speech} ui={data.ui} />
      </div>

      {/* Bottom Nav */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-100 bg-white px-6 py-4 sm:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id
                ? 'scale-110 text-emerald-600'
                : 'text-slate-400'
            }`}
          >
            <tab.icon size={20} />
            <span className="text-[10px] font-bold tracking-widest uppercase">
              {tab.mobileLabel}
            </span>
          </button>
        ))}
      </nav>

      {/* Desktop Sidebar (Floating Tabs) */}
      <div className="fixed top-1/2 left-8 z-20 hidden -translate-y-1/2 flex-col gap-4 sm:flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all ${
              activeTab === tab.id
                ? '-translate-x-2 bg-emerald-600 text-white'
                : 'bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-500'
            }`}
            title={tab.desktopLabel}
          >
            <tab.icon size={24} />
          </button>
        ))}
      </div>

      <footer className="border-t border-slate-100 bg-white py-12 pb-24 text-center sm:pb-12">
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          © 2026 DAILY ENGLISH · DESIGNED FOR LEARNING
        </p>
      </footer>
    </div>
  );
};
