/**
 * @description 复习文章生成 API — 根据用户待复习词汇，AI 实时生成个性化阅读文章 + Quiz。
 *
 * POST /api/review/generate
 * Body: { words: string[], difficulty?: string }
 * Response: LessonData JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { modelPower } from '@/lib/ai';

// ---------------------------------------------------------------------------
// Zod schema for the AI-generated lesson
// ---------------------------------------------------------------------------

const ParagraphSchema = z.object({
  id: z.string(),
  en: z.string(),
  zh: z.string(),
});

const FocusWordSchema = z.object({
  key: z.string(),
  forms: z.array(z.string()),
});

const CompletionBlankSchema = z.object({
  id: z.string(),
  acceptedAnswers: z.array(z.string()),
  wordLimit: z.number().nullable(),
});

const CompletionQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('completion'),
  subtype: z.enum(['summary', 'sentence']),
  prompt: z.string(),
  instruction: z.string(),
  contentTemplate: z.string(),
  blanks: z.array(CompletionBlankSchema),
  rationale: z.object({ en: z.string(), zh: z.string() }).nullable(),
});

const MultipleChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

const MultipleChoiceQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('multiple_choice'),
  selectionMode: z.enum(['single', 'multiple']),
  prompt: z.string(),
  options: z.array(MultipleChoiceOptionSchema),
  correctOptionIds: z.array(z.string()),
  rationale: z.object({ en: z.string(), zh: z.string() }).nullable(),
});

const TFNGQuestionSchema = z.object({
  id: z.string(),
  type: z.literal('tfng'),
  mode: z.enum(['TFNG', 'YNNG']),
  prompt: z.string(),
  statement: z.string(),
  answer: z.enum(['TRUE', 'FALSE', 'NOT_GIVEN']),
  rationale: z.object({ en: z.string(), zh: z.string() }).nullable(),
});

const QuizQuestionSchema = z.discriminatedUnion('type', [
  CompletionQuestionSchema,
  MultipleChoiceQuestionSchema,
  TFNGQuestionSchema,
]);

const GeneratedLessonSchema = z.object({
  title: z.string(),
  category: z.string(),
  teaser: z.string(),
  paragraphs: z.array(ParagraphSchema),
  focusWords: z.array(FocusWordSchema),
  quizQuestions: z.array(QuizQuestionSchema),
});

// ---------------------------------------------------------------------------
// Topics pool — rotated to keep content varied
// ---------------------------------------------------------------------------

const TOPIC_POOL = [
  'technology and innovation',
  'nature and the environment',
  'culture and society',
  'health and wellness',
  'travel and geography',
  'science and discovery',
  'art and creativity',
  'food and cooking',
  'sports and fitness',
  'history and tradition',
  'education and learning',
  'business and economics',
];

function pickTopic(): string {
  return TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: { words?: string[]; difficulty?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const words = body.words;
  if (!words || !Array.isArray(words) || words.length === 0) {
    return NextResponse.json(
      { error: 'Missing or empty words array' },
      { status: 400 }
    );
  }

  const difficulty = body.difficulty || 'B1';
  const topic = pickTopic();
  const wordList = words.slice(0, 15).join(', ');

  try {
    const { object } = await generateObject({
      model: modelPower,
      schema: GeneratedLessonSchema,
      prompt: `You are a professional English language education content creator.

Generate a complete English reading lesson that naturally incorporates ALL of the following vocabulary words: ${wordList}

REQUIREMENTS:
1. TOPIC: Write about "${topic}" — make it interesting and engaging.
2. DIFFICULTY: The article should be at CEFR ${difficulty} level.
3. ARTICLE: Write 3-5 paragraphs (each 60-120 words). Each word from the list must appear naturally at least once. Do NOT force words unnaturally.
4. PARAGRAPHS: Each paragraph needs an id (p1, p2, ...), English text (en), and Chinese translation (zh). The Chinese translation should be natural and accurate.
5. FOCUS WORDS: List each target vocabulary word with its key and common forms (e.g., key: "sustain", forms: ["sustain", "sustained", "sustaining", "sustainability"]).
6. QUIZ: Generate 5-8 quiz questions that test comprehension AND vocabulary knowledge. Use a mix of these types:
   - "completion" (subtype: "summary" or "sentence"): Fill-in-the-blank using target words. Use "___BLANK_1___", "___BLANK_2___" etc as placeholders in contentTemplate.
   - "multiple_choice" (selectionMode: "single"): 4 options, test word meaning in context.
   - "tfng" (mode: "TFNG"): True/False/Not Given statements about the article.
   At least 3 questions should directly test the target vocabulary words.
7. Each quiz question must have a rationale with both English (en) and Chinese (zh) explanations.
8. The article title should be catchy and relevant.
9. Category should be a short topic label (e.g., "Technology", "Nature").
10. Teaser should be 1-2 sentences summarizing the article's appeal.

Return valid JSON matching the schema exactly.`,
      temperature: 0.8,
    });

    // Assemble into LessonData format
    const lessonId = `review-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    const lessonData = {
      schemaVersion: '2.2' as const,
      meta: {
        id: lessonId,
        title: object.title,
        date: today,
        category: object.category,
        teaser: object.teaser,
        published: false,
        featured: false,
        tag: 'Review',
        difficulty,
        isReview: true,
        reviewWords: words,
      },
      speech: { enabled: true },
      article: {
        title: object.title,
        paragraphs: object.paragraphs,
      },
      focusWords: object.focusWords,
      quiz: {
        title: 'Vocabulary & Comprehension Check',
        questions: object.quizQuestions,
      },
    };

    return NextResponse.json(lessonData);
  } catch (error) {
    console.error('[ReviewGenerate] AI generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate review article. Please try again.' },
      { status: 500 }
    );
  }
}
