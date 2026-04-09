'use client';

/**
 * @author SaltedFish-No1
 * @description 写作工作区组件，集成编辑器、计时器、提交批改及成绩报告。
 */
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Loader2,
  FileText,
  Hash,
  Camera,
  History,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { WritingTimerDisplay, WritingTimerControls } from './WritingTimer';
import { WritingEditor } from './WritingEditor';
import { HandwritingOcrModal } from './HandwritingOcrModal';
import { useWritingStore } from '@/store/useWritingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useWritingTopicsQuery } from '@/features/writing/hooks/useWritingTopicsQuery';
import { useWritingSubmissionsQuery } from '@/features/writing/hooks/useWritingSubmissionsQuery';
import { useSubmitEssayMutation } from '@/features/writing/hooks/useSubmitEssayMutation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { WritingTopic } from '@/types/writing';

type Phase = 'writing' | 'submitting';

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
    stopTimer,
    isTimerRunning,
    startTimer,
  } = useWritingStore();

  // --- TanStack Query hooks ---
  const { data: allTopics = [] } = useWritingTopicsQuery();
  const { data: submissionsData, isLoading: isSubmissionsLoading } =
    useWritingSubmissionsQuery(topicId);
  const submitMutation = useSubmitEssayMutation();

  // 从 topics 列表中查找当前题目
  const topic: WritingTopic | undefined = useMemo(
    () => allTopics.find((t) => t.id === topicId),
    [allTopics, topicId]
  );

  // 历史提交数据
  const pastSubmissions = submissionsData?.submissions ?? [];
  const pastGrades = submissionsData?.grades ?? {};
  const submissionCount = pastSubmissions.length;

  // --- 本地 UI 状态 ---
  const [phase, setPhase] = useState<Phase>('writing');
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
    setPhase('submitting');
    stopTimer();

    try {
      const sub = await submitMutation.mutateAsync({
        topicId: topic.id,
        content: currentDraftText.trim(),
        timeSpentSeconds: timerSeconds,
      });

      clearDraft();
      router.push(`/writing/${topicId}/grade/${sub.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '提交失败');
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
    router,
    topicId,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-5 pt-6">
        <div className="mx-auto max-w-3xl">
          {/* Header skeleton */}
          <div className="mb-5 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          {/* Topic prompt skeleton */}
          <div className="mb-4 rounded-2xl border border-violet-100 bg-violet-50/30 p-4">
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="mb-1 h-3.5 w-full" />
            <Skeleton className="mb-1 h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          {/* Editor skeleton */}
          <Skeleton className="mb-4 h-48 w-full rounded-2xl" />
          {/* Submit button skeleton */}
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
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

              <Button
                onClick={handleSubmit}
                disabled={
                  wordCount === 0 ||
                  submitMutation.isPending ||
                  phase !== 'writing'
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:opacity-50 disabled:shadow-none"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    提交并 AI 批改
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Submitting phase */}
          {phase === 'submitting' && (
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
              <p className="text-sm font-medium text-slate-600">提交中...</p>
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
                    <Link
                      key={sub.id}
                      href={`/writing/${topicId}/grade/${sub.id}`}
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                    >
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
                      <ArrowRight
                        size={16}
                        className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-violet-500"
                      />
                    </Link>
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
