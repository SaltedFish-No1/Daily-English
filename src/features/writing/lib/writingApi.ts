/**
 * @author SaltedFish-No1
 * @description 写作模块客户端 API 调用封装。
 */

import { supabase } from '@/lib/supabase';
import type {
  GradingCriteria,
  TopicExtraction,
  WritingTopic,
  WritingTopicWithStats,
  WritingSubmission,
  WritingGrade,
  WritingGradeResult,
} from '@/types/writing';

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

/**
 * @description 获取所有评分标准列表（无需鉴权）。
 *
 * @returns 评分标准数组
 */
export async function fetchCriteria(): Promise<GradingCriteria[]> {
  const res = await fetch('/api/writing/criteria');
  if (!res.ok) throw new Error('Failed to fetch criteria');
  const json = await res.json();
  return json.criteria;
}

/**
 * @description 获取当前用户的写作题目列表（含提交统计）。
 *
 * @returns 带统计信息的写作题目数组
 */
export async function fetchTopics(): Promise<WritingTopicWithStats[]> {
  const res = await authFetch('/api/writing/topics');
  if (!res.ok) throw new Error('Failed to fetch topics');
  const json = await res.json();
  return json.topics;
}

/**
 * @description 上传题目图片并通过 AI 识别提取写作题目信息。
 *
 * @param image 题目图片文件
 * @returns 上传后的图片 URL 和 AI 提取的题目结构
 */
export async function parseTopicImage(
  image: File
): Promise<{ imageUrl: string; extraction: TopicExtraction }> {
  const formData = new FormData();
  formData.append('image', image);

  const res = await authFetch('/api/writing/parse-topic-image', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? '图片识别失败');
  }
  return res.json();
}

/**
 * @description 手动创建写作题目。
 *
 * @param params 题目参数：评分标准 ID、标题、写作提示、图片 URL、字数限制
 * @returns 创建成功的写作题目对象
 */
export async function createTopicManual(params: {
  gradingCriteria: string;
  title: string | null;
  writingPrompt: string;
  imageUrl?: string | null;
  wordLimit?: number | null;
}): Promise<WritingTopic> {
  const res = await authFetch('/api/writing/create-topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? '创建题目失败');
  }
  const json = await res.json();
  return json.topic;
}

/**
 * @description 获取指定题目的所有提交记录及对应评分。
 *
 * @param topicId 写作题目 ID
 * @returns 提交列表和评分映射（key 为 submissionId）
 */
export async function fetchSubmissions(topicId: string): Promise<{
  submissions: WritingSubmission[];
  grades: Record<string, WritingGrade>;
}> {
  const res = await authFetch(
    `/api/writing/submissions?topicId=${encodeURIComponent(topicId)}`
  );
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json();
}

/**
 * @description 提交键盘输入的作文。
 *
 * @param params 提交参数：题目 ID、作文内容、写作用时（秒）
 * @returns 创建成功的提交记录
 */
export async function submitWriting(params: {
  topicId: string;
  content: string;
  timeSpentSeconds: number;
}): Promise<WritingSubmission> {
  const res = await authFetch('/api/writing/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Submit failed');
  }
  const json = await res.json();
  return json.submission;
}

/**
 * @description 上传手写作文图片并通过 AI OCR 识别为文本。
 *
 * @param image 手写作文图片文件
 * @returns 识别出的文本内容
 */
export async function recognizeHandwriting(image: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', image);

  const res = await authFetch('/api/writing/ocr', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? '手写识别失败');
  }
  const json = await res.json();
  return json.text;
}

/**
 * @description 提交手写作文（图片 + OCR 识别），通过 FormData 上传。
 *
 * @param topicId 写作题目 ID
 * @param image 手写作文图片文件
 * @param timeSpentSeconds 写作用时（秒）
 * @returns 创建成功的提交记录
 */
export async function submitHandwritten(
  topicId: string,
  image: File,
  timeSpentSeconds: number
): Promise<WritingSubmission> {
  const formData = new FormData();
  formData.append('topicId', topicId);
  formData.append('image', image);
  formData.append('timeSpentSeconds', String(timeSpentSeconds));

  const res = await authFetch('/api/writing/submit', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Submit failed');
  }
  const json = await res.json();
  return json.submission;
}

/**
 * Grade a submission — handles both JSON (existing grade) and streaming (new AI grading).
 * @param onPartial - Called with partial WritingGradeResult as the stream arrives.
 *                    Allows the UI to show progressive grading feedback.
 */
export async function gradeSubmission(
  submissionId: string,
  onPartial?: (partial: Partial<WritingGradeResult>) => void
): Promise<WritingGrade> {
  const res = await authFetch('/api/writing/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Grading failed');
  }

  const contentType = res.headers.get('content-type') ?? '';

  // Existing grade — server returns JSON directly
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return json.grade;
  }

  // New AI grading — server streams partial JSON via streamObject
  const text = await readStreamAsText(res, onPartial);
  let parsed: WritingGradeResult;
  try {
    parsed = JSON.parse(text) as WritingGradeResult;
  } catch {
    console.error(
      '[WritingGrade] Failed to parse streamed JSON, length:',
      text.length
    );
    throw new Error('AI 批改结果不完整，请重试。');
  }

  // Construct full WritingGrade from AI result (DB fields filled client-side)
  return {
    id: '',
    submissionId,
    userId: '',
    overallScore: parsed.overallScore,
    dimensionScores: parsed.dimensionScores,
    grammarErrors: parsed.grammarErrors,
    vocabularySuggestions: parsed.vocabularySuggestions,
    overallComment: parsed.overallComment,
    modelAnswer: parsed.modelAnswer,
    strengths: parsed.strengths,
    improvements: parsed.improvements,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Read a text stream response, calling onPartial with accumulated text
 * parsed as partial JSON whenever possible.
 */
async function readStreamAsText(
  res: Response,
  onPartial?: (partial: Partial<WritingGradeResult>) => void
): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });

    if (onPartial) {
      try {
        const partial = JSON.parse(accumulated);
        onPartial(partial);
      } catch {
        // Incomplete JSON — skip until next chunk
      }
    }
  }

  // Flush any remaining buffered bytes (e.g. partial multi-byte UTF-8 chars)
  accumulated += decoder.decode();

  return accumulated;
}
