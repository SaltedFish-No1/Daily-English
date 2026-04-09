/**
 * @author SaltedFish-No1
 * @description 课程详情 API，根据课程 ID 返回完整课程数据。
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLessonById } from '@/lib/lessons-db';
import { requireApiAuth } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    return NextResponse.json(
      { error: 'Invalid lesson id format' },
      { status: 400 }
    );
  }

  try {
    // Try to extract userId from auth (optional — unauthenticated users only
    // see published lessons).
    const auth = await requireApiAuth(req);
    const userId = 'user' in auth ? auth.user.id : undefined;

    const lesson = await getLessonById(id, userId);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json(lesson);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
