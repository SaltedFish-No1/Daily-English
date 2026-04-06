/**
 * @description 用户持久化状态：生词收藏、词典缓存、课程历史与测验进度。
 *   云端同步使用 user_words 表（合并 saved_words + word_review_states）。
 *   quiz_progress 仅保留在 localStorage 中，不再云端同步。
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

/**
 * 根据单词文本获取 words 表中的 word_id。
 * 如果不存在则先创建一条记录。
 */
async function getOrCreateWordId(word: string): Promise<string | null> {
  // 先查询
  const { data: existing } = await supabase
    .from('words')
    .select('id')
    .eq('word', word)
    .single();

  if (existing) return existing.id;

  // 不存在则创建（最简记录，后续词典查询会补全）
  const { data: created, error } = await supabase
    .from('words')
    .upsert({ word, meanings: [], source: 'cache' }, { onConflict: 'word' })
    .select('id')
    .single();

  if (error) {
    console.error('[CloudSync] words upsert:', error);
    return null;
  }
  return created?.id ?? null;
}

/**
 * 同步单词收藏 + 复习状态到 user_words 表。
 */
async function syncUserWord(
  userId: string,
  word: string,
  occurrences: VocabOccurrence[],
  reviewState: WordReviewState
) {
  const wordId = await getOrCreateWordId(word);
  if (!wordId) return;

  const occurrencesJson = occurrences.map((occ) => ({
    lesson_slug: occ.lessonSlug,
    lesson_title: occ.lessonTitle ?? null,
    paragraph_index: occ.paragraphIndex,
    saved_at: occ.savedAt,
    surface: occ.surface ?? null,
  }));

  supabase
    .from('user_words')
    .upsert(
      {
        user_id: userId,
        word_id: wordId,
        occurrences: occurrencesJson,
        interval_days: reviewState.interval,
        easiness: reviewState.easiness,
        repetition: reviewState.repetition,
        next_review_at: reviewState.nextReviewAt,
        last_reviewed_at: reviewState.lastReviewedAt || null,
        total_reviews: reviewState.totalReviews,
        total_correct: reviewState.totalCorrect,
        status: reviewState.status,
      },
      { onConflict: 'user_id,word_id' }
    )
    .then(({ error }) => {
      if (error) console.error('[CloudSync] user_words upsert:', error);
    });
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

          // 自动初始化间隔重复状态（若该词尚未有复习记录）
          const reviewStates = state.wordReviewStates[key]
            ? state.wordReviewStates
            : {
                ...state.wordReviewStates,
                [key]: initReviewState(),
              };

          // 云端同步：已登录时后台写入 user_words 表
          const userId = getAuthUserId();
          if (userId) {
            const reviewState =
              reviewStates[key] ?? state.wordReviewStates[key];
            if (reviewState) {
              syncUserWord(userId, key, occurrences, reviewState);
            }
          }

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

          // 云端同步
          const userId = getAuthUserId();
          if (userId) {
            if (nextOccurrences.length === 0) {
              // 删除整个 user_words 记录
              getOrCreateWordId(key).then((wordId) => {
                if (!wordId) return;
                supabase
                  .from('user_words')
                  .delete()
                  .eq('user_id', userId)
                  .eq('word_id', wordId)
                  .then(({ error }) => {
                    if (error)
                      console.error('[CloudSync] user_words delete:', error);
                  });
              });
            } else {
              // 更新 occurrences
              const reviewState = state.wordReviewStates[key];
              if (reviewState) {
                syncUserWord(userId, key, nextOccurrences, reviewState);
              }
            }
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

          // 云端同步：删除该词的 user_words 记录
          const userId = getAuthUserId();
          if (userId) {
            getOrCreateWordId(key).then((wordId) => {
              if (!wordId) return;
              supabase
                .from('user_words')
                .delete()
                .eq('user_id', userId)
                .eq('word_id', wordId)
                .then(({ error }) => {
                  if (error)
                    console.error('[CloudSync] user_words delete word:', error);
                });
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
      // TTL 缓存（7天）词典查询：先设 loading 占位防止并发请求，完成后替换为真实数据。
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
              status: currentRecord?.data ? 'revalidating' : 'loading',
              ...(currentRecord?.data
                ? {
                    source: currentRecord.source,
                    audioUrl: currentRecord.audioUrl,
                    zhStatus: currentRecord.zhStatus,
                  }
                : {}),
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
      // quiz_progress 仅保留在 localStorage，不再云端同步
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
      // --- 间隔重复 ---
      initWordReviewState: (word) =>
        set((state) => {
          const key = word.trim().toLowerCase();
          if (state.wordReviewStates[key]) return state;
          const reviewState = initReviewState();

          // 云端同步
          const userId = getAuthUserId();
          if (userId) {
            const occurrences = state.savedWords[key] ?? [];
            syncUserWord(userId, key, occurrences, reviewState);
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
            const occurrences = state.savedWords[key] ?? [];
            syncUserWord(userId, key, occurrences, next);
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

          for (const { word, quality } of updates) {
            const key = word.trim().toLowerCase();
            const current = nextStates[key];
            if (!current) continue;
            const next = calculateNextReview(quality, current);
            nextStates[key] = next;

            if (userId) {
              const occurrences = state.savedWords[key] ?? [];
              syncUserWord(userId, key, occurrences, next);
            }
          }

          return { wordReviewStates: nextStates };
        }),
    }),
    {
      name: 'daily-english-user-storage',
    }
  )
);
