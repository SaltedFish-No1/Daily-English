'use client';

/**
 * @author SaltedFish-No1
 * @description 写作批改报告视图，展示 AI 批改的评分报告（支持流式批改与历史查看）。
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Loader2,
  Eye,
  PenLine,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';

import { GradeReport } from './GradeReport';
import { useWritingTopicsQuery } from '@/features/writing/hooks/useWritingTopicsQuery';
import { useWritingSubmissionsQuery } from '@/features/writing/hooks/useWritingSubmissionsQuery';
import { useWritingCriteriaQuery } from '@/features/writing/hooks/useWritingCriteriaQuery';
import { gradeSubmission } from '@/features/writing/lib/writingApi';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  WritingTopic,
  WritingGrade,
  WritingGradeResult,
  GradingCriteriaDimension,
} from '@/types/writing';

type Phase = 'idle' | 'grading' | 'report' | 'error';

interface GradeViewProps {
  topicId: string;
  submissionId: string;
}

export function GradeView({ topicId, submissionId }: GradeViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- TanStack Query hooks ---
  const { data: allTopics = [] } = useWritingTopicsQuery();
  const { data: submissionsData, isLoading: isSubmissionsLoading } =
    useWritingSubmissionsQuery(topicId);
  const { data: criteriaList = [] } = useWritingCriteriaQuery();

  const topic: WritingTopic | undefined = useMemo(
    () => allTopics.find((t) => t.id === topicId),
    [allTopics, topicId]
  );

  const dimensions: GradingCriteriaDimension[] = useMemo(() => {
    if (!topic) return [];
    const crit = criteriaList.find((c) => c.id === topic.gradingCriteria);
    return crit?.dimensions ?? [];
  }, [topic, criteriaList]);

  const submission = useMemo(
    () => submissionsData?.submissions.find((s) => s.id === submissionId),
    [submissionsData, submissionId]
  );

  const existingGrade: WritingGrade | undefined =
    submissionsData?.grades[submissionId];

  // --- Local state ---
  const [phase, setPhase] = useState<Phase>('idle');
  const [grade, setGrade] = useState<WritingGrade | null>(null);
  const [partialGrade, setPartialGrade] =
    useState<Partial<WritingGradeResult> | null>(null);

  // Trigger grading on mount (or show existing grade)
  useEffect(() => {
    if (isSubmissionsLoading) return;

    if (existingGrade) {
      setGrade(existingGrade);
      setPhase('report');
      return;
    }

    // Only auto-trigger when idle (not after error or already grading)
    if (phase !== 'idle') return;

    setPhase('grading');
    let cancelled = false;

    gradeSubmission(submissionId, (partial) => {
      if (!cancelled) setPartialGrade(partial);
    })
      .then((result) => {
        if (!cancelled) {
          setGrade(result);
          setPhase('report');
          queryClient.invalidateQueries({
            queryKey: queryKeys.writing.submissions(topicId),
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : '批改失败');
          setPhase('error');
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmissionsLoading, existingGrade, submissionId, topicId]);

  const handleRetry = useCallback(() => {
    setPhase('grading');
    setPartialGrade(null);
    let cancelled = false;

    gradeSubmission(submissionId, (partial) => {
      if (!cancelled) setPartialGrade(partial);
    })
      .then((result) => {
        if (!cancelled) {
          setGrade(result);
          setPhase('report');
          queryClient.invalidateQueries({
            queryKey: queryKeys.writing.submissions(topicId),
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : '批改失败');
          setPhase('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [submissionId, topicId, queryClient]);

  // --- Loading state ---
  if (isSubmissionsLoading || (!submission && phase === 'idle')) {
    return (
      <div className="min-h-screen bg-slate-50 px-5 pt-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="mb-4 rounded-2xl border border-violet-100 bg-violet-50/30 p-4">
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="mb-1 h-3.5 w-full" />
            <Skeleton className="mb-1 h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <Skeleton className="mb-4 h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // --- Not found state ---
  if (!submission) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-5">
        <p className="text-sm text-slate-500">提交记录未找到</p>
        <Button
          variant="link"
          onClick={() => router.push(`/writing/${topicId}`)}
          className="text-sm font-bold text-violet-600"
        >
          返回写作
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      {/* Header */}
      <header className="pt-safe sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push(`/writing/${topicId}`)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold text-slate-900">
                {topic?.title ?? '批改报告'}
              </h1>
              <p className="mt-0.5 text-[10px] text-slate-400">
                第 {submission.attemptNumber} 次 · {submission.wordCount} 词
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-grow px-5 py-5">
        {/* Topic prompt */}
        {topic && (
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
        )}

        <AnimatePresence mode="wait">
          {/* Grading phase */}
          {phase === 'grading' && (
            <motion.div
              key="grading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-16"
            >
              <div className="relative">
                <Loader2 size={40} className="animate-spin text-violet-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                AI 批改中，请稍候...
              </p>
              {partialGrade && (
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
              {!partialGrade && (
                <p className="text-xs text-slate-400">
                  正在分析语法、词汇与结构
                </p>
              )}
            </motion.div>
          )}

          {/* Error phase */}
          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-16"
            >
              <p className="text-sm text-slate-500">批改失败，请重试</p>
              <Button
                onClick={handleRetry}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200"
              >
                <RefreshCw size={16} />
                重试
              </Button>
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
                    {submission.wordCount} 词
                    {submission.timeSpentSeconds != null &&
                      submission.timeSpentSeconds > 0 &&
                      ` · ${Math.floor(submission.timeSpentSeconds / 60)} 分钟`}
                  </p>
                </div>
              </details>

              {/* New attempt */}
              <Button
                variant="outline"
                onClick={() => router.push(`/writing/${topicId}`)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-violet-200 py-3 text-sm font-bold text-violet-600 transition-all hover:bg-violet-50"
              >
                <PenLine size={16} />
                再写一次
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
