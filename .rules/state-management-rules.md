# 状态管理规范 / State Management Rules

> 本规范适用于项目中所有状态管理代码。编写代码时**必须严格遵守**以下规则。
>
> This specification applies to all state management code. All code **MUST** strictly follow these rules.

---

## 目录 / Table of Contents

1. [核心原则 / Core Principle](#1-核心原则--core-principle)
2. [Zustand Store 设计 / Store Design](#2-zustand-store-设计--store-design)
3. [持久化策略 / Persistence](#3-持久化策略--persistence)
4. [云端同步 / Cloud Sync](#4-云端同步--cloud-sync)
5. [TanStack Query 基础 / Query Basics](#5-tanstack-query-基础--query-basics)
6. [Query Key 约定 / Query Keys](#6-query-key-约定--query-keys)
7. [自定义 Hook / Custom Hooks](#7-自定义-hook--custom-hooks)
8. [状态归属速查 / Quick Reference](#8-状态归属速查--quick-reference)
9. [迁移指南 / Migration](#9-迁移指南--migration)
10. [反模式 / Anti-Patterns](#10-反模式--anti-patterns)

---

## 1. 核心原则 / Core Principle

**一句话**：Zustand 管理客户端/UI 状态，TanStack Query 管理服务端/异步数据。

### 决策流程 / Decision Flow

| 问题 | 是 | 否 |
|------|----|----|
| 数据来自 API 或数据库？ | → TanStack Query | ↓ |
| 需要跨组件共享的 UI 状态？ | → Zustand | ↓ |
| 仅组件内部使用？ | → `useState` | — |

### 现有 Store 职责 / Current Stores

| Store | 类型 | 持久化 | 云端同步 |
|-------|------|--------|----------|
| `useAuthStore` | 会话状态 | 否 | Supabase SDK 管理 |
| `useLessonStore` | UI 交互状态 | 否 | 否 |
| `usePreferenceStore` | 用户设置 | localStorage | fire-and-forget |
| `useUserStore` | 用户学习数据 | localStorage | fire-and-forget + 登录全量拉取 |
| `useWritingStore` | 编辑器状态 | 部分（仅草稿） | debounced |

---

## 2. Zustand Store 设计 / Store Design

**适用场景 / When**：创建或修改 `src/store/` 下的 Zustand Store。

**要求 / Rules**：
- 命名：`use[Domain]Store`，导出为 `const`
- 单一职责：一个 Store 只管理一个领域
- State 与 Action 定义在同一个 `interface` 中
- 禁止在 Store 中存放 API 响应缓存（应使用 TanStack Query）

**示例 / Example**：

```typescript
interface LessonState {
  /** 当前激活的标签页 */
  activeTab: string;
  setActiveTab: (tab: string) => void;
  /** 当前选中的单词上下文（供词典面板使用） */
  selectedWordContext: SelectedWordContext | null;
  setSelectedWordContext: (context: SelectedWordContext | null) => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  activeTab: 'article',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedWordContext: null,
  setSelectedWordContext: (context) => set({ selectedWordContext: context }),
}));
```

---

## 3. 持久化策略 / Persistence

**适用场景 / When**：需要在页面刷新后保留状态时。

**要求 / Rules**：
- 使用 `zustand/middleware` 的 `persist`
- localStorage key 统一前缀 `daily-english-`
- 临时状态（计时器、loading 等）必须通过 `partialize` 排除
- 每个 Store 仅持久化必要字段，避免 localStorage 膨胀

**示例 / Example**：

```typescript
export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      // 持久化字段
      currentTopicId: null,
      currentDraftText: '',
      // 临时字段（不持久化）
      timerSeconds: 0,
      isTimerRunning: false,
      // actions...
    }),
    {
      name: 'daily-english-writing-storage',
      partialize: (state) => ({
        currentTopicId: state.currentTopicId,
        currentDraftText: state.currentDraftText,
      }),
    }
  )
);
```

---

## 4. 云端同步 / Cloud Sync

**适用场景 / When**：已登录用户的状态需同步到 Supabase。

**要求 / Rules**：
- 写操作使用 fire-and-forget 模式（不阻塞 UI），错误仅 `console.error`
- 同步前必须检查 `getAuthUserId()` 是否存在
- 高频操作（如草稿输入）必须 debounce（≥ 2s）
- 登录时通过 `useDataSync` 全量拉取云端数据并合并

**示例 / Example**：

```typescript
/** fire-and-forget 将偏好部分字段同步到云端 */
function syncPreferenceToCloud(partial: Record<string, unknown>) {
  const userId = getAuthUserId();
  if (!userId) return;
  supabase
    .from('user_preferences')
    .upsert(
      { user_id: userId, ...partial, updated_at: Date.now() },
      { onConflict: 'user_id' }
    )
    .then(({ error }) => {
      if (error) console.error('[CloudSync] user_preferences upsert:', error);
    });
}
```

---

## 5. TanStack Query 基础 / Query Basics

**适用场景 / When**：从 API 获取或修改服务端数据。

**要求 / Rules**：
- **读取**用 `useQuery`，**写入**用 `useMutation`
- 需要登录的查询设置 `enabled: !!userId`
- QueryClient 已配置全局 `staleTime: 60 * 1000`，按需覆盖
- 写入成功后用 `queryClient.invalidateQueries` 刷新相关缓存
- 禁止在组件中手动 `useState + fetch` 获取服务端数据

**示例 / Example**：

```typescript
/** 获取写作话题列表 */
export function useWritingTopicsQuery() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.writing.topics(userId),
    queryFn: () => fetchTopics(),
    enabled: !!userId,
  });
}

/** 提交作文 */
export function useSubmitEssayMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (data: EssaySubmission) => submitEssay(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.writing.topics(userId),
      });
    },
  });
}
```

---

## 6. Query Key 约定 / Query Keys

**适用场景 / When**：定义 TanStack Query 的缓存键。

**要求 / Rules**：
- 层级结构：`[领域, 操作, ...参数]`
- 集中定义在 `src/lib/queryKeys.ts` 中
- 使用工厂函数返回 key 数组，便于类型安全和 invalidation

**示例 / Example**：

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  lessons: {
    all: ['lessons'] as const,
    list: (filters?: LessonFilters) => ['lessons', 'list', filters] as const,
    detail: (id: string) => ['lessons', 'detail', id] as const,
  },
  writing: {
    topics: (userId?: string) => ['writing', 'topics', userId] as const,
    submissions: (topicId: string) =>
      ['writing', 'submissions', topicId] as const,
  },
  dictionary: {
    lookup: (word: string) => ['dictionary', word] as const,
  },
} as const;

// invalidation 示例：模糊匹配清除所有 writing 相关缓存
queryClient.invalidateQueries({ queryKey: ['writing'] });
```

---

## 7. 自定义 Hook / Custom Hooks

**适用场景 / When**：封装 TanStack Query 调用供组件消费。

**要求 / Rules**：
- 位置：`src/features/[domain]/hooks/`
- 命名：查询用 `use[Domain]Query`，变更用 `use[Action]Mutation`
- 必须导出使用的 `queryKey`，方便外部 invalidation
- 一个 hook 一个文件，文件名与 hook 同名

**示例 / Example**：

```typescript
// src/features/writing/hooks/useWritingTopicsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchTopics } from '@/features/writing/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export const writingTopicsKey = queryKeys.writing.topics;

export function useWritingTopicsQuery() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: writingTopicsKey(userId),
    queryFn: fetchTopics,
    enabled: !!userId,
  });
}
```

---

## 8. 状态归属速查 / Quick Reference

| 数据 | 归属 | 原因 |
|------|------|------|
| 课程列表/详情 | TanStack Query | 服务端数据，需缓存 + 自动刷新 |
| 词典查询结果 | TanStack Query | API 响应，Query 自带 TTL 缓存 |
| 写作话题列表 | TanStack Query | 服务端数据 |
| 写作评分结果 | TanStack Query | API streaming 响应 |
| 已收藏生词本 | Zustand（`useUserStore`） | 客户端优先数据，需离线可用 + 云端同步 |
| 复习状态 | Zustand（`useUserStore`） | 客户端优先数据，SM-2 算法本地计算 |
| 测验进度 | Zustand（`useUserStore`） | 临时会话数据 + 客户端优先持久化 |
| 用户偏好设置 | Zustand（`usePreferenceStore`） | 客户端优先，即时响应 |
| 写作草稿内容 | Zustand（`useWritingStore`） | 客户端优先，需离线编辑 |
| 当前标签页/选中词 | Zustand（`useLessonStore`） | 纯 UI 交互状态 |
| 登录会话 | Zustand（`useAuthStore`） | Supabase SDK 驱动 |
| 表单临时输入 | `useState` | 仅组件内部使用 |

---

## 9. 迁移指南 / Migration

### 从 `useState + fetch` 迁移到 `useQuery`

**Before**（反模式）：

```typescript
// 手动管理 loading/error/data —— 不推荐
const [topics, setTopics] = useState<WritingTopicWithStats[]>([]);
const [loading, setLoading] = useState(true);

const loadTopics = useCallback(async () => {
  setLoading(true);
  try {
    const list = await fetchTopics();
    setTopics(list);
  } finally {
    setLoading(false);
  }
}, [user]);

useEffect(() => { loadTopics(); }, [loadTopics]);
```

**After**（推荐）：

```typescript
// TanStack Query 自动管理缓存、loading、错误、重试、去重
const { data: topics = [], isLoading } = useWritingTopicsQuery();
```

### dictionaryCache 迁移方向

当前 `useUserStore.dictionaryCache` 应逐步迁移到 TanStack Query：
- 用 `queryKeys.dictionary.lookup(word)` 作为缓存键
- `staleTime` 设为 7 天（`7 * 24 * 60 * 60 * 1000`）对应当前 TTL
- Query 的 GC 机制自动清理不再使用的缓存，解决 localStorage 无限增长问题

---

## 10. 反模式 / Anti-Patterns

### 10.1 在 Zustand 中缓存 API 响应

```typescript
// ❌ Bad：API 响应不应存在 Zustand 中
interface UserState {
  dictionaryCache: Record<string, DictionaryEntry>;
  fetchDictionary: (word: string) => Promise<void>;
}

// ✅ Good：使用 TanStack Query
const { data } = useQuery({
  queryKey: queryKeys.dictionary.lookup(word),
  queryFn: () => lookupWord(word),
  staleTime: 7 * 24 * 60 * 60 * 1000,
});
```

### 10.2 手动 `useState + fetch` 获取服务端数据

```typescript
// ❌ Bad：手动管理 loading/error/data
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => { fetch('/api/xxx').then(r => r.json()).then(setData).finally(() => setLoading(false)); }, []);

// ✅ Good：useQuery 自动处理
const { data, isLoading } = useQuery({ queryKey: ['xxx'], queryFn: fetchXxx });
```

### 10.3 Store 间循环依赖

```typescript
// ❌ Bad：authStore 直接调用其他 Store 的方法
signOut: () => {
  useUserStore.getState().resetStore();
  usePreferenceStore.getState().resetStore();
  useWritingStore.getState().resetStore();
  set({ user: null, session: null });
}

// ✅ Good：通过订阅机制解耦
// 在各 Store 内部订阅 auth 变化，自行清理
const unsubscribe = useAuthStore.subscribe(
  (state) => state.user,
  (user) => { if (!user) resetStore(); },
  { equalityFn: (a, b) => a?.id === b?.id }
);
```

### 10.4 无限增长的 localStorage 缓存

```typescript
// ❌ Bad：持久化中包含无限增长的缓存数据
persist(
  (set) => ({ savedWords: {}, dictionaryCache: {}, /* ... */ }),
  { name: 'daily-english-user-storage' }  // dictionaryCache 无限增长
)

// ✅ Good：仅持久化必要数据，缓存交给 TanStack Query
persist(
  (set) => ({ savedWords: {}, /* ... */ }),
  {
    name: 'daily-english-user-storage',
    partialize: (state) => ({ savedWords: state.savedWords }),
  }
)
```
