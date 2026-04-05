/**
 * @description 复习文章生成 API — 根据用户待复习词汇，AI 实时生成个性化阅读文章 + Quiz。
 *
 * POST /api/review/generate
 * Body: { words: string[], difficulty?: string }
 * Response: LessonData JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { modelPower } from '@/lib/ai';
import { requireApiAuth } from '@/lib/api-auth';
import { GeneratedLessonSchema } from '@/types/review';

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
  const auth = await requireApiAuth(request);
  if ('error' in auth) return auth.error;

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
    const result = streamObject({
      model: modelPower,
      schema: GeneratedLessonSchema,
      maxOutputTokens: 65536,
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
      onFinish: ({ object, error }) => {
        if (error) {
          console.error(
            '[ReviewGenerate] streamObject finished with error:',
            error
          );
        }
        if (!object) {
          console.error(
            '[ReviewGenerate] streamObject produced no valid object'
          );
        }
      },
    });

    // Wrap the text stream: pass through normal data, but if the stream
    // ends empty (AI error swallowed), append the error from result.object.
    const textStream = result.textStream;
    const objectPromise = result.object;

    const encoder = new TextEncoder();
    let hasData = false;

    const wrappedStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            hasData = true;
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (streamErr) {
          console.error(
            '[ReviewGenerate] textStream iteration error:',
            streamErr
          );
        }

        // If no data came through, the AI call likely failed.
        // Await the object promise to get the real error and surface it.
        if (!hasData) {
          try {
            await objectPromise;
          } catch (objErr) {
            const errMsg = `__SERVER_ERROR__${String(objErr)}`;
            console.error('[ReviewGenerate] object promise rejected:', objErr);
            controller.enqueue(encoder.encode(errMsg));
          }
        }

        controller.close();
      },
    });

    return new Response(wrappedStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('[ReviewGenerate] AI generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate review article. Please try again.' },
      { status: 500 }
    );
  }
}
