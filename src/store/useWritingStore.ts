/**
 * @description 写作练习客户端状态：计时器与草稿持久化。
 *   已登录时自动同步草稿到 Supabase writing_drafts 表。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

function getAuthUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

/** 立即同步草稿到云端 */
function syncDraftToCloud() {
  const userId = getAuthUserId();
  if (!userId) return;
  const { currentTopicId, currentDraftText } = useWritingStore.getState();
  supabase
    .from('writing_drafts')
    .upsert(
      {
        user_id: userId,
        topic_id: currentTopicId,
        draft_text: currentDraftText,
        updated_at: Date.now(),
      },
      { onConflict: 'user_id' }
    )
    .then(({ error }) => {
      if (error) console.error('[CloudSync] writing_drafts upsert:', error);
    });
}

/** 防抖同步：setDraftText 每次击键触发，2 秒内合并为一次请求 */
let draftSyncTimer: ReturnType<typeof setTimeout> | null = null;
function syncDraftToCloudDebounced() {
  if (draftSyncTimer) clearTimeout(draftSyncTimer);
  draftSyncTimer = setTimeout(() => syncDraftToCloud(), 2000);
}

interface WritingState {
  // Timer (not persisted — ephemeral session state)
  timerSeconds: number;
  timerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  // Draft (persisted — survives page refresh)
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

      setCurrentTopic: (topicId) => {
        set({ currentTopicId: topicId });
        syncDraftToCloud();
      },
      setDraftText: (text) => {
        set({ currentDraftText: text });
        syncDraftToCloudDebounced();
      },
      clearDraft: () => {
        set({
          currentTopicId: null,
          currentDraftText: '',
          timerSeconds: 0,
          timerRunning: false,
        });
        syncDraftToCloud();
      },
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
