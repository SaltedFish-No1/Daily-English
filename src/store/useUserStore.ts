/**
 * @description 用户持久化状态：生词收藏、词典缓存、课程历史与测验进度。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeDictionaryQuery } from '@/lib/dictionary';
import { fetchDictionaryFromApi } from '@/lib/dictionary-fallback';
import { DictionaryCacheRecord } from '@/types/dictionary';
import { QuizPersistState } from '@/types/quiz';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  WordReviewState,
  initReviewState,
  calculateNextReview,
} from '@/lib/spaced-repetition';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @author SaltedFish-No1
 * @description 获取当前登录用户 ID，未登录返回 null。
 */
function getAuthUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

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
    defZh?: string;
    phonetic?: string;
    audio?: string;
  };
}

export type SavedVocabIndex = Record<string, VocabOccurrence[]>;
export type DictionaryCacheIndex = Record<string, DictionaryCacheRecord>;

export interface LessonHistory {
  slug: string;
  title?: string;
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
  saveLessonScore: (
    slug: string,
    score: number,
    total: number,
    title?: string
  ) => void;
  quizProgress: Record<string, QuizPersistState>;
  setQuizProgress: (key: string, state: QuizPersistState) => void;
  clearQuizProgress: (key: string) => void;
  /** 间隔重复：每个词的复习状态 */
  wordReviewStates: Record<string, WordReviewState>;
  /** 收藏生词时自动初始化复习状态（若不存在） */
  initWordReviewState: (word: string) => void;
  /** Quiz 答题后更新复习状态，quality 0-5 */
  updateWordReview: (word: string, quality: number) => void;
  /** 批量更新多个词的复习状态 */
  batchUpdateWordReview: (
    updates: Array<{ word: string; quality: number }>
  ) => void;
  /** 重置所有用户数据（登出时清理 localStorage） */
  resetStore: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      savedWords: {},
      dictionaryCache: {},
      history: {},
      quizProgress: {},
      wordReviewStates: {},
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

          // 云端同步：已登录时后台写入
          const userId = getAuthUserId();
          if (userId) {
            supabase
              .from('saved_words')
              .upsert(
                {
                  user_id: userId,
                  word: key,
                  lesson_slug: lessonSlug,
                  lesson_title: lessonTitle ?? null,
                  paragraph_index: paragraphIndex,
                  saved_at: Date.now(),
                  surface: surface ?? null,
                  sense_headword: senseSnapshot.headword ?? null,
                  sense_pos: senseSnapshot.pos ?? null,
                  sense_def: senseSnapshot.def ?? null,
                  sense_def_zh: senseSnapshot.defZh ?? null,
                  sense_phonetic: senseSnapshot.phonetic ?? null,
                  sense_audio: senseSnapshot.audio ?? null,
                },
                { onConflict: 'user_id,word,lesson_slug,paragraph_index' }
              )
              .then(({ error }) => {
                if (error)
                  console.error('[CloudSync] saved_words upsert:', error);
              });
          }

          // 自动初始化间隔重复状态（若该词尚未有复习记录）
          const reviewStates = state.wordReviewStates[key]
            ? state.wordReviewStates
            : {
                ...state.wordReviewStates,
                [key]: initReviewState(),
              };

