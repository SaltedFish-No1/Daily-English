/**
 * @author SaltedFish-No1
 * @description 手写作文 OCR — 仅识别文字，不创建提交记录。
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { modelFast } from '@/lib/ai';
import { getAuthUserWithLimits } from '@/lib/api-auth';
import { setUsageContext, clearUsageContext } from '@/lib/ai-middleware';

export async function POST(request: NextRequest) {
  const auth = await getAuthUserWithLimits(request, 'writing-ocr');
  if ('error' in auth) return auth.error;
  const user = auth.user;
  setUsageContext(user.id, 'writing-ocr');

  const formData = await request.formData();
  const imageFile = formData.get('image') as File | null;

  if (!imageFile) {
    return NextResponse.json({ error: 'Missing image' }, { status: 400 });
  }

  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    const { object } = await generateObject({
      model: modelFast,
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

    return NextResponse.json({ text: object.extractedText });
  } catch (error) {
    clearUsageContext();
    console.error('[Writing OCR] Error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from image' },
      { status: 502 }
    );
  }
}
