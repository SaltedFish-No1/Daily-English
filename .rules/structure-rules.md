# 项目结构规范

> 本规范适用于项目中所有目录和文件的组织方式。新增代码时**必须严格遵守**以下结构约定。

---

## 目录

1. [顶层目录职责](#1-顶层目录职责)
2. [Feature 模块结构](#2-feature-模块结构)
3. [共享代码 vs Feature 代码](#3-共享代码-vs-feature-代码)
4. [文件命名规范](#4-文件命名规范)
5. [导入路径规范](#5-导入路径规范)
6. [页面路由组织](#6-页面路由组织)
7. [API 路由组织](#7-api-路由组织)
8. [状态管理文件规范](#8-状态管理文件规范)
9. [测试文件组织](#9-测试文件组织)
10. [环境变量管理](#10-环境变量管理)
11. [深层嵌套指南](#11-深层嵌套指南)
12. [反模式](#12-反模式)

---

## 1. 顶层目录职责

**适用场景**：在 `src/` 下创建新文件或新目录时。

**要求**：

| 目录 | 职责 | 约束 |
|------|------|------|
| `src/app/` | Next.js App Router：页面、布局、API 路由 | 必须只做路由壳，业务逻辑委托给 `features/` |
| `src/components/` | 全局 app-shell 级组件（`AppShell`、`AppNavBar`） | 仅放全局 layout 组件；feature 组件**禁止**放此处 |
| `src/features/` | Feature 模块，按领域封装 UI + 逻辑 | 必须按领域划分，禁止跨 feature 随意耦合 |
| `src/hooks/` | 被 2+ features 共享的 custom hook | 单 feature 专属 hook 必须放 `features/[name]/hooks/` |
| `src/lib/` | 核心工具、第三方服务封装、算法、server-only 逻辑 | 禁止放 React 组件；禁止放 feature 专属业务逻辑 |
| `src/store/` | Zustand 全局 store | 每个 store 一个文件，命名 `use[Name]Store.ts` |
| `src/types/` | 被 2+ features 共享的 TypeScript 类型定义 | Feature 专属类型必须放 `features/[name]/types.ts` |
| `src/__tests__/` | 单元测试，镜像源码目录结构 | 测试文件命名 `[module].test.ts` |

其他顶层文件：

- `src/middleware.ts` — Next.js middleware（auth 守卫、重定向），单文件，禁止拆分
- `src/instrumentation.ts` / `src/instrumentation-client.ts` — Next.js instrumentation hook（Sentry）

> 禁止在 `src/` 下新建未列出的顶层目录。

**示例**：

```
src/
├── app/                    # 路由层：page.tsx + route.ts
├── components/             # 全局组件：AppShell, AppNavBar
├── features/               # Feature 模块：auth, writing, lesson, vocab...
├── hooks/                  # 共享 hook：useSpeech, useReviewWords, usePWAInstall...
├── lib/                    # 核心工具：supabase, ai, otp, dictionary...
│   ├── env/                # 环境变量校验：client.ts, server.ts
│   └── email-templates/    # 邮件模板（仅 API routes 使用）
├── store/                  # Zustand store：useAuthStore, useUserStore...
├── types/                  # 共享类型：lesson.ts, writing.ts, dictionary.ts...
├── __tests__/              # 单元测试
└── middleware.ts            # Auth 路由中间件
```

---

## 2. Feature 模块结构

**适用场景**：新增 feature 或向现有 feature 添加文件时。

**要求**：

标准 feature 目录结构：

```
src/features/[feature-name]/
├── components/     # （必须）Feature 专属 React 组件
├── hooks/          # （可选）Feature 专属 custom hook
├── lib/            # （可选）Feature 专属 API 调用、工具函数
└── types.ts        # （可选）Feature 专属 TypeScript 类型
```

- 每个 feature **必须**包含 `components/` 子目录
- `hooks/`、`lib/`、`types.ts` 为可选，仅在有实际文件时创建
- Feature 名称必须使用 **kebab-case**（如 `photo-capture`，不是 `photoCapture`）
- Feature 名称应与对应的 `src/app/` 路由名称一致（如 `writing` → `/writing`）
- **禁止**在 feature 根目录创建上述四项以外的子目录（如 `services/`、`utils/`、`constants/`）
- **禁止**在 feature 根目录直接放置松散的 `.ts` / `.tsx` 文件（`types.ts` 除外）

**示例**：

最小 feature（about）：

```
src/features/about/
└── components/
    └── AboutView.tsx
```

标准 feature（writing）：

```
src/features/writing/
├── components/     # GradeReport, WritingEditor, WritingView...
└── lib/
    └── writingApi.ts
```

完整 feature（auth）：

```
src/features/auth/
├── components/     # EmailLoginForm, LoginView, OAuthButtons, PhoneLoginForm, UserMenu
├── hooks/          # useAuth, useDataSync
└── lib/
    ├── authApi.ts
    └── dataMigration.ts
```

带类型文件的 feature（photo-capture）：

```
src/features/photo-capture/
├── components/
│   └── PhotoCaptureModal.tsx
├── lib/
│   └── photoCaptureApi.ts
└── types.ts
```

---

## 3. 共享代码 vs Feature 代码

**适用场景**：新增 hook、工具函数、类型定义或组件时，判断其归属位置。

**要求**：

| 使用范围 | 放置位置 |
|----------|---------|
| 仅一个 feature 使用 | `src/features/[name]/hooks/`、`lib/`、`types.ts` |
| 被 2+ features 或 app 层使用 | `src/hooks/`、`src/lib/`、`src/types/` |
| 全局 app-shell 级 UI（导航、布局壳） | `src/components/` |
| 全局状态管理 | `src/store/` |

- **禁止"预防性共享"**：代码初始时放在 feature 内部，被第二个 feature 需要时再提升到共享目录
- 提升时**必须**同步更新所有导入路径
- 跨 feature 导入（`@/features/A/` 内导入 `@/features/B/`）应视为代码异味，需评估是否将被导入的模块提升为共享代码

**示例**：

正确 — 共享 hook（被 3+ features 使用）：

```typescript
// src/hooks/useReviewWords.ts
import { useReviewWords } from '@/hooks/useReviewWords';
```

正确 — feature 专属 API 封装：

```typescript
// src/features/writing/lib/writingApi.ts — 仅 writing feature 使用
import { fetchTopics } from '@/features/writing/lib/writingApi';
```

代码异味 — 跨 feature 导入：

```typescript
// ❌ src/features/reading/ 导入 src/features/home/ 的组件
// → 应考虑将 CEFRGuideDialog 提升到 src/components/ 或独立共享模块
import { CEFRGuideDialog } from '@/features/home/components/CEFRGuideDialog';
```

---

## 4. 文件命名规范

**适用场景**：创建任何新的 `.ts` / `.tsx` 文件时。

**要求**：

| 文件类型 | 命名规则 | 示例 |
|----------|---------|------|
| React 组件 | PascalCase `.tsx` | `GradeReport.tsx`、`WritingView.tsx` |
| Custom Hook | camelCase + `use` 前缀 `.ts` | `useAuth.ts`、`usePWAInstall.ts` |
| Zustand Store | camelCase + `use` 前缀 + `Store` 后缀 `.ts` | `useAuthStore.ts`、`useUserStore.ts` |
| API 封装 | camelCase + `Api` 后缀 `.ts` | `writingApi.ts`、`authApi.ts` |
| 工具 / 算法 | camelCase `.ts` | `focusWords.ts`、`spaced-repetition.ts` |
| 类型定义 | camelCase `.ts` | `lesson.ts`、`dictionary.ts` |
| API 路由 | `route.ts`（在 kebab-case 目录内） | `send-otp/route.ts` |
| 页面入口 | `page.tsx` | `src/app/writing/page.tsx` |
| 布局 | `layout.tsx` | `src/app/layout.tsx` |
| 测试文件 | 同源文件名 + `.test.ts` | `focusWords.test.ts` |
| Barrel Export | `index.ts` | `grading/index.ts` |

补充规则：

- API 路由目录**必须**使用 **kebab-case**（如 `send-otp/`、`reset-password-with-token/`）
- 动态路由段使用方括号命名法（如 `[id]/`、`[topicId]/`）
- **禁止**在文件名中使用空格或中文字符
- 组件文件名**必须**与其默认导出的组件名一致
- 一个文件一个组件

---

## 5. 导入路径规范

**适用场景**：编写任何 `import` 语句时。

**要求**：

1. **必须使用 `@/` 路径别名**：所有跨 `src/` 子目录的导入必须使用 `@/` 前缀（映射到 `src/`）
2. **禁止使用相对路径跨越模块边界**：如 `../../lib/supabase` 必须写为 `@/lib/supabase`
3. **同目录内允许相对导入**：同一 feature 子目录内的导入可用 `./` 或 `../`
4. **导入顺序**（建议）：
   - 第三方库（`react`、`next`、`zustand`、`lucide-react` 等）
   - `@/lib/` 核心工具
   - `@/store/`、`@/hooks/`、`@/types/` 共享模块
   - `@/features/[current-feature]/` 当前 feature 内模块
   - 相对路径 `./`

**示例**：

正确：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { serverEnv } from '@/lib/env/server';
import { generateOtp, hashOtp } from '@/lib/otp';
import { buildVerificationEmail } from '@/lib/email-templates/verification';
```

正确 — 同 feature 内相对导入：

```typescript
// src/features/lesson/components/quiz/registry.ts 内部
import { TFNGQuestionView } from './question-types/TFNGQuestionView';
```

错误：

```typescript
// ❌ 禁止：相对路径跨越模块边界
import { supabase } from '../../lib/supabase';
```

---

## 6. 页面路由组织

**适用场景**：在 `src/app/` 下创建或修改页面路由时。

**要求**：

- `page.tsx` **必须是薄壳（thin shell）**：仅负责导入 feature View 组件 + 可选的 server 端数据获取
- **禁止**在 `page.tsx` 中编写业务 UI 逻辑 — 必须委托给 `@/features/[name]/components/[Name]View`
- Server Component 页面可直接调用 `src/lib/` 中的数据获取函数
- 需要 `useSearchParams` 等 client API 时，将客户端逻辑封装在 feature 组件中，page 用 `<Suspense>` 包裹
- 动态路由使用 `[param]` 命名法，参数名应语义化（如 `[id]`、`[topicId]`）

**示例**：

最小 page（最常见模式）：

```typescript
// src/app/learn/page.tsx — 3 行即可
import { LearnView } from '@/features/learn/components/LearnView';

export default function LearnPage() {
  return <LearnView />;
}
```

带 server 端数据获取的 page：

```typescript
// src/app/reading/page.tsx
import { ReadingView } from '@/features/reading/components/ReadingView';
import { getLessons } from '@/lib/lessons-db';

export default async function ReadingPage() {
  const { lessons } = await getLessons();
  return <ReadingView lessons={lessons} />;
}
```

需要 client API 的 page（用 Suspense 包裹）：

```typescript
// src/app/review/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ReviewView } from '@/features/review/components/ReviewView';

function ReviewContent() {
  const searchParams = useSearchParams();
  // ...解析参数
  return <ReviewView words={words} difficulty={difficulty} />;
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ReviewContent />
    </Suspense>
  );
}
```

---

## 7. API 路由组织

**适用场景**：在 `src/app/api/` 下创建或修改后端 API 端点时。

**要求**：

- API routes 按**领域**分组：`api/auth/`、`api/writing/`、`api/review/` 等
- 目录结构：`src/app/api/[domain]/[action]/route.ts`
- 目录名**必须**使用 **kebab-case**
- 每个 `route.ts` 只导出 HTTP 方法函数（`GET`、`POST`、`PUT`、`DELETE`）
- CRUD 集合用域名根路由，单个资源用动态段：
  - 列表：`GET /api/lessons/route.ts`
  - 单条：`GET /api/lessons/[id]/route.ts`
- 动作类 API 用动词短语命名目录：`send-otp/`、`verify-otp/`、`reset-password-with-token/`
- **业务逻辑应委托给 `src/lib/`**，`route.ts` 只负责请求解析、鉴权、错误处理和响应构造

**示例**：

```
src/app/api/
├── auth/
│   ├── check-user/route.ts
│   ├── send-otp/route.ts
│   ├── verify-otp/route.ts
│   ├── send-reset-link/route.ts
│   └── reset-password-with-token/route.ts
├── dictionary/route.ts
├── lessons/
│   ├── route.ts              # GET: 课程列表
│   └── [id]/route.ts         # GET: 单条课程
├── review/
│   ├── generate/route.ts
│   ├── save/route.ts
│   └── lessons/
│       ├── route.ts
│       └── [id]/route.ts
├── tts/route.ts
└── writing/
    ├── create-topic/route.ts
    ├── grade/route.ts
    ├── ocr/route.ts
    ├── submit/route.ts
    ├── submissions/route.ts
    └── topics/route.ts
```

---

## 8. 状态管理文件规范

**适用场景**：创建或修改 Zustand store 时。

**要求**：

- 所有 Zustand store **必须**放在 `src/store/`
- 每个 store 一个文件，命名 `use[Domain]Store.ts`
- Store **禁止**导入 `src/features/`（store 是共享基础设施，依赖方向：feature → store）
- Feature 专属的 store 封装 hook 放在 `src/features/[name]/hooks/`（如 `useAuth` 封装 `useAuthStore`）

当前 store 清单：

| Store | 持久化 | 职责 |
|-------|--------|------|
| `useAuthStore` | 否 | 会话、auth token、用户 ID |
| `useUserStore` | localStorage | 生词本、词典缓存、测验记录 |
| `useLessonStore` | 否 | Tab 状态、Quiz 进度 |
| `usePreferenceStore` | localStorage | 用户偏好设置 |
| `useWritingStore` | 否 | 写作编辑器状态 |

---

## 9. 测试文件组织

**适用场景**：编写单元测试或集成测试时。

**要求**：

- 单元测试**必须**放在 `src/__tests__/`，镜像源码目录结构
- 测试文件命名：`[module].test.ts`
- E2E 测试放在项目根目录 `e2e/`（Playwright）
- 测试运行器为 Vitest（`pnpm test`）

**示例**：

```
src/__tests__/
├── grading/                         # 对应 features/lesson/components/quiz/grading/
│   ├── gradeCompletion.test.ts
│   ├── gradeMatchingFeatures.test.ts
│   ├── gradeMatchingHeadings.test.ts
│   ├── gradeMatchingInformation.test.ts
│   ├── gradeMultipleChoice.test.ts
│   └── gradeTFNG.test.ts
└── lib/                             # 对应 src/lib/
    ├── focusWords.test.ts
    └── spaced-repetition.test.ts
```

---

## 10. 环境变量管理

**适用场景**：新增或使用环境变量时。

**要求**：

- 客户端环境变量（`NEXT_PUBLIC_*`）**必须**通过 `@/lib/env/client.ts` 读取
- 服务端环境变量**必须**通过 `@/lib/env/server.ts` 读取
- 两个模块均使用 Zod schema 验证
- **禁止**在业务代码中直接使用 `process.env`
- **禁止**在 `'use client'` 文件中导入 `@/lib/env/server`

**示例**：

正确：

```typescript
import { serverEnv } from '@/lib/env/server';
const apiKey = serverEnv.OPENAI_API_KEY;
```

错误：

```typescript
// ❌ 禁止：直接使用 process.env
const apiKey = process.env.OPENAI_API_KEY;
```

---

## 11. 深层嵌套指南

**适用场景**：Feature 的 `components/` 目录文件数量增长，需要子分组时。

**要求**：

- Feature 内组件目录默认保持扁平
- 子分组仅在有明确的、内聚的子领域时才允许（如 `quiz/` 包含评分策略 + 题型组件）
- `components/` 下嵌套最多 **3 层**（如 `components/quiz/grading/gradeCompletion.ts`）
- 子目录至少包含 **3 个相关文件**才可创建
- Barrel export（`index.ts`）仅在深层嵌套的子模块聚合时使用

**示例**：

合理的深层嵌套（策略模式 + 注册表模式）：

```
src/features/lesson/components/
├── Article.tsx
├── LessonView.tsx
├── Quiz.tsx
└── quiz/                          # 第 1 层：Quiz 子领域
    ├── QuestionRenderer.tsx
    ├── registry.ts
    ├── types.ts
    ├── grading/                   # 第 2 层：8 个评分策略文件
    │   ├── index.ts               # barrel export
    │   ├── gradeCompletion.ts
    │   ├── gradeMatchingFeatures.ts
    │   ├── gradeMatchingHeadings.ts
    │   ├── gradeMatchingInformation.ts
    │   ├── gradeMultipleChoice.ts
    │   ├── gradeTFNG.ts
    │   └── gradeLegacySingle.ts
    └── question-types/            # 第 2 层：6 个题型渲染组件
        ├── TFNGQuestionView.tsx
        ├── MultipleChoiceView.tsx
        └── ...
```

---

## 12. 反模式

**适用场景**：代码审查或提交前自检时。

1. **禁止将 feature 组件放入 `src/components/`**
   `src/components/` 仅限全局 app-shell 组件（`AppShell`、`AppNavBar`）。Feature 组件必须放入 `src/features/[name]/components/`。

2. **禁止在 `page.tsx` 中编写业务 UI 逻辑**
   Page 是薄壳，必须委托给 feature 的 `*View` 组件。Server-side 数据获取可在 page 中执行，但 UI 渲染必须委托给 feature。

3. **禁止创建 `src/utils/`、`src/helpers/`、`src/services/` 等目录**
   使用 `src/lib/` 放置共享工具。使用 `src/features/[name]/lib/` 放置 feature 专属工具。

4. **禁止在 feature 模块根目录创建非标准子目录**
   Feature 子目录只允许 `components/`、`hooks/`、`lib/`，加上可选的 `types.ts` 文件。

5. **禁止在 feature 根目录直接放置松散文件**
   组件必须放在 `features/[name]/components/` 下，不可直接放在 `features/[name]/`（`types.ts` 除外）。

6. **禁止使用相对路径跨越模块边界**
   跨 `src/` 子目录的导入必须使用 `@/` 别名。

7. **禁止 store 导入 feature 代码**
   Store 是共享基础设施，依赖方向为 feature → store，反向依赖会导致循环引用。

8. **禁止在客户端组件导入 `@/lib/env/server`**
   Server 环境变量包含密钥，客户端导入会导致构建错误和潜在泄露。

9. **禁止直接使用 `process.env`**
   所有环境变量必须通过 `@/lib/env/` 模块读取。

10. **禁止无理由的深层嵌套**
    不要为少于 3 个文件创建子目录。扁平优于嵌套。

---

## 快速参考

| 场景 | 位置 | 命名 |
|------|------|------|
| 全局 Shell 组件 | `src/components/` | `PascalCase.tsx` |
| Feature 组件 | `src/features/[name]/components/` | `PascalCase.tsx` |
| Feature Hook | `src/features/[name]/hooks/` | `useCamelCase.ts` |
| Feature API 调用 | `src/features/[name]/lib/` | `camelCaseApi.ts` |
| Feature 类型 | `src/features/[name]/types.ts` | `types.ts` |
| 共享 Hook | `src/hooks/` | `useCamelCase.ts` |
| 共享工具 / 服务 | `src/lib/` | `camelCase.ts` |
| 共享类型 | `src/types/` | `camelCase.ts` |
| Zustand Store | `src/store/` | `use[Domain]Store.ts` |
| 页面路由 | `src/app/[route]/page.tsx` | `page.tsx` |
| API 路由 | `src/app/api/[domain]/[action]/route.ts` | `route.ts`（kebab-case 目录） |
| 单元测试 | `src/__tests__/`（镜像源码结构） | `[module].test.ts` |
| 环境变量 | `src/lib/env/` | `client.ts` / `server.ts` |