          return {
            savedWords: {
              ...state.savedWords,
              [key]: occurrences,
            },
            wordReviewStates: reviewStates,
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

          // 云端同步：删除对应记录
          const userId = getAuthUserId();
          if (userId) {
            supabase
              .from('saved_words')
              .delete()
              .eq('user_id', userId)
              .eq('word', key)
              .eq('lesson_slug', lessonSlug)
              .eq('paragraph_index', paragraphIndex)
              .then(({ error }) => {
                if (error)
                  console.error('[CloudSync] saved_words delete:', error);
              });
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

          // 云端同步：删除该词所有记录
          const userId = getAuthUserId();
          if (userId) {
            supabase
              .from('saved_words')
              .delete()
              .eq('user_id', userId)
              .eq('word', key)
              .then(({ error }) => {
                if (error)
                  console.error('[CloudSync] saved_words delete word:', error);
              });
          }

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

        const result = await fetchDictionaryFromApi(key);

        set((state) => ({
          dictionaryCache: {
            ...state.dictionaryCache,
            [key]: {
              fetchedAt: Date.now(),
              data: result.data,
              status: result.status,
              source: result.source as
                | 'dictionaryapi'
                | 'ai_generated'
                | 'cache'
                | undefined,
              audioUrl: result.audioUrl,
              zhStatus: result.zhStatus,
            },
          },
        }));

        // 中文释义后台生成中，3s 后自动重新查询以获取完整数据
        if (result.zhStatus === 'pending') {
          setTimeout(() => {
            get().fetchDictionaryRecord(key, true);
          }, 3000);
        }
      },
      saveLessonScore: (slug, score, total, title) =>
        set((state) => {
          const userId = getAuthUserId();
          if (userId) {
            supabase
              .from('lesson_history')
              .upsert(
                {
                  user_id: userId,
                  slug,
                  score,
                  total,
                  title,
                  completed_at: Date.now(),
                },
                { onConflict: 'user_id,slug' }
              )
              .then(({ error }) => {
                if (error)
                  console.error('[CloudSync] lesson_history upsert:', error);
              });
          }
          return {
            history: {
              ...state.history,
              [slug]: {
                slug,
                title,
                score,
                total,
                completedAt: Date.now(),
              },
            },
          };
        }),
      setQuizProgress: (key, state) =>
        set((prev) => {
          const userId = getAuthUserId();
          if (userId) {
            supabase
              .from('quiz_progress')
              .upsert(
                { user_id: userId, persist_key: key, state },
                { onConflict: 'user_id,persist_key' }
              )
              .then(({ error }) => {
                if (error)
                  console.error('[CloudSync] quiz_progress upsert:', error);
              });
          }
          return {
            quizProgress: { ...prev.quizProgress, [key]: state },
          };
        }),
      clearQuizProgress: (key) =>
        set((prev) => {
          const userId = getAuthUserId();
          if (userId) {
            supabase
              .from('quiz_progress')
              .delete()
              .eq('user_id', userId)
              .eq('persist_key', key)
              .then(({ error }) => {
                if (error)
                  console.error('[CloudSync] quiz_progress delete:', error);
              });
          }
          const next = { ...prev.quizProgress };
          delete next[key];
          return { quizProgress: next };
        }),
      // --- 间隔重复 ---
      initWordReviewState: (word) =>
        set((state) => {
          const key = word.trim().toLowerCase();
          if (state.wordReviewStates[key]) return state;
          const reviewState = initReviewState();

          // 云端同步
          const userId = getAuthUserId();
          if (userId) {
            supabase
              .from('word_review_states')
              .upsert(
                {
                  user_id: userId,
                  word: key,
                  interval_days: reviewState.interval,
                  easiness: reviewState.easiness,
                  repetition: reviewState.repetition,
                  next_review_at: reviewState.nextReviewAt,
                  last_reviewed_at: reviewState.lastReviewedAt || null,
                  total_reviews: reviewState.totalReviews,
                  total_correct: reviewState.totalCorrect,
                  status: reviewState.status,
                },
                { onConflict: 'user_id,word' }
              )
              .then(({ error }) => {
                if (error)
                  console.error('[CloudSync] word_review_states init:', error);
              });
          }

          return {
            wordReviewStates: {
              ...state.wordReviewStates,
              [key]: reviewState,
            },
          };
        }),
      updateWordReview: (word, quality) =>
        set((state) => {
          const key = word.trim().toLowerCase();
          const current = state.wordReviewStates[key];
          if (!current) return state;
          const next = calculateNextReview(quality, current);

          // 云端同步
          const userId = getAuthUserId();
          if (userId) {
            supabase
              .from('word_review_states')
              .upsert(
                {
                  user_id: userId,
                  word: key,
                  interval_days: next.interval,
                  easiness: next.easiness,
                  repetition: next.repetition,
                  next_review_at: next.nextReviewAt,
                  last_reviewed_at: next.lastReviewedAt,
                  total_reviews: next.totalReviews,
                  total_correct: next.totalCorrect,
                  status: next.status,
                },
                { onConflict: 'user_id,word' }
              )
              .then(({ error }) => {
                if (error)
                  console.error(
                    '[CloudSync] word_review_states update:',
                    error
                  );
              });
          }

          return {
            wordReviewStates: {
              ...state.wordReviewStates,
              [key]: next,
            },
          };
        }),
      resetStore: () =>
        set({
          savedWords: {},
          dictionaryCache: {},
          history: {},
          quizProgress: {},
          wordReviewStates: {},
        }),
      batchUpdateWordReview: (updates) =>
        set((state) => {
          const nextStates = { ...state.wordReviewStates };
          const userId = getAuthUserId();
          const upsertRows: Array<Record<string, unknown>> = [];

          for (const { word, quality } of updates) {
            const key = word.trim().toLowerCase();
            const current = nextStates[key];
            if (!current) continue;
            const next = calculateNextReview(quality, current);
            nextStates[key] = next;

            if (userId) {
              upsertRows.push({
                user_id: userId,
                word: key,
                interval_days: next.interval,
                easiness: next.easiness,
                repetition: next.repetition,
                next_review_at: next.nextReviewAt,
                last_reviewed_at: next.lastReviewedAt,
                total_reviews: next.totalReviews,
                total_correct: next.totalCorrect,
                status: next.status,
              });
            }
          }

          if (userId && upsertRows.length > 0) {
            supabase
              .from('word_review_states')
              .upsert(upsertRows, { onConflict: 'user_id,word' })
              .then(({ error }) => {
                if (error)
                  console.error('[CloudSync] word_review_states batch:', error);
              });
          }

          return { wordReviewStates: nextStates };
        }),
    }),
    {
      name: 'daily-english-user-storage',
    }
  )
);
