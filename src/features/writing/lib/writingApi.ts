/**
 * @description 写作模块客户端 API 调用封装。
 */

import { supabase } from '@/lib/supabase';
import type {
  GradingCriteria,
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

export async function uploadTopic(
  image: File,
  gradingCriteria: string
): Promise<WritingTopic> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('gradingCriteria', gradingCriteria);

  const res = await authFetch('/api/writing/upload-topic', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Upload failed');
  }
  const json = await res.json();
  return json.topic;
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

export async function gradeSubmission(
  submissionId: string
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
  const json = await res.json();
  return json.grade;
}
