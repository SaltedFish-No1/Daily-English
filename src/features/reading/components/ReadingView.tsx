'use client';

import React, { useState, useEffect } from 'react';
import { LessonDifficulty, LessonListItem } from '@/types/lesson';
import {
  Calendar,
  ArrowRight,
  BookMarked,
  BookOpen,
  Trophy,
  CheckCircle2,
  Sparkles,
  CircleCheckBig,
  History,
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import { supabase } from '@/lib/supabase';
import {
  CEFRGuideDialog,
  difficultyClassMap,
} from '@/features/home/components/CEFRGuideDialog';
import { useLearningStats } from '@/hooks/useLearningStats';
import { useReviewWords } from '@/hooks/useReviewWords';

interface ReadingViewProps {
  lessons: LessonListItem[];
}

interface DifficultyGuideState {
  open: boolean;
  difficulty: LessonDifficulty | null;
}

export const ReadingView: React.FC<ReadingViewProps> = ({ lessons }) => {
  const { history, quizProgress } = useUserStore();
  const stats = useLearningStats();
  const { dueCount, dueWords } = useReviewWords();

  const [reviewLessons, setReviewLessons] = useState<LessonListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchReviewLessons() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/review/lessons?limit=6', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok || cancelled) return;
      const json = await res.json();
      if (!cancelled) setReviewLessons(json.lessons ?? []);
    }
    fetchReviewLessons();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const formatDisplayDate = (rawDate: string) => {
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return rawDate;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      <header className="pt-safe sticky top-0 z-30 hidden border-b border-gray-100 bg-white shadow-sm lg:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:py-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              阅读课程
            </h1>
            <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase sm:text-sm">
              沉浸式英文阅读，积累地道表达
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-grow px-5 py-8 sm:py-12">
        {/* Learning Stats */}
        <section className="mb-6 grid grid-cols-4 gap-3 sm:mb-8">
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
              <CircleCheckBig size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">
              {stats.masteredCount}
            </p>
            <p className="text-[10px] font-bold text-slate-400 sm:text-[11px]">
              已背单词
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

        {/* Review Recommendation */}
        {dueCount > 0 && (
          <section className="mb-8">
            {/* AI review article card */}
            <Link
              href={`/review?words=${encodeURIComponent(dueWords.join(','))}`}
              className="group block overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm transition-all hover:shadow-lg active:scale-[0.99]"
            >
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-600" />
                <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                  为你定制 · 复习课程
                </span>
              </div>
              <h3 className="mb-1 text-lg font-bold text-slate-900">
                专属复习文章
              </h3>
              <p className="mb-4 text-sm text-slate-500">
                包含 {dueCount} 个复习词，系统将为你实时生成一篇个性化文章
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {dueWords.slice(0, 5).map((w) => (
                    <span
                      key={w}
                      className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                    >
                      {w}
                    </span>
                  ))}
                  {dueCount > 5 && (
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                      +{dueCount - 5}
                    </span>
                  )}
                </div>
                <span className="flex items-center text-sm font-bold text-emerald-600 transition-transform group-hover:translate-x-1">
                  开始学习
                  <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>
          </section>
        )}

        {/* Review History */}
        {reviewLessons.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <History size={16} className="text-slate-500" />
              <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase">
                复习文章历史
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviewLessons.map((lesson) => {
                const lessonHistory = history[lesson.id];
                const accuracy =
                  lessonHistory && lessonHistory.total > 0
                    ? Math.round(
                        (lessonHistory.score / lessonHistory.total) * 100
                      )
                    : null;
                return (
                  <Link
                    key={lesson.id}
                    href={`/lessons/${lesson.id}`}
                    className="group block rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        Review
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDisplayDate(lesson.createdAt ?? lesson.date)}
                      </span>
                    </div>
                    <h3 className="mb-1 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-emerald-900">
                      {lesson.title}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-xs text-slate-500">
                      {lesson.teaser}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${difficultyClassMap[lesson.difficulty]}`}
                      >
                        {lesson.difficulty}
                      </span>
                      {accuracy !== null ? (
                        <span className="text-xs font-bold text-slate-400">
                          {accuracy}%
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">
                          查看 <ArrowRight size={12} className="inline" />
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Lesson Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {lessons.map((lesson, i) => {
            const lessonHistory = history[lesson.date];
            const lessonProgress = quizProgress[lesson.date];
            const accuracy =
              lessonHistory && lessonHistory.total > 0
                ? Math.round((lessonHistory.score / lessonHistory.total) * 100)
                : null;
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
                  {/* Status label */}
                  <div
                    className={`absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${
                      lessonHistory
                        ? accuracy! < 20
                          ? 'bg-red-500 text-white'
                          : accuracy! < 60
                            ? 'bg-amber-400 text-amber-900'
                            : 'bg-emerald-600 text-white'
                        : lessonProgress
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-400 text-white'
                    }`}
                  >
                    {lessonHistory ? (
                      <>
                        <CheckCircle2 size={12} />
                        {accuracy === 100
                          ? 'done 🏅'
                          : accuracy! < 20
                            ? 'done?'
                            : 'done'}
                      </>
                    ) : lessonProgress ? (
                      '进行中'
                    ) : (
                      'new'
                    )}
                  </div>
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
                          if (event.key !== 'Enter' && event.key !== ' ')
                            return;
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

      <CEFRGuideDialog
        open={difficultyGuide.open}
        difficulty={difficultyGuide.difficulty}
        onClose={closeDifficultyGuide}
      />
    </div>
  );
};
