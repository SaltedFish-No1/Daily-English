/**
 * @author SaltedFish-No1
 * @description 手动创建写作题目（无需上传图片）。
 *   接收 JSON: { gradingCriteria: string, title?: string, writingPrompt: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-helper';
import { mapWritingTopicRow } from '@/types/writing';

export async function POST(request: NextRequest) {
  // 1. Auth
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse JSON body
  let body: {
    gradingCriteria?: string;
    title?: string | null;
    writingPrompt?: string;
    imageUrl?: string | null;
    wordLimit?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { gradingCriteria, title, writingPrompt } = body;

  if (!gradingCriteria) {
    return NextResponse.json(
      { error: 'Missing gradingCriteria' },
      { status: 400 }
    );
  }
  if (!writingPrompt || writingPrompt.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing writingPrompt' },
      { status: 400 }
    );
  }

  // 3. Insert into writing_topics
  const { data: topic, error: insertError } = await supabaseAdmin
    .from('writing_topics')
    .insert({
      user_id: user.id,
      title: title || null,
      writing_prompt: writingPrompt.trim(),
      grading_criteria: gradingCriteria,
      word_limit: body.wordLimit ?? null,
      image_url: body.imageUrl ?? null,
    })
    .select()
    .single();

  if (insertError || !topic) {
    console.error('[Writing] Insert topic error:', insertError);
    return NextResponse.json(
      { error: 'Failed to save topic' },
      { status: 500 }
    );
  }

  return NextResponse.json({ topic: mapWritingTopicRow(topic) });
}
