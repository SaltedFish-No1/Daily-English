/**
 * @description 上传写作题目图片 → 视觉模型提取题目 → 存入数据库。
 *   接收 FormData: image (File), gradingCriteria (string)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-helper';
import { TopicExtractionSchema, mapWritingTopicRow } from '@/types/writing';

export async function POST(request: NextRequest) {
  // 1. Auth
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const imageFile = formData.get('image') as File | null;
  const gradingCriteria = formData.get('gradingCriteria') as string | null;

  if (!imageFile) {
    return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
  }
  if (!gradingCriteria) {
    return NextResponse.json(
      { error: 'Missing gradingCriteria' },
      { status: 400 }
    );
  }

  // 3. Upload image to Supabase Storage
  const arrayBuffer = await imageFile.arrayBuffer();
  const ext = imageFile.name.split('.').pop() ?? 'jpg';
  const fileName = `${user.id}/topics/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('writing-images')
    .upload(fileName, arrayBuffer, {
      contentType: imageFile.type || 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    console.error('[Writing] Image upload error:', uploadError);
    return NextResponse.json({ error: 'Image upload failed' }, { status: 502 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('writing-images').getPublicUrl(fileName);

  // 4. Call vision model to extract writing prompt
  let extraction;
  try {
    const imageBuffer = Buffer.from(arrayBuffer);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: TopicExtractionSchema,
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
              text: 'Extract the writing prompt/question from this image. Capture the full prompt text, a short title, and the word limit if mentioned. Return the extracted information as structured data.',
            },
          ],
        },
      ],
    });
    extraction = object;
  } catch (error) {
    console.error('[Writing] Vision model error:', error);
    return NextResponse.json(
      { error: 'Failed to extract topic from image' },
      { status: 502 }
    );
  }

  // 5. Insert into writing_topics
  const { data: topic, error: insertError } = await supabaseAdmin
    .from('writing_topics')
    .insert({
      user_id: user.id,
      title: extraction.title,
      writing_prompt: extraction.writingPrompt,
      grading_criteria: gradingCriteria,
      word_limit: extraction.wordLimit,
      image_url: publicUrl,
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
