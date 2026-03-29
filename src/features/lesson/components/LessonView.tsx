'use client';

import React from 'react';
import { LessonData } from '@/types/lesson';
import { useLessonStore } from '@/store/useLessonStore';
import { Article } from './Article';
import { Chart } from './Chart';
import { Quiz } from './Quiz';
import { VocabSheet } from './VocabSheet';
import { BookOpen, BarChart3, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { LessonBreadcrumb } from './LessonBreadcrumb';

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
      <div className="sticky top-0 z-30">
        {/* Header */}
        <header className="pt-safe border-b border-gray-100 bg-white shadow-sm">
          <div className="mx-auto max-w-5xl px-5 py-4 sm:py-6">
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
        <LessonBreadcrumb category={data.meta.category} />
      </div>

      {/* Main Content */}
      <main className="mx-auto grid w-full max-w-5xl flex-grow grid-cols-1 gap-8 sm:px-6 sm:py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <motion.div
            initial={false}
            animate={{
              opacity: activeTab === 'article' ? 1 : 0,
              x: activeTab === 'article' ? 0 : 20,
            }}
            transition={{ duration: 0.2 }}
            className={activeTab === 'article' ? 'block' : 'hidden'}
            aria-hidden={activeTab !== 'article'}
          >
            <Article
              article={data.article}
              speechEnabled={data.speech.enabled}
            />
          </motion.div>
          <motion.div
            initial={false}
            animate={{
              opacity: activeTab === 'chart' ? 1 : 0,
              x: activeTab === 'chart' ? 0 : 20,
            }}
            transition={{ duration: 0.2 }}
            className={activeTab === 'chart' ? 'block' : 'hidden'}
            aria-hidden={activeTab !== 'chart'}
          >
            <Chart chart={data.chart} />
          </motion.div>
          <motion.div
            initial={false}
            animate={{
              opacity: activeTab === 'quiz' ? 1 : 0,
              x: activeTab === 'quiz' ? 0 : 20,
            }}
            transition={{ duration: 0.2 }}
            className={activeTab === 'quiz' ? 'block' : 'hidden'}
            aria-hidden={activeTab !== 'quiz'}
          >
            <Quiz quiz={data.quiz} persistKey={data.meta.slug} />
          </motion.div>
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
