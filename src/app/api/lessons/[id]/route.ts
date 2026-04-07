import { NextRequest, NextResponse } from 'next/server';
import { getLessonById } from '@/lib/lessons-db';

export async function GET(
  _req: NextRequest,
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
    console.log('[API /lessons/[id]] fetching lesson, id:', id);
    const lesson = await getLessonById(id);
    if (!lesson) {
      console.log('[API /lessons/[id]] lesson not found');
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    console.log('[API /lessons/[id]] lesson found, title:', lesson.meta?.title);
    return NextResponse.json(lesson);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API /lessons/[id]] error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
