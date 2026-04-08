/**
 * @author SaltedFish-No1
 * @description AI 批改写作：根据评分标准生成结构化批改报告（流式输出）。
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { supabaseAdmin } from '@/lib/supabase-server';
import { modelPower } from '@/lib/ai';
import { getAuthUser } from '@/lib/auth-helper';
import {
  WritingGradeSchema,
  mapWritingGradeRow,
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

  // 2. Check for existing grade
  const { data: existingGrade } = await supabaseAdmin
    .from('writing_grades')
    .select('*')
    .eq('submission_id', submissionId)
    .single();

  if (existingGrade) {
    return NextResponse.json({ grade: mapWritingGradeRow(existingGrade) });
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
      // 7. Insert grade into DB after stream completes
      const { error: insertError } = await supabaseAdmin
        .from('writing_grades')
        .insert({
          submission_id: submissionId,
          user_id: user.id,
          overall_score: gradeResult.overallScore,
          dimension_scores: gradeResult.dimensionScores,
          grammar_errors: gradeResult.grammarErrors,
          vocabulary_suggestions: gradeResult.vocabularySuggestions,
          overall_comment: gradeResult.overallComment,
          model_answer: gradeResult.modelAnswer,
          strengths: gradeResult.strengths,
          improvements: gradeResult.improvements,
        });
      if (insertError) {
        console.error('[Writing] Insert grade error:', insertError);
      }
    },
  });

  return result.toTextStreamResponse();
}
