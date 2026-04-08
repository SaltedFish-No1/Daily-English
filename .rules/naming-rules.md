# TypeScript 命名规范 / Naming Conventions

> 本规范适用于项目中所有 `.ts` / `.tsx` 文件及目录结构。编写代码时**必须严格遵守**以下规则。
>
> This specification applies to all `.ts` / `.tsx` files and directory structures. All code **MUST** strictly follow these rules.

---

## 目录 / Table of Contents

1. [目录与文件夹命名 / Directory](#1-目录与文件夹命名--directory)
2. [文件命名 / File](#2-文件命名--file)
3. [React 组件命名 / React Component](#3-react-组件命名--react-component)
4. [函数命名 / Function](#4-函数命名--function)
5. [自定义 Hook 与 Store / Hook & Store](#5-自定义-hook-与-store--hook--store)
6. [接口与类型命名 / Interface & Type](#6-接口与类型命名--interface--type)
7. [变量命名 / Variable](#7-变量命名--variable)
8. [常量命名 / Constant](#8-常量命名--constant)
9. [API 路由与环境变量 / API Route & Env](#9-api-路由与环境变量--api-route--env)
10. [数据属性与 CSS / Data Attributes & CSS](#10-数据属性与-css--data-attributes--css)

---

## 语言风格 / Language Style

- **中文为主**：描述性文字使用中文，贴近团队阅读习惯。
- **英文保留**：代码标识符、技术术语（如 `PascalCase`、`kebab-case`、`Hook`、`Store`）保持英文原文。

---

## 1. 目录与文件夹命名 / Directory

**适用场景 / When**：`src/` 下所有目录，包括功能模块、子目录、API 路由目录。

**要求 / Rules**：
- 功能模块目录使用 **kebab-case**（全小写，单词间用 `-` 连接）
- 标准子目录名称固定：`components/`、`hooks/`、`lib/`、`types/`、`store/`
- API 路由目录使用 kebab-case，与 URL 路径段保持一致
- 禁止使用 camelCase 或 PascalCase 命名目录

**示例 / Example**：

```
✅ 正确
src/features/photo-capture/
src/features/auth/hooks/
src/app/api/send-otp/
src/app/api/writing/parse-topic-image/

❌ 错误
src/features/photoCapture/
src/features/PhotoCapture/
src/app/api/sendOtp/
```

---

## 2. 文件命名 / File

**适用场景 / When**：项目中所有 `.ts` / `.tsx` 文件。

**要求 / Rules**：

| 文件类别 | 命名格式 | 扩展名 | 示例 |
|----------|---------|--------|------|
| React 组件 | PascalCase | `.tsx` | `AppNavBar.tsx`, `WritingEditor.tsx` |
| 自定义 Hook | `use` + PascalCase | `.ts` | `useReviewWords.ts`, `usePWAInstall.ts` |
| Zustand Store | `use` + PascalCase + `Store` | `.ts` | `useUserStore.ts`, `useAuthStore.ts` |
| 类型定义 | camelCase（领域名词） | `.ts` | `lesson.ts`, `dictionary.ts`, `quiz.ts` |
| 工具/库函数 | kebab-case | `.ts` | `spaced-repetition.ts`, `api-auth.ts` |
| API 路由 | 固定 `route` | `.ts` | `route.ts` |
| 单元测试 | `<模块名>.test` | `.ts` | `gradeCompletion.test.ts` |
| E2E 测试 | `<功能名>.spec` | `.ts` | `auth.spec.ts`, `home.spec.ts` |
| 常量/配置 | kebab-case 或 camelCase | `.ts` | `constants.ts`, `ai-middleware.ts` |

- 组件文件**必须**使用 `.tsx` 扩展名（即使没有 JSX，只要导出 React 组件）
- 纯逻辑文件使用 `.ts` 扩展名
- 文件名应与其导出的主要标识符对应：组件文件名 = 组件名，Hook 文件名 = Hook 函数名

**示例 / Example**：

```
✅ 正确
PhotoCaptureModal.tsx    → export function PhotoCaptureModal
useAuth.ts               → export function useAuth()
useWritingStore.ts       → export const useWritingStore = create(...)
spaced-repetition.ts     → export function calculateNextReview(...)

❌ 错误
photo-capture-modal.tsx  （组件文件应 PascalCase）
UseAuth.ts               （Hook 文件名首字母小写）
user-store.ts            （Store 文件应以 use 开头）
```

---

## 3. React 组件命名 / React Component

**适用场景 / When**：所有 React 函数组件的定义与导出。

**要求 / Rules**：
- 组件名使用 **PascalCase**
- 使用语义化后缀表达组件职责：

| 后缀 | 用途 | 示例 |
|------|------|------|
| `View` | 页面级主视图 | `LoginView`, `DashboardView`, `ProfileView` |
| `Modal` | 弹窗/对话框 | `PhotoCaptureModal`, `CEFRGuideDialog` |
| `Form` | 表单 | `EmailLoginForm`, `PhoneLoginForm` |
| `Card` | 卡片式展示 | `SwipeCard`, `TopicCard`, `GradeScoreCard` |
| `Editor` | 编辑器 | `WritingEditor` |
| 无后缀 | 通用 UI 组件 | `Article`, `AppNavBar`, `AppShell` |

- Props 接口命名：`<ComponentName>Props`
- 组件定义风格统一：`export function Foo()` 或 `export const Foo: React.FC<Props>`

**示例 / Example**：

```typescript
// Props 接口以组件名 + Props 命名
interface ArticleProps {
  article: LessonArticle;
  focusWords: FocusWord[];
}

// 组件名 PascalCase，与文件名一致
export const Article: React.FC<ArticleProps> = ({ article, focusWords }) => {
  // ...
};
```

```typescript
// 页面级视图使用 View 后缀
export function DashboardView() {
  // ...
}
```

---

## 4. 函数命名 / Function

**适用场景 / When**：所有导出函数和重要的内部函数。

**要求 / Rules**：
- 使用 **camelCase**，以**动词**开头
- 根据语义选择合适的动词前缀：

| 前缀 | 语义 | 示例 |
|------|------|------|
| `get` | 获取/读取数据 | `getAuthUserId`, `getWordsForReview` |
| `set` | 设置状态 | `setSelectedWordContext` |
| `build` | 构建/组装数据结构 | `buildRenderableTokens`, `buildVerificationEmail` |
| `parse` | 解析/转换格式 | `parseClientEnv` |
| `calculate` | 计算 | `calculateNextReview` |
| `generate` | 生成 | `generateOtp` |
| `hash` | 哈希处理 | `hashOtp` |
| `fetch` | 网络请求 | `fetchDictionaryFromApi` |
| `normalize` | 标准化 | `normalizeDictionaryQuery`, `normalizeAnswer` |
| `validate` | 校验 | `validateQuality` |
| `is` | 布尔判断函数 | `isActive`, `isPhotoCaptureOccurrence` |
| `handle` | 事件处理（仅组件内） | `handleWordSelect`, `handleInstall` |

- 事件处理函数使用 `handle` + 事件/动作名，仅用于组件内部
- 回调 prop 使用 `on` + 事件名：`onSubmit`、`onChange`、`onWordSelect`
- 禁止无意义命名（如 `doStuff`、`processData`、`helper`）

**示例 / Example**：

```typescript
// ✅ 动词开头，语义清晰
export function calculateNextReview(quality: number, state: WordReviewState): WordReviewState { ... }
export function buildRenderableTokens(text: string, focusWords: string[]): RenderableToken[] { ... }
function getAuthUserId(): string | null { ... }

// ✅ 组件内事件处理
const handleWordSelect = (surface: string, query: string) => { ... };
const handleInstall = async () => { ... };

// ❌ 缺少动词前缀
export function nextReview(quality: number) { ... }
// ❌ 语义模糊
function processWord(word: string) { ... }
```

---

## 5. 自定义 Hook 与 Store / Hook & Store

**适用场景 / When**：`src/hooks/` 下的自定义 Hook 和 `src/store/` 下的 Zustand Store。

**要求 / Rules**：

### Hook
- 命名格式：`use` + 功能描述（PascalCase）
- 函数名与文件名一致
- 返回值应语义明确

### Store
- 命名格式：`use` + 领域名 + `Store`
- State 接口命名：`<领域名>State`（如 `UserState`、`PreferenceState`）
- Action 方法使用动词开头（与函数命名规则一致）

**示例 / Example**：

```typescript
// Hook：use + 功能
export function useReviewWords() { ... }    // ✅ 文件名 useReviewWords.ts
export function useSpeech() { ... }          // ✅ 文件名 useSpeech.ts
export function usePWAInstall() { ... }      // ✅ 文件名 usePWAInstall.ts

// Store：use + 领域 + Store
export const useUserStore = create<UserState>()(...)    // ✅ 文件名 useUserStore.ts
export const useAuthStore = create<AuthState>()(...)    // ✅ 文件名 useAuthStore.ts

// State 接口
interface UserState {
  savedWords: SavedVocabIndex;
  initWordReviewState: (word: string) => void;   // action 动词开头
  updateWordReview: (word: string, quality: number) => void;
  resetStore: () => void;
}
```

```typescript
// ❌ 错误示例
export function reviewWords() { ... }       // 缺少 use 前缀
export const userStore = create(...)        // Store 缺少 use 前缀
export const useUser = create(...)          // Store 缺少 Store 后缀
interface UserStore { ... }                 // State 接口应命名为 UserState
```

---

## 6. 接口与类型命名 / Interface & Type

**适用场景 / When**：所有 `interface`、`type` 定义。

**要求 / Rules**：
- 使用 **PascalCase**
- **禁止**使用 `I` 前缀（如 ~~`ILesson`~~），直接使用名词
- 接口名应反映其数据的领域含义
- 常用后缀约定：

| 后缀 | 用途 | 示例 |
|------|------|------|
| `Props` | 组件 props | `ArticleProps`, `NavTab` |
| `State` | Store 状态 | `UserState`, `PreferenceState` |
| `Meta` | 元数据 | `LessonMeta` |
| `Option` | 选项项 | `MatchingHeadingOption` |
| `Result` | 操作结果 | `GradeResult` |
| `Record` | 数据记录 | `DictionaryCacheRecord` |
| `Index` | 索引/映射 | `SavedVocabIndex`, `DictionaryCacheIndex` |

- 联合类型（Union Type）字面量：
  - 枚举式标签值：**UPPER_SNAKE_CASE** — `'TRUE' | 'FALSE' | 'NOT_GIVEN'`
  - 状态/分类值：**小写 snake_case** — `'matching_headings' | 'completion'`
  - 简单状态词：**小写单词** — `'new' | 'learning' | 'reviewing' | 'mastered'`

**示例 / Example**：

```typescript
// ✅ PascalCase，语义清晰
export interface LessonDetail {
  id: string;
  title: string;
  paragraphs: Paragraph[];
}

export type LessonDifficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type IELTSQuestionType =
  | 'tfng'
  | 'matching_headings'
  | 'matching_information'
  | 'completion'
  | 'multiple_choice';

export type TFNGLabel = 'TRUE' | 'FALSE' | 'NOT_GIVEN';

// ❌ 错误
export interface ILessonDetail { ... }    // 禁止 I 前缀
export type lessonDifficulty = ...;       // type alias 必须 PascalCase
```

---

## 7. 变量命名 / Variable

**适用场景 / When**：函数内局部变量、组件内状态、参数。

**要求 / Rules**：
- 使用 **camelCase**
- 布尔变量**必须**使用语义前缀：

| 前缀 | 语义 | 示例 |
|------|------|------|
| `is` | 当前状态判断 | `isActive`, `isLoading`, `isGuest`, `isInstalled` |
| `has` | 是否拥有/包含 | `hasError`, `hasPermission` |
| `show` | 是否显示 | `showHint`, `showModal` |
| `should` | 是否应该执行 | `shouldSync`, `shouldRedirect` |

- 解构赋值保持原始属性名，避免无意义重命名
- 数组变量使用**复数名词**：`words`、`paragraphs`、`tabs`
- 映射/索引变量使用 `*Map`、`*Index`、`*Record`：`answerMap`、`savedWords`

**示例 / Example**：

```typescript
// ✅ 布尔值使用语义前缀
const [showHint, setShowHint] = useState(true);
const [isLoading, setIsLoading] = useState(false);
const isSameSelection = selectedWordContext?.surface === surface;

// ✅ 数组使用复数
const tabs: NavTab[] = [...];
const paragraphs = article.paragraphs;

// ✅ 解构保持原名
const { savedWords, dictionaryCache, history } = useUserStore();

// ❌ 布尔值缺少前缀
const loading = true;        // 应为 isLoading
const hint = true;           // 应为 showHint
const active = false;        // 应为 isActive
```

---

## 8. 常量命名 / Constant

**适用场景 / When**：模块级常量、配置值、阈值、正则表达式、Zod schema。

**要求 / Rules**：

| 类别 | 命名格式 | 示例 |
|------|---------|------|
| 不可变原始值 | UPPER_SNAKE_CASE | `MIN_EASINESS`, `CACHE_TTL_MS`, `MS_PER_DAY` |
| 不可变字符串 | UPPER_SNAKE_CASE | `PHOTO_CAPTURE_PREFIX` |
| 正则表达式 | UPPER_SNAKE_CASE + `_RE` | `EMAIL_RE` |
| 导出配置对象 | camelCase | `modelFast`, `clientEnv`, `serverEnv` |
| 数组/对象字面量 | camelCase | `tabs`, `publicPaths` |
| Zod schema | camelCase + `Schema` | `clientEnvSchema`, `gradingRequestSchema` |

- 魔术数字（magic number）**必须**提取为命名常量
- 相关常量应分组，组前用分隔注释标明主题

**示例 / Example**：

```typescript
// ✅ 模块级不可变值：UPPER_SNAKE_CASE
const MIN_EASINESS = 1.3;
const INITIAL_EASINESS = 2.5;
const OTP_EXPIRY_MINUTES = 10;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ✅ 正则表达式
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ✅ 导出配置对象：camelCase
export const modelFast = wrapLanguageModel({ ... });
export const clientEnv = { ... };

// ✅ Zod schema
const clientEnvSchema = z.object({ ... });

// ❌ 错误
const min_easiness = 1.3;     // 原始常量应 UPPER_SNAKE_CASE
const ClientEnvSchema = ...;  // Zod schema 应 camelCase
const TABS = [...];           // 数组常量应 camelCase
```

---

## 9. API 路由与环境变量 / API Route & Env

**适用场景 / When**：`src/app/api/` 下的路由文件和 `.env` 环境变量。

**要求 / Rules**：

### API 路由
- 路由目录使用 **kebab-case**，与 URL 路径段一致
- 路由文件固定命名 `route.ts`
- 导出函数使用 HTTP 方法原名（大写）：`GET`、`POST`、`PUT`、`DELETE`、`PATCH`
- 动态路由参数使用 `[camelCase]`：`[id]`、`[topicId]`

### 环境变量
- 使用 **UPPER_SNAKE_CASE**
- 客户端变量**必须**以 `NEXT_PUBLIC_` 前缀开头
- 服务端变量无特殊前缀

**示例 / Example**：

```
✅ 路由目录结构
src/app/api/auth/send-otp/route.ts        → POST /api/auth/send-otp
src/app/api/lessons/[id]/route.ts          → GET  /api/lessons/:id
src/app/api/writing/parse-topic-image/route.ts

❌ 错误
src/app/api/auth/sendOtp/route.ts          （目录应 kebab-case）
```

```typescript
// ✅ HTTP 方法导出
export async function GET(request: NextRequest) { ... }
export async function POST(request: NextRequest) { ... }

// ❌ 错误
export async function handlePost(request: NextRequest) { ... }
```

```bash
# ✅ 环境变量
NEXT_PUBLIC_SUPABASE_URL=...       # 客户端可用
SUPABASE_SERVICE_ROLE_KEY=...      # 仅服务端
OPENAI_API_KEY=...

# ❌ 错误
supabase_url=...                   # 应 UPPER_SNAKE_CASE
NEXT_PUBLIC_supabaseUrl=...        # 整体应 UPPER_SNAKE_CASE
```

---

## 10. 数据属性与 CSS / Data Attributes & CSS

**适用场景 / When**：HTML 自定义数据属性和样式方案。

**要求 / Rules**：
- 自定义 `data-*` 属性使用 **kebab-case**
- 样式方案以 **Tailwind utility classes** 为主，不自定义 CSS class 名
- 如需自定义 CSS class，使用 kebab-case

**示例 / Example**：

```tsx
// ✅ data 属性 kebab-case
<span data-word={word} data-paragraph-index={idx}>
  {text}
</span>

// ✅ Tailwind utility classes
<div className="flex items-center gap-2 rounded-lg bg-white p-4">
  ...
</div>

// ❌ 错误
<span dataWord={word}>               {/* 应为 data-word */}
<span data-paragraphIndex={idx}>     {/* 应为 data-paragraph-index */}
```

---

## 快速参考 / Quick Reference

| 场景 / Scenario | 命名格式 / Format | 示例 / Example |
|---|---|---|
| 目录 | kebab-case | `photo-capture/`, `send-otp/` |
| 组件文件 | PascalCase.tsx | `AppNavBar.tsx` |
| Hook 文件 | use\*.ts | `useReviewWords.ts` |
| Store 文件 | use\*Store.ts | `useUserStore.ts` |
| 类型文件 | camelCase.ts | `lesson.ts`, `quiz.ts` |
| 工具文件 | kebab-case.ts | `spaced-repetition.ts` |
| 测试文件 | \*.test.ts / \*.spec.ts | `auth.spec.ts` |
| React 组件 | PascalCase | `PhotoCaptureModal` |
| Props 接口 | \<Component\>Props | `ArticleProps` |
| State 接口 | \<Domain\>State | `UserState` |
| 函数 | camelCase（动词开头） | `calculateNextReview` |
| Hook 函数 | use + PascalCase | `useAuth`, `useSpeech` |
| Store | use + Domain + Store | `useUserStore` |
| 接口/类型 | PascalCase | `LessonMeta`, `FocusWord` |
| 布尔变量 | is/has/show/should + Name | `isLoading`, `showHint` |
| 原始常量 | UPPER_SNAKE_CASE | `MIN_EASINESS` |
| 正则常量 | UPPER_SNAKE_CASE + \_RE | `EMAIL_RE` |
| 配置对象 | camelCase | `modelFast`, `clientEnv` |
| Zod schema | camelCase + Schema | `clientEnvSchema` |
| 事件处理 | handle + Action | `handleInstall` |
| 回调 prop | on + Event | `onSubmit`, `onChange` |
| 环境变量 | UPPER_SNAKE_CASE | `OPENAI_API_KEY` |
| data 属性 | data-kebab-case | `data-word` |
