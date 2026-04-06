/**
 * @description 获取当前用户的写作题目列表，附带提交次数和最近分数。
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-helper';
import { mapWritingTopicRow, WritingTopicWithStats } from '@/types/writing';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch topics
  const { data: topics, error } = await supabaseAdmin
    .from('writing_topics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Writing] topics query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }

  if (!topics || topics.length === 0) {
    return NextResponse.json({ topics: [] });
  }

  // Fetch submission stats — overall_score is now a direct column on writing_submissions
  const topicIds = topics.map((t) => t.id);
  const { data: submissions } = await supabaseAdmin
    .from('writing_submissions')
    .select('id, topic_id, overall_score, created_at')
    .in('topic_id', topicIds)
    .order('created_at', { ascending: true });

  // Build stats maps
  const submissionCountMap = new Map<string, number>();
  const topicScores = new Map<string, number[]>();

  for (const s of submissions ?? []) {
    submissionCountMap.set(
      s.topic_id,
      (submissionCountMap.get(s.topic_id) ?? 0) + 1
    );
    if (s.overall_score != null) {
      const scores = topicScores.get(s.topic_id) ?? [];
      scores.push(Number(s.overall_score));
      topicScores.set(s.topic_id, scores);
    }
  }

  const result: WritingTopicWithStats[] = topics.map((row) => {
    const base = mapWritingTopicRow(row);
    const scores = topicScores.get(row.id) ?? [];
    return {
      ...base,
      submissionCount: submissionCountMap.get(row.id) ?? 0,
      bestScore: scores.length > 0 ? Math.max(...scores) : null,
      latestScore: scores.length > 0 ? scores[scores.length - 1] : null,
    };
  });

  return NextResponse.json({ topics: result });
}
