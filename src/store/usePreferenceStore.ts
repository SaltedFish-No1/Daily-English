/**
 * @author SaltedFish-No1
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
  /** 用户昵称，默认 '薄荷学员' */
  nickname: string;
  /** 备考目标，默认 'ielts' */
  examGoal: ExamGoal;
  /** 学习语言，当前仅支持 'en' */
  learningLang: LearningLang;
  /** 每日学习课程数目标，默认 1 */
  dailyGoal: number;
  /** 难度偏好，'auto' 表示由系统根据表现自动调整 */
  difficultyPref: DifficultyPref;
  /** 更新头像 URL，同步到云端 */
  setAvatarUrl: (url: string) => void;
  /** 更新昵称，同步到云端 */
  setNickname: (nickname: string) => void;
  /** 更新备考目标，同步到云端 */
  setExamGoal: (goal: ExamGoal) => void;
  /** 更新学习语言，同步到云端 */
  setLearningLang: (lang: LearningLang) => void;
  /** 更新每日学习目标，同步到云端 */
  setDailyGoal: (goal: number) => void;
  /** 更新难度偏好，同步到云端 */
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
