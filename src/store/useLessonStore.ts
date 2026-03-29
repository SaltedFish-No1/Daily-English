import { create } from 'zustand';

interface LessonState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedWord: string | null;
  setSelectedWord: (word: string | null) => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  activeTab: 'article',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedWord: null,
  setSelectedWord: (word) => set({ selectedWord: word }),
}));
