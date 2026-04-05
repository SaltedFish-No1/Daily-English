'use client';

/**
 * @description 生词本全览页面，展示收藏词汇卡片与出处链接。
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useSpeech } from '@/hooks/useSpeech';

import { useNow } from '@/hooks/useNow';
import { getMemoryStrength, WordReviewState } from '@/lib/spaced-repetition';
import { BookMarked, Volume2, Check, ArrowUpDown, Camera } from 'lucide-react';
import { isPhotoCaptureOccurrence } from '@/features/photo-capture/lib/constants';

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
  const [pendingRemoveWord, setPendingRemoveWord] = useState<string | null>(
    null
  );
  const [doubleCheckStep, setDoubleCheckStep] = useState<1 | 2>(1);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const now = useNow();

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
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <BookMarked size={18} className="text-emerald-600" />
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              我的生词表
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-8">
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
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortMode(opt.key)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  sortMode === opt.key
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
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
                    <button
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
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingRemoveWord(card.word);
                        setDoubleCheckStep(1);
                      }}
                      className="rounded-lg border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100"
                      title="我记住了"
                    >
                      <Check size={14} />
                    </button>
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
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-500">
            你还没有收藏任何生词。去阅读文章点击词卡”收藏”，或使用底部拍照按钮识别手抄单词开始积累吧。
          </div>
        )}
      </main>

      {pendingRemoveWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-slate-900">
              标记已记住
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-600">
              {doubleCheckStep === 1
                ? `你确定已经记住单词「${pendingRemoveWord}」了吗？`
                : `请再次确认：你已经掌握「${pendingRemoveWord}」，并要将它从生词表中移除。`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingRemoveWord(null);
                  setDoubleCheckStep(1);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              {doubleCheckStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setDoubleCheckStep(2)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  我记住了
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    removeWord(pendingRemoveWord);
                    setPendingRemoveWord(null);
                    setDoubleCheckStep(1);
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  确认我已记住
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
