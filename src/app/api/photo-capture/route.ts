/**
 * @description 拍照识词 API：接收手写单词图片，通过视觉模型提取英文单词及释义。
 *   接收 FormData: image (File)
 *   返回 { words: ExtractedWord[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { modelVision } from '@/lib/ai';
import { PhotoCaptureResultSchema } from '@/features/photo-capture/types';

export async function POST(request: NextRequest) {
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

  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    const { object } = await generateObject({
      model: modelVision,
      schema: PhotoCaptureResultSchema,
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
              text: 'Look at this image of handwritten English words. Extract every distinct English word you can read. For each word, provide the base form (lemma) in lowercase, the most likely part of speech (e.g. noun, verb, adjective, adverb), and a brief English definition. Skip any word that is illegible or not English. Return structured data.',
            },
          ],
        },
      ],
    });

    return NextResponse.json({ words: object.words });
  } catch (error) {
    console.error('[PhotoCapture] Vision model error:', error);
    return NextResponse.json(
      { error: 'Failed to extract words from image' },
      { status: 502 }
    );
  }
}
