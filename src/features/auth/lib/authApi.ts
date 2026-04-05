/**
 * @author SaltedFish-No1
 * @description 邮箱验证 API 调用封装，与后端 /api/auth/* 路由通信。
 */

interface ApiResult<T = unknown> {
  data?: T;
  error?: string;
}

async function post<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error ?? '请求失败' };
    return { data: json as T };
  } catch {
    return { error: '网络错误，请检查网络后重试' };
  }
}

/** 发送验证码到指定邮箱。 */
export function sendOtp(email: string) {
  return post<{ success: boolean }>('/api/auth/send-otp', { email });
}

/** 验证邮箱验证码，返回 token_hash 用于建立 Supabase 会话。 */
export function verifyOtp(email: string, code: string) {
  return post<{ success: boolean; token_hash: string }>(
    '/api/auth/verify-otp',
    { email, code }
  );
}
