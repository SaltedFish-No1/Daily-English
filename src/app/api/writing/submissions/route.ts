/**
 * @description 获取指定题目下的提交记录（含内联批改结果）。
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-helper';
import {
  mapWritingSubmissionRow,
  type WritingSubmission,
} from '@/types/writing';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topicId = request.nextUrl.searchParams.get('topicId');
  if (!topicId) {
    return NextResponse.json(
      { error: 'Missing topicId parameter' },
      { status: 400 }
    );
  }

  // Fetch submissions (grade is now an inline JSONB column)
  const { data: submissionRows, error: subError } = await supabaseAdmin
    .from('writing_submissions')
    .select('*')
    .eq('topic_id', topicId)
    .eq('user_id', user.id)
    .order('attempt_number', { ascending: true });

  if (subError) {
    console.error('[Writing] submissions query error:', subError);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }

  const submissions: WritingSubmission[] = (submissionRows ?? []).map(
    mapWritingSubmissionRow
  );

  return NextResponse.json({ submissions });
}
