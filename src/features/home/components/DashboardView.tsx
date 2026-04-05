'use client';

import React, { useMemo } from 'react';
import {
  BookOpen,
  BookMarked,
  Trophy,
  ArrowRight,
  Download,
  GraduationCap,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/useUserStore';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useReviewWords } from '@/hooks/useReviewWords';


function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function DashboardView() {
  const { savedWords, history, wordReviewStates } = useUserStore();
  const { dueCount, dueWords } = useReviewWords();
  const {
    isStandalone,
    installDialog,
    installTitle,
    installLabel,
    handleInstall,
    closeInstallDialog,
    confirmInstall,
  } = usePWAInstall();

  // Word stats for dashboard cards
  const wordStats = useMemo(() => {
    // 今日单词 = SM-2到期复习词 + 今天新添加的词（去重）
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    const todayNewWords = new Set<string>();
    for (const [word, occurrences] of Object.entries(savedWords)) {
      if (occurrences.some((o) => o.savedAt >= todayMs)) {
        todayNewWords.add(word);
      }
    }
    const dueWordSet = new Set(dueWords);
    const overlap = [...todayNewWords].filter((w) => dueWordSet.has(w)).length;
    const todayWordCount = dueCount + todayNewWords.size - overlap;

    // 单词量 = 总收藏词数
    const totalWordCount = Object.keys(savedWords).filter(
      (k) => savedWords[k].length > 0
    ).length;

    // 已背单词 = status === 'mastered' 的词数
    const masteredCount = Object.values(wordReviewStates).filter(
      (s) => s.status === 'mastered'
    ).length;

    return { todayWordCount, totalWordCount, masteredCount };
  }, [savedWords, wordReviewStates, dueCount, dueWords]);

  // Recent vocab
  const recentWordEntries = useMemo(() => {
    return Object.entries(savedWords)
      .filter(([, occurrences]) => occurrences.length > 0)
      .map(([word, occurrences]) => {
        const [firstOccurrence, ...restOccurrences] = occurrences;
        const latestOccurrence = restOccurrences.reduce(
          (latest, current) =>
            current.savedAt > latest.savedAt ? current : latest,
          firstOccurrence
        );
        return { word, latestOccurrence };
      })
      .sort((a, b) => b.latestOccurrence.savedAt - a.latestOccurrence.savedAt);
  }, [savedWords]);

  const savedWordCount = recentWordEntries.length;
  const previewCount = Math.min(
    8,
    Math.max(2, Math.min(6, savedWordCount || 0))
  );
  const recentWords = recentWordEntries.slice(0, previewCount);

  // Recent learning history (last 5)
  const recentHistory = useMemo(() => {
    return Object.values(history)
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 5);
  }, [history]);

  const quickActions = [
    {
      title: '开始阅读',
      subtitle: '沉浸式英文阅读',
      href: '/reading',
      icon: BookOpen,
      color: 'emerald' as const,
    },
    {
      title: '复习生词',
      subtitle: '巩固词汇记忆',
      href: '/vocab',
      icon: BookMarked,
      color: 'sky' as const,
    },
    {
      title: '学习中心',
      subtitle: '探索更多技能',
      href: '/learn',
      icon: GraduationCap,
      color: 'violet' as const,
    },
  ];

  const actionColorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      hover: 'hover:bg-emerald-100',
      icon: 'text-emerald-600',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
    },
    sky: {
      bg: 'bg-sky-50',
      hover: 'hover:bg-sky-100',
      icon: 'text-sky-600',
      border: 'border-sky-100',
      text: 'text-sky-600',
    },
    violet: {
      bg: 'bg-violet-50',
      hover: 'hover:bg-violet-100',
      icon: 'text-violet-600',
      border: 'border-violet-100',
      text: 'text-violet-600',
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      {/* Header */}
      <header className="pt-safe sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:py-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              薄荷外语
            </h1>
            <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase sm:text-sm">
              每日一课，轻松进步
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isStandalone && (
              <button
                type="button"
                onClick={handleInstall}
                className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100"
                title={installTitle}
              >
                <Download size={14} />
                {installLabel}
              </button>
            )}

          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-grow px-5 py-8 sm:py-12">
        {/* Welcome Greeting */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {getGreeting()}
          </h2>
          <p className="mt-1 text-sm text-slate-500">坚持学习，每天都在进步</p>
        </motion.section>

        {/* Word Stats */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 grid grid-cols-3 gap-3 sm:mb-8"
        >
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex items-center justify-center text-emerald-600">
              <Calendar size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">
              {wordStats.todayWordCount}
            </p>
            <p className="text-[10px] font-bold text-slate-400 sm:text-[11px]">
              今日单词
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex items-center justify-center text-emerald-600">
              <BookMarked size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">
              {wordStats.totalWordCount}
            </p>
            <p className="text-[10px] font-bold text-slate-400 sm:text-[11px]">
              单词量
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex items-center justify-center text-emerald-600">
              <Trophy size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">
              {wordStats.masteredCount}
            </p>
            <p className="text-[10px] font-bold text-slate-400 sm:text-[11px]">
              已背单词
            </p>
          </div>
        </motion.section>

        {/* Review Recommendation Cards */}
        {dueCount > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-6 grid grid-cols-2 gap-3 sm:mb-8"
          >
            {/* Swipe flashcard — fast */}
            <Link
              href={`/review/swipe?words=${encodeURIComponent(dueWords.join(','))}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Layers size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">单词闪卡</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {dueCount} 个词 · 预计 {Math.max(2, Math.round(dueCount * 0.3))} 分钟
              </p>
              <div className="mt-auto flex items-center pt-3 text-xs font-bold text-amber-600">
                开始复习
                <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* AI article — deep */}
            <Link
              href={`/review?words=${encodeURIComponent(dueWords.join(','))}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Sparkles size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">AI 复习文章</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                专属文章 · 预计 {Math.max(5, Math.round(dueCount * 0.7))} 分钟
              </p>
              <div className="mt-auto flex items-center pt-3 text-xs font-bold text-emerald-600">
                开始学习
                <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.section>
        )}

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {quickActions.map((action) => {
              const colors = actionColorMap[action.color];
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group flex items-center gap-4 rounded-2xl border ${colors.border} bg-white p-4 shadow-sm transition-all ${colors.hover} hover:shadow-md active:scale-[0.98]`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.icon}`}
                  >
                    <action.icon size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {action.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {action.subtitle}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className={`${colors.text} transition-transform group-hover:translate-x-1`}
                  />
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:mb-8"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                最近学习
              </h2>
            </div>
            {recentHistory.length > 0 && (
              <Link
                href="/profile"
                className="text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
              >
                查看全部
              </Link>
            )}
          </div>
          {recentHistory.length > 0 ? (
            <div className="space-y-2">
              {recentHistory.map((record) => (
                <Link
                  key={record.slug}
                  href={`/lessons/${record.slug}`}
                  className="flex items-center justify-between rounded-xl border border-slate-50 px-4 py-3 transition-colors hover:border-emerald-100 hover:bg-emerald-50/50"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {record.title || record.slug}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(record.completedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-600">
                      {record.score}/{record.total}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {Math.round((record.score / record.total) * 100)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400">
              还没有学习记录，去完成第一课吧！
            </p>
          )}
        </motion.section>

        {/* Recent Vocab Preview */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:mb-8"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked size={18} className="text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                我的生词库
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {savedWordCount} 词
              </span>
              <Link
                href="/vocab"
                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
              >
                查看生词表
              </Link>
            </div>
          </div>
          {recentWords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentWords.map(({ word, latestOccurrence }) => (
                <Link
                  key={`${word}-${latestOccurrence.lessonSlug}-${latestOccurrence.paragraphIndex}`}
                  href="/vocab"
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {word}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              还没有收藏记录，进入课程点击高亮词后可在词卡里收藏。
            </p>
          )}
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-12 text-center">
        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
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

      {/* PWA Install Dialog */}
      {installDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-slate-900">
              {installDialog.title}
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-slate-600">
              {installDialog.message}
            </p>
            <div className="flex justify-end gap-2">
              {installDialog.showConfirm && (
                <button
                  type="button"
                  onClick={closeInstallDialog}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
              )}
              <button
                type="button"
                onClick={
                  installDialog.showConfirm
                    ? confirmInstall
                    : closeInstallDialog
                }
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                {installDialog.showConfirm ? '确认安装' : '知道了'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
