/**
 * @description 上传写作题目图片 → 视觉模型提取题目文字 → 返回提取结果（不写入数据库）。
 *   接收 FormData: image (File)
 *   返回 { imageUrl: string, extraction: { title, writingPrompt, wordLimit } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { supabaseAdmin } from '@/lib/supabase-server';
import { modelVision } from '@/lib/ai';
import { getAuthUser } from '@/lib/auth-helper';
import { TopicExtractionSchema } from '@/types/writing';

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

  if (!imageFile) {
    return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
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
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    const { object } = await generateObject({
      model: modelVision,
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

  // 5. Return extracted data (no DB insert)
  return NextResponse.json({ imageUrl: publicUrl, extraction });
}
