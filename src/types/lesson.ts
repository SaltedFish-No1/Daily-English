export type LessonSchemaVersion = '2.1';

export interface LessonMeta {
  title: string;
}

export interface LessonSpeech {
  enabled: boolean;
}

export interface FocusWord {
  key: string;
  forms: string[];
}

export interface Paragraph {
  id: string;
  en: string;
  zh: string;
}

export interface LessonArticle {
  title: string;
  paragraphs: Paragraph[];
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
  type: 'line' | 'bar';
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
  questions: unknown[];
}

export interface LessonData {
  schemaVersion: LessonSchemaVersion;
  meta: LessonMeta;
  speech: LessonSpeech;
  article: LessonArticle;
  focusWords: FocusWord[];
  chart: LessonChart;
  quiz: LessonQuiz;
}

export type LessonDifficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LessonListItem {
  date: string;
  path: string;
  title: string;
  category: string;
  teaser: string;
  published: boolean;
  featured: boolean;
  tag: string;
  difficulty: LessonDifficulty;
}

export interface LessonsList {
  lessons: LessonListItem[];
}
