/**
 * @author SaltedFish-No1
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
  /** 计时器累计秒数（非持久化，刷新页面归零） */
  timerSeconds: number;
  /** 计时器是否正在运行 */
  isTimerRunning: boolean;
  /** 开始计时 */
  startTimer: () => void;
  /** 暂停计时 */
  stopTimer: () => void;
  /** 重置计时器为 0 并停止 */
  resetTimer: () => void;
  /** 计时器每秒 tick，仅在运行状态下累加 */
  tickTimer: () => void;

  // Draft (persisted — survives page refresh)
  /** 当前正在编辑的题目 ID，null 表示未选择题目 */
  currentTopicId: string | null;
  /** 当前草稿文本内容 */
  currentDraftText: string;
  /** 设置当前题目，同时同步草稿到云端 */
  setCurrentTopic: (topicId: string | null) => void;
  /** 更新草稿文本，防抖 2 秒后同步到云端 */
  setDraftText: (text: string) => void;
  /** 清空草稿和计时器，同步到云端 */
  clearDraft: () => void;
  /** 重置所有写作状态（登出时清理 localStorage） */
  resetStore: () => void;
}

export const useWritingStore = create<WritingState>()(
  persist(
    (set) => ({
      timerSeconds: 0,
      isTimerRunning: false,
      currentTopicId: null,
      currentDraftText: '',

      startTimer: () => set({ isTimerRunning: true }),
      stopTimer: () => set({ isTimerRunning: false }),
      resetTimer: () => set({ timerSeconds: 0, isTimerRunning: false }),
      tickTimer: () =>
        set((state) =>
          state.isTimerRunning
            ? { timerSeconds: state.timerSeconds + 1 }
            : state
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
          isTimerRunning: false,
        });
        syncDraftToCloud();
      },
      resetStore: () =>
        set({
          currentTopicId: null,
          currentDraftText: '',
          timerSeconds: 0,
          isTimerRunning: false,
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
