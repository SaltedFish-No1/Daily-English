/**
 * @description AI 批改写作：根据评分标准生成结构化批改报告（流式输出）。
 *   批改结果写入 writing_submissions.grade JSONB 列。
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { supabaseAdmin } from '@/lib/supabase-server';
import { modelPower } from '@/lib/ai';
import { getAuthUser } from '@/lib/auth-helper';
import {
  WritingGradeSchema,
  type WritingGradeData,
  GradingCriteriaDimension,
} from '@/types/writing';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { submissionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { submissionId } = body;
  if (!submissionId) {
    return NextResponse.json(
      { error: 'Missing submissionId' },
      { status: 400 }
    );
  }

  // 1. Fetch submission
  const { data: submission } = await supabaseAdmin
    .from('writing_submissions')
    .select('*')
    .eq('id', submissionId)
    .eq('user_id', user.id)
    .single();

  if (!submission) {
    return NextResponse.json(
      { error: 'Submission not found' },
      { status: 404 }
    );
  }

  // 2. Check for existing grade (inline in submission row)
  if (submission.grade) {
    const gradeData = submission.grade as WritingGradeData;
    return NextResponse.json({ grade: gradeData });
  }

  // 3. Fetch topic
  const { data: topic } = await supabaseAdmin
    .from('writing_topics')
    .select('*')
    .eq('id', submission.topic_id)
    .single();

  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  // 4. Fetch grading criteria
  const { data: criteria } = await supabaseAdmin
    .from('grading_criteria')
    .select('*')
    .eq('id', topic.grading_criteria)
    .single();

  if (!criteria) {
    return NextResponse.json(
      { error: 'Grading criteria not found' },
      { status: 404 }
    );
  }

  const dimensions = criteria.dimensions as GradingCriteriaDimension[];
  const dimensionDesc = dimensions
    .map(
      (d, i) =>
        `${i + 1}. **${d.label}** (key: "${d.key}", max ${d.maxScore}): ${d.description}`
    )
    .join('\n');

  // 5. Build AI prompt
  const systemPrompt = criteria.grading_prompt as string;
  const userPrompt = `## Writing Prompt
${topic.writing_prompt}

## Word Limit
${topic.word_limit ? `${topic.word_limit} words` : 'Not specified'}

## Student's Answer (${submission.word_count} words)
---
${submission.content}
---

## Grading Dimensions
${dimensionDesc}

Please grade this writing according to the criteria above. For dimensionScores, use these exact keys: ${dimensions.map((d) => `"${d.key}"`).join(', ')}.

Provide your overall comment, strengths, and improvements in Chinese (中文). Grammar errors, vocabulary suggestions, and model answer should be in English.`;

  // 6. Stream AI grading — client receives partial results progressively
  const result = streamObject({
    model: modelPower,
    schema: WritingGradeSchema,
    maxOutputTokens: 16384,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    onFinish: async ({ object: gradeResult, error }) => {
      if (error) {
        console.error('[Writing] streamObject finished with error:', error);
      }
      if (!gradeResult) {
        console.error('[Writing] streamObject produced no valid object');
        return;
      }
      // 7. Update submission with grade JSONB
      const gradeData: WritingGradeData = {
        overallScore: gradeResult.overallScore,
        dimensionScores: gradeResult.dimensionScores,
        grammarErrors: gradeResult.grammarErrors,
        vocabularySuggestions: gradeResult.vocabularySuggestions,
        overallComment: gradeResult.overallComment,
        modelAnswer: gradeResult.modelAnswer,
        strengths: gradeResult.strengths,
        improvements: gradeResult.improvements,
        gradedAt: new Date().toISOString(),
      };

      const { error: updateError } = await supabaseAdmin
        .from('writing_submissions')
        .update({
          grade: gradeData,
          overall_score: gradeResult.overallScore,
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('[Writing] Update grade error:', updateError);
      }
    },
  });

  return result.toTextStreamResponse();
}
