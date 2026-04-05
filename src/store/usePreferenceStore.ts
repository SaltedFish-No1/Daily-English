/**
 * @description 用户偏好持久化状态：头像、昵称、学习设置等。
 *   已登录时自动同步到 Supabase user_preferences 表。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type ExamGoal = 'ielts' | 'toefl' | 'cet4' | 'cet6' | 'general';
export type LearningLang = 'en';
export type DifficultyPref = 'auto' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

function getAuthUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

/** fire-and-forget 将偏好部分字段同步到云端 */
function syncPreferenceToCloud(partial: Record<string, unknown>) {
  const userId = getAuthUserId();
  if (!userId) return;
  supabase
    .from('user_preferences')
    .upsert(
      { user_id: userId, ...partial, updated_at: Date.now() },
      { onConflict: 'user_id' }
    )
    .then(({ error }) => {
      if (error) console.error('[CloudSync] user_preferences upsert:', error);
    });
}

interface PreferenceState {
  /** base64 data URL of user avatar image, or empty string for default */
  avatarUrl: string;
  nickname: string;
  examGoal: ExamGoal;
  learningLang: LearningLang;
  dailyGoal: number;
  difficultyPref: DifficultyPref;
  setAvatarUrl: (url: string) => void;
  setNickname: (nickname: string) => void;
  setExamGoal: (goal: ExamGoal) => void;
  setLearningLang: (lang: LearningLang) => void;
  setDailyGoal: (goal: number) => void;
  setDifficultyPref: (pref: DifficultyPref) => void;
  /** 重置所有偏好到默认值（登出时清理 localStorage） */
  resetStore: () => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      avatarUrl: '',
      nickname: '薄荷学员',
      examGoal: 'ielts',
      learningLang: 'en',
      dailyGoal: 1,
      difficultyPref: 'auto',
      setAvatarUrl: (avatarUrl) => {
        set({ avatarUrl });
        syncPreferenceToCloud({ avatar_url: avatarUrl });
      },
      setNickname: (nickname) => {
        set({ nickname });
        syncPreferenceToCloud({ nickname });
      },
      setExamGoal: (examGoal) => {
        set({ examGoal });
        syncPreferenceToCloud({ exam_goal: examGoal });
      },
      setLearningLang: (learningLang) => {
        set({ learningLang });
        syncPreferenceToCloud({ learning_lang: learningLang });
      },
      setDailyGoal: (dailyGoal) => {
        set({ dailyGoal });
        syncPreferenceToCloud({ daily_goal: dailyGoal });
      },
      setDifficultyPref: (difficultyPref) => {
        set({ difficultyPref });
        syncPreferenceToCloud({ difficulty_pref: difficultyPref });
      },
      resetStore: () =>
        set({
          avatarUrl: '',
          nickname: '薄荷学员',
          examGoal: 'ielts',
          learningLang: 'en',
          dailyGoal: 1,
          difficultyPref: 'auto',
        }),
    }),
    {
      name: 'daily-english-preferences',
    }
  )
);
