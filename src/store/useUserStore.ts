/**
 * @description 用户持久化状态：生词收藏、词典缓存、课程历史与测验进度。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  fetchDictionaryEntries,
  normalizeDictionaryQuery,
} from '@/lib/dictionary';
import { DictionaryCacheRecord } from '@/types/dictionary';
import { QuizPersistState } from '@/types/quiz';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface VocabOccurrence {
  lessonSlug: string;
  lessonTitle?: string;
  paragraphIndex: number;
  savedAt: number;
  surface?: string;
  senseSnapshot: {
    headword?: string;
    pos?: string;
    def?: string;
    phonetic?: string;
    audio?: string;
  };
}

export type SavedVocabIndex = Record<string, VocabOccurrence[]>;
export type DictionaryCacheIndex = Record<string, DictionaryCacheRecord>;

export interface LessonHistory {
  slug: string;
  score: number;
  total: number;
  completedAt: number;
}

interface UserState {
  savedWords: SavedVocabIndex;
  dictionaryCache: DictionaryCacheIndex;
  history: Record<string, LessonHistory>;
  upsertVocabOccurrence: (params: {
    word: string;
    lessonSlug: string;
    lessonTitle?: string;
    paragraphIndex: number;
    surface?: string;
    senseSnapshot: VocabOccurrence['senseSnapshot'];
  }) => void;
  removeVocabOccurrence: (params: {
    word: string;
    lessonSlug: string;
    paragraphIndex: number;
  }) => void;
  removeWord: (word: string) => void;
  setDictionaryCacheRecord: (
    word: string,
    record: DictionaryCacheRecord
  ) => void;
  fetchDictionaryRecord: (word: string, force?: boolean) => Promise<void>;
  saveLessonScore: (slug: string, score: number, total: number) => void;
  quizProgress: Record<string, QuizPersistState>;
  setQuizProgress: (key: string, state: QuizPersistState) => void;
  clearQuizProgress: (key: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      savedWords: {},
      dictionaryCache: {},
      history: {},
      quizProgress: {},
      // 不可变更新 savedWords 索引：按 (lessonSlug, paragraphIndex) 查找已有记录并更新，或追加新记录。
      upsertVocabOccurrence: ({
        word,
        lessonSlug,
        lessonTitle,
        paragraphIndex,
        surface,
        senseSnapshot,
      }) =>
        set((state) => {
          const key = word.trim().toLowerCase();
          const occurrences = state.savedWords[key]
            ? [...state.savedWords[key]]
            : [];
          const hitIndex = occurrences.findIndex(
            (item) =>
              item.lessonSlug === lessonSlug &&
              item.paragraphIndex === paragraphIndex
          );
          const nextOccurrence: VocabOccurrence = {
            lessonSlug,
            lessonTitle,
            paragraphIndex,
            savedAt: Date.now(),
            surface,
            senseSnapshot,
          };

          if (hitIndex >= 0) {
            occurrences[hitIndex] = nextOccurrence;
          } else {
            occurrences.push(nextOccurrence);
          }

          return {
            savedWords: {
              ...state.savedWords,
              [key]: occurrences,
            },
          };
        }),
      // 删除特定出处记录；若该词的出处列表清空则删除整个词条以保持索引整洁。
      removeVocabOccurrence: ({ word, lessonSlug, paragraphIndex }) =>
        set((state) => {
          const key = word.trim().toLowerCase();
          const occurrences = state.savedWords[key];
          if (!occurrences) return state;
          const nextOccurrences = occurrences.filter(
            (item) =>
              !(
                item.lessonSlug === lessonSlug &&
                item.paragraphIndex === paragraphIndex
              )
          );
          if (nextOccurrences.length === occurrences.length) {
            return state;
          }
          if (nextOccurrences.length === 0) {
            const rest = Object.fromEntries(
              Object.entries(state.savedWords).filter(
                ([entryKey]) => entryKey !== key
              )
            ) as SavedVocabIndex;
            return {
              savedWords: rest,
            };
          }
          return {
            savedWords: {
              ...state.savedWords,
              [key]: nextOccurrences,
            },
          };
        }),
      removeWord: (word) =>
        set((state) => {
          const key = word.trim().toLowerCase();
          if (!state.savedWords[key]) return state;
          const rest = Object.fromEntries(
            Object.entries(state.savedWords).filter(
              ([entryKey]) => entryKey !== key
            )
          ) as SavedVocabIndex;
          return {
            savedWords: rest,
          };
        }),
      setDictionaryCacheRecord: (word, record) =>
        set((state) => ({
          dictionaryCache: {
            ...state.dictionaryCache,
            [word.trim().toLowerCase()]: record,
          },
        })),
      // TTL 缓存（7天）词典查询：先设 loading 占位防止并发请求，完成后替换为真实数据���
      fetchDictionaryRecord: async (word, force = false) => {
        const key = normalizeDictionaryQuery(word);
        if (!key) return;

        const currentRecord = get().dictionaryCache[key];
        const isStale =
          !currentRecord ||
          currentRecord.status === 'error' ||
          currentRecord.status === 'loading' ||
          Date.now() - currentRecord.fetchedAt > CACHE_TTL_MS;
        if (!isStale && !force) return;

        set((state) => ({
          dictionaryCache: {
            ...state.dictionaryCache,
            [key]: {
              fetchedAt: Date.now(),
              data: currentRecord?.data ?? null,
              status: 'loading',
            },
          },
        }));

        const result = await fetchDictionaryEntries(key);

        set((state) => ({
          dictionaryCache: {
            ...state.dictionaryCache,
            [key]: {
              fetchedAt: Date.now(),
              data: result.data,
              status: result.status,
            },
          },
        }));
      },
      saveLessonScore: (slug, score, total) =>
        set((state) => ({
          history: {
            ...state.history,
            [slug]: {
              slug,
              score,
              total,
              completedAt: Date.now(),
            },
          },
        })),
      setQuizProgress: (key, state) =>
        set((prev) => ({
          quizProgress: { ...prev.quizProgress, [key]: state },
        })),
      clearQuizProgress: (key) =>
        set((prev) => {
          const next = { ...prev.quizProgress };
          delete next[key];
          return { quizProgress: next };
        }),
    }),
    {
      name: 'daily-english-user-storage',
    }
  )
);
