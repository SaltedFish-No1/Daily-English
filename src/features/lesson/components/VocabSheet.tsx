'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { normalizeDictionaryQuery } from '@/lib/dictionary';
import { useLessonStore } from '@/store/useLessonStore';
import { useUserStore } from '@/store/useUserStore';
import { useSpeech } from '@/hooks/useSpeech';
import { LessonSpeech } from '@/types/lesson';
import { X, Volume2, Bookmark, BookmarkCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VocabSheetProps {
  speech: LessonSpeech;
}

/**
 * @author SuperQ
 * @description 渲染生词弹层并提供发音能力。
 * @param props 词汇、发音与文案配置。
 * @return 生词弹层组件。
 */
export const VocabSheet: React.FC<VocabSheetProps> = ({ speech }) => {
  const { selectedWordContext, setSelectedWordContext } = useLessonStore();
  const {
    savedWords,
    dictionaryCache,
    fetchDictionaryRecord,
    upsertVocabOccurrence,
    removeVocabOccurrence,
  } = useUserStore();
  const { speak } = useSpeech();
  const selectedSurface = selectedWordContext?.surface ?? null;
  const queryWord = selectedWordContext?.query ?? '';
  const isOpen = Boolean(selectedWordContext);
  const currentRecord = queryWord ? dictionaryCache[queryWord] : undefined;
  const currentEntries = currentRecord?.data ?? null;
  const primaryEntry = currentEntries?.[0] ?? null;
  const preferredPhonetic =
    primaryEntry?.phonetic ??
    primaryEntry?.phonetics.find((phonetic) => phonetic.text)?.text;
  const preferredAudio =
    primaryEntry?.audio ??
    primaryEntry?.phonetics.find((phonetic) => phonetic.audio)?.audio;
  const savedWordKey = normalizeDictionaryQuery(
    primaryEntry?.word ?? queryWord
  );
  const flattenedMeanings = useMemo(() => {
    return (currentEntries ?? []).flatMap((entry) => entry.meanings);
  }, [currentEntries]);
  const currentOccurrences = savedWordKey
    ? (savedWords[savedWordKey] ?? [])
    : [];
  const isSavedAtCurrentPoint =
    selectedWordContext !== null &&
    currentOccurrences.some(
      (item) =>
        item.lessonSlug === selectedWordContext.lessonSlug &&
        item.paragraphIndex === selectedWordContext.paragraphIndex
    );

  useEffect(() => {
    if (!queryWord) return;
    if (currentRecord) return;
    void fetchDictionaryRecord(queryWord);
  }, [currentRecord, fetchDictionaryRecord, queryWord]);

  const handleClose = () => {
    setSelectedWordContext(null);
  };

  const handleSpeak = () => {
    if (!queryWord || !speech.enabled) return;

    const audioUrl = preferredAudio;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      void audio.play().catch(() => {
        speak(primaryEntry?.word || queryWord);
      });
      return;
    }

    speak(primaryEntry?.word || queryWord);
  };

  const handleSave = () => {
    if (!selectedWordContext || !primaryEntry || !savedWordKey) return;

    const firstMeaning = primaryEntry.meanings[0];
    const firstDefinition = firstMeaning?.definitions[0];

    if (isSavedAtCurrentPoint) {
      removeVocabOccurrence({
        word: savedWordKey,
        lessonSlug: selectedWordContext.lessonSlug,
        paragraphIndex: selectedWordContext.paragraphIndex,
      });
      return;
    }
    upsertVocabOccurrence({
      word: savedWordKey,
      lessonSlug: selectedWordContext.lessonSlug,
      lessonTitle: selectedWordContext.lessonTitle,
      paragraphIndex: selectedWordContext.paragraphIndex,
      surface: selectedWordContext.surface,
      senseSnapshot: {
        headword: primaryEntry.word,
        pos: firstMeaning?.partOfSpeech,
        def: firstDefinition?.definition,
        phonetic: preferredPhonetic,
        audio: preferredAudio,
      },
    });
  };

  const renderDictionaryContent = () => {
    if (currentRecord?.status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
          <p className="text-sm font-medium text-slate-500">正在查询词典…</p>
        </div>
      );
    }

    if (!currentRecord) {
      return (
        <div className="hidden py-12 text-center text-emerald-700 opacity-60 lg:block">
          <div className="mb-3 text-4xl">👆</div>
          <p className="text-base font-medium">
            点击正文中的英文单词即可查询，高亮词为本课重点词。
          </p>
        </div>
      );
    }

    if (currentRecord.status === 'error') {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <X size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-700">查询失败</h4>
            <p className="text-sm text-slate-500">请检查网络连接后重试</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchDictionaryRecord(queryWord, true)}
            className="mt-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 active:scale-95"
          >
            重新查询
          </button>
        </div>
      );
    }

    if (currentRecord.status === 'not_found' || !primaryEntry) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <span className="text-xl">?</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-700">未找到释义</h4>
            <p className="text-sm text-slate-500">
              词典中没有收录词语{' '}
              <span className="font-bold">&quot;{queryWord}&quot;</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchDictionaryRecord(queryWord, true)}
            className="mt-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 active:scale-95"
          >
            重试
          </button>
        </div>
      );
    }

    return (
      <div className="fade-in">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-3xl leading-tight font-extrabold break-words text-slate-900 lg:text-3xl">
                {primaryEntry.word}
              </h3>
              <div className="flex shrink-0 items-center gap-2 lg:gap-3">
                <button
                  onClick={handleSave}
                  type="button"
                  title={isSavedAtCurrentPoint ? '取消收藏' : '收藏'}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-emerald-100 hover:text-emerald-600 active:scale-95 lg:h-12 lg:w-12"
                >
                  {isSavedAtCurrentPoint ? (
                    <BookmarkCheck size={22} className="text-emerald-600" />
                  ) : (
                    <Bookmark size={22} />
                  )}
                </button>
                {speech.enabled && (
                  <button
                    onClick={handleSpeak}
                    title="播放发音"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-colors hover:bg-emerald-200 active:scale-95 lg:h-12 lg:w-12"
                  >
                    <Volume2 size={22} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                {selectedWordContext?.isFocusWord && (
                  <span className="rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-bold tracking-widest text-emerald-700 uppercase ring-1 ring-emerald-200/50">
                    重点词
                  </span>
                )}
                {preferredPhonetic && (
                  <span className="text-sm font-medium tracking-wide text-slate-500">
                    {preferredPhonetic}
                  </span>
                )}
              </div>
              {selectedSurface &&
                normalizeDictionaryQuery(selectedSurface) !==
                  normalizeDictionaryQuery(primaryEntry.word) && (
                  <p className="text-xs font-medium text-slate-400">
                    点击词形：
                    <span className="text-slate-500">{selectedSurface}</span>
                  </p>
                )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {primaryEntry.phonetics.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 lg:p-6">
              <div className="mb-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
                Phonetics 发音
              </div>
              <div className="flex flex-wrap gap-2.5">
                {primaryEntry.phonetics.map((phonetic, phoneticIndex) => (
                  <button
                    key={`${phonetic.text ?? 'phonetic'}-${phoneticIndex}`}
                    type="button"
                    onClick={() => {
                      if (phonetic.audio) {
                        const audio = new Audio(phonetic.audio);
                        void audio.play().catch(() => {
                          speak(primaryEntry.word);
                        });
                        return;
                      }
                      speak(primaryEntry.word);
                    }}
                    className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow"
                  >
                    <Volume2
                      size={16}
                      className="text-slate-400 group-hover:text-emerald-600"
                    />
                    <span>{phonetic.text || 'Play'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {flattenedMeanings.map((meaning, meaningIndex) => (
            <div
              key={`${meaning.partOfSpeech ?? 'meaning'}-${meaningIndex}`}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:p-6"
            >
              {meaning.partOfSpeech && (
                <div className="mb-4 flex items-center gap-3 border-b border-slate-50 pb-3">
                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold tracking-wide text-slate-600 uppercase">
                    {meaning.partOfSpeech}
                  </span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
              )}
              <div className="space-y-5">
                {meaning.definitions
                  .slice(0, 3)
                  .map((definition, definitionIndex) => (
                    <div
                      key={`${meaningIndex}-${definitionIndex}`}
                      className="group relative space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
                          {definitionIndex + 1}
                        </span>
                        <div className="flex-1 space-y-2">
                          <p className="text-[15px] leading-relaxed font-medium text-slate-800">
                            {definition.definition}
                          </p>
                          {definition.example && (
                            <div className="rounded-lg border-l-2 border-emerald-200 bg-emerald-50/50 py-2 pr-3 pl-3">
                              <p className="text-sm leading-relaxed text-slate-600 italic">
                                &quot;{definition.example}&quot;
                              </p>
                            </div>
                          )}
                          {(definition.synonyms.length > 0 ||
                            definition.antonyms.length > 0) && (
                            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                              {definition.synonyms.length > 0 && (
                                <p className="text-xs font-medium text-slate-500">
                                  <span className="text-slate-400">Syn:</span>{' '}
                                  {definition.synonyms.slice(0, 5).join(', ')}
                                </p>
                              )}
                              {definition.antonyms.length > 0 && (
                                <p className="text-xs font-medium text-slate-500">
                                  <span className="text-slate-400">Ant:</span>{' '}
                                  {definition.antonyms.slice(0, 5).join(', ')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {(meaning.synonyms.length > 0 || meaning.antonyms.length > 0) && (
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                  {meaning.synonyms.length > 0 && (
                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                      <span className="font-bold text-slate-400">
                        Synonyms:
                      </span>
                      <span className="text-slate-600">
                        {meaning.synonyms.slice(0, 8).join(', ')}
                      </span>
                    </div>
                  )}
                  {meaning.antonyms.length > 0 && (
                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                      <span className="font-bold text-slate-400">
                        Antonyms:
                      </span>
                      <span className="text-slate-600">
                        {meaning.antonyms.slice(0, 8).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {primaryEntry.sourceUrls.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 lg:p-6">
              <div className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
                Source 来源
              </div>
              <div className="space-y-2">
                {primaryEntry.sourceUrls.map((sourceUrl) => (
                  <Link
                    key={sourceUrl}
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs font-medium break-all text-slate-400 transition-colors hover:text-emerald-600"
                  >
                    {sourceUrl}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!selectedWordContext) {
    return (
      <div className="hidden rounded-2xl border border-emerald-100 bg-slate-50/50 p-8 lg:block">
        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100/50 text-3xl shadow-sm">
            👆
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-700">查词典</h4>
            <p className="text-sm font-medium text-slate-500">
              点击正文中的英文单词即可查询，
              <br />
              <span className="text-emerald-600">绿色高亮</span> 为本课重点词。
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="relative h-[70vh] max-h-[85vh] overflow-y-auto p-6 pt-14 lg:h-auto lg:max-h-none lg:rounded-2xl lg:border lg:border-emerald-100 lg:bg-slate-50/50 lg:pt-8">
              {/* Drag Handle */}
              <div className="absolute top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-200 lg:hidden" />

              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 active:scale-95 lg:hidden"
              >
                <X size={18} />
              </button>
              {renderDictionaryContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
