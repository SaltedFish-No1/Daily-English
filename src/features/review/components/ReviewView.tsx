'use client';

/**
 * @description 复习课程页 — 调用 AI 实时生成文章，生成后复用 LessonView 展示。
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { LessonData, LessonListItem } from '@/types/lesson';
import { GeneratedLessonSchema, type GeneratedLesson } from '@/types/review';
import { LessonView } from '@/features/lesson/components/LessonView';
import { useUserStore } from '@/store/useUserStore';
import { Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ReviewViewProps {
  words: string[];
  difficulty?: string;
}

function assembleLessonData(
  object: GeneratedLesson,
  words: string[],
  difficulty: string
): LessonData {
  const lessonId = `review-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);
  return {
    schemaVersion: '2.2' as const,
    meta: {
      id: lessonId,
      title: object.title,
      date: today,
      category: object.category,
      teaser: object.teaser,
      published: false,
      featured: false,
      tag: 'Review',
      difficulty,
      isReview: true,
      reviewWords: words,
    },
    speech: { enabled: true },
    article: {
      title: object.title,
      paragraphs: object.paragraphs,
    },
    focusWords: object.focusWords,
    quiz: {
      title: 'Vocabulary & Comprehension Check',
      questions: object.quizQuestions,
    },
  } as LessonData;
}

export function ReviewView({ words, difficulty = 'B1' }: ReviewViewProps) {
  const batchUpdateWordReview = useUserStore((s) => s.batchUpdateWordReview);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { object, submit, isLoading, error } = useObject({
    api: '/api/review/generate',
    schema: GeneratedLessonSchema,
    onFinish({ object: finalObject }) {
      if (finalObject) {
        setLessonData(
          assembleLessonData(finalObject as GeneratedLesson, words, difficulty)
        );
      }
    },
    onError(err) {
      setErrorMsg(err.message || '生成失败，请重试');
    },
  });

  // Trigger generation on mount
  useEffect(() => {
    if (words.length > 0) {
      submit({ words, difficulty });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(() => {
    setLessonData(null);
    setErrorMsg(null);
    submit({ words, difficulty });
  }, [submit, words, difficulty]);

  /**
   * 复习课程完成时，根据总分按比例更新每个复习词的 SM-2 状态。
   */
  const handleReviewComplete = useCallback(
    (score: number, total: number) => {
      if (total === 0) return;
      const pct = score / total;
      const quality = pct >= 0.8 ? 4 : pct >= 0.5 ? 3 : 1;
      const updates = words.map((word) => ({ word, quality }));
      batchUpdateWordReview(updates);
    },
    [words, batchUpdateWordReview]
  );

  // Derive progress metrics from the streaming object
  const progress = object;
  const progressSteps = useMemo(
    () => [
      !!progress?.title,
      !!progress?.paragraphs?.length,
      !!progress?.focusWords?.length,
      !!progress?.quizQuestions?.length,
    ],
    [progress]
  );
  const progressPct = progress
    ? Math.round(
        (progressSteps.filter(Boolean).length / progressSteps.length) * 100
      )
    : 0;

  const displayError = errorMsg || error?.message;

  // Error state
  if (displayError && !isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
            <Sparkles size={32} className="text-red-500" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-slate-900">生成失败</h2>
          <p className="mb-6 text-sm text-slate-500">{displayError}</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/reading"
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={14} />
              返回课程
            </Link>
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <RefreshCw size={14} />
              重新生成
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success — render the generated lesson using LessonView
  if (lessonData) {
    const overview: LessonListItem = {
      id: lessonData.meta.id,
      date: lessonData.meta.date,
      title: lessonData.meta.title,
      category: lessonData.meta.category,
      teaser: lessonData.meta.teaser,
      published: false,
      featured: false,
      tag: lessonData.meta.tag,
      difficulty: lessonData.meta.difficulty,
    };

    return (
      <LessonView
        data={lessonData}
        lessonSlug={lessonData.meta.id}
        overview={overview}
        onReviewComplete={handleReviewComplete}
      />
    );
  }

  // Loading / generating state
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
          <Sparkles size={32} className="animate-pulse text-emerald-600" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-slate-900">
          正在为你生成专属文章
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          {progress?.title
            ? `"${progress.title}" — 正在生成中...`
            : `正在根据你的 ${words.length} 个复习词创作文章和测验题...`}
        </p>
        <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            animate={{ width: `${Math.max(5, progressPct)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {progress && (
          <div className="mt-4 flex justify-center gap-2 text-[10px] text-slate-400">
            {progress.title && <span>标题 ✓</span>}
            {progress.paragraphs?.length && (
              <span>段落 ({progress.paragraphs.length}) ✓</span>
            )}
            {progress.focusWords?.length && <span>词汇 ✓</span>}
            {progress.quizQuestions?.length && (
              <span>测验 ({progress.quizQuestions.length}) ✓</span>
            )}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {words.slice(0, 8).map((w) => (
            <span
              key={w}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"
            >
              {w}
            </span>
          ))}
          {words.length > 8 && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
              +{words.length - 8}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
