'use client';

/**
 * @description 复习课程页 — 调用 AI 实时生成文章，生成后复用 LessonView 展示。
 */

import React, { useEffect, useState, useCallback } from 'react';
import { parsePartialJson } from 'ai';
import { LessonData, LessonListItem } from '@/types/lesson';
import { type GeneratedLesson } from '@/types/review';
import { LessonView } from '@/features/lesson/components/LessonView';
import { useUserStore } from '@/store/useUserStore';
import { Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ReviewViewProps {
  words: string[];
  difficulty?: string;
}

type GenerationState =
  | { status: 'idle' }
  | { status: 'generating'; progress: Partial<GeneratedLesson> | null }
  | { status: 'success'; data: LessonData }
  | { status: 'error'; message: string };

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
  const [state, setState] = useState<GenerationState>({ status: 'idle' });
  const batchUpdateWordReview = useUserStore((s) => s.batchUpdateWordReview);

  const generate = useCallback(async () => {
    setState({ status: 'generating', progress: null });
    try {
      const res = await fetch('/api/review/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, difficulty }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      // Read streaming response from streamObject
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let chunkCount = 0;

      console.log('[ReviewView] Stream started, reading chunks...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        chunkCount++;

        if (chunkCount <= 3) {
          console.log(
            `[ReviewView] Chunk #${chunkCount}, size=${chunk.length}, accumulated=${accumulated.length}, preview:`,
            accumulated.slice(0, 200)
          );
        }

        const { value: partial } = await parsePartialJson(accumulated);
        if (partial != null) {
          if (chunkCount <= 3) {
            console.log(
              `[ReviewView] parsePartialJson OK, keys:`,
              Object.keys(partial as Record<string, unknown>)
            );
          }
          setState({
            status: 'generating',
            progress: partial as Partial<GeneratedLesson>,
          });
        }
      }

      // Flush any remaining buffered bytes
      accumulated += decoder.decode();

      console.log(
        `[ReviewView] Stream ended. Total chunks=${chunkCount}, accumulated length=${accumulated.length}`
      );
      console.log('[ReviewView] First 500 chars:', accumulated.slice(0, 500));
      console.log('[ReviewView] Last 500 chars:', accumulated.slice(-500));

      const { value: finalObject } = await parsePartialJson(accumulated);

      console.log(
        '[ReviewView] Final parsePartialJson result:',
        finalObject
          ? Object.keys(finalObject as Record<string, unknown>)
          : 'null/undefined'
      );

      if (finalObject) {
        const obj = finalObject as GeneratedLesson;
        console.log('[ReviewView] Validation check:', {
          hasTitle: !!obj.title,
          hasParagraphs: !!obj.paragraphs?.length,
          paragraphCount: obj.paragraphs?.length,
          hasQuizQuestions: !!obj.quizQuestions?.length,
          quizCount: obj.quizQuestions?.length,
          hasFocusWords: !!obj.focusWords?.length,
        });
      }

      if (
        !finalObject ||
        !(finalObject as GeneratedLesson).title ||
        !(finalObject as GeneratedLesson).paragraphs?.length ||
        !(finalObject as GeneratedLesson).quizQuestions?.length
      ) {
        console.error(
          '[ReviewView] FAILED validation. Incomplete streamed JSON, length:',
          accumulated.length
        );
        throw new Error('AI 生成内容不完整，请重试。');
      }

      const lessonData = assembleLessonData(
        finalObject as GeneratedLesson,
        words,
        difficulty
      );
      setState({ status: 'success', data: lessonData });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : '生成失败，请重试',
      });
    }
  }, [words, difficulty]);

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

  useEffect(() => {
    if (words.length > 0) {
      generate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if (state.status === 'idle' || state.status === 'generating') {
    const progress = state.status === 'generating' ? state.progress : null;
    // Calculate real progress based on which schema fields have arrived
    const progressSteps = [
      !!progress?.title,
      !!progress?.paragraphs?.length,
      !!progress?.focusWords?.length,
      !!progress?.quizQuestions?.length,
    ];
    const progressPct = progress
      ? Math.round(
          (progressSteps.filter(Boolean).length / progressSteps.length) * 100
        )
      : 0;

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

  // Error state
  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
            <Sparkles size={32} className="text-red-500" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-slate-900">生成失败</h2>
          <p className="mb-6 text-sm text-slate-500">{state.message}</p>
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
              onClick={generate}
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
  const { data } = state;
  const overview: LessonListItem = {
    id: data.meta.id,
    date: data.meta.date,
    title: data.meta.title,
    category: data.meta.category,
    teaser: data.meta.teaser,
    published: false,
    featured: false,
    tag: data.meta.tag,
    difficulty: data.meta.difficulty,
  };

  return (
    <LessonView
      data={data}
      lessonSlug={data.meta.id}
      overview={overview}
      onReviewComplete={handleReviewComplete}
    />
  );
}
