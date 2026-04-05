import type { ExtractedWord } from '@/features/photo-capture/types';

export async function extractWordsFromPhoto(
  imageFile: File
): Promise<ExtractedWord[]> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const res = await fetch('/api/photo-capture', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('识别失败，请重试');
  }

  const data = await res.json();
  return data.words;
}
