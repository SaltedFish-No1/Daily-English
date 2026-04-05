'use client';

import React, { useMemo, useState } from 'react';
import { LessonDifficulty, LessonListItem } from '@/types/lesson';
import {
  Calendar,
  ArrowRight,
  Download,
  BookMarked,
  BookOpen,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import {
  CEFRGuideDialog,
  difficultyClassMap,
} from '@/features/home/components/CEFRGuideDialog';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { UserMenu } from '@/features/auth/components/UserMenu';

interface HomeViewProps {
  lessons: LessonListItem[];
}

interface DifficultyGuideState {
  open: boolean;
  difficulty: LessonDifficulty | null;
}

export const HomeView: React.FC<HomeViewProps> = ({ lessons }) => {
  const { savedWords, history } = useUserStore();
  const {
    isStandalone,
    installDialog,
    installTitle,
    installLabel,
    handleInstall,
    closeInstallDialog,
    confirmInstall,
  } = usePWAInstall();

  const [difficultyGuide, setDifficultyGuide] = useState<DifficultyGuideState>({
    open: false,
    difficulty: null,
  });

  const openDifficultyGuide = (
    event: React.MouseEvent<HTMLElement>,
    difficulty: LessonDifficulty
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDifficultyGuide({ open: true, difficulty });
  };

  const closeDifficultyGuide = () => {
    setDifficultyGuide({ open: false, difficulty: null });
  };

  // Learning stats
  const stats = useMemo(() => {
    const completedLessons = Object.values(history);
    const lessonCount = completedLessons.length;
    const wordCount = Object.keys(savedWords).filter(
      (k) => savedWords[k].length > 0
    ).length;
    const avgScore =
      lessonCount > 0
        ? Math.round(
            completedLessons.reduce(
              (sum, h) => sum + (h.score / h.total) * 100,
              0
            ) / lessonCount
          )
        : 0;
    return { lessonCount, wordCount, avgScore };
  }, [history, savedWords]);

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
  const formatDisplayDate = (rawDate: string) => {
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return rawDate;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
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
            <button
              type="button"
              onClick={handleInstall}
              disabled={isStandalone}
              className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-600 transition-colors enabled:hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
              title={installTitle}
            >
              <Download size={14} />
              {installLabel}
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-grow px-5 py-8 sm:py-12">
        {/* Learning Stats */}
        <section className="mb-6 grid grid-cols-3 gap-3 sm:mb-8">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex items-center justify-center text-emerald-600">
              <BookOpen size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">
              {stats.lessonCount}
            </p>
            <p className="text-[10px] font-bold text-slate-400 sm:text-[11px]">
              已完成课程
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex items-center justify-center text-emerald-600">
              <BookMarked size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">
              {stats.wordCount}
            </p>
            <p className="text-[10px] font-bold text-slate-400 sm:text-[11px]">
              收藏生词
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
            <div className="mb-1 flex items-center justify-center text-emerald-600">
              <Trophy size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">
              {stats.avgScore > 0 ? `${stats.avgScore}%` : '--'}
            </p>
            <p className="text-[10px] font-bold text-slate-400 sm:text-[11px]">
              平均正确率
            </p>
          </div>
        </section>

        {/* Vocab Cards */}
        <section className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:mb-8">
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
        </section>

        {/* Lesson Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {lessons.map((lesson, i) => {
            const lessonHistory = history[lesson.date];
            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="group relative block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl active:scale-95"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {/* Completion badge */}
                  {lessonHistory && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                      <CheckCircle2 size={12} />
                      {Math.round(
                        (lessonHistory.score / lessonHistory.total) * 100
                      )}
                      %
                    </div>
                  )}
                  <div className="flex h-44 items-center justify-center bg-emerald-50/50 p-6 transition-colors group-hover:bg-emerald-50 sm:h-48 sm:p-8">
                    <div className="w-full">
                      <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
                        <span className="inline-block rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                          {lesson.category}
                        </span>
                      </div>
                      <h3 className="text-center text-lg leading-tight font-bold text-slate-900 transition-colors group-hover:text-emerald-900 sm:text-xl">
                        {lesson.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDisplayDate(lesson.createdAt ?? lesson.date)}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) =>
                          openDifficultyGuide(event, lesson.difficulty)
                        }
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          event.stopPropagation();
                          setDifficultyGuide({
                            open: true,
                            difficulty: lesson.difficulty,
                          });
                        }}
                        className={`cursor-pointer rounded-full px-2 py-0.5 ${difficultyClassMap[lesson.difficulty]}`}
                      >
                        {lesson.difficulty}
                      </span>
                    </div>
                    <p className="mb-5 line-clamp-3 text-sm leading-relaxed font-medium text-slate-500">
                      {lesson.teaser}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm font-bold text-emerald-600 transition-transform group-hover:translate-x-1">
                        {lessonHistory ? '再次学习' : '立即开始'}
                        <ArrowRight size={16} className="ml-1" />
                      </div>
                      {lessonHistory && (
                        <span className="text-xs font-bold text-slate-400">
                          {lessonHistory.score}/{lessonHistory.total}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </main>

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
      <CEFRGuideDialog
        open={difficultyGuide.open}
        difficulty={difficultyGuide.difficulty}
        onClose={closeDifficultyGuide}
      />
    </div>
  );
};
