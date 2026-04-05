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

  // Fetch submission stats for all topics in one query
  const topicIds = topics.map((t) => t.id);
  const { data: submissions } = await supabaseAdmin
    .from('writing_submissions')
    .select('id, topic_id')
    .in('topic_id', topicIds);

  // Fetch grades for these submissions
  const submissionIds = (submissions ?? []).map((s) => s.id);
  const { data: grades } = await supabaseAdmin
    .from('writing_grades')
    .select('submission_id, overall_score')
    .in(
      'submission_id',
      submissionIds.length > 0 ? submissionIds : ['__none__']
    );

  // Build stats maps
  const submissionCountMap = new Map<string, number>();
  for (const s of submissions ?? []) {
    submissionCountMap.set(
      s.topic_id,
      (submissionCountMap.get(s.topic_id) ?? 0) + 1
    );
  }

  const submissionToTopic = new Map<string, string>();
  for (const s of submissions ?? []) {
    submissionToTopic.set(s.id, s.topic_id);
  }

  const topicScores = new Map<string, number[]>();
  for (const g of grades ?? []) {
    const topicId = submissionToTopic.get(g.submission_id);
    if (topicId) {
      const scores = topicScores.get(topicId) ?? [];
      scores.push(Number(g.overall_score));
      topicScores.set(topicId, scores);
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
