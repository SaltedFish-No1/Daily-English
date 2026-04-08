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
  Camera,
  History,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WritingTimerDisplay, WritingTimerControls } from './WritingTimer';
import { WritingEditor } from './WritingEditor';
import { GradeReport } from './GradeReport';
import { HandwritingOcrModal } from './HandwritingOcrModal';
import { useWritingStore } from '@/store/useWritingStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  submitWriting,
  gradeSubmission,
  fetchCriteria,
  fetchSubmissions,
} from '@/features/writing/lib/writingApi';
import { supabase } from '@/lib/supabase';
import type {
  WritingTopic,
  WritingSubmission,
  WritingGrade,
  WritingGradeResult,
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
    setDraftText,
    clearDraft,
    resetTimer,
    stopTimer,
    timerRunning,
    startTimer,
  } = useWritingStore();

  const [topic, setTopic] = useState<WritingTopic | null>(null);
  const [dimensions, setDimensions] = useState<GradingCriteriaDimension[]>([]);
  const [phase, setPhase] = useState<Phase>('writing');
  const [submission, setSubmission] = useState<WritingSubmission | null>(null);
  const [grade, setGrade] = useState<WritingGrade | null>(null);
  const [partialGrade, setPartialGrade] =
    useState<Partial<WritingGradeResult> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [pastSubmissions, setPastSubmissions] = useState<WritingSubmission[]>(
    []
  );
  const [pastGrades, setPastGrades] = useState<Record<string, WritingGrade>>(
    {}
  );

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

      // Fetch past submissions
      try {
        const { submissions: subs, grades: gds } =
          await fetchSubmissions(topicId);
        setPastSubmissions(subs);
        setPastGrades(gds);
        setSubmissionCount(subs.length);
      } catch {
        // Non-fatal — past submissions simply won't show
      }

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

      // Auto-grade with streaming progress
      setPhase('grading');
      setPartialGrade(null);
      const gradeResult = await gradeSubmission(sub.id, (partial) => {
        setPartialGrade(partial);
      });
      setGrade(gradeResult);
      setPhase('report');
      clearDraft();

      // Append to history so it shows immediately
      setPastSubmissions((prev) => [...prev, sub]);
      setPastGrades((prev) => ({ ...prev, [sub.id]: gradeResult }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
      setPhase('writing');
    }
  }, [topic, currentDraftText, timerSeconds, wordCount, stopTimer, clearDraft]);

  const handleOcrFill = useCallback(
    (text: string) => {
      setDraftText(text);
      setOcrModalOpen(false);
      if (!timerRunning && text.trim().length > 0) {
        startTimer();
      }
    },
    [setDraftText, timerRunning, startTimer]
  );

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
      <header className="pt-safe sticky top-0 z-30 hidden border-b border-gray-100 bg-white shadow-sm lg:block">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-5 sm:py-4">
          {/* Row 1: Back + Title + Timer display */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push('/writing')}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
              {topic.title ?? '写作练习'}
            </h1>
            <div className="shrink-0">
              <WritingTimerDisplay />
            </div>
            {/* Controls inline on sm+ */}
            <div className="hidden shrink-0 sm:flex">
              <WritingTimerControls />
            </div>
          </div>
          {/* Row 2 (mobile only): metadata + timer controls */}
          <div className="mt-1.5 flex items-center justify-between sm:hidden">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Hash size={10} />第{' '}
              {submissionCount + (phase === 'writing' ? 1 : 0)} 次
            </span>
            <WritingTimerControls />
          </div>
          {/* Metadata inline on sm+ */}
          <div className="mt-0.5 hidden pl-[40px] sm:block">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Hash size={10} />第{' '}
              {submissionCount + (phase === 'writing' ? 1 : 0)} 次
            </span>
          </div>
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
              <div className="flex justify-end">
                <button
                  onClick={() => setOcrModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Camera size={14} />
                  手写识别
                </button>
              </div>
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
              {phase === 'grading' && partialGrade && (
                <div className="w-full max-w-xs space-y-2">
                  {partialGrade.overallScore != null && (
                    <p className="text-center text-lg font-bold text-violet-600">
                      {partialGrade.overallScore} 分
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center gap-1.5 text-[10px] text-slate-400">
                    {partialGrade.overallComment && <span>总评 ✓</span>}
                    {partialGrade.dimensionScores && <span>维度分数 ✓</span>}
                    {partialGrade.grammarErrors && <span>语法分析 ✓</span>}
                    {partialGrade.vocabularySuggestions && (
                      <span>词汇建议 ✓</span>
                    )}
                    {partialGrade.modelAnswer && <span>范文 ✓</span>}
                  </div>
                </div>
              )}
              {phase === 'grading' && !partialGrade && (
                <p className="text-xs text-slate-400">
                  正在分析语法、词汇与结构
                </p>
              )}
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

        {/* Past submissions history */}
        {pastSubmissions.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <History size={16} />
              历史记录
            </h2>
            <div className="flex flex-col gap-3">
              {pastSubmissions
                .slice()
                .reverse()
                .map((sub) => {
                  const g = pastGrades[sub.id];
                  return (
                    <details
                      key={sub.id}
                      className="rounded-2xl border border-slate-100 bg-white shadow-sm"
                    >
                      <summary className="flex cursor-pointer items-center gap-3 p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600">
                          #{sub.attemptNumber}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-700">
                              第 {sub.attemptNumber} 次
                            </span>
                            {g && (
                              <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                <Trophy size={12} />
                                {g.overallScore}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{sub.wordCount} 词</span>
                            {sub.timeSpentSeconds != null &&
                              sub.timeSpentSeconds > 0 && (
                                <span>
                                  {Math.floor(sub.timeSpentSeconds / 60)} 分钟
                                </span>
                              )}
                            <span>
                              {new Date(sub.createdAt).toLocaleDateString(
                                'zh-CN',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </summary>
                      <div className="space-y-3 border-t border-slate-50 p-4">
                        {/* Original text */}
                        <div>
                          <p className="mb-1 flex items-center gap-1 text-xs font-bold text-slate-600">
                            <Eye size={12} />
                            原文
                          </p>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-500">
                            {sub.content}
                          </p>
                        </div>
                        {/* Grade report */}
                        {g && <GradeReport grade={g} dimensions={dimensions} />}
                      </div>
                    </details>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      <HandwritingOcrModal
        open={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        onFillText={handleOcrFill}
        hasExistingText={currentDraftText.trim().length > 0}
      />
    </div>
  );
}
