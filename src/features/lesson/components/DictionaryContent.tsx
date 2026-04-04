'use client';

/**
 * @description 词典查询结果展示组件，处理加载、错误、未找到与成功四种状态。
 */

import React from 'react';
import Link from 'next/link';
import { normalizeDictionaryQuery } from '@/lib/dictionary';
import { DictionaryEntry, DictionaryMeaning } from '@/types/dictionary';
import { DictionaryCacheRecord } from '@/types/dictionary';
import { X, Volume2, Bookmark, BookmarkCheck } from 'lucide-react';

interface DictionaryContentProps {
  queryWord: string;
  selectedSurface: string | null;
  isFocusWord: boolean;
  currentRecord: DictionaryCacheRecord | undefined;
  primaryEntry: DictionaryEntry | null;
  preferredPhonetic: string | undefined;
  flattenedMeanings: DictionaryMeaning[];
  isSavedAtCurrentPoint: boolean;
  speechEnabled: boolean;
  onSave: () => void;
  onSpeak: () => void;
  onRetry: () => void;
  speak: (word: string) => void;
}

export const DictionaryContent: React.FC<DictionaryContentProps> = ({
  queryWord,
  selectedSurface,
  isFocusWord,
  currentRecord,
  primaryEntry,
  preferredPhonetic,
  flattenedMeanings,
  isSavedAtCurrentPoint,
  speechEnabled,
  onSave,
  onSpeak,
  onRetry,
  speak,
}) => {
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
          onClick={onRetry}
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
          onClick={onRetry}
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
                onClick={onSave}
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
              {speechEnabled && (
                <button
                  onClick={onSpeak}
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
              {isFocusWord && (
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
                    <span className="font-bold text-slate-400">Synonyms:</span>
                    <span className="text-slate-600">
                      {meaning.synonyms.slice(0, 8).join(', ')}
                    </span>
                  </div>
                )}
                {meaning.antonyms.length > 0 && (
                  <div className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className="font-bold text-slate-400">Antonyms:</span>
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
