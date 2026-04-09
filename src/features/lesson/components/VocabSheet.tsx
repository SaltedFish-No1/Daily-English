'use client';

import React, { useEffect, useMemo } from 'react';
import { normalizeDictionaryQuery } from '@/lib/dictionary';
import { useLessonStore } from '@/store/useLessonStore';
import { useUserStore } from '@/store/useUserStore';
import { useSpeech } from '@/hooks/useSpeech';
import { LessonSpeech } from '@/types/lesson';
import { DictionaryContent } from './DictionaryContent';
import { fetchTTSAudioUrl } from '@/lib/tts-fallback';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

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
  // 优先取顶层 phonetic/audio，回退到 phonetics 数组中首个有值的项。
  const preferredPhonetic =
    primaryEntry?.phonetic ??
    primaryEntry?.phonetics.find((phonetic) => phonetic.text)?.text;
  const preferredAudio =
    currentRecord?.audioUrl ??
    primaryEntry?.audio ??
    primaryEntry?.phonetics.find((phonetic) => phonetic.audio)?.audio;
  const savedWordKey = normalizeDictionaryQuery(
    primaryEntry?.word ?? queryWord
  );
  const flattenedMeanings = useMemo(() => {
    return (currentEntries ?? []).flatMap((entry) => entry.meanings);
  }, [currentEntries]);
  // 判断当前词是否已在此 (lessonSlug, paragraphIndex) 位置收藏，驱动书签图标状态。
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

  const handleSpeak = async () => {
    if (!queryWord || !speech.enabled) return;
    const targetWord = primaryEntry?.word || queryWord;

    // Tier 1: 已有音频 URL（来自 dictionaryapi 或 TTS 缓存）
    if (preferredAudio) {
      try {
        await new Audio(preferredAudio).play();
        return;
      } catch {
        // 播放失败，继续 fallback
      }
    }

    // Tier 2: 服务端 TTS 生成
    try {
      const ttsUrl = await fetchTTSAudioUrl(targetWord);
      if (ttsUrl) {
        await new Audio(ttsUrl).play();
        return;
      }
    } catch {
      // TTS 失败，继续 fallback
    }

    // Tier 3: 浏览器 Web Speech API
    speak(targetWord);
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
        defZh: firstDefinition?.definitionZh,
        phonetic: preferredPhonetic,
        audio: preferredAudio,
      },
    });
  };

  const dictionaryContentEl = (
    <DictionaryContent
      queryWord={queryWord}
      selectedSurface={selectedSurface}
      isFocusWord={selectedWordContext?.isFocusWord ?? false}
      currentRecord={currentRecord}
      primaryEntry={primaryEntry}
      preferredPhonetic={preferredPhonetic}
      flattenedMeanings={flattenedMeanings}
      isSavedAtCurrentPoint={isSavedAtCurrentPoint}
      speechEnabled={speech.enabled}
      onSave={handleSave}
      onSpeak={handleSpeak}
      onRetry={() => void fetchDictionaryRecord(queryWord, true)}
      speak={speak}
    />
  );

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
      {/* Mobile: Vaul Drawer */}
      <div className="lg:hidden">
        <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DrawerContent className="max-h-[85vh]">
            <div className="overflow-y-auto p-6 pt-4">
              {dictionaryContentEl}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: Static sidebar panel */}
      <div className="hidden lg:block">
        <div className="relative h-auto rounded-2xl border border-emerald-100 bg-slate-50/50 p-6 pt-8">
          {dictionaryContentEl}
        </div>
      </div>
    </>
  );
};
