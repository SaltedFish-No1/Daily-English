'use client';

import React, { useMemo, useState } from 'react';
import { LessonDifficulty, LessonListItem } from '@/types/lesson';
import {
  Calendar,
  ArrowRight,
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
import { useLearningStats } from '@/hooks/useLearningStats';

interface ReadingViewProps {
  lessons: LessonListItem[];
}

interface DifficultyGuideState {
  open: boolean;
  difficulty: LessonDifficulty | null;
}

export const ReadingView: React.FC<ReadingViewProps> = ({ lessons }) => {
  const { savedWords, history } = useUserStore();
  const stats = useLearningStats();

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
