'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Loader2,
  FileText,
  Eye,
  PenLine,
  Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WritingTimer } from './WritingTimer';
import { WritingEditor } from './WritingEditor';
import { GradeReport } from './GradeReport';
import { useWritingStore } from '@/store/useWritingStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  submitWriting,
  gradeSubmission,
  fetchCriteria,
} from '@/features/writing/lib/writingApi';
import { supabase } from '@/lib/supabase';
import type {
  WritingTopic,
  WritingSubmission,
  WritingGrade,
  GradingCriteriaDimension,
} from '@/types/writing';

type Phase = 'writing' | 'submitting' | 'grading' | 'report';

interface WritingWorkspaceProps {
  topicId: string;
}

export function WritingWorkspace({ topicId }: WritingWorkspaceProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    currentDraftText,
    timerSeconds,
    setCurrentTopic,
    clearDraft,
    resetTimer,
    stopTimer,
  } = useWritingStore();

  const [topic, setTopic] = useState<WritingTopic | null>(null);
  const [dimensions, setDimensions] = useState<GradingCriteriaDimension[]>([]);
  const [phase, setPhase] = useState<Phase>('writing');
  const [submission, setSubmission] = useState<WritingSubmission | null>(null);
  const [grade, setGrade] = useState<WritingGrade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionCount, setSubmissionCount] = useState(0);

  // Load topic data
  useEffect(() => {
    async function load() {
      if (!user) return;

      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      if (!token) return;

      // Fetch topic
      const topicRes = await fetch(`/api/writing/topics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!topicRes.ok) {
        setLoading(false);
        return;
      }
      const { topics } = await topicRes.json();
      const found = topics.find(
        (t: WritingTopic & { submissionCount: number }) => t.id === topicId
      );
      if (!found) {
        setLoading(false);
        return;
      }
      setTopic(found);
      setSubmissionCount(found.submissionCount ?? 0);

      // Fetch criteria dimensions
      const criteriaList = await fetchCriteria();
      const crit = criteriaList.find((c) => c.id === found.gradingCriteria);
      if (crit) setDimensions(crit.dimensions);

      setCurrentTopic(topicId);
      setLoading(false);
    }
    load();
  }, [topicId, user, setCurrentTopic]);

  const wordCount = currentDraftText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const handleSubmit = useCallback(async () => {
    if (!topic || wordCount === 0) return;
    setError(null);
    setPhase('submitting');
    stopTimer();

    try {
      const sub = await submitWriting({
        topicId: topic.id,
        content: currentDraftText.trim(),
        timeSpentSeconds: timerSeconds,
      });
      setSubmission(sub);
      setSubmissionCount((c) => c + 1);

      // Auto-grade
      setPhase('grading');
      const gradeResult = await gradeSubmission(sub.id);
      setGrade(gradeResult);
      setPhase('report');
      clearDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
      setPhase('writing');
    }
  }, [topic, currentDraftText, timerSeconds, wordCount, stopTimer, clearDraft]);

  const handleNewAttempt = useCallback(() => {
    setPhase('writing');
    setGrade(null);
    setSubmission(null);
    setError(null);
    resetTimer();
    setCurrentTopic(topicId);
  }, [resetTimer, setCurrentTopic, topicId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-5">
        <p className="text-sm text-slate-500">题目未找到</p>
        <button
          onClick={() => router.push('/writing')}
          className="text-sm font-bold text-violet-600"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      {/* Header */}
      <header className="pt-safe sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/writing')}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-900">
                {topic.title ?? '写作练习'}
              </h1>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Hash size={10} />第{' '}
                  {submissionCount + (phase === 'writing' ? 1 : 0)} 次
                </span>
              </div>
            </div>
          </div>
          <WritingTimer />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-grow px-5 py-5">
        {/* Topic prompt */}
        <div className="mb-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-violet-700">
            <FileText size={14} />
            写作题目
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
            {topic.writingPrompt}
          </p>
          {topic.wordLimit && (
            <p className="mt-2 text-xs text-slate-400">
              建议字数：{topic.wordLimit} 词
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Writing phase */}
          {phase === 'writing' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <WritingEditor wordLimit={topic.wordLimit} />

              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={wordCount === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:opacity-50 disabled:shadow-none"
              >
                <Send size={16} />
                提交并 AI 批改
              </button>
            </motion.div>
          )}

          {/* Submitting / Grading phase */}
          {(phase === 'submitting' || phase === 'grading') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-16"
            >
              <div className="relative">
                <Loader2 size={40} className="animate-spin text-violet-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                {phase === 'submitting' ? '提交中...' : 'AI 批改中，请稍候...'}
              </p>
              <p className="text-xs text-slate-400">
                {phase === 'grading' && '正在分析语法、词汇与结构'}
              </p>
            </motion.div>
          )}

          {/* Report phase */}
          {phase === 'report' && grade && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              <GradeReport grade={grade} dimensions={dimensions} />

              {/* View original text */}
              {submission && (
                <details className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-bold text-slate-900">
                    <Eye size={16} />
                    查看原文
                  </summary>
                  <div className="border-t border-slate-50 p-4">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600">
                      {submission.content}
                    </p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      {submission.wordCount} 词 ·{' '}
                      {submission.timeSpentSeconds
                        ? `${Math.floor(submission.timeSpentSeconds / 60)} 分钟`
                        : ''}
                    </p>
                  </div>
                </details>
              )}

              {/* New attempt */}
              <button
                onClick={handleNewAttempt}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-violet-200 py-3 text-sm font-bold text-violet-600 transition-all hover:bg-violet-50"
              >
                <PenLine size={16} />
                再写一次
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
