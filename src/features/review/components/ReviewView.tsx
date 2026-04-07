'use client';

/**
 * @description 复习课程页 — 调用 AI 实时生成文章，生成完成后保存到数据库并跳转到课程页。
 */

import React, { useEffect, useState, useCallback } from 'react';
import { type GeneratedLesson } from '@/types/review';
import { parsePartialJson } from 'ai';
import { Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ReviewViewProps {
  words: string[];
  difficulty?: string;
}

type GenerationState =
  | { status: 'idle' }
  | { status: 'generating'; progress: Partial<GeneratedLesson> | null }
  | { status: 'saving' }
  | { status: 'error'; message: string };

export function ReviewView({ words, difficulty = 'B1' }: ReviewViewProps) {
  const [state, setState] = useState<GenerationState>({ status: 'idle' });
  const router = useRouter();

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

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });

        const { value: partial } = await parsePartialJson(accumulated);
        if (partial != null) {
          setState({
            status: 'generating',
            progress: partial as Partial<GeneratedLesson>,
          });
        }
      }
      accumulated += decoder.decode();

      const { value: parsed } = await parsePartialJson(accumulated);
      const finalObject = parsed as GeneratedLesson | null;

      if (
        !finalObject?.title ||
        !finalObject.paragraphs?.length ||
        !finalObject.quizQuestions?.length
      ) {
        throw new Error('AI 生成内容不完整，请重试。');
      }

      // Save to database and redirect to the persisted lesson page.
      setState({ status: 'saving' });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const saveRes = await fetch('/api/review/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ lesson: finalObject, words, difficulty }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err.error || '保存失败，请重试');
      }

      const { lessonId } = await saveRes.json();
      router.replace(`/lessons/${lessonId}`);
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : '生成失败，请重试',
      });
    }
  }, [words, difficulty, router]);

  useEffect(() => {
    if (words.length > 0) {
      generate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state (generating or saving)
  if (
    state.status === 'idle' ||
    state.status === 'generating' ||
    state.status === 'saving'
  ) {
    const progress = state.status === 'generating' ? state.progress : null;
    const isSaving = state.status === 'saving';

    // Calculate real progress based on which schema fields have arrived
    const progressSteps = [
      !!progress?.title,
      !!progress?.paragraphs?.length,
      !!progress?.focusWords?.length,
      !!progress?.quizQuestions?.length,
    ];
    const progressPct = isSaving
      ? 100
      : progress
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
            {isSaving ? '正在保存文章...' : '正在为你生成专属文章'}
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            {isSaving
              ? '即将跳转到课程页面'
              : progress?.title
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
          {progress && !isSaving && (
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
