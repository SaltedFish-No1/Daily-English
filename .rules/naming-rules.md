# TypeScript 命名规范 / Naming Conventions

> 适用于所有 `.ts` / `.tsx` 文件及目录。**必须严格遵守。**

---

## 1. 目录命名 / Directory

- **kebab-case**，禁止 camelCase / PascalCase
- 标准子目录固定：`components/`、`hooks/`、`lib/`、`types/`、`store/`
- 动态路由段：`[camelCase]` — `[id]`、`[topicId]`

```
✅ src/features/photo-capture/    src/app/api/send-otp/
❌ src/features/photoCapture/     src/app/api/sendOtp/
```

---

## 2. 文件命名 / File

| 类别 | 格式 | 示例 |
|------|------|------|
| React 组件 | PascalCase`.tsx` | `AppNavBar.tsx`, `WritingEditor.tsx` |
| Hook | `use`PascalCase`.ts` | `useReviewWords.ts`, `usePWAInstall.ts` |
| Store | `use`PascalCase`Store.ts` | `useUserStore.ts`, `useAuthStore.ts` |
| 类型定义 | camelCase`.ts` | `lesson.ts`, `dictionary.ts` |
| 工具/库 | kebab-case`.ts` | `spaced-repetition.ts`, `api-auth.ts` |
| API 路由 | `route.ts` | `route.ts`（固定） |
| 单元测试 | `*.test.ts` | `gradeCompletion.test.ts` |
| E2E 测试 | `*.spec.ts` | `auth.spec.ts` |

- 文件名**必须**与主导出标识符对应（组件名 = 文件名，Hook 名 = 文件名）
- 含 JSX 的文件用 `.tsx`，纯逻辑用 `.ts`

---

## 3. React 组件 / Component

- **PascalCase**，语义化后缀：

| 后缀 | 用途 | 示例 |
|------|------|------|
| `View` | 页面主视图 | `LoginView`, `DashboardView` |
| `Modal`/`Dialog` | 弹窗 | `PhotoCaptureModal`, `CEFRGuideDialog` |
| `Form` | 表单 | `EmailLoginForm` |
| `Card` | 卡片 | `SwipeCard`, `TopicCard` |
| `Editor` | 编辑器 | `WritingEditor` |
| 无后缀 | 通用组件 | `Article`, `AppNavBar` |

- Props 接口：`<ComponentName>Props`
- 定义风格：`export function Foo()` 或 `export const Foo: React.FC<Props>`

---

## 4. 函数命名 / Function

- **camelCase**，以**动词**开头：

| 前缀 | 语义 | 示例 |
|------|------|------|
| `get` | 读取 | `getAuthUserId` |
| `set` | 设置 | `setSelectedWordContext` |
| `build` | 组装 | `buildRenderableTokens` |
| `parse` | 解析 | `parseClientEnv` |
| `calculate` | 计算 | `calculateNextReview` |
| `generate` | 生成 | `generateOtp` |
| `fetch` | 请求 | `fetchDictionaryFromApi` |
| `normalize` | 标准化 | `normalizeDictionaryQuery` |
| `validate` | 校验 | `validateQuality` |
| `is` | 布尔判断 | `isPhotoCaptureOccurrence` |
| `handle` | 事件处理（组件内） | `handleWordSelect` |

- 回调 prop 用 `on` + 事件名：`onSubmit`、`onChange`
- 禁止无意义命名：~~`doStuff`~~、~~`processData`~~、~~`helper`~~

---

## 5. Hook 与 Store / Hook & Store

**Hook**：`use` + 功能（PascalCase），函数名 = 文件名

```typescript
export function useReviewWords() { ... }  // useReviewWords.ts
export function useSpeech() { ... }       // useSpeech.ts
```

**Store**：`use` + 领域 + `Store`，State 接口为 `<领域>State`

```typescript
export const useUserStore = create<UserState>()(...)  // useUserStore.ts

interface UserState {
  savedWords: SavedVocabIndex;
  initWordReviewState: (word: string) => void;  // action 动词开头
  resetStore: () => void;
}
```

---

## 6. 接口与类型 / Interface & Type

