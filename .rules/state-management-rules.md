# 状态管理规范

> 本规范适用于项目中所有状态管理代码。编写代码时**必须严格遵守**以下规则。

---

## 目录

1. [核心原则](#1-核心原则)
2. [Zustand Store 设计](#2-zustand-store-设计)
3. [持久化策略](#3-持久化策略)
4. [云端同步](#4-云端同步)
5. [TanStack Query 规范](#5-tanstack-query-规范)
6. [Query Key 约定](#6-query-key-约定)
7. [自定义 Query Hook](#7-自定义-query-hook)
8. [状态归属速查](#8-状态归属速查)

---

## 1. 核心原则

**Zustand 管理客户端/UI 状态，TanStack Query 管理服务端/异步数据。**

| 问题 | 是 | 否 |
|------|----|----|
| 数据来自 API 或数据库？ | → TanStack Query | ↓ |
| 需要跨组件共享的 UI 状态？ | → Zustand | ↓ |
| 仅组件内部使用？ | → `useState` | — |

**禁止事项**：
- 禁止在 Zustand 中缓存 API 响应数据（loading 状态、服务端返回值等）
- 禁止在组件中手动 `useState + useEffect + fetch` 获取服务端数据
- 禁止 Store 之间直接相互调用（应通过订阅机制解耦）

---

## 2. Zustand Store 设计

**适用场景**：`src/store/` 下的 Zustand Store。

**要求**：
- 命名：`use[Domain]Store`，导出为 `const`
- 单一职责：一个 Store 只管理一个领域
- State 与 Action 定义在同一个 `interface` 中
- 每个持久化 Store 必须暴露 `resetStore()` 方法用于登出清理

**示例**：

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

**Store 间解耦**：各 Store 通过订阅 auth 状态变化自行清理，而非被其他 Store 直接调用。

```typescript
// 在 Store 初始化后订阅 auth 变化
useAuthStore.subscribe(
  (state) => state.user,
  (user) => { if (!user) resetStore(); },
  { equalityFn: (a, b) => a?.id === b?.id }
);
```

---

## 3. 持久化策略

**适用场景**：需要在页面刷新后保留状态时。

**要求**：
- 使用 `zustand/middleware` 的 `persist`
- localStorage key 统一前缀 `daily-english-`
- 临时状态（计时器、loading 等）必须通过 `partialize` 排除
- 仅持久化必要字段，禁止将 API 缓存数据写入 localStorage

**示例**：

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

## 4. 云端同步

**适用场景**：已登录用户的 Zustand 状态需同步到 Supabase。

**要求**：
- 写操作使用 fire-and-forget 模式（不阻塞 UI），错误仅 `console.error`
- 同步前必须检查 `getAuthUserId()` 是否存在
- 高频操作（如草稿输入）必须 debounce（≥ 2s）
- 登录时通过 `useDataSync` 全量拉取云端数据并合并
- 批量操作合并为单次 Supabase 调用

**示例**：

```typescript
function syncToCloud(table: string, partial: Record<string, unknown>) {
  const userId = getAuthUserId();
  if (!userId) return;
  supabase
    .from(table)
    .upsert(
      { user_id: userId, ...partial, updated_at: Date.now() },
      { onConflict: 'user_id' }
    )
    .then(({ error }) => {
      if (error) console.error(`[CloudSync] ${table} upsert:`, error);
    });
}
```

---

## 5. TanStack Query 规范

**适用场景**：从 API 获取或修改服务端数据。

**要求**：
- **读取**用 `useQuery`，**写入**用 `useMutation`
- 需要登录的查询设置 `enabled: !!userId`
- QueryClient 全局 `staleTime: 60 * 1000`，按需覆盖
- 写入成功后用 `queryClient.invalidateQueries` 刷新相关缓存

**示例**：

```typescript
export function useWritingTopicsQuery() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.writing.topics(userId),
    queryFn: () => fetchTopics(),
    enabled: !!userId,
  });
}

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

## 6. Query Key 约定

**要求**：
- 层级结构：`[领域, 操作, ...参数]`
- 集中定义在 `src/lib/queryKeys.ts`
- 使用工厂函数返回 `as const` 数组，保证类型安全

**示例**：

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

// 模糊 invalidation：清除某个领域下所有缓存
queryClient.invalidateQueries({ queryKey: ['writing'] });
```

---

## 7. 自定义 Query Hook

**要求**：
- 位置：`src/features/[domain]/hooks/`
- 命名：查询用 `use[Domain]Query`，变更用 `use[Action]Mutation`
- 必须导出所使用的 `queryKey`，方便外部 invalidation
- 一个 hook 一个文件，文件名与 hook 同名

**示例**：

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

## 8. 状态归属速查

| 数据类型 | 归属 | 原因 |
|----------|------|------|
| API 返回的列表/详情 | TanStack Query | 服务端数据，需缓存 + 自动刷新 |
| API 返回的查询结果 | TanStack Query | Query 自带 TTL 和 GC |
| AI streaming 响应 | TanStack Query | 服务端异步数据 |
| 客户端优先的用户数据（需离线可用） | Zustand + persist | 本地优先 + 云端同步 |
| 用户偏好设置 | Zustand + persist | 客户端优先，即时响应 |
| 编辑器草稿 | Zustand + persist（partialize） | 需离线编辑，排除临时字段 |
| 页面交互状态（标签页、选中项等） | Zustand（不持久化） | 纯 UI 状态 |
| 认证会话 | Zustand（不持久化） | Supabase SDK 驱动 |
| 表单临时输入 | `useState` | 仅组件内部使用 |
