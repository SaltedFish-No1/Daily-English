'use client';

import React from 'react';
import { useLessonStore } from '@/store/useLessonStore';
import { useUserStore } from '@/store/useUserStore';
import { useSpeech } from '@/hooks/useSpeech';
import { VocabEntry, LessonSpeech } from '@/types/lesson';
import { X, Volume2, Bookmark, BookmarkCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VocabSheetProps {
  vocab: Record<string, VocabEntry>;
  speech: LessonSpeech;
}

/**
 * @author SuperQ
 * @description 渲染生词弹层并提供发音能力。
 * @param props 词汇、发音与文案配置。
 * @return 生词弹层组件。
 */
export const VocabSheet: React.FC<VocabSheetProps> = ({ vocab, speech }) => {
  const { selectedWordContext, setSelectedWordContext } = useLessonStore();
  const { savedWords, upsertVocabOccurrence, removeVocabOccurrence } =
    useUserStore();
  const { speak } = useSpeech();
  const selectedWord = selectedWordContext?.word ?? null;
  const isOpen = Boolean(selectedWord);

  const currentEntry = selectedWord ? vocab[selectedWord] : null;
  const normalizedWord = selectedWord?.trim().toLowerCase() ?? '';
  const currentOccurrences = normalizedWord
    ? (savedWords[normalizedWord] ?? [])
    : [];
  const isSavedAtCurrentPoint =
    selectedWordContext !== null &&
    currentOccurrences.some(
      (item) =>
        item.lessonSlug === selectedWordContext.lessonSlug &&
        item.paragraphIndex === selectedWordContext.paragraphIndex
    );

  if (!currentEntry && !isOpen) return null;

  /**
   * @author SuperQ
   * @description 关闭弹层并清空当前选中单词。
   * @param 无。
   * @return 无返回值。
   */
  const handleClose = () => {
    setSelectedWordContext(null);
  };

  /**
   * @author SuperQ
   * @description 播放当前单词发音。
   * @param 无。
   * @return 无返回值。
   */
  const handleSpeak = () => {
    if (selectedWord && speech.enabled) {
      speak(currentEntry?.speakText || selectedWord);
    }
  };

  const handleSave = () => {
    if (!selectedWordContext || !currentEntry) return;
    if (isSavedAtCurrentPoint) {
      removeVocabOccurrence({
        word: selectedWordContext.word,
        lessonSlug: selectedWordContext.lessonSlug,
        paragraphIndex: selectedWordContext.paragraphIndex,
      });
      return;
    }
    upsertVocabOccurrence({
      word: selectedWordContext.word,
      lessonSlug: selectedWordContext.lessonSlug,
      lessonTitle: selectedWordContext.lessonTitle,
      paragraphIndex: selectedWordContext.paragraphIndex,
      senseSnapshot: {
        pos: currentEntry.pos,
        def: currentEntry.def,
        trans: currentEntry.trans,
        speakText: currentEntry.speakText,
      },
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pb-safe fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white shadow-2xl lg:static lg:block lg:rounded-none lg:bg-transparent lg:shadow-none"
          >
            <div className="relative h-[60vh] overflow-y-auto p-6 pt-10 lg:h-auto lg:rounded-xl lg:border lg:border-emerald-200 lg:bg-emerald-50 lg:pt-8">
              {/* Drag Handle */}
              <div className="absolute top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-200 lg:hidden" />

              <button
                onClick={handleClose}
                className="absolute top-4 right-4 rounded-full bg-slate-100 p-2 text-slate-500 lg:hidden"
              >
                <X size={20} />
              </button>

              {currentEntry ? (
                <div className="fade-in">
                  <div className="mb-6 flex items-center gap-3">
                    <h3 className="text-2xl leading-tight font-bold text-slate-900 capitalize">
                      {selectedWord}
                    </h3>
                    <button
                      onClick={handleSave}
                      type="button"
                      title={isSavedAtCurrentPoint ? '取消收藏' : '收藏'}
                      className={`rounded-xl border p-2.5 transition-all active:scale-95 ${
                        isSavedAtCurrentPoint
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {isSavedAtCurrentPoint ? (
                        <BookmarkCheck size={20} />
                      ) : (
                        <Bookmark size={20} />
                      )}
                    </button>
                    {speech.enabled && (
                      <button
                        onClick={handleSpeak}
                        title="播放发音"
                        className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-600 shadow-sm transition-all hover:bg-emerald-100 active:scale-95"
                      >
                        <Volume2 size={20} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 uppercase">
                        {currentEntry.pos}
                      </span>
                      <span className="text-sm font-medium text-slate-400">
                        Definition
                      </span>
                    </div>

                    <p className="text-lg leading-relaxed text-slate-700 italic">
                      {currentEntry.def}
                    </p>

                    <div className="border-t border-slate-100 pt-4">
                      <span className="mb-2 block text-sm font-medium text-slate-400">
                        中文释义
                      </span>
                      <p className="serif text-2xl font-bold text-emerald-700">
                        {currentEntry.trans}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden py-12 text-center text-emerald-700 opacity-60 lg:block">
                  <div className="mb-3 text-4xl">👆</div>
                  <p className="text-base font-medium">
                    点击正文中的高亮词汇，查看释义并收藏到生词库
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
