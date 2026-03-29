export interface LessonMeta {
  title: string;
  subtitle: string;
  pageTitle: string;
  date: string;
  slug: string;
  category: string;
  summary: string;
}

export interface LessonUI {
  desktopArticleTabLabel: string;
  desktopDataTabLabel: string;
  desktopQuizTabLabel: string;
  mobileArticleTabLabel: string;
  mobileDataTabLabel: string;
  mobileQuizTabLabel: string;
  vocabPlaceholderText: string;
  translationLabel: string;
  listenTitle?: string;
}

export interface LessonSpeech {
  enabled: boolean;
  lang: string;
  rate: number;
}

export interface Paragraph {
  en: string;
  zh: string;
}

export interface LessonArticle {
  title: string;
  paragraphs: Paragraph[];
}

export interface VocabEntry {
  pos: string;
  def: string;
  trans: string;
  speakText?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor?: string;
}

export interface ChartInsight {
  icon: string;
  title: string;
  text: string;
}

export interface LessonChart {
  title: string;
  description: string;
  labels: string[];
  datasets: ChartDataset[];
  insights: ChartInsight[];
}

export interface QuizRationale {
  en: string;
  zh: string;
}

export interface QuizOption {
  text: string;
  correct: boolean;
  rationale: QuizRationale;
}

export interface QuizQuestion {
  q: string;
  options: QuizOption[];
}

export interface LessonQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface LessonData {
  meta: LessonMeta;
  ui: LessonUI;
  speech: LessonSpeech;
  article: LessonArticle;
  vocab: Record<string, VocabEntry>;
  chart: LessonChart;
  quiz: LessonQuiz;
}

export interface LessonListItem {
  date: string;
  path: string;
  title: string;
  category: string;
  summary: string;
  published: boolean;
  featured: boolean;
  tag: string;
}

export interface LessonsList {
  lessons: LessonListItem[];
}
