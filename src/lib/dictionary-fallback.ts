/**
 * @author SaltedFish-No1
 * @description 客户端调用统一词典 API 的封装，服务端处理所有 fallback 逻辑。
 */

import { DictionaryEntry } from '@/types/dictionary';

interface DictionaryApiResponse {
  /** 词典条目数据，null 表示未找到 */
  data: DictionaryEntry[] | null;
  /** 数据来源 */
  source: 'cache' | 'dictionaryapi' | 'ai_generated';
  /** TTS 发音音频 URL */
  audioUrl?: string | null;
  /** 中文释义补全状态 */
  zhStatus?: 'full' | 'pending' | 'none';
}

/**
 * @description 通过统一词典 API 查询单词，服务端自动处理缓存和 AI fallback。
 *
 * @param word 待查询的英文单词
 * @returns 查询结果，包含状态、数据、来源和音频信息
 */
export async function fetchDictionaryFromApi(word: string): Promise<{
  status: 'success' | 'not_found' | 'error';
  data: DictionaryEntry[] | null;
  source?: string;
  audioUrl?: string | null;
  zhStatus?: 'full' | 'pending' | 'none';
}> {
  try {
    const res = await fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });

    if (res.status === 404) {
      return { status: 'not_found', data: null };
    }

    if (!res.ok) {
      return { status: 'error', data: null };
    }

    const json: DictionaryApiResponse = await res.json();
    if (!json.data || json.data.length === 0) {
      return { status: 'not_found', data: null };
    }

    return {
      status: 'success',
      data: json.data,
      source: json.source,
      audioUrl: json.audioUrl,
      zhStatus: json.zhStatus,
    };
  } catch {
    return { status: 'error', data: null };
  }
}
