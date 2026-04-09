/**
 * @author SaltedFish-No1
 * @description 复习课程保存 API，将流式生成的复习课程持久化到数据库。
 *
 * POST /api/review/save
 * Body: { lesson: GeneratedLesson, words: string[], difficulty: string }
 * Response: { lessonId: string }
 *
 * Saves a streamed review lesson to the database and returns the persisted ID
 * so the client can redirect to /lessons/{lessonId}.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { saveReviewLesson } from '@/lib/lessons-db';
import { GeneratedLessonSchema } from '@/types/review';

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request);
  if ('error' in auth) return auth.error;

  let body: { lesson?: unknown; words?: string[]; difficulty?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = GeneratedLessonSchema.safeParse(body.lesson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid lesson data', details: parsed.error.message },
      { status: 400 }
    );
  }

  const words = body.words;
  if (!words || !Array.isArray(words) || words.length === 0) {
    return NextResponse.json(
      { error: 'Missing or empty words array' },
      { status: 400 }
    );
  }

  const difficulty = body.difficulty || 'B1';

  try {
    const lessonId = await saveReviewLesson(
      auth.user.id,
      parsed.data,
      words,
      difficulty
    );
    return NextResponse.json({ lessonId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
