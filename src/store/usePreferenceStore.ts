/**
 * @author SaltedFish-No1
 * @description 用户偏好持久化状态：头像、昵称、学习设置等。
 *   通过 localStorage 持久化，已登录时自动同步到 Supabase user_preferences 表。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

/** @description 用户备考目标类型 */
export type ExamGoal = 'ielts' | 'toefl' | 'cet4' | 'cet6' | 'general';
/** @description 学习语言类型，当前仅支持英语 */
export type LearningLang = 'en';
/** @description 学习难度偏好，'auto' 表示由系统根据表现自动调整，其余为 CEFR 等级 */
export type DifficultyPref = 'auto' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/** @description 获取当前登录用户 ID，未登录返回 null */
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

/**
 * @description 用户偏好状态接口：个人信息与学习配置项。
 */
interface PreferenceState {
  /** 用户头像 base64 data URL，空字符串表示使用默认头像 */
  avatarUrl: string;
  /** 用户昵称，默认 '薄荷学员' */
  nickname: string;
  /** 备考目标，默认 'ielts' */
  examGoal: ExamGoal;
  /** 学习语言，默认 'en' */
  learningLang: LearningLang;
  /** 每日学习课数目标，默认 1 */
  dailyGoal: number;
  /** 学习难度偏好，默认 'auto'（系统自动调整） */
  difficultyPref: DifficultyPref;
  /** 更新头像并同步到云端 */
  setAvatarUrl: (url: string) => void;
  /** 更新昵称并同步到云端 */
  setNickname: (nickname: string) => void;
  /** 更新备考目标并同步到云端 */
  setExamGoal: (goal: ExamGoal) => void;
  /** 更新学习语言并同步到云端 */
  setLearningLang: (lang: LearningLang) => void;
  /** 更新每日学习目标并同步到云端 */
  setDailyGoal: (goal: number) => void;
  /** 更新难度偏好并同步到云端 */
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
