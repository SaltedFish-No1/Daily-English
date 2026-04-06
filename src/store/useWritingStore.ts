/**
 * @description 写作练习客户端状态：计时器与草稿持久化。
 *   草稿仅保存在 localStorage 中（不再云端同步到 writing_drafts 表）。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WritingState {
  // Timer (not persisted — ephemeral session state)
  timerSeconds: number;
  timerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  // Draft (persisted — survives page refresh via localStorage)
  currentTopicId: string | null;
  currentDraftText: string;
  setCurrentTopic: (topicId: string | null) => void;
  setDraftText: (text: string) => void;
  clearDraft: () => void;
  /** 重置所有写作状态（登出时清理 localStorage） */
  resetStore: () => void;
}

export const useWritingStore = create<WritingState>()(
  persist(
    (set) => ({
      timerSeconds: 0,
      timerRunning: false,
      currentTopicId: null,
      currentDraftText: '',

      startTimer: () => set({ timerRunning: true }),
      stopTimer: () => set({ timerRunning: false }),
      resetTimer: () => set({ timerSeconds: 0, timerRunning: false }),
      tickTimer: () =>
        set((state) =>
          state.timerRunning ? { timerSeconds: state.timerSeconds + 1 } : state
        ),

      setCurrentTopic: (topicId) => set({ currentTopicId: topicId }),
      setDraftText: (text) => set({ currentDraftText: text }),
      clearDraft: () =>
        set({
          currentTopicId: null,
          currentDraftText: '',
          timerSeconds: 0,
          timerRunning: false,
        }),
      resetStore: () =>
        set({
          currentTopicId: null,
          currentDraftText: '',
          timerSeconds: 0,
          timerRunning: false,
        }),
    }),
    {
      name: 'daily-english-writing-storage',
      partialize: (state) => ({
        currentTopicId: state.currentTopicId,
        currentDraftText: state.currentDraftText,
      }),
    }
  )
);
