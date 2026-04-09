/**
 * @author SaltedFish-No1
 * @description 用户复习课程列表 API。
 *
 * GET /api/review/lessons?page=1&limit=20
 * Response: { lessons: LessonListItem[], total: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { getUserReviewLessons } from '@/lib/lessons-db';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request);
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number(searchParams.get('limit')) || 20)
  );

  try {
    const result = await getUserReviewLessons(auth.user.id, { page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[ReviewLessons] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review lessons' },
      { status: 500 }
    );
  }
}
