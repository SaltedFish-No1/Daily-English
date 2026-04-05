/**
 * @description 获取用户指定复习课程详情。
 *
 * GET /api/review/lessons/:id
 * Response: LessonData JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { getReviewLessonById } from '@/lib/lessons-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const lesson = await getReviewLessonById(id, auth.user.id);
    if (!lesson) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(lesson);
  } catch (error) {
    console.error('[ReviewLessonDetail] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review lesson' },
      { status: 500 }
    );
  }
}
