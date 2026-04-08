/**
 * @author SaltedFish-No1
 * @description 课程页面会话状态：当前标签页与选中单词上下文。
 *   不做持久化——仅在页面会话期间有效。
 */

import { create } from 'zustand';

/**
 * @description 用户在课文中点击单词时的上下文信息，用于驱动词典面板查询。
 */
export interface SelectedWordContext {
  /** 用户点击的原始词形（如 "running"） */
  surface: string;
  /** 词典查询关键词（通常为词根形式，如 "run"） */
  query: string;
  /** 是否为本课重点词汇 */
  isFocusWord: boolean;
  /** 所属课程 slug */
  lessonSlug: string;
  /** 所属课程标题 */
  lessonTitle: string;
  /** 所在段落索引（从 0 开始） */
  paragraphIndex: number;
}

/**
 * @description 课程页面会话状态接口：管理标签页切换与选中单词上下文。
 */
interface LessonState {
  /** 当前激活的标签页标识，默认 'article' */
  activeTab: string;
  /** 切换当前标签页 */
  setActiveTab: (tab: string) => void;
  /** 当前选中的单词上下文，null 表示未选中任何单词 */
  selectedWordContext: SelectedWordContext | null;
  /** 设置选中单词上下文，传 null 清除选中状态 */
  setSelectedWordContext: (context: SelectedWordContext | null) => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  activeTab: 'article',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedWordContext: null,
  setSelectedWordContext: (context) => set({ selectedWordContext: context }),
}));
