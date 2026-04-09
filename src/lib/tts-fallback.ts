/**
 * @author SaltedFish-No1
 * @description 客户端 TTS fallback：调用 /api/tts 获取服务端生成的音频 URL。
 */

const ttsCache = new Map<string, string>();

/**
 * @description 从服务端 TTS API 获取单词发音音频 URL，带内存缓存。
 *
 * @param word 待发音的英文单词
 * @returns 音频 URL，失败时返回 null
 */
export async function fetchTTSAudioUrl(word: string): Promise<string | null> {
  const key = word.trim().toLowerCase();
  const cached = ttsCache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: key }),
    });

    if (!res.ok) return null;

    const json: { audioUrl: string } = await res.json();
    if (json.audioUrl) {
      ttsCache.set(key, json.audioUrl);
      return json.audioUrl;
    }
    return null;
  } catch {
    return null;
  }
}
