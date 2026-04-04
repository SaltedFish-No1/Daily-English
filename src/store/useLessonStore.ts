import { create } from 'zustand';

export interface SelectedWordContext {
  surface: string;
  query: string;
  isFocusWord: boolean;
  lessonSlug: string;
  lessonTitle: string;
  paragraphIndex: number;
}

interface LessonState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedWordContext: SelectedWordContext | null;
  setSelectedWordContext: (context: SelectedWordContext | null) => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  activeTab: 'article',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedWordContext: null,
  setSelectedWordContext: (context) => set({ selectedWordContext: context }),
}));
