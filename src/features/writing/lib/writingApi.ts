/**
 * @description 写作模块客户端 API 调用封装。
 */

import { supabase } from '@/lib/supabase';
import { parsePartialJson } from 'ai';
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

export async function fetchCriteria(): Promise<GradingCriteria[]> {
  const res = await fetch('/api/writing/criteria');
  if (!res.ok) throw new Error('Failed to fetch criteria');
  const json = await res.json();
  return json.criteria;
}

export async function fetchTopics(): Promise<WritingTopicWithStats[]> {
  const res = await authFetch('/api/writing/topics');
  if (!res.ok) throw new Error('Failed to fetch topics');
  const json = await res.json();
  return json.topics;
}

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
 * Uses parsePartialJson for robust partial JSON parsing during streaming.
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

  // New AI grading — stream partial JSON via streamObject
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });

    if (onPartial) {
      const { value: partial } = await parsePartialJson(accumulated);
      if (partial != null) {
        onPartial(partial as Partial<WritingGradeResult>);
      }
    }
  }
  accumulated += decoder.decode();

  const { value: parsed } = await parsePartialJson(accumulated);
  if (!parsed || !(parsed as WritingGradeResult).overallScore) {
    console.error(
      '[WritingGrade] Incomplete streamed JSON, length:',
      accumulated.length
    );
    throw new Error('AI 批改结果不完整，请重试。');
  }

  const result = parsed as WritingGradeResult;
  return {
    id: '',
    submissionId,
    userId: '',
    overallScore: result.overallScore,
    dimensionScores: result.dimensionScores,
    grammarErrors: result.grammarErrors,
    vocabularySuggestions: result.vocabularySuggestions,
    overallComment: result.overallComment,
    modelAnswer: result.modelAnswer,
    strengths: result.strengths,
    improvements: result.improvements,
    createdAt: new Date().toISOString(),
  };
}
