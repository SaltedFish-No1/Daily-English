'use client';

/**
 * @description 生词本全览页面，展示收藏词汇卡片与出处链接。
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useSpeech } from '@/hooks/useSpeech';
import { BookMarked, Volume2, Check } from 'lucide-react';


interface VocabCardItem {
  word: string;
  latestSavedAt: number;
  latestSense: {
    headword?: string;
    pos?: string;
    def?: string;
    phonetic?: string;
    audio?: string;
  };
  occurrences: Array<{
    lessonSlug: string;
    lessonTitle?: string;
    paragraphIndex: number;
    savedAt: number;
  }>;
}

interface VocabLibraryViewProps {
  lessonTitleMap: Record<string, string>;
}

export const VocabLibraryView: React.FC<VocabLibraryViewProps> = ({
  lessonTitleMap,
}) => {
  const { savedWords, removeWord } = useUserStore();
  const { speak } = useSpeech();
  const [pendingRemoveWord, setPendingRemoveWord] = useState<string | null>(
    null
  );
  const [doubleCheckStep, setDoubleCheckStep] = useState<1 | 2>(1);

  const cards = useMemo<VocabCardItem[]>(() => {
    return Object.entries(savedWords)
      .filter(([, occurrences]) => occurrences.length > 0)
      .map(([word, occurrences]) => {
        const sortedOccurrences = [...occurrences].sort(
          (a, b) => b.savedAt - a.savedAt
        );
        const latest = sortedOccurrences[0];
        return {
          word,
          latestSavedAt: latest.savedAt,
          latestSense: {
            headword: latest.senseSnapshot.headword,
            pos: latest.senseSnapshot.pos,
            def: latest.senseSnapshot.def,
            phonetic: latest.senseSnapshot.phonetic,
            audio: latest.senseSnapshot.audio,
          },
          occurrences: sortedOccurrences.map((item) => ({
            lessonSlug: item.lessonSlug,
            lessonTitle: item.lessonTitle,
            paragraphIndex: item.paragraphIndex,
            savedAt: item.savedAt,
          })),
        };
      })
      .sort((a, b) => b.latestSavedAt - a.latestSavedAt);
  }, [savedWords]);

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
                  </div>
                )}

                <div className="space-y-2">
                  {card.occurrences.map((occurrence) => (
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
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-500">
            你还没有收藏任何生词，去阅读文章并点击词卡里的“收藏”开始积累吧。
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
