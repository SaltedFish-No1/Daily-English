/**
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
