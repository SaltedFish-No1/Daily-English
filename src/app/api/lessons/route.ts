/**
 * @author SaltedFish-No1
 * @description 课程列表 API，支持分页、难度、标签等筛选条件。
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLessons } from '@/lib/lessons-db';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.get('limit')) || 50));
  const difficulty = params.get('difficulty') ?? undefined;
  const tag = params.get('tag') ?? undefined;
  const featured =
    params.get('featured') === 'true'
      ? true
      : params.get('featured') === 'false'
        ? false
        : undefined;

  try {
    const result = await getLessons({ page, limit, difficulty, tag, featured });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[Lessons] Failed to fetch lessons:', err);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}
