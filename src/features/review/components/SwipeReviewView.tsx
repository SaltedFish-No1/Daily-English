'use client';

/**
 * @author SaltedFish-No1
 * @description Tinder 风格滑动卡片复习 —— 左滑忘记，右滑记住，逐词更新 SM-2。
 */

import React, { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Volume2,
  Undo2,
  X,
  Check,
  ArrowLeft,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore, type VocabOccurrence } from '@/store/useUserStore';
import { useSpeech } from '@/hooks/useSpeech';
import { getMemoryStrength } from '@/lib/spaced-repetition';
import type { WordReviewState } from '@/lib/spaced-repetition';
import { SwipeCard, type SwipeCardRef } from './SwipeCard';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewWord {
  word: string;
  headword?: string;
  pos?: string;
  def?: string;
  phonetic?: string;
  audio?: string;
  reviewState?: WordReviewState;
}

interface SwipeRecord {
  word: string;
  direction: 'left' | 'right';
  prevState: WordReviewState | undefined;
}

interface SwipeReviewViewProps {
  words: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const QUALITY_FORGOT = 1;
const QUALITY_REMEMBERED = 4;
const EXIT_X = 600;

function buildReviewWords(
  words: string[],
  savedWords: Record<string, VocabOccurrence[]>,
  reviewStates: Record<string, WordReviewState>
): ReviewWord[] {
  return words.map((w) => {
    const key = w.trim().toLowerCase();
    const occurrences = savedWords[key] ?? [];
    const latest =
      occurrences.length > 0 ? occurrences[occurrences.length - 1] : null;
    const sense = latest?.senseSnapshot;
    return {
      word: key,
      headword: sense?.headword,
      pos: sense?.pos,
      def: sense?.def,
      phonetic: sense?.phonetic,
      audio: sense?.audio,
      reviewState: reviewStates[key],
    };
  });
}

function strengthLabel(strength: number): { text: string; color: string } {
  if (strength >= 80) return { text: '已掌握', color: 'text-emerald-600' };
  if (strength >= 40) return { text: '复习中', color: 'text-blue-600' };
  if (strength >= 10) return { text: '学习中', color: 'text-amber-600' };
  return { text: '新词', color: 'text-slate-400' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SwipeReviewView({ words }: SwipeReviewViewProps) {
  const savedWords = useUserStore((s) => s.savedWords);
  const wordReviewStates = useUserStore((s) => s.wordReviewStates);
  const updateWordReview = useUserStore((s) => s.updateWordReview);

  const { speak } = useSpeech();

  const [reviewWords, setReviewWords] = useState(() =>
    buildReviewWords(words, savedWords, wordReviewStates)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<SwipeRecord[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<
    Array<{ word: string; remembered: boolean }>
  >([]);
  const [isAnimating, setIsAnimating] = useState(false);
  /** Direction of the last undo — used for fly-back initial position */
  const [undoFrom, setUndoFrom] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<SwipeCardRef>(null);

  const isFinished = currentIndex >= reviewWords.length;
  const currentWord = isFinished ? null : reviewWords[currentIndex];

  // ----- Card Flip -----
  const toggleFlip = useCallback((idx: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  // ----- Swipe Handler (called after fly-out animation completes) -----
  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const word = reviewWords[currentIndex];
      if (!word) return;

      const key = word.word;
      const prevState = wordReviewStates[key]
        ? { ...wordReviewStates[key] }
        : undefined;

      const quality =
        direction === 'right' ? QUALITY_REMEMBERED : QUALITY_FORGOT;
      updateWordReview(key, quality);

      setHistory((prev) => [...prev, { word: key, direction, prevState }]);
      setResults((prev) => [
        ...prev,
        { word: key, remembered: direction === 'right' },
      ]);
      setUndoFrom(null);
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(false);
    },
    [currentIndex, reviewWords, wordReviewStates, updateWordReview]
  );

  // ----- Undo -----
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isAnimating) return;

    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setResults((prev) => prev.slice(0, -1));

    // Set undo direction so the card flies back from where it went
    setUndoFrom(last.direction);
    setCurrentIndex((prev) => prev - 1);

    // Restore previous SM-2 state
    if (last.prevState) {
      useUserStore.setState((state) => ({
        wordReviewStates: {
          ...state.wordReviewStates,
          [last.word]: last.prevState!,
        },
      }));
    }
  }, [history, isAnimating]);

  // ----- Play audio -----
  const playAudio = useCallback(
    (word: ReviewWord) => {
      if (word.audio) {
        const audio = new Audio(word.audio);
        audio.play().catch(() => speak(word.headword ?? word.word));
      } else {
        speak(word.headword ?? word.word);
      }
    },
    [speak]
  );

  // 无复习词时显示空状态
  if (words.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">没有待复习的词汇</p>
          <p className="mt-1 text-sm text-slate-500">
            收藏生词后，系统会根据遗忘曲线安排复习
          </p>
          <Link
            href="/reading"
            className="mt-4 inline-block rounded-full bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            去阅读
          </Link>
        </div>
      </div>
    );
  }

  // ----- Finished Summary -----
  if (isFinished) {
    const remembered = results.filter((r) => r.remembered).length;
    const forgot = results.filter((r) => !r.remembered).length;

    return (
      <div className="flex h-dvh flex-col items-center justify-center overflow-hidden bg-slate-50 px-4">
        <motion.div
          className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mb-4 text-5xl">
            {forgot === 0 ? '🎉' : remembered > forgot ? '💪' : '📖'}
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">复习完成!</h2>
          <div className="mb-6 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {remembered}
              </p>
              <p className="text-xs text-slate-400">记住了</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{forgot}</p>
              <p className="text-xs text-slate-400">忘了</p>
            </div>
          </div>

          {/* Word result list */}
          <div className="mb-6 max-h-60 space-y-1.5 overflow-y-auto text-left">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-700">
                  {r.word}
                </span>
                {r.remembered ? (
                  <Check size={16} className="text-emerald-500" />
                ) : (
                  <X size={16} className="text-red-400" />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {forgot > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  const forgotWordKeys = results
                    .filter((r) => !r.remembered)
                    .map((r) => r.word);
                  setReviewWords(
                    buildReviewWords(
                      forgotWordKeys,
                      savedWords,
                      wordReviewStates
                    )
                  );
                  setCurrentIndex(0);
                  setHistory([]);
                  setResults([]);
                  setFlippedCards(new Set());
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100"
              >
                <RotateCcw size={16} />
                复习忘记的 ({forgot})
              </Button>
            )}
            <Link
              href="/reading"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              完成
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ----- Card Stack -----
  const isFlipped = flippedCards.has(currentIndex);
  const progress =
    reviewWords.length > 0
      ? Math.round((currentIndex / reviewWords.length) * 100)
      : 0;

  // Compute initial x for undo fly-back
  const initialX = undoFrom ? (undoFrom === 'left' ? -EXIT_X : EXIT_X) : 0;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link
          href="/reading"
          className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft size={18} />
          返回
        </Link>
        <span className="text-sm font-bold text-slate-500">
          {currentIndex + 1} / {reviewWords.length}
        </span>
      </header>

      {/* Progress bar */}
      <div className="mx-4 mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Card area */}
      <div className="flex flex-1 items-center justify-center px-6 sm:px-4">
        <div className="relative h-[420px] w-full max-w-[320px] sm:max-w-sm">
          {/* Show next card underneath (preview) */}
          {currentIndex + 1 < reviewWords.length && (
            <motion.div
              className="absolute inset-0 rounded-3xl border border-slate-100 bg-white shadow-sm"
              style={{ zIndex: 0 }}
              initial={{ scale: 0.95, opacity: 0.6 }}
              animate={{ scale: 0.95, opacity: 0.6 }}
            />
          )}

          {/* Active card — key changes on index so React remounts */}
          <SwipeCard
            key={`card-${currentIndex}`}
            ref={cardRef}
            onSwipe={handleSwipe}
            initialX={initialX}
          >
            <div
              className="flex h-full flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 shadow-xl"
              onClick={() => toggleFlip(currentIndex)}
            >
              {/* Memory strength badge */}
              {currentWord!.reviewState && (
                <div className="absolute top-5 left-5">
                  {(() => {
                    const strength = getMemoryStrength(
                      currentWord!.reviewState!
                    );
                    const label = strengthLabel(strength);
                    return (
                      <span className={`text-xs font-bold ${label.color}`}>
                        {label.text} · {strength}%
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* Audio button */}
              <Button
                variant="ghost"
                className="absolute top-5 right-5 rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentWord!);
                }}
              >
                <Volume2 size={20} />
              </Button>

              <AnimatePresence mode="wait" initial={false}>
                {!isFlipped ? (
                  /* ---- Front: Word ---- */
                  <motion.div
                    key="front"
                    className="flex flex-col items-center"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <h1 className="mb-2 text-3xl font-black text-slate-900">
                      {currentWord!.headword ?? currentWord!.word}
                    </h1>
                    {currentWord!.phonetic && (
                      <p className="mb-4 text-sm text-slate-400">
                        {currentWord!.phonetic}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 text-slate-300">
                      <Eye size={14} />
                      <span className="text-xs">点击查看释义</span>
                    </div>
                  </motion.div>
                ) : (
                  /* ---- Back: Definition ---- */
                  <motion.div
                    key="back"
                    className="flex flex-col items-center px-2"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <h1 className="mb-2 text-2xl font-black text-slate-900">
                      {currentWord!.headword ?? currentWord!.word}
                    </h1>
                    {currentWord!.pos && (
                      <span className="mb-3 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                        {currentWord!.pos}
                      </span>
                    )}
                    <p className="mt-2 text-center text-base leading-relaxed text-slate-600">
                      {currentWord!.def ?? '暂无释义'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SwipeCard>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-4 px-4 pt-2 pb-10">
        {/* Undo — separate row above the main buttons */}
        <motion.button
          onClick={handleUndo}
          disabled={history.length === 0 || isAnimating}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
          whileTap={{ scale: 0.9 }}
        >
          <Undo2 size={16} />
        </motion.button>

        {/* Forgot / Remembered */}
        <div className="flex items-center justify-center gap-10">
          {/* Forgot (left swipe) */}
          <motion.button
            onClick={() => cardRef.current?.swipeLeft()}
            disabled={isAnimating}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-200 bg-white text-red-500 shadow-md transition-all hover:border-red-300 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-white"
            whileTap={{ scale: 0.9 }}
          >
            <X size={28} strokeWidth={3} />
          </motion.button>

          {/* Remembered (right swipe) */}
          <motion.button
            onClick={() => cardRef.current?.swipeRight()}
            disabled={isAnimating}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-200 bg-white text-emerald-500 shadow-md transition-all hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-white"
            whileTap={{ scale: 0.9 }}
          >
            <Check size={28} strokeWidth={3} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
