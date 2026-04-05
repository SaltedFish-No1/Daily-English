'use client';

/**
 * @description 课程详情页布局，编排阅读、图表与测验标签页。
 */

import React, { useCallback } from 'react';
import { LessonData, LessonListItem } from '@/types/lesson';
import { useLessonStore } from '@/store/useLessonStore';
import { useUserStore } from '@/store/useUserStore';
import { Article } from './Article';
import { Quiz } from './Quiz';
import { VocabSheet } from './VocabSheet';
import { BookOpen, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { LessonBreadcrumb } from './LessonBreadcrumb';


interface LessonViewProps {
  data: LessonData;
  lessonSlug: string;
  overview: LessonListItem;
  /** 复习课程完成后的额外回调（用于更新间隔重复状态） */
  onReviewComplete?: (score: number, total: number) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  data,
  lessonSlug,
  overview,
  onReviewComplete,
}) => {
  const { activeTab, setActiveTab } = useLessonStore();
  const { saveLessonScore } = useUserStore();
  const handleQuizComplete = useCallback(
    (score: number, total: number) => {
      saveLessonScore(lessonSlug, score, total, overview.title);
      onReviewComplete?.(score, total);
    },
    [lessonSlug, saveLessonScore, onReviewComplete, overview.title]
  );

  const tabs = [
    {
      id: 'article',
      label: '阅读',
      icon: BookOpen,
    },
    {
      id: 'quiz',
      label: '测验',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      <div className="sticky top-0 z-30">
        {/* Header */}
        <header className="hidden pt-safe border-b border-gray-100 bg-white shadow-sm lg:block">
          <div className="mx-auto max-w-5xl px-5 py-4 sm:py-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="w-full sm:w-auto">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {data.meta.title}
                </h1>
                <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase sm:text-sm">
                  {overview.category} · {overview.difficulty}
                </p>
              </div>
            </div>
          </div>
        </header>
        <LessonBreadcrumb category={overview.category} />

        {/* Segmented Control (replaces old bottom tab bar) */}
        <div className="border-b border-slate-100 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-1 px-5 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
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
              focusWords={data.focusWords}
              speechEnabled={data.speech.enabled}
              lessonSlug={lessonSlug}
              lessonTitle={overview.title}
            />
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
            <Quiz
              quiz={data.quiz}
              persistKey={lessonSlug}
              onComplete={handleQuizComplete}
              reviewWords={data.meta.reviewWords}
            />
          </motion.div>
        </div>

        {/* Desktop Vocab Panel */}
        <div className="hidden lg:sticky lg:top-[260px] lg:block lg:h-fit lg:self-start">
          <VocabSheet speech={data.speech} />
        </div>
      </main>

      {/* Mobile Vocab Sheet */}
      <div className="lg:hidden">
        <VocabSheet speech={data.speech} />
      </div>

      <footer className="border-t border-slate-100 bg-white py-12 text-center">
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          © 2026 薄荷外语 · DESIGNED FOR LEARNING
        </p>
        <a
          href="https://github.com/SaltedFish-No1"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-emerald-600"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 fill-current"
          >
            <path d="M12 1.5C6.201 1.5 1.5 6.201 1.5 12c0 4.64 3.01 8.577 7.186 9.966.525.097.717-.228.717-.507 0-.25-.01-1.082-.014-1.962-2.924.636-3.54-1.241-3.54-1.241-.478-1.214-1.168-1.537-1.168-1.537-.955-.652.072-.639.072-.639 1.056.074 1.611 1.084 1.611 1.084.938 1.607 2.46 1.143 3.06.874.095-.68.367-1.144.667-1.407-2.335-.266-4.79-1.168-4.79-5.198 0-1.148.41-2.088 1.082-2.824-.109-.266-.469-1.337.102-2.787 0 0 .882-.282 2.89 1.078A9.96 9.96 0 0 1 12 6.337a9.95 9.95 0 0 1 2.633.354c2.007-1.36 2.888-1.078 2.888-1.078.572 1.45.212 2.521.104 2.787.673.736 1.08 1.676 1.08 2.824 0 4.04-2.458 4.929-4.8 5.19.378.326.714.967.714 1.95 0 1.408-.013 2.543-.013 2.889 0 .282.189.61.722.506A10.503 10.503 0 0 0 22.5 12c0-5.799-4.701-10.5-10.5-10.5Z" />
          </svg>
          <span>SaltedFish-No1</span>
        </a>
      </footer>
    </div>
  );
};
