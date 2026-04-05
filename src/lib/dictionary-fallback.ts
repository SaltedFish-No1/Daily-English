/**
 * @description 客户端调用统一词典 API 的封装，服务端处理所有 fallback 逻辑。
 */

import { DictionaryEntry } from '@/types/dictionary';

interface DictionaryApiResponse {
  data: DictionaryEntry[] | null;
  source: 'cache' | 'dictionaryapi' | 'ai_generated';
  audioUrl?: string | null;
}

export async function fetchDictionaryFromApi(
  word: string
): Promise<{
  status: 'success' | 'not_found' | 'error';
  data: DictionaryEntry[] | null;
  source?: string;
  audioUrl?: string | null;
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
    };
  } catch {
    return { status: 'error', data: null };
  }
}
