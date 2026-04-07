# TypeScript 注释规范 / Comment Conventions

> 本规范适用于项目中所有 `.ts` / `.tsx` 文件。编写代码时**必须严格遵守**以下规则。
>
> This specification applies to all `.ts` / `.tsx` files. All code **MUST** strictly follow these rules.

---

## 目录 / Table of Contents

1. [文件头注释 / File Header](#1-文件头注释--file-header)
2. [函数头注释 / Function Header](#2-函数头注释--function-header)
3. [接口与类型头注释 / Interface & Type Header](#3-接口与类型头注释--interface--type-header)
4. [React 组件注释 / React Component](#4-react-组件注释--react-component)
5. [API 路由处理函数注释 / API Route Handler](#5-api-路由处理函数注释--api-route-handler)
6. [Store / 状态管理注释 / State Management](#6-store--状态管理注释--state-management)
7. [枚举与常量注释 / Enum & Constant](#7-枚举与常量注释--enum--constant)
8. [接口属性注释 / Interface Property](#8-接口属性注释--interface-property)
9. [复杂逻辑注释 / Complex Logic](#9-复杂逻辑注释--complex-logic)
10. [行内注释原则 / Inline Comment Principle](#10-行内注释原则--inline-comment-principle)
11. [@deprecated 废弃标记 / Deprecation](#11-deprecated-废弃标记--deprecation)
12. [TODO / FIXME / NOTE 标记 / Task Markers](#12-todo--fixme--note-标记--task-markers)

---

## 语言风格 / Language Style

- **中文为主**：描述性文字使用中文，贴近团队阅读习惯。
- **英文 JSDoc 标签**：`@author`、`@description`、`@param`、`@returns` 等标签名保持英文。
- **技术术语不翻译**：如 `token`、`middleware`、`OTP`、`SSR` 等可直接使用英文原文。

---

## 1. 文件头注释 / File Header

**适用场景 / When**：每个 `.ts` / `.tsx` 文件的**第一行**（`'use client'` 指令之后）。

**要求 / Rules**：
- 必须包含 `@author` 和 `@description`
- `@description` 用一句话说明文件的职责与作用范围
- 若文件有重要约束或使用须知，在描述后用换行补充

**示例 / Example**：

```typescript
/**
 * @author SaltedFish-No1
 * @description Token 工具函数：生成安全随机 token、哈希、timing-safe 比较。
 *   用于邮件链接验证（如密码重置）。
 */
```

```typescript
'use client';

/**
 * @author SuperQ
 * @description 课程详情页 — 展示文章正文、生词高亮、测验入口。
 *   依赖 LessonProvider 提供课程上下文数据。
 */
```

---

## 2. 函数头注释 / Function Header

**适用场景 / When**：所有导出函数（`export function` / `export const fn =`）以及复杂的内部函数。

**要求 / Rules**：
- 必须包含 `@description`：概述函数的目的
- 必须包含 `@param`：每个参数的含义、类型约束、默认值
- 必须包含 `@returns`：返回值的含义
- 可选 `@author`：若与文件作者不同
- 可选 `@example`：当用法不直观时提供调用示例
- 可选 `@throws`：当函数会抛出异常时说明抛出条件

**示例 / Example**：

```typescript
/**
 * @description SM-2 核心：根据答题质量更新复习状态。
 *
 * @param quality 答题质量评分 0-5：
 *   5 = 完美（答对且快速）
 *   4 = 正确（答对但有犹豫）
 *   3 = 勉强记住（答对但用了提示）
 *   2 = 模糊记忆（答错但选了近义项）
 *   1 = 遗忘（完全答错）
 *   0 = 完全空白
 * @param state 当前复习状态
 * @param now 当前时间戳（ms），默认 Date.now()，便于测试注入
 * @returns 更新后的复习状态对象
 *
 * @example
 * const newState = calculateNextReview(4, currentState);
 * // newState.interval 会根据 quality 增长或缩短
 */
export function calculateNextReview(
  quality: number,
  state: WordReviewState,
  now: number = Date.now(),
): WordReviewState {
  // ...
}
```

```typescript
/**
 * @description 生成指定长度的安全随机 OTP 验证码（纯数字）。
 *
 * @param length 验证码位数，默认 6
 * @returns 纯数字字符串，如 "482916"
 * @throws {Error} 当 length 小于 4 时抛出
 */
export function generateOtp(length: number = 6): string {
  // ...
}
```

---

## 3. 接口与类型头注释 / Interface & Type Header

**适用场景 / When**：所有导出的 `interface` 和 `type`，以及复杂的内部类型定义。

**要求 / Rules**：
- 必须包含 `@description`：说明该类型的用途与使用上下文
- 若类型有重要约束（如互斥字段、必选组合），需在描述中说明

**示例 / Example**：

```typescript
/**
 * @description 课程详情数据结构 — 包含文章段落、重点词汇和测验题目。
 *   由 GET /api/lessons/[id] 返回，供课程详情页消费。
 */
export interface LessonDetail {
  id: string;
  title: string;
  paragraphs: LessonParagraph[];
  focusWords: FocusWord[];
  quizQuestions: QuizQuestion[];
}
```

```typescript
/**
 * @description AI 评分请求参数。
 *   topic 与 submissionId 二选一：新提交传 topic，重新评分传 submissionId。
 */
export type GradingRequest =
  | { topic: WritingTopic; essay: string }
  | { submissionId: string };
```

---

## 4. React 组件注释 / React Component

**适用场景 / When**：所有 React 组件（函数组件）。

**要求 / Rules**：
- 必须包含 `@author` 和 `@description`
- 必须包含 `@param props`：概述组件接收的 props
- 必须包含 `@return`：说明渲染的 UI 内容
- Props 接口应独立定义并遵循[接口属性注释](#8-接口属性注释--interface-property)规范

**示例 / Example**：

```typescript
interface ArticleProps {
  /** 文章段落列表 */
  paragraphs: LessonParagraph[];
  /** 重点词汇，用于高亮渲染 */
  focusWords: FocusWord[];
  /** 界面文案配置（支持 i18n） */
  labels: ArticleLabels;
}

/**
 * @author SuperQ
 * @description 渲染课程正文并处理高亮词点击交互。
 *
 * @param props 文章内容与界面文案配置
 * @return 文章阅读视图组件
 */
export const Article: React.FC<ArticleProps> = ({
  paragraphs,
  focusWords,
  labels,
}) => {
  // ...
};
```

---

## 5. API 路由处理函数注释 / API Route Handler

**适用场景 / When**：`src/app/api/` 下的所有路由文件。

**要求 / Rules**：
- 文件头注释必须描述完整的请求处理流程（用 `→` 连接步骤）
- 关键处理步骤用行内注释标注
- 错误分支可省略注释（HTTP 状态码已自说明）

**示例 / Example**：

```typescript
/**
 * @author SaltedFish-No1
 * @description 发送邮箱验证码 API：
 *   验证请求参数 → 生成 OTP → 哈希存入 email_verifications 表 → 通过 Resend 发送邮件。
 */

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  // 生成 OTP 并哈希（明文不落库）
  const code = generateOtp();
  const hashedCode = hashOtp(code);

  // 写入验证记录，设置 10 分钟过期
  const { error: dbError } = await supabaseAdmin
    .from('email_verifications')
    .upsert({ email, code: hashedCode, expires_at: getExpiry(10) });

  // 发送验证邮件
  const template = buildVerificationEmail(code);
  await resend.emails.send({ to: email, ...template });

  return NextResponse.json({ success: true });
}
```

---

## 6. Store / 状态管理注释 / State Management

**适用场景 / When**：`src/store/` 下的 Zustand Store 定义。

**要求 / Rules**：
- 文件头注释说明 Store 的职责与持久化策略
- State 接口的每个属性和方法必须有 `/** */` 注释
- Action 方法需说明触发场景和副作用

**示例 / Example**：

```typescript
/**
 * @author SaltedFish-No1
 * @description 用户数据 Store — 管理生词本、词典缓存、测验记录和复习状态。
 *   通过 localStorage 持久化，登录后同步至 Supabase。
 */

interface UserState {
  /** 已收藏的生词索引（key: word） */
  savedWords: SavedVocabIndex;
  /** 本地词典查询缓存，减少重复 API 调用 */
  dictionaryCache: DictionaryCacheIndex;
  /** 间隔重复：每个词的复习状态 */
  wordReviewStates: Record<string, WordReviewState>;

  /** 收藏生词时自动初始化复习状态（若不存在） */
  initWordReviewState: (word: string) => void;
  /** Quiz 答题后更新复习状态，quality 取值 0-5 */
  updateWordReview: (word: string, quality: number) => void;
  /** 重置所有用户数据（登出时清理 localStorage） */
  resetStore: () => void;
}
```

---

## 7. 枚举与常量注释 / Enum & Constant

**适用场景 / When**：模块级常量（`const`）、配置项、阈值、枚举类型。

**要求 / Rules**：
- 每个常量必须有 `/** */` 注释，说明用途和取值依据
- 相关常量应分组，组前用注释说明分组主题
- 魔术数字（magic number）必须提取为命名常量并注释

**示例 / Example**：

```typescript
/* ────── 间隔重复算法阈值 ────── */

/** 连续正确次数达到此值且 interval ≥ 30 天时，状态升级为 mastered */
const MASTERY_REPETITIONS = 5;

/** 判定 mastered 所需的最小间隔天数 */
const MASTERY_INTERVAL_DAYS = 30;

/** 一篇复习文章的默认目标词数 */
const DEFAULT_REVIEW_LIMIT = 12;

/** 难度因子下限，防止间隔缩短过快导致过度复习 */
const MIN_EASINESS = 1.3;
```

```typescript
/** 无需登录即可访问的页面路径（白名单） */
const PUBLIC_PATHS = ['/login', '/intro', '/reset-password'];

/** 隐藏全局导航栏的路由 */
const HIDE_NAV_ROUTES = ['/login', '/auth/callback', '/intro', '/review/swipe'];
```

---

## 8. 接口属性注释 / Interface Property

**适用场景 / When**：`interface` 和 `type` 中的每个字段。

**要求 / Rules**：
- 每个属性上方使用 `/** */` 单行注释
- 说明字段的语义、约束条件、默认值、特殊值含义
- 可选字段需说明何时为 `undefined`

**示例 / Example**：

```typescript
export interface WordReviewState {
  /** 当前间隔（天），初始值 1 */
  interval: number;
  /** 难度因子，初始值 2.5，最低 1.3 */
  easiness: number;
  /** 连续正确次数，初始值 0 */
  repetition: number;
  /** 下次复习时间戳（ms） */
  nextReviewAt: number;
  /** 上次复习时间戳（ms），0 表示从未复习 */
  lastReviewedAt: number;
  /** 总复习次数 */
  totalReviews: number;
  /** 总答对次数 */
  totalCorrect: number;
  /** 当前学习阶段：new → learning → reviewing → mastered */
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
}
```

```typescript
interface PreferenceState {
  /** 用户头像 base64 data URL，空字符串表示使用默认头像 */
  avatarUrl: string;
  /** 用户昵称，空字符串表示未设置 */
  nickname: string;
  /** 学习难度偏好，'auto' 表示由系统根据表现自动调整 */
  difficulty: DifficultyPref;
  /** 每日学习目标（分钟），undefined 表示未设定 */
  dailyGoal?: number;
}
```

---

## 9. 复杂逻辑注释 / Complex Logic

**适用场景 / When**：算法实现、多步骤流程、非直觉的业务规则、性能优化技巧。

**要求 / Rules**：
- 在代码块之前用**多行注释**解释整体思路
- 说明"为什么这样做"而不是"代码做了什么"
- 关键分支和边界条件需要注释

**示例 / Example**：

```typescript
/**
 * 两步分词器：先用最长优先的正则按重点词边界断句，再将非重点段拆为单词和间隔。
 * 采用游标递进避免遗漏两个重点词之间的普通文本。
 *
 * 为什么不用简单的 split？
 *   重点词可能包含空格（如 "look up"），简单按空格分词会拆散它们。
 */
export function buildRenderableTokens(
  text: string,
  focusWords: string[],
): RenderableToken[] {
  // 按词长降序排列，确保 "look up" 优先于 "look" 匹配
  const sorted = [...focusWords].sort((a, b) => b.length - a.length);

  // 构建以 \b 包裹的正则，确保只匹配完整词而非子串
  const pattern = new RegExp(
    `\\b(${sorted.map(escapeRegex).join('|')})\\b`,
    'gi',
  );

  // ...
}
```

```typescript
// 安装流程分支：
//   已安装 → 直接返回
//   iOS 非 Safari → 提示切换浏览器
//   iOS + Safari → 显示手动添加引导
//   有 beforeinstallprompt 事件 → 调用原生安装弹窗
//   其他 → 显示通用提示
const handleInstall = async () => {
  if (isInstalled) return;
  // ...
};
```

---

## 10. 行内注释原则 / Inline Comment Principle

**核心原则 / Core Rule**：注释解释**"为什么"（Why）**，而非**"是什么"（What）**。代码本身应该能说明"是什么"。

**要求 / Rules**：
- 使用 `//` 单行注释，放在代码**上方**（而非行尾）
- 简明扼要，一般不超过一行
- 禁止无意义注释（如 `// 遍历数组`、`// 返回结果`）
- 行尾注释仅在极短且与代码紧密关联时使用

**正确示例 / Good**：

```typescript
// 新词排在前面，让用户优先复习陌生词汇
const aNew = a[1].status === 'new' ? 0 : 1;
const bNew = b[1].status === 'new' ? 0 : 1;
if (aNew !== bNew) return aNew - bNew;

// 同类按 nextReviewAt 升序（最紧急的优先）
return a[1].nextReviewAt - b[1].nextReviewAt;
```

```typescript
// 优先取顶层 phonetic/audio，回退到 phonetics 数组中首个有值的项
const preferredPhonetic = entry.phonetic ?? entry.phonetics?.[0]?.text;
```

**错误示例 / Bad**：

```typescript
// 定义变量
const count = 0;

// 遍历数组
for (const item of items) {
  // 调用函数
  process(item);
}

// 返回结果
return result;
```

---

## 11. @deprecated 废弃标记 / Deprecation

**适用场景 / When**：函数、类型、接口字段即将废弃但暂时保留兼容时。

**要求 / Rules**：
- 使用 `@deprecated` JSDoc 标签
- 必须说明废弃原因和替代方案
- 标注预计移除版本或时间（如已知）

**示例 / Example**：

```typescript
/**
 * @deprecated 自 v2.0 起请使用 `useDataSync` hook 替代。
 *   此函数不支持乐观更新，将在 v3.0 移除。
 *
 * @description 手动同步用户数据到 Supabase。
 */
export function syncToCloud(userId: string): Promise<void> {
  // ...
}
```

```typescript
interface UserProfile {
  /** 用户邮箱 */
  email: string;
  /**
   * @deprecated 请使用 `avatarUrl` 替代，此字段将在下次大版本移除。
   * 旧版头像路径（相对路径）
   */
  avatar?: string;
  /** 用户头像完整 URL */
  avatarUrl: string;
}
```

---

## 12. TODO / FIXME / NOTE 标记 / Task Markers

**适用场景 / When**：标记待办事项、已知缺陷、重要提醒。

**要求 / Rules**：
- 格式：`// TAG(作者): 描述内容`
- 三种标签含义：
  - `TODO` — 待实现的功能或待优化项
  - `FIXME` — 已知的 bug 或需要修复的问题
  - `NOTE` — 重要提醒，帮助后续维护者理解上下文
- 必须标注作者，便于追溯
- 若关联 Issue，附加 Issue 编号

**示例 / Example**：

```typescript
// TODO(SaltedFish-No1): 支持批量查词，减少多次 API 调用 (#42)
export async function lookupWord(word: string): Promise<DictionaryEntry> {
  // ...
}
```

```typescript
// FIXME(SuperQ): iOS Safari 下 audio.play() 需要用户手势触发，
//   当前在某些场景下会静默失败，需要增加用户交互提示。
const playPronunciation = (url: string) => {
  // ...
};
```

```typescript
// NOTE(SaltedFish-No1): Supabase RLS 策略要求 service_role key 才能
//   绕过行级安全检查，此处必须使用 supabaseAdmin 而非 supabase client。
const { data } = await supabaseAdmin.from('email_verifications').select('*');
```

---

## 快速参考 / Quick Reference

| 场景 / Scenario | 必须包含 / Required Tags | 可选 / Optional Tags |
|---|---|---|
| 文件头 | `@author`, `@description` | — |
| 函数 | `@description`, `@param`, `@returns` | `@author`, `@example`, `@throws` |
| 接口/类型 | `@description` | — |
| React 组件 | `@author`, `@description`, `@param`, `@return` | — |
| API 路由 | `@author`, `@description`（含流程） | — |
| Store | `@author`, `@description`（含持久化策略） | — |
| 常量 | `/** */` 单行说明 | — |
| 属性 | `/** */` 单行说明（语义+约束+默认值） | — |
| 复杂逻辑 | 多行注释解释思路 | — |
| 行内 | `//` 解释"为什么" | — |
| 废弃 | `@deprecated`（含替代方案） | 移除版本 |
| 标记 | `// TAG(作者): 描述` | Issue 编号 |
