/**
 * @description 提交写作答案（文字输入或手写图片 OCR）。
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-helper';
import { mapWritingSubmissionRow } from '@/types/writing';

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let topicId: string;
  let content: string;
  let timeSpentSeconds: number | null = null;
  let contentImageUrl: string | null = null;
  let inputMethod: 'typed' | 'handwritten' = 'typed';

  if (contentType.includes('multipart/form-data')) {
    // Handwritten image upload mode
    const formData = await request.formData();
    topicId = formData.get('topicId') as string;
    const imageFile = formData.get('image') as File | null;
    const timeStr = formData.get('timeSpentSeconds') as string | null;
    timeSpentSeconds = timeStr ? parseInt(timeStr, 10) : null;

    if (!topicId || !imageFile) {
      return NextResponse.json(
        { error: 'Missing topicId or image' },
        { status: 400 }
      );
    }

    // Upload answer image
    const arrayBuffer = await imageFile.arrayBuffer();
    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const fileName = `${user.id}/answers/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('writing-images')
      .upload(fileName, arrayBuffer, {
        contentType: imageFile.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Writing] Answer image upload error:', uploadError);
      return NextResponse.json(
        { error: 'Image upload failed' },
        { status: 502 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('writing-images').getPublicUrl(fileName);
    contentImageUrl = publicUrl;

    // OCR via vision model
    try {
      const imageBuffer = Buffer.from(arrayBuffer);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = imageFile.type || 'image/jpeg';

      const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
          extractedText: z
            .string()
            .describe(
              'The full handwritten English text extracted from the image, preserving paragraph breaks'
            ),
        }),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image: `data:${mimeType};base64,${base64Image}`,
              },
              {
                type: 'text',
                text: 'Extract all handwritten English text from this image. Preserve paragraph structure. Return the full text as-is without correcting any errors.',
              },
            ],
          },
        ],
      });
      content = object.extractedText;
    } catch (error) {
      console.error('[Writing] OCR error:', error);
      return NextResponse.json(
        { error: 'Failed to extract text from image' },
        { status: 502 }
      );
    }

    inputMethod = 'handwritten';
  } else {
    // Typed text mode
    let body: {
      topicId?: string;
      content?: string;
      timeSpentSeconds?: number;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    topicId = body.topicId ?? '';
    content = body.content ?? '';
    timeSpentSeconds = body.timeSpentSeconds ?? null;

    if (!topicId || !content.trim()) {
      return NextResponse.json(
        { error: 'Missing topicId or content' },
        { status: 400 }
      );
    }
  }

  // Verify topic belongs to user
  const { data: topic } = await supabaseAdmin
    .from('writing_topics')
    .select('id')
    .eq('id', topicId)
    .eq('user_id', user.id)
    .single();

  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  // Calculate attempt number
  const { count } = await supabaseAdmin
    .from('writing_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('topic_id', topicId)
    .eq('user_id', user.id);

  const attemptNumber = (count ?? 0) + 1;

  // Insert submission
  const { data: submission, error: insertError } = await supabaseAdmin
    .from('writing_submissions')
    .insert({
      topic_id: topicId,
      user_id: user.id,
      attempt_number: attemptNumber,
      content: content.trim(),
      content_image_url: contentImageUrl,
      word_count: countWords(content),
      time_spent_seconds: timeSpentSeconds,
      input_method: inputMethod,
    })
    .select()
    .single();

  if (insertError || !submission) {
    console.error('[Writing] Insert submission error:', insertError);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    submission: mapWritingSubmissionRow(submission),
  });
}
