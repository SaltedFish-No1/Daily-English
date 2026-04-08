/**
 * @author SaltedFish-No1
 * @description 复习模块 API 调用封装。
 */

import { supabase } from '@/lib/supabase';
import type { GeneratedLesson } from '@/types/review';

/**
 * @description 调用 AI 复习文章生成接口（流式响应）。
 *   返回原始 Response 以便调用方通过 ReadableStream 逐步解析生成进度。
 *
 * @param words 需要复习的单词列表
 * @param difficulty CEFR 难度等级，默认 'B1'
 * @returns 流式 Response 对象，body 为 JSON 片段流
 * @throws {Error} 当 HTTP 响应非 2xx 时抛出，包含服务端错误信息
 */
export async function generateReviewLesson(
  words: string[],
  difficulty: string
): Promise<Response> {
  const res = await fetch('/api/review/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words, difficulty }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res;
}

/**
 * @description 保存 AI 生成的复习课程到数据库（需要用户鉴权）。
 *
 * @param lesson AI 生成的完整课程对象
 * @param words 本次复习的单词列表
 * @param difficulty CEFR 难度等级
 * @returns 包含 lessonId 的响应数据
 * @throws {Error} 当保存失败或 HTTP 响应非 2xx 时抛出
 */
export async function saveReviewLesson(
  lesson: GeneratedLesson,
  words: string[],
  difficulty: string
): Promise<{ lessonId: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch('/api/review/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify({ lesson, words, difficulty }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '保存失败，请重试');
  }

  return res.json();
}
