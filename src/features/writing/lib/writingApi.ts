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

/**
 * Fetch submissions for a topic.
 * New API returns submissions with inline grade data.
 * For backward compatibility, also builds a grades record keyed by submissionId.
 */
export async function fetchSubmissions(topicId: string): Promise<{
  submissions: WritingSubmission[];
  grades: Record<string, WritingGrade>;
}> {
  const res = await authFetch(
    `/api/writing/submissions?topicId=${encodeURIComponent(topicId)}`
  );
  if (!res.ok) throw new Error('Failed to fetch submissions');
  const json = await res.json();

  const submissions: WritingSubmission[] = json.submissions;

  // Build grades record from inline grade data for backward compatibility
  const grades: Record<string, WritingGrade> = {};
  for (const sub of submissions) {
    if (sub.grade) {
      grades[sub.id] = {
        id: '',
        submissionId: sub.id,
        userId: sub.userId,
        overallScore: sub.grade.overallScore,
        dimensionScores: sub.grade.dimensionScores,
        grammarErrors: sub.grade.grammarErrors,
        vocabularySuggestions: sub.grade.vocabularySuggestions,
        overallComment: sub.grade.overallComment,
        modelAnswer: sub.grade.modelAnswer,
        strengths: sub.grade.strengths,
        improvements: sub.grade.improvements,
        createdAt: sub.grade.gradedAt,
      };
    }
  }

  return { submissions, grades };
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

  // Existing grade — server returns JSON directly (now WritingGradeData format)
  if (contentType.includes('application/json')) {
    const json = await res.json();
    const gradeData = json.grade;
    return {
      id: '',
      submissionId,
      userId: '',
      overallScore: gradeData.overallScore,
      dimensionScores: gradeData.dimensionScores,
      grammarErrors: gradeData.grammarErrors,
      vocabularySuggestions: gradeData.vocabularySuggestions,
      overallComment: gradeData.overallComment,
      modelAnswer: gradeData.modelAnswer,
      strengths: gradeData.strengths,
      improvements: gradeData.improvements,
      createdAt: gradeData.gradedAt ?? new Date().toISOString(),
    };
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

  // Construct full WritingGrade from AI result
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
