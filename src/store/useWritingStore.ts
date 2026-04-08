/**
 * @author SaltedFish-No1
 * @description 写作练习客户端状态：计时器与草稿持久化。
 *   通过 localStorage 持久化草稿（partialize 仅持久化 currentTopicId 和 currentDraftText），
 *   已登录时自动同步草稿到 Supabase writing_drafts 表。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

/** @description 获取当前登录用户 ID，未登录返回 null */
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
/** 防抖计时器句柄，用于合并连续击键产生的同步请求 */
let draftSyncTimer: ReturnType<typeof setTimeout> | null = null;
function syncDraftToCloudDebounced() {
  if (draftSyncTimer) clearTimeout(draftSyncTimer);
  draftSyncTimer = setTimeout(() => syncDraftToCloud(), 2000);
}

/**
 * @description 写作练习状态接口：包含计时器（会话级）和草稿（持久化）两部分。
 */
interface WritingState {
  /* ────── 计时器（不持久化，会话级状态） ────── */

  /** 已计时秒数，默认 0 */
  timerSeconds: number;
  /** 计时器是否正在运行，默认 false */
  timerRunning: boolean;
  /** 开始计时 */
  startTimer: () => void;
  /** 暂停计时 */
  stopTimer: () => void;
  /** 重置计时器（归零并停止） */
  resetTimer: () => void;
  /** 计时器每秒 tick，仅在 timerRunning 为 true 时递增 */
  tickTimer: () => void;

  /* ────── 草稿（持久化，支持云端同步） ────── */

  /** 当前写作话题 ID，null 表示未选择话题 */
  currentTopicId: string | null;
  /** 当前草稿文本内容，默认空字符串 */
  currentDraftText: string;
  /** 设置当前话题并立即同步云端 */
  setCurrentTopic: (topicId: string | null) => void;
  /** 更新草稿文本，防抖 2 秒后同步云端 */
  setDraftText: (text: string) => void;
  /** 清空草稿与计时器并立即同步云端 */
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
