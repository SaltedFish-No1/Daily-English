'use client';

/**
 * @author SaltedFish-No1
 * @description 写作工作区组件，集成编辑器、计时器、提交批改及成绩报告。
 */
import { useState, useCallback, useMemo } from 'react';
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
import { useWritingTopicsQuery } from '@/features/writing/hooks/useWritingTopicsQuery';
import { useWritingSubmissionsQuery } from '@/features/writing/hooks/useWritingSubmissionsQuery';
import { useWritingCriteriaQuery } from '@/features/writing/hooks/useWritingCriteriaQuery';
import { useSubmitEssayMutation } from '@/features/writing/hooks/useSubmitEssayMutation';
import { gradeSubmission } from '@/features/writing/lib/writingApi';
import { Button } from '@/components/ui/button';
import type {
  WritingTopic,
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
    isTimerRunning,
    startTimer,
  } = useWritingStore();

  // --- TanStack Query hooks ---
  const { data: allTopics = [] } = useWritingTopicsQuery();
  const { data: submissionsData, isLoading: isSubmissionsLoading } =
    useWritingSubmissionsQuery(topicId);
  const { data: criteriaList = [] } = useWritingCriteriaQuery();
  const submitMutation = useSubmitEssayMutation();

  // 从 topics 列表中查找当前题目
  const topic: WritingTopic | undefined = useMemo(
    () => allTopics.find((t) => t.id === topicId),
    [allTopics, topicId]
  );

  // 从 criteria 列表中匹配当前题目的评分维度
  const dimensions: GradingCriteriaDimension[] = useMemo(() => {
    if (!topic) return [];
    const crit = criteriaList.find((c) => c.id === topic.gradingCriteria);
    return crit?.dimensions ?? [];
  }, [topic, criteriaList]);

  // 历史提交数据
  const pastSubmissions = submissionsData?.submissions ?? [];
  const pastGrades = submissionsData?.grades ?? {};
  const submissionCount = pastSubmissions.length;

  // --- 本地 UI 状态 ---
  const [phase, setPhase] = useState<Phase>('writing');
  const [grade, setGrade] = useState<WritingGrade | null>(null);
  const [partialGrade, setPartialGrade] =
    useState<Partial<WritingGradeResult> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // 初始化 currentTopic（仅在 topic 加载完成后）
  const isLoading = !user || (!topic && !isSubmissionsLoading);
  if (topic && phase === 'writing') {
    // 确保 store 中的 currentTopicId 与当前路由一致
    setCurrentTopic(topicId);
  }

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
      const sub = await submitMutation.mutateAsync({
        topicId: topic.id,
        content: currentDraftText.trim(),
        timeSpentSeconds: timerSeconds,
      });

      // Auto-grade with streaming progress
      setPhase('grading');
      setPartialGrade(null);
      const gradeResult = await gradeSubmission(sub.id, (partial) => {
        setPartialGrade(partial);
      });
      setGrade(gradeResult);
      setPhase('report');
      clearDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
      setPhase('writing');
    }
  }, [
    topic,
    currentDraftText,
    timerSeconds,
    wordCount,
    stopTimer,
    clearDraft,
    submitMutation,
  ]);

  const handleOcrFill = useCallback(
    (text: string) => {
      setDraftText(text);
      setIsOcrModalOpen(false);
      if (!isTimerRunning && text.trim().length > 0) {
        startTimer();
      }
    },
    [setDraftText, setIsOcrModalOpen, isTimerRunning, startTimer]
  );

  const handleNewAttempt = useCallback(() => {
    setPhase('writing');
    setGrade(null);
    setError(null);
    resetTimer();
    setCurrentTopic(topicId);
  }, [resetTimer, setCurrentTopic, topicId]);

  if (isLoading) {
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
        <Button
          variant="link"
          onClick={() => router.push('/writing')}
          className="text-sm font-bold text-violet-600"
        >
          返回列表
        </Button>
      </div>
    );
  }

  // 当前提交对象（submit mutation 的返回值）
  const currentSubmission = submitMutation.data ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      {/* Header */}
      <header className="pt-safe sticky top-0 z-30 hidden border-b border-gray-100 bg-white shadow-sm lg:block">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-5 sm:py-4">
          {/* Row 1: Back + Title + Timer display */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/writing')}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </Button>
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
                <Button
                  variant="outline"
                  onClick={() => setIsOcrModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Camera size={14} />
                  手写识别
                </Button>
              </div>
              <WritingEditor wordLimit={topic.wordLimit} />

              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={wordCount === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:opacity-50 disabled:shadow-none"
              >
                <Send size={16} />
                提交并 AI 批改
              </Button>
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
              {currentSubmission && (
                <details className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-bold text-slate-900">
                    <Eye size={16} />
                    查看原文
                  </summary>
                  <div className="border-t border-slate-50 p-4">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600">
                      {currentSubmission.content}
                    </p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      {currentSubmission.wordCount} 词 ·{' '}
                      {currentSubmission.timeSpentSeconds
                        ? `${Math.floor(currentSubmission.timeSpentSeconds / 60)} 分钟`
                        : ''}
                    </p>
                  </div>
                </details>
              )}

              {/* New attempt */}
              <Button
                variant="outline"
                onClick={handleNewAttempt}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-violet-200 py-3 text-sm font-bold text-violet-600 transition-all hover:bg-violet-50"
              >
                <PenLine size={16} />
                再写一次
              </Button>
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
        open={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onFillText={handleOcrFill}
        hasExistingText={currentDraftText.trim().length > 0}
      />
    </div>
  );
}
