# 错误处理规范 / Error Handling Conventions

> 本规范适用于项目中所有错误处理代码（API 路由、客户端 API 封装、React 组件、Store、Sentry 集成等）。编写代码时**必须严格遵守**以下规则。
>
> This specification applies to all error handling code (API routes, client API wrappers, React components, stores, Sentry integration, etc.). All code **MUST** strictly follow these rules.

---

## 目录 / Table of Contents

1. [API 路由错误响应 / API Route Error Response](#1-api-路由错误响应--api-route-error-response)
2. [API 路由 try-catch 结构 / API Route Try-Catch Structure](#2-api-路由-try-catch-结构--api-route-try-catch-structure)
3. [请求校验 / Request Validation](#3-请求校验--request-validation)
4. [鉴权错误 / Authentication Error](#4-鉴权错误--authentication-error)
5. [客户端 API 封装 / Client API Wrapper](#5-客户端-api-封装--client-api-wrapper)
6. [组件错误状态 / Component Error State](#6-组件错误状态--component-error-state)
7. [Next.js 错误边界 / Error Boundary](#7-nextjs-错误边界--error-boundary)
8. [流式 / AI 响应错误 / Streaming & AI Error](#8-流式--ai-响应错误--streaming--ai-error)
9. [日志规范 / Error Logging](#9-日志规范--error-logging)
10. [Sentry 集成 / Sentry Integration](#10-sentry-集成--sentry-integration)
11. [优雅降级 / Graceful Degradation](#11-优雅降级--graceful-degradation)
12. [用户友好错误消息 / User-Facing Error Message](#12-用户友好错误消息--user-facing-error-message)

---

## 1. API 路由错误响应 / API Route Error Response

**适用场景 / When**：`src/app/api/` 下所有 API 路由处理函数。

**要求 / Rules**：
- 统一错误响应格式：`{ error: string, details?: string }`
- 状态码必须语义正确：
  - `400` — 请求体格式错误、必填字段缺失、校验失败
  - `401` — 未认证
  - `404` — 资源不存在
  - `500` — 服务端内部错误（数据库操作失败等）
  - `502` — 外部服务失败（AI SDK、文件存储、邮件服务等）
- **禁止**暴露堆栈、内部路径或实现细节给客户端
- 成功响应使用业务语义化的 key（如 `{ submission }`, `{ grade }`, `{ data }`）

**示例 / Example**：

```typescript
// ✅ 统一错误格式，状态码语义明确
return NextResponse.json({ error: 'Missing topicId or content' }, { status: 400 });
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
return NextResponse.json({ error: 'Image upload failed' }, { status: 502 });

// ✅ 带详细信息（仅用于校验错误，帮助调试）
return NextResponse.json(
  { error: 'Invalid lesson data', details: parsed.error.message },
  { status: 400 }
);
```

```typescript
// ❌ 暴露内部信息
return NextResponse.json({ error: err.stack }, { status: 500 });

// ❌ 状态码与语义不符
return NextResponse.json({ error: 'Not found' }, { status: 500 });

// ❌ 非标准响应格式
return NextResponse.json({ message: 'error', code: 400 });
```

---

## 2. API 路由 try-catch 结构 / API Route Try-Catch Structure

**适用场景 / When**：API 路由中涉及请求体解析、外部服务调用、数据库操作的处理逻辑。

**要求 / Rules**：
- JSON 解析使用**独立** try-catch，捕获后返回 400
- 外部服务调用（AI SDK `generateObject`/`streamObject`、文件存储、邮件）使用 try-catch，返回 502
- Supabase 数据库操作使用**解构 `{ error }`** 检查，返回 500
- try-catch 要**细粒度** — 包裹特定操作，而非整个 handler
- 遵循早返回（early return）模式：鉴权 → 解析 → 校验 → 业务逻辑

**示例 / Example**：

```typescript
// ✅ 细粒度 try-catch + 早返回
export async function POST(request: NextRequest) {
  // 1. 鉴权 — 早返回
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. JSON 解析 — 独立 try-catch
  let body: { topicId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 3. 输入校验 — 早返回
  if (!body.topicId || !body.content?.trim()) {
    return NextResponse.json(
      { error: 'Missing topicId or content' },
      { status: 400 }
    );
  }

  // 4. 数据库操作 — 解构 { error }
  const { data, error: insertError } = await supabaseAdmin
    .from('submissions')
    .insert({ topic_id: body.topicId, content: body.content })
    .select()
    .single();

  if (insertError || !data) {
    console.error('[Writing] Insert error:', insertError);
    return NextResponse.json(
      { error: 'Failed to save' },
      { status: 500 }
    );
  }

  // 5. 外部服务 — try-catch + 502
  try {
    const { object } = await generateObject({ model: modelFast, ... });
  } catch (error) {
    console.error('[Writing] AI error:', error);
    return NextResponse.json(
      { error: 'AI processing failed' },
      { status: 502 }
    );
  }

  return NextResponse.json({ data });
}
```

```typescript
// ❌ 整个处理包在一个 try-catch 中，无法区分错误来源
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = await supabaseAdmin
      .from('t')
      .insert(body)
      .select()
      .single();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
```

---

## 3. 请求校验 / Request Validation

**适用场景 / When**：API 路由接收来自客户端的结构化数据。

**要求 / Rules**：
- 复杂/嵌套数据结构使用 Zod `safeParse`，校验失败时在 `details` 中包含 `parsed.error.message`
- 简单必填字段使用手动检查（`if (!field)`）
- 校验失败统一返回 `400` + 具体错误描述
- 为解析后的 body 变量显式声明 TypeScript 类型

**示例 / Example**：

```typescript
// ✅ Zod safeParse — 复杂结构
const parsed = GeneratedLessonSchema.safeParse(body.lesson);
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Invalid lesson data', details: parsed.error.message },
    { status: 400 }
  );
}
```

```typescript
// ✅ 手动校验 — 简单字段
const words = body.words;
if (!words || !Array.isArray(words) || words.length === 0) {
  return NextResponse.json(
    { error: 'Missing or empty words array' },
    { status: 400 }
  );
}
```

```typescript
// ❌ 使用 Zod parse（会抛异常），而非 safeParse
try {
  const data = MySchema.parse(body);
} catch (e) {
  return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
}
```

---

## 4. 鉴权错误 / Authentication Error

**适用场景 / When**：需要用户认证的 API 路由。

**要求 / Rules**：
- 需要完整鉴权（cookie + Bearer 双通道）时使用 `requireApiAuth(request)`（来自 `src/lib/api-auth.ts`）
- 仅需 Bearer token 时使用 `getAuthUser(request)`（来自 `src/lib/auth-helper.ts`）
- `requireApiAuth` 的结果使用 `'error' in auth` 模式判断
- `getAuthUser` 的结果使用 `if (!user)` 模式判断
- 未认证统一返回 `401`

**示例 / Example**：

```typescript
// ✅ 方式一：requireApiAuth（支持 cookie + Bearer 双通道）
const auth = await requireApiAuth(request);
if ('error' in auth) return auth.error;
// auth.user.id 可用

// ✅ 方式二：getAuthUser（仅 Bearer token）
const user = await getAuthUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
// user.id 可用
```

---

## 5. 客户端 API 封装 / Client API Wrapper

**适用场景 / When**：客户端调用后端 API 的封装函数（位于 `src/features/*/lib/*Api.ts`）。

**要求 / Rules**：
- **非抛出模式**（`ApiResult<T>`）：返回 `{ data }` 或 `{ error }` — 用于表单提交等需要内联显示错误的场景
- **抛出模式**：`throw new Error(...)` — 用于 TanStack Query mutation 或调用方自行 try-catch 的场景
- 网络错误统一使用中文兜底消息：`'网络错误，请检查网络后重试'`
- 安全解析错误响应体：`res.json().catch(() => ({}))`
- 认证请求使用 `authFetch()` 封装，自动注入 Bearer token

**示例 / Example**：

```typescript
// ✅ 非抛出模式 — ApiResult 模式
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
```

```typescript
// ✅ 抛出模式 — 配合 try-catch 或 TanStack Query
export async function submitWriting(params: SubmitParams): Promise<WritingSubmission> {
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
```

---

## 6. 组件错误状态 / Component Error State

**适用场景 / When**：触发异步操作的 React 组件（表单提交、数据加载、AI 评分等）。

**要求 / Rules**：
- 使用 `useState<string | null>(null)` 管理错误状态
- 每次新操作前清空错误：`setError(null)`
- 安全提取错误消息：`err instanceof Error ? err.message : '默认消息'`
- 统一错误文案样式：`<p className="text-xs text-red-500">{error}</p>`
- 异步操作期间禁用交互元素，防止重复提交

**示例 / Example**：

```typescript
// ✅ 标准组件错误处理模式
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleSubmit = useCallback(async () => {
  setError(null);
  setLoading(true);

  try {
    await submitWriting({ topicId, content, timeSpentSeconds });
  } catch (err) {
    setError(err instanceof Error ? err.message : '提交失败');
  } finally {
    setLoading(false);
  }
}, [topicId, content, timeSpentSeconds]);

// JSX
{error && <p className="text-xs text-red-500">{error}</p>}
<button disabled={loading} onClick={handleSubmit}>提交</button>
```

```typescript
// ❌ 未清空之前的错误
const handleSubmit = async () => {
  try { await submit(); } catch (err) { setError(String(err)); }
};

// ❌ 直接 String(err)，可能产生 "[object Object]"
setError(String(err));
```

---

## 7. Next.js 错误边界 / Error Boundary

**适用场景 / When**：配置页面路由的错误恢复机制。

**要求 / Rules**：
- `src/app/error.tsx`：页面级错误边界 — 使用 Tailwind 样式，包含 Sentry 上报和 `reset()` 重试按钮
- `src/app/global-error.tsx`：根级兜底 — 使用**内联样式**（Tailwind 可能未加载），包裹 `<html><body>`
- `src/app/not-found.tsx`：404 页面，提供返回首页链接
- 两个 error boundary **必须**在 `useEffect` 中调用 `Sentry.captureException(error)`
- Feature 路由**可以**添加局部 `error.tsx` 实现功能特定的恢复 UI

**示例 / Example**：

```typescript
// ✅ error.tsx — 页面级错误边界
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-5 text-center">
      <h2 className="mb-2 text-3xl font-bold">Something went wrong!</h2>
      <p className="mb-8 text-slate-500">加载页面时发生了一些错误。</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  );
}
```

```typescript
// ✅ global-error.tsx — 使用内联样式（Tailwind 可能未加载）
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <h2>Something went wrong!</h2>
          <button onClick={() => reset()}>重试</button>
        </div>
      </body>
    </html>
  );
}
```

---

## 8. 流式 / AI 响应错误 / Streaming & AI Error

**适用场景 / When**：API 路由使用 `streamObject`/`generateObject`，客户端消费流式响应。

**要求 / Rules**：
- 服务端：`onFinish` 回调**必须**检查 `error` 和 `object` 空值 — 记录日志但不抛出（流已发送）
- 服务端：`onFinish` 中的数据库操作使用 `{ error }` 解构 + `console.error`
- 客户端：流结束后**必须**验证 JSON 完整性
- 客户端：不完整的 AI 结果抛出中文用户友好错误（如 `'AI 批改结果不完整，请重试。'`）
- 客户端：最终流解析使用 try-catch 包裹 `JSON.parse`

**示例 / Example**：

```typescript
// ✅ 服务端 — onFinish 回调中的错误处理
const result = streamObject({
  model: modelPower,
  schema: WritingGradeSchema,
  messages: [...],
  onFinish: async ({ object: gradeResult, error }) => {
    if (error) {
      console.error('[Writing] streamObject finished with error:', error);
    }
    if (!gradeResult) {
      console.error('[Writing] streamObject produced no valid object');
      return;
    }
    // DB 操作 — 解构 error
    const { error: insertError } = await supabaseAdmin
      .from('writing_grades')
      .insert({ submission_id: submissionId, ... });
    if (insertError) {
      console.error('[Writing] Insert grade error:', insertError);
    }
  },
});

return result.toTextStreamResponse();
```

```typescript
// ✅ 客户端 — 流式 JSON 解析与验证
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
```

---

## 9. 日志规范 / Error Logging

**适用场景 / When**：记录错误信息用于调试与监控。

**要求 / Rules**：
- 格式：`console.error('[Module] 上下文描述:', error)`
- 模块名与功能/文件对应（如 `[Writing]`、`[Dictionary]`、`[TTS]`、`[CloudSync]`、`[verify-otp]`）
- **必须**使用 `console.error` 记录错误，**禁止**使用 `console.log`
- 记录原始 error 对象（而非仅 `.message`），保留开发环境下的 stack trace
- 生产环境依赖 Sentry 采集，`console.error` 仅用于开发调试

**示例 / Example**：

```typescript
// ✅ 标准格式：[模块] 上下文 + 原始错误对象
console.error('[Writing] Answer image upload error:', uploadError);
console.error('[Dictionary AI Fallback] Error:', error);
console.error('[verify-otp] generateLink failed:', linkError);
console.error('[CloudSync] saved_words upsert:', error);
```

```typescript
// ❌ 缺少模块标识
console.error('Upload failed', error);

// ❌ 使用 console.log 记录错误
console.log('Error:', error);

// ❌ 只记录 message，丢失 stack trace
console.error('[Writing] Error:', error.message);
```

---

## 10. Sentry 集成 / Sentry Integration

**适用场景 / When**：生产环境错误追踪配置。

**要求 / Rules**：
- 客户端：在 `src/instrumentation-client.ts` 中初始化，仅生产环境启用（`enabled: process.env.NODE_ENV === 'production'`）
- 服务端：在 `src/instrumentation.ts` 中注册，通过 `onRequestError` 自动捕获请求错误
- Error Boundary 中**必须**在 `useEffect` 中调用 `Sentry.captureException(error)`
- 采样率配置：`tracesSampleRate: 0.2`、`replaysOnErrorSampleRate: 1.0`、`replaysSessionSampleRate: 0.1`
- **禁止**在 API 路由中手动调用 `Sentry.captureException` — 服务端 instrumentation 已自动处理

**示例 / Example**：

```typescript
// ✅ 客户端初始化
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
});
```

```typescript
// ✅ 服务端 instrumentation
export const onRequestError = async (...args: unknown[]) => {
  const Sentry = await import('@sentry/nextjs');
  return (Sentry.captureRequestError as (...a: unknown[]) => void)(...args);
};
```

```typescript
// ✅ Error Boundary 中上报
useEffect(() => {
  Sentry.captureException(error);
}, [error]);
```

---

## 11. 优雅降级 / Graceful Degradation

**适用场景 / When**：具有多级数据源回退的操作，或非关键性副作用。

**要求 / Rules**：
- 多级回退：返回最佳可用数据，记录每个失败层级（如 cache → API → AI）
- 非关键云端同步：fire-and-forget 模式 + `.then(({ error }) => { if (error) console.error(...) })`
- 后台增强：使用 `after()` 处理响应后的异步工作，内部捕获错误
- 部分成功：返回 200 + 降级数据标记（如 `zhStatus: 'pending'` / `'none'`）

**示例 / Example**：

```typescript
// ✅ 多级回退 — 每层失败后尝试下一层
// 1. 查缓存（最快）
const { data: cached } = await supabaseAdmin
  .from('dictionary_cache')
  .select('*')
  .eq('word', word)
  .single();
if (cached?.data && hasChinese(cached.data)) {
  return NextResponse.json({
    data: cached.data,
    source: 'cache',
    zhStatus: 'full',
  });
}

// 2. 请求外部 API
const apiResult = await fetchDictionaryEntries(word);
if (apiResult.status === 'success') {
  // 先返回英文结果，后台异步补全中文
  after(async () => {
    const enriched = await enrichWithChinese(word, apiResult.data);
    // 写入缓存...
  });
  return NextResponse.json({
    data: apiResult.data,
    source: 'dictionaryapi',
    zhStatus: 'pending',
  });
}

// 3. AI 生成兜底
try {
  const { object } = await generateObject({ ... });
  return NextResponse.json({
    data: object.entries,
    source: 'ai_generated',
    zhStatus: 'full',
  });
} catch (error) {
  console.error('[Dictionary AI Fallback] Error:', error);
  return NextResponse.json(
    { error: 'All dictionary sources failed' },
    { status: 502 }
  );
}
```

```typescript
// ✅ fire-and-forget — 云端同步失败不影响本地操作
supabaseAdmin
  .from('writing_drafts')
  .upsert(
    { user_id: userId, topic_id: topicId, draft_text: text },
    { onConflict: 'user_id' }
  )
  .then(({ error }) => {
    if (error) console.error('[CloudSync] writing_drafts upsert:', error);
  });
```

---

## 12. 用户友好错误消息 / User-Facing Error Message

**适用场景 / When**：向终端用户展示错误信息。

**要求 / Rules**：
- 面向用户的消息使用**中文**，技术日志使用英文
- 包含可操作指引："请重试"、"请检查网络后重试"、"请重新发送"
- **禁止**将技术细节暴露给用户（SQL 错误、堆栈、内部路径等）
- 速率限制 / 尝试次数超限时，说明原因和下一步操作
- 客户端将服务端错误映射为本地化消息

**示例 / Example**：

```typescript
// ✅ 用户友好 + 可操作
'网络错误，请检查网络后重试'
'AI 批改结果不完整，请重试。'
'验证码已失效，尝试次数过多，请重新发送'
'验证码错误，请重新输入'
'图片识别失败'
'创建题目失败'
```

```typescript
// ❌ 暴露技术细节
'PGRST116: JSON object requested, multiple (or no) rows returned'
'Error: fetch failed at processTicksAndRejections'
'TypeError: Cannot read properties of undefined'
```

```typescript
// ✅ 速率限制提示
if (row.attempts >= MAX_ATTEMPTS) {
  return NextResponse.json(
    { error: '验证码已失效，尝试次数过多，请重新发送' },
    { status: 400 }
  );
}
```

---

## 快速参考 / Quick Reference

| 场景 / Scenario | 处理方式 / Approach | 状态码 / Status | 示例 / Example |
|---|---|---|---|
| 请求体格式错误 | try-catch + 400 | 400 | `{ error: 'Invalid JSON' }` |
| 必填字段缺失 | 早返回 + 400 | 400 | `{ error: 'Missing topicId' }` |
| Zod 校验失败 | safeParse + 400 | 400 | `{ error: '...', details: parsed.error.message }` |
| 未认证 | requireApiAuth / getAuthUser | 401 | `{ error: 'Unauthorized' }` |
| 资源不存在 | 查询后判空 + 404 | 404 | `{ error: 'Topic not found' }` |
| 数据库操作失败 | 解构 `{ error }` + 500 | 500 | `{ error: 'Failed to save' }` |
| 外部服务失败 | try-catch + 502 | 502 | `{ error: 'AI processing failed' }` |
| 客户端网络错误 | catch + 中文消息 | — | `{ error: '网络错误，请检查网络后重试' }` |
| 流式 AI 不完整 | JSON.parse catch + throw | — | `throw new Error('AI 批改结果不完整')` |
| 非关键云端同步 | fire-and-forget + console.error | — | `.then(({ error }) => ...)` |
| 页面渲染崩溃 | error.tsx + Sentry | — | `Sentry.captureException(error)` |
| 全局崩溃 | global-error.tsx + 内联样式 | — | 内联样式 + `reset()` |
