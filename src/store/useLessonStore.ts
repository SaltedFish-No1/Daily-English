/**
 * @author SaltedFish-No1
 * @description 课程页面会话状态：当前标签页与选中单词上下文。
 */

import { create } from 'zustand';

export interface SelectedWordContext {
  /** 用户点击的原始词形（正文中的显示形式） */
  surface: string;
  /** 归一化后的查词关键字（小写、去标点） */
  query: string;
  /** 该词是否为课程重点词 */
  isFocusWord: boolean;
  /** 所属课程的 slug/ID */
  lessonSlug: string;
  /** 所属课程标题 */
  lessonTitle: string;
  /** 该词所在段落的索引（从 0 开始） */
  paragraphIndex: number;
}

interface LessonState {
  /** 当前激活的标签页标识，默认 'article' */
  activeTab: string;
  /** 切换当前标签页 */
  setActiveTab: (tab: string) => void;
  /** 当前选中的单词上下文，null 表示未选中任何词 */
  selectedWordContext: SelectedWordContext | null;
  /** 设置或清除选中的单词上下文（传 null 清除） */
  setSelectedWordContext: (context: SelectedWordContext | null) => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  activeTab: 'article',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedWordContext: null,
  setSelectedWordContext: (context) => set({ selectedWordContext: context }),
}));