- **PascalCase**，**禁止** `I` 前缀（~~`ILesson`~~）
- 后缀约定：`Props`（组件）、`State`（Store）、`Meta`（元数据）、`Result`（结果）、`Record`（记录）、`Index`（映射）、`Option`（选项）
- 联合类型字面量：
  - 枚举标签：UPPER_SNAKE_CASE — `'TRUE' | 'FALSE' | 'NOT_GIVEN'`
  - 分类/题型：小写 snake_case — `'matching_headings' | 'completion'`
  - 简单状态：小写单词 — `'new' | 'learning' | 'mastered'`

---

## 7. 变量命名 / Variable

- **camelCase**
- 布尔值**必须**加前缀：`is`（状态）、`has`（拥有）、`show`（显示）、`should`（条件）

```typescript
✅ isLoading, hasError, showHint, shouldSync
❌ loading, hint, active
```

- 数组用**复数**：`words`、`paragraphs`、`tabs`
- 映射用后缀：`answerMap`、`savedWords`
- 解构保持原名，避免无意义重命名

---

## 8. 常量命名 / Constant

| 类别 | 格式 | 示例 |
|------|------|------|
| 不可变原始值/字符串 | UPPER_SNAKE_CASE | `MIN_EASINESS`, `CACHE_TTL_MS` |
| 正则表达式 | UPPER_SNAKE_CASE + `_RE` | `EMAIL_RE` |
| 导出配置对象 | camelCase | `modelFast`, `clientEnv` |
| 数组/对象字面量 | camelCase | `tabs`, `publicPaths` |
| Zod schema | camelCase + `Schema` | `clientEnvSchema` |

- 魔术数字**必须**提取为命名常量
- 相关常量分组，组前加分隔注释

---

## 9. API 路由与环境变量 / API Route & Env

- 路由目录 **kebab-case**，文件固定 `route.ts`
- 导出 HTTP 方法原名：`GET`、`POST`、`PUT`、`DELETE`（禁止 ~~`handlePost`~~）
- 环境变量 **UPPER_SNAKE_CASE**，客户端必须 `NEXT_PUBLIC_` 前缀

```
✅ src/app/api/auth/send-otp/route.ts → export async function POST(...)
❌ src/app/api/auth/sendOtp/route.ts
```

---

## 10. 数据属性与 CSS / Data Attributes & CSS

- `data-*` 属性：**kebab-case** — `data-word`、`data-paragraph-index`
- 样式：**Tailwind utility classes** 为主，不自定义 CSS class 名
- 如需自定义 class：kebab-case

---

## 快速参考 / Quick Reference

| 场景 | 格式 | 示例 |
|------|------|------|
| 目录 | kebab-case | `photo-capture/` |
| 组件文件 | PascalCase.tsx | `AppNavBar.tsx` |
| Hook 文件 | use\*.ts | `useReviewWords.ts` |
| Store 文件 | use\*Store.ts | `useUserStore.ts` |
| 类型文件 | camelCase.ts | `lesson.ts` |
| 工具文件 | kebab-case.ts | `spaced-repetition.ts` |
| 测试文件 | \*.test.ts / \*.spec.ts | `auth.spec.ts` |
| 组件名 | PascalCase | `PhotoCaptureModal` |
| Props | \<Component\>Props | `ArticleProps` |
| State | \<Domain\>State | `UserState` |
| 函数 | camelCase 动词开头 | `calculateNextReview` |
| Hook | use + PascalCase | `useAuth` |
| Store | use + Domain + Store | `useUserStore` |
| 接口/类型 | PascalCase | `LessonMeta` |
| 布尔变量 | is/has/show/should | `isLoading` |
| 原始常量 | UPPER_SNAKE_CASE | `MIN_EASINESS` |
| 正则 | UPPER_SNAKE_CASE\_RE | `EMAIL_RE` |
| 配置对象 | camelCase | `modelFast` |
| Zod schema | camelCase + Schema | `clientEnvSchema` |
| 事件处理 | handle + Action | `handleInstall` |
| 回调 prop | on + Event | `onSubmit` |
| 环境变量 | UPPER_SNAKE_CASE | `OPENAI_API_KEY` |
| data 属性 | data-kebab-case | `data-word` |
