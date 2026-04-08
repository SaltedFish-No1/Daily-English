# UI/UX 规范 / UI & UX Conventions

> 本规范定义项目中 UI 组件选型、动效、交互增强的统一标准。编写代码时**必须严格遵守**以下规则。
>
> This specification defines the unified standards for UI component selection, animation, and interaction enhancement. All code **MUST** strictly follow these rules.

---

## 目录 / Table of Contents

1. [基础组件库 / Base Component Library (shadcn/ui)](#1-基础组件库--base-component-library-shadcnui)
2. [动效规范 / Animation Conventions (Framer Motion)](#2-动效规范--animation-conventions-framer-motion)
3. [磨砂玻璃效果 / Glassmorphism](#3-磨砂玻璃效果--glassmorphism)
4. [抽屉组件 / Drawer (Vaul)](#4-抽屉组件--drawer-vaul)
5. [命令面板 / Command Palette (CMDK)](#5-命令面板--command-palette-cmdk)
6. [消息通知 / Toast Notifications (Sonner)](#6-消息通知--toast-notifications-sonner)
7. [禁止事项 / Anti-Patterns](#7-禁止事项--anti-patterns)

---

## 1. 基础组件库 / Base Component Library (shadcn/ui)

**选型原则**：使用 [shadcn/ui](https://ui.shadcn.com/) 作为基础 UI 零件的唯一来源（Button、Input、Dialog、Select 等）。**禁止**为已有 shadcn/ui 组件的场景手写替代品。

**安装方式**：通过 `npx shadcn@latest add <component>` 按需引入，组件代码落入 `src/components/ui/`。

**CSS Variables 自适应圆角**：

- 利用 shadcn/ui 的 CSS Variables 机制，根据设备类型切换圆角大小
- 桌面端偏"方正"（`--radius: 0.5rem`），移动端更"圆润"（`--radius: 0.75rem`）

```css
/* globals.css */
:root {
  --radius: 0.75rem; /* 移动端默认 */
}

@media (min-width: 1024px) {
  :root {
    --radius: 0.5rem; /* 桌面端更方正 */
  }
}
```

**主题色对接**：项目主色为 emerald，shadcn/ui 的 `--primary` 等变量须与现有 Tailwind 色板一致。

**示例 / Example**：

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

/* ✅ 使用 shadcn/ui 组件 */
<Button variant="default">保存</Button>
<Input placeholder="请输入..." />

/* ❌ 手写重复组件 */
<button className="h-10 rounded-xl bg-emerald-500 ...">保存</button>
```

---

## 2. 动效规范 / Animation Conventions (Framer Motion)

**已安装**：`framer-motion`（v12）。所有复杂动效必须使用 Framer Motion，禁止使用 CSS `@keyframes` 实现可交互动画。

### 页面转场 / Page Transitions

使用 `AnimatePresence` 实现类似 iOS 的页面切入切出效果：

```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### 弹性动画 / Spring Physics

桌面端侧边栏、面板等使用 **spring** 物理动画，体感更自然：

```tsx
<motion.aside
  initial={{ x: -280 }}
  animate={{ x: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  {/* 侧边栏内容 */}
</motion.aside>
```

### 性能要求 / Performance

- 动画属性优先使用 `opacity` 和 `transform`（不触发 reflow）
- 长列表内的元素动画使用 `layout` prop 时注意性能，必要时限定 `layoutId` 范围
- 简单的非交互动画（如 loading spinner）允许使用 CSS `@keyframes`

---

## 3. 磨砂玻璃效果 / Glassmorphism

**标准写法**：统一使用 `backdrop-blur-md bg-white/70` 组合，搭配细微边框增强层次感。

**适用场景**：

| 场景 | 类名组合 |
|------|----------|
| 顶部导航栏（PWA） | `backdrop-blur-md bg-white/70 border-b border-white/20` |
| 侧边栏（桌面端） | `backdrop-blur-md bg-white/70 border-r border-white/20` |
| 浮动面板 / 弹窗背景 | `backdrop-blur-md bg-white/70 rounded-2xl shadow-lg` |

**示例 / Example**：

```tsx
/* 顶部导航栏 — 已在 AppNavBar.tsx 中使用 */
<nav className="fixed top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-white/20">
  {/* ... */}
</nav>

/* 桌面端侧边栏 */
<aside className="hidden lg:block fixed left-0 h-full w-72 backdrop-blur-md bg-white/70 border-r border-white/20">
  {/* ... */}
</aside>
```

**注意事项**：
- 磨砂效果需要底层有可见内容才有意义，避免在纯白背景上使用
- 半透明度可根据场景微调（`bg-white/60` ~ `bg-white/80`），但团队应保持一致

---

## 4. 抽屉组件 / Drawer (Vaul)

**选型**：使用 [Vaul](https://vaul.emilkowal.ski/) 实现移动端 / PWA 模式下的底部抽屉。Vaul 是目前 React 生态中手势模拟最顺滑的 Drawer 组件，完美适配触摸屏。

**安装**：`pnpm add vaul`

### Drawer vs Dialog 选择

| 条件 | 使用 |
|------|------|
| 移动端 / 触摸设备操作面板 | → **Vaul Drawer** |
| 桌面端确认弹窗、表单弹窗 | → **shadcn/ui Dialog** |
| 需同时适配两端 | → 响应式：移动端 Drawer，桌面端 Dialog |

### 响应式切换示例

```tsx
import { Drawer } from 'vaul';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function ResponsiveModal({ open, onClose, children }: Props) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4">
          <Drawer.Handle className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

**UX 要求**：
- 必须包含顶部拖拽手柄（`Drawer.Handle`），给用户明确的"可拖拽"暗示
- 支持下拉手势关闭
- 内容区超长时允许内部滚动，不与拖拽手势冲突

---

## 5. 命令面板 / Command Palette (CMDK)

**选型**：使用 [CMDK](https://cmdk.paco.me/) 实现全局搜索 / 命令面板，通过 `Cmd+K`（macOS）或 `Ctrl+K`（Windows/Linux）快捷键唤起。

**安装**：`pnpm add cmdk`

**适用场景**：桌面端核心体验，让用户不离开键盘就能完成操作（搜索课程、跳转页面、切换设置等）。

**基本结构**：

```tsx
import { Command } from 'cmdk';

<Command.Dialog open={open} onOpenChange={setOpen} label="全局搜索">
  <Command.Input placeholder="搜索课程、单词、操作..." />
  <Command.List>
    <Command.Empty>未找到结果</Command.Empty>

    <Command.Group heading="课程">
      <Command.Item onSelect={() => router.push('/lessons/1')}>
        第一课：日常问候
      </Command.Item>
    </Command.Group>

    <Command.Group heading="操作">
      <Command.Item onSelect={() => router.push('/vocab')}>
        打开词汇本
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
```

**UX 要求**：
- 弹出时自动聚焦搜索框
- 支持键盘上下箭头导航 + `Enter` 选择
- 搜索结果按分组展示（课程、单词、快捷操作等）
- 弹窗样式应用磨砂玻璃效果（参考第 3 节）

---

## 6. 消息通知 / Toast Notifications (Sonner)

**选型**：使用 [Sonner](https://sonner.emilkowal.ski/) 作为项目**唯一**的 Toast 通知方案。**禁止**手写 Toast 组件或使用其他 Toast 库。

**安装**：`pnpm add sonner`

### 接入方式

在根 Layout 中挂载 `<Toaster />`：

```tsx
// src/app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }: Props) {
  return (
    <html>
      <body>
        {children}
        <Toaster
          position="bottom-center"       // 移动端底部居中
          className="lg:!right-4 lg:!top-4 lg:!bottom-auto lg:!left-auto" // 桌面端右上角
          toastOptions={{ duration: 3000 }}
        />
      </body>
    </html>
  );
}
```

### 调用方式

```tsx
import { toast } from 'sonner';

// 成功
toast.success('单词已保存');

// 错误
toast.error('保存失败，请重试');

// 带操作按钮
toast('草稿已保存', {
  action: {
    label: '撤销',
    onClick: () => handleUndo(),
  },
});

// 异步 Promise
toast.promise(submitEssay(), {
  loading: '正在提交...',
  success: '提交成功！',
  error: '提交失败',
});
```

### 定位规则

| 环境 | 位置 | 原因 |
|------|------|------|
| 移动端 / PWA | `bottom-center` | 贴近拇指操作区 |
| 桌面端 | `top-right` | 不遮挡主内容，符合桌面端习惯 |

**UX 要求**：
- 支持堆叠显示多条通知
- 支持滑动删除
- `duration` 默认 3 秒，错误类型可适当延长至 5 秒
- **替换现有的行内提示**：逐步将 `{error && <p className="text-red-500">...` 等行内消息迁移为 `toast.error()`（表单验证的行内提示除外，仍保留在表单内）

---

## 7. 禁止事项 / Anti-Patterns

| ❌ 禁止 | ✅ 应该 |
|---------|---------|
| 手写 Button / Input / Dialog 等基础组件 | 使用 shadcn/ui 对应组件 |
| 使用其他 Toast 库或手写 Toast | 使用 Sonner |
| 移动端使用 Dialog 做操作面板 | 使用 Vaul Drawer |
| 用 CSS `@keyframes` 做可交互动画 | 使用 Framer Motion |
| 在纯白背景上使用磨砂玻璃效果 | 确保底层有可见内容 |
| 重复造轮子：为已有库覆盖的场景编写自定义实现 | 优先使用规范指定的库 |
