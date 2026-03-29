import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VocabOccurrence {
  lessonSlug: string;
  lessonTitle?: string;
  paragraphIndex: number;
  savedAt: number;
  senseSnapshot: {
    pos?: string;
    def?: string;
    trans?: string;
    speakText?: string;
  };
}

export type SavedVocabIndex = Record<string, VocabOccurrence[]>;

export interface LessonHistory {
  slug: string;
  score: number;
  total: number;
  completedAt: number;
}

interface UserState {
  savedWords: SavedVocabIndex;
  history: Record<string, LessonHistory>;
  upsertVocabOccurrence: (params: {
    word: string;
    lessonSlug: string;
    lessonTitle?: string;
    paragraphIndex: number;
    senseSnapshot: VocabOccurrence['senseSnapshot'];
  }) => void;
  removeVocabOccurrence: (params: {
    word: string;
    lessonSlug: string;
    paragraphIndex: number;
  }) => void;
  removeWord: (word: string) => void;
  saveLessonScore: (slug: string, score: number, total: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      savedWords: {},
      history: {},
      upsertVocabOccurrence: ({
        word,
        lessonSlug,
        lessonTitle,
        paragraphIndex,
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
    }),
    {
      name: 'daily-english-user-storage',
    }
  )
);
