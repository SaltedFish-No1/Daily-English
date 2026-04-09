/**
 * @author SaltedFish-No1
 * @description 拍照识词客户端 API 封装，调用后端视觉模型提取单词。
 */
import type { ExtractedWord } from '@/features/photo-capture/types';

/**
 * @description 上传图片并通过 AI 视觉模型提取其中的英文单词。
 *
 * @param imageFile 待识别的图片文件
 * @returns 提取出的单词列表（含词性和释义）
 * @throws {Error} 识别失败时抛出
 */
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
