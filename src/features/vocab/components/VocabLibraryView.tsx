'use client';

/**
 * @author SaltedFish-No1
 * @description 生词本全览页面，展示收藏词汇卡片与出处链接。
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/useUserStore';
import { useSpeech } from '@/hooks/useSpeech';
import { useHydrated } from '@/hooks/useHydrated';
import { VocabCardSkeleton } from '@/components/skeletons/VocabCardSkeleton';

import { useNow } from '@/hooks/useNow';
import { getMemoryStrength, WordReviewState } from '@/lib/spaced-repetition';
import {
  BookMarked,
  Volume2,
  Check,
  ArrowUpDown,
  Camera,
  Layers,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { isPhotoCaptureOccurrence } from '@/lib/photo-capture';
import { useReviewWords } from '@/hooks/useReviewWords';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type SortMode = 'recent' | 'urgency' | 'strength';

interface VocabCardItem {
  word: string;
  latestSavedAt: number;
  latestSense: {
    headword?: string;
    pos?: string;
    def?: string;
    defZh?: string;
    phonetic?: string;
    audio?: string;
  };
  occurrences: Array<{
    lessonSlug: string;
    lessonTitle?: string;
    paragraphIndex: number;
    savedAt: number;
  }>;
  reviewState?: WordReviewState;
  memoryStrength: number;
}

interface VocabLibraryViewProps {
  lessonTitleMap: Record<string, string>;
}

export const VocabLibraryView: React.FC<VocabLibraryViewProps> = ({
  lessonTitleMap,
}) => {
  const { savedWords, removeWord, wordReviewStates } = useUserStore();
  const { speak } = useSpeech();
  const isHydrated = useHydrated();
  const [pendingRemoveWord, setPendingRemoveWord] = useState<string | null>(
    null
  );
  const [doubleCheckStep, setDoubleCheckStep] = useState<1 | 2>(1);
  const [isRemoving, setIsRemoving] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const now = useNow();
  const { dueCount, dueWords } = useReviewWords();

  const cards = useMemo<VocabCardItem[]>(() => {
    const items = Object.entries(savedWords)
      .filter(([, occurrences]) => occurrences.length > 0)
      .map(([word, occurrences]) => {
        const sortedOccurrences = [...occurrences].sort(
          (a, b) => b.savedAt - a.savedAt
        );
        const latest = sortedOccurrences[0];
        const reviewState = wordReviewStates[word.trim().toLowerCase()];
        return {
          word,
          latestSavedAt: latest.savedAt,
          latestSense: {
            headword: latest.senseSnapshot.headword,
            pos: latest.senseSnapshot.pos,
            def: latest.senseSnapshot.def,
            defZh: latest.senseSnapshot.defZh,
            phonetic: latest.senseSnapshot.phonetic,
            audio: latest.senseSnapshot.audio,
          },
          occurrences: sortedOccurrences.map((item) => ({
            lessonSlug: item.lessonSlug,
            lessonTitle: item.lessonTitle,
            paragraphIndex: item.paragraphIndex,
            savedAt: item.savedAt,
          })),
          reviewState,
          memoryStrength: reviewState ? getMemoryStrength(reviewState) : 0,
        };
      });

    // Sort based on selected mode
    switch (sortMode) {
      case 'urgency':
        return items.sort((a, b) => {
          const aNext = a.reviewState?.nextReviewAt ?? Infinity;
          const bNext = b.reviewState?.nextReviewAt ?? Infinity;
          const aDue = aNext <= now ? now - aNext : -(aNext - now);
          const bDue = bNext <= now ? now - bNext : -(bNext - now);
          return bDue - aDue;
        });
      case 'strength':
        return items.sort((a, b) => a.memoryStrength - b.memoryStrength);
      default:
        return items.sort((a, b) => b.latestSavedAt - a.latestSavedAt);
    }
  }, [savedWords, wordReviewStates, sortMode, now]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-8">
      <header className="sticky top-0 z-40 hidden border-b border-slate-100 bg-white lg:block">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <BookMarked size={18} className="text-emerald-600" />
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              我的生词表
            </h1>
          </div>
          {dueCount > 0 && (
            <Link
              href={`/review/swipe?words=${encodeURIComponent(dueWords.join(','))}`}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <Layers size={14} />
              开始复习 ({dueCount})
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-8">
        {/* Hydration skeleton */}
        {!isHydrated ? (
          <VocabCardSkeleton count={6} />
        ) : (
          <>
            {/* Review Recommendation */}
            {dueCount > 0 && cards.length > 0 && (
              <Link
                href={`/review/swipe?words=${encodeURIComponent(dueWords.join(','))}`}
                className="group mb-6 block overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm transition-all hover:shadow-lg active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                      <Layers size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {dueCount} 个单词待复习
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        左滑忘了、右滑记住，逐词精准打分
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-amber-600 transition-transform group-hover:translate-x-1">
                    开始
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            )}

            {/* Sort Controls */}
            {cards.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <ArrowUpDown size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-400">排序：</span>
                {[
                  { key: 'recent' as const, label: '最近收藏' },
                  { key: 'urgency' as const, label: '复习紧急' },
                  { key: 'strength' as const, label: '记忆强度' },
                ].map((opt) => (
                  <Button
                    key={opt.key}
                    variant={sortMode === opt.key ? 'default' : 'outline'}
                    type="button"
                    onClick={() => setSortMode(opt.key)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                      sortMode === opt.key
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}

            {cards.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                  <article
                    key={card.word}
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 capitalize">
                          {card.latestSense.headword || card.word}
                        </h2>
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => {
                            if (card.latestSense.audio) {
                              const audio = new Audio(card.latestSense.audio);
                              void audio.play().catch(() => {
                                speak(
                                  card.latestSense.headword || card.word,
                                  'en-US',
                                  0.9
                                );
                              });
                              return;
                            }
                            speak(
                              card.latestSense.headword || card.word,
                              'en-US',
                              0.9
                            );
                          }}
                          className="rounded-lg border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100"
                        >
                          <Volume2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => {
                            setPendingRemoveWord(card.word);
                            setDoubleCheckStep(1);
                          }}
                          className="rounded-lg border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100"
                          title="我记住了"
                        >
                          <Check size={14} />
                        </Button>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        {card.occurrences.length} 个收藏点
                      </span>
                    </div>

                    {/* Memory Strength Bar */}
                    {card.reviewState && (
                      <div className="mb-3">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">
                            记忆强度
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              card.reviewState.status === 'mastered'
                                ? 'text-emerald-600'
                                : card.reviewState.status === 'reviewing'
                                  ? 'text-sky-600'
                                  : card.reviewState.status === 'learning'
                                    ? 'text-amber-600'
                                    : 'text-slate-400'
                            }`}
                          >
                            {card.reviewState.status === 'mastered'
                              ? '已掌握'
                              : card.reviewState.status === 'reviewing'
                                ? '复习中'
                                : card.reviewState.status === 'learning'
                                  ? '学习中'
                                  : '新词'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              card.memoryStrength >= 80
                                ? 'bg-emerald-500'
                                : card.memoryStrength >= 40
                                  ? 'bg-sky-500'
                                  : card.memoryStrength >= 10
                                    ? 'bg-amber-500'
                                    : 'bg-slate-300'
                            }`}
                            style={{ width: `${card.memoryStrength}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {(card.latestSense.pos || card.latestSense.def) && (
                      <div className="mb-4 rounded-xl bg-slate-50 p-3">
                        <div className="mb-1 text-xs font-bold text-slate-500">
                          最新释义
                        </div>
                        <div className="text-xs text-slate-600">
                          {[card.latestSense.pos, card.latestSense.phonetic]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          {card.latestSense.def || ''}
                        </div>
                        {card.latestSense.defZh && (
                          <div className="mt-0.5 text-sm text-slate-500">
                            {card.latestSense.defZh}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {card.occurrences.map((occurrence) =>
                        isPhotoCaptureOccurrence(occurrence.lessonSlug) ? (
                          <div
                            key={`${card.word}-${occurrence.lessonSlug}-${occurrence.paragraphIndex}`}
                            className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2"
                          >
                            <Camera
                              size={12}
                              className="shrink-0 text-emerald-500"
                            />
                            <span className="text-sm font-bold text-slate-800">
                              拍照识词
                            </span>
                          </div>
                        ) : (
                          <Link
                            key={`${card.word}-${occurrence.lessonSlug}-${occurrence.paragraphIndex}`}
                            href={`/lessons/${occurrence.lessonSlug}#p-${occurrence.paragraphIndex}`}
                            className="block rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <span className="block text-sm font-bold text-slate-800">
                              {occurrence.lessonTitle ||
                                lessonTitleMap[occurrence.lessonSlug] ||
                                occurrence.lessonSlug}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                              日期 {occurrence.lessonSlug} · 第
                              {occurrence.paragraphIndex + 1}段
                            </span>
                          </Link>
                        )
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center">
                <p className="mb-4 text-slate-500">
                  你还没有收藏任何生词。阅读文章时点击生词即可收藏，或使用底部拍照按钮识别手抄单词开始积累吧。
                </p>
                <Link
                  href="/reading"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  <BookOpen size={16} />
                  去阅读文章
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      <Dialog
        open={!!pendingRemoveWord}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemoveWord(null);
            setDoubleCheckStep(1);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>标记已记住</DialogTitle>
            <DialogDescription>
              {doubleCheckStep === 1
                ? `你确定已经记住单词「${pendingRemoveWord}」了吗？`
                : `请再次确认：你已经掌握「${pendingRemoveWord}」，并要将它从生词表中移除。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setPendingRemoveWord(null);
                setDoubleCheckStep(1);
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              取消
            </Button>
            {doubleCheckStep === 1 ? (
              <Button
                type="button"
                onClick={() => setDoubleCheckStep(2)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                我记住了
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isRemoving}
                onClick={() => {
                  if (!pendingRemoveWord) return;
                  setIsRemoving(true);
                  try {
                    removeWord(pendingRemoveWord);
                    toast.success('已从词汇本移除');
                    setPendingRemoveWord(null);
                    setDoubleCheckStep(1);
                  } finally {
                    setIsRemoving(false);
                  }
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isRemoving ? '移除中...' : '确认我已记住'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
