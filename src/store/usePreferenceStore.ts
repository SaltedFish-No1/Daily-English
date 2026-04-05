/**
 * @description 用户偏好持久化状态：头像、昵称、学习设置等。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExamGoal = 'ielts' | 'toefl' | 'cet4' | 'cet6' | 'general';
export type LearningLang = 'en';
export type DifficultyPref = 'auto' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

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
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      setNickname: (nickname) => set({ nickname }),
      setExamGoal: (examGoal) => set({ examGoal }),
      setLearningLang: (learningLang) => set({ learningLang }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setDifficultyPref: (difficultyPref) => set({ difficultyPref }),
    }),
    {
      name: 'daily-english-preferences',
    }
  )
);
