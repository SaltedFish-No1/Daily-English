# Daily English

一个基于 Next.js 16 构建的综合英语学习平台，围绕"每日一课"提供阅读理解、词汇积累、知识测验与写作练习，支持 AI 智能批改、用户认证与 PWA 安装。

## 项目特性

- 每日课程首页，展示课程卡片、难度标签与课程简介
- 课程详情页包含阅读与知识测验两大学习区块
- 支持高亮词点击查看释义、中文翻译与英文发音
- 多种测验题型：判断题（TFNG/YNNG）、选择题、匹配题（标题/信息/特征）、填空题
- 内置生词收藏与生词库页面，自动记录词汇出现位置
- 写作练习：自定义话题、计时写作、AI 多维度批改（语法、词汇、连贯性等）
- 学习中心与阅读练习入口
- 用户认证：邮箱 OTP 登录、密码重置、个人档案
- 已登录用户学习数据云端同步，未登录用户数据保存在浏览器本地
- 支持 PWA 安装，可作为独立应用使用
- 课程难度采用 CEFR 分级展示，并提供分级说明弹窗

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 App Router、React 19 |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4、PostCSS |
| 状态管理 | Zustand 5（带持久化中间件） |
| 数据请求 | TanStack React Query 5 |
| 后端 / 数据库 | Supabase（PostgreSQL、认证） |
| AI 集成 | Vercel AI SDK 6 + @ai-sdk/openai |
| 邮件服务 | Resend |
| 数据校验 | Zod 4 |
| 动画 | Framer Motion |
| 图标 | Lucide React |
| PWA | @ducanh2912/next-pwa |
| 测试 | Vitest 2 |
| 代码质量 | ESLint 9、Prettier 3、Husky 9 + lint-staged 16 |

## 快速开始

建议环境：

- Node.js 20+
- pnpm 10+

安装依赖并启动开发环境：

```bash
pnpm install
pnpm dev
```

启动后默认访问：

```text
http://localhost:3000
```

## 环境变量

项目运行需要以下环境变量，建议创建 `.env.local` 文件：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=           # Supabase 项目地址
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase 匿名密钥
SUPABASE_SERVICE_ROLE_KEY=          # Supabase 服务端密钥（仅服务端使用）

# AI 写作批改
OPENAI_API_KEY=                     # OpenAI API 密钥

# 邮件
RESEND_API_KEY=                     # Resend 邮件服务密钥
```

## 常用命令

```bash
pnpm dev       # 启动本地开发环境
pnpm build     # 执行 Next.js 构建
pnpm start     # 启动生产服务器
pnpm lint      # 运行 ESLint 校验
pnpm format    # 格式化仓库文件
pnpm test      # 运行 Vitest 单元测试
```

## 目录结构

```text
.
├── public/                        # PWA 资源、图标与静态文件
├── scripts/                       # 数据库建表与数据迁移脚本
├── src/
│   ├── __tests__/                 # 单元测试
│   ├── app/                       # App Router 页面入口
│   │   ├── api/                   # API 路由（课程、认证、词典、TTS、写作）
│   │   ├── auth/                  # 认证回调
│   │   ├── learn/                 # 学习中心
│   │   ├── lessons/[id]/          # 课程详情
│   │   ├── login/                 # 登录页
│   │   ├── profile/               # 个人档案
│   │   ├── reading/               # 阅读练习
│   │   ├── reset-password/        # 密码重置
│   │   ├── vocab/                 # 生词库
│   │   └── writing/[topicId]/     # 写作练习
│   ├── components/                # 全局组件（导航栏、应用外壳）
│   ├── features/                  # 按业务划分的页面与组件
│   │   ├── about/                 # 关于页面
│   │   ├── auth/                  # 认证（登录表单、用户菜单）
│   │   ├── home/                  # 首页仪表盘、CEFR 说明
│   │   ├── intro/                 # 产品介绍页
│   │   ├── learn/                 # 学习中心
│   │   ├── lesson/                # 课程（文章、测验、词汇面板）
│   │   ├── photo-capture/         # 拍照识别（OCR）
│   │   ├── profile/               # 个人档案
│   │   ├── reading/               # 阅读练习
│   │   ├── review/                # AI 复习课程
│   │   ├── vocab/                 # 生词库
│   │   └── writing/               # 写作（编辑器、批改报告、话题管理）
│   ├── hooks/                     # 自定义 Hook
│   ├── lib/                       # 工具函数与服务集成（AI、Supabase、词典、邮件等）
│   │   ├── env/                   # 环境变量配置
│   │   └── email-templates/       # 邮件模板
│   ├── store/                     # Zustand 状态管理
│   └── types/                     # TypeScript 类型定义
├── .github/workflows/             # CI 流水线
└── README.md
```

## 页面说明

### 首页 `/`

- 展示课程标题、日期、摘要、分类标签与 CEFR 难度
- 展示最近收藏的词汇预览
- 提供 PWA 安装入口

### 课程页 `/lessons/[id]`

- 阅读区支持高亮词交互，点击查看释义与发音
- 测验区支持多种题型、答题评分与成绩记录
- 桌面端显示固定词汇面板，移动端显示底部学习导航

### 生词库 `/vocab`

- 汇总本地收藏词汇
- 展示词性、英文释义、中文翻译与最近收藏信息
- 可查看词汇来自哪节课、出现在哪一段

### 学习中心 `/learn`

- 学习功能导航入口

### 阅读练习 `/reading`

- 阅读练习专区

### 写作练习 `/writing/[topicId]`

- 自定义写作话题与计时写作
- AI 智能批改，按语法、词汇、连贯性等维度评分
- 语法错误检测与词汇建议
- 支持多次提交与历史记录

### AI 复习 `/review`

- AI 生成个性化复习课程
- 基于间隔重复算法的单词复习
- 支持滑动复习界面（`/review/swipe`）

### 关于 `/about`

- 产品介绍与项目信息

### 个人档案 `/profile`

- 用户学习统计与个人信息管理

### 登录 `/login`

- 邮箱 OTP 验证登录，无需密码

## 状态管理

项目使用 Zustand 管理状态，包含以下 Store：

| Store | 职责 | 持久化 |
|-------|------|--------|
| `useAuthStore` | 用户认证会话 | 否 |
| `useUserStore` | 词汇收藏、学习历史、词典缓存 | 是（localStorage） |
| `useLessonStore` | 课程页标签状态、测验进度 | 否 |
| `usePreferenceStore` | 用户偏好设置 | 是 |
| `useWritingStore` | 写作练习状态 | 否 |

- **未登录用户**：所有学习数据保存在浏览器 `localStorage`，刷新页面后保留，更换浏览器或清除存储后丢失
- **已登录用户**：通过 Supabase 实现数据云端同步

## 数据存储

课程数据存储在 Supabase PostgreSQL 数据库中，采用规范化表结构：

- `lessons` — 课程主表（标题、分类、难度、发布状态等）
- `lesson_paragraphs` — 课程段落（英文正文与中文翻译）
- `lesson_focus_words` — 重点词汇
- `lesson_quiz_questions` — 测验题目（支持多种题型）

写作相关数据：

- `writing_topics` — 写作话题
- `writing_submissions` — 用户提交
- `writing_grades` — AI 批改结果
- `grading_criteria` — 评分标准

数据库建表脚本位于 `scripts/` 目录。

## 部署说明

- 项目使用 `next build --webpack` 构建
- 需要 Node.js 服务器运行时环境（非静态导出）
- CI 流水线（`.github/workflows/ci.yml`）在推送到 `main` 或 PR 时自动运行 lint → build → test

## 开发提示

- 高亮词必须在正文中使用 `data-word` 标记，才能与词汇面板联动
- 如果课程启用了发音，浏览器需要支持 Web Speech API
- 生词库页面的数据来源于本地收藏，不会自动扫描所有课程词汇
- 提交代码时 Husky pre-commit hook 会自动运行 lint-staged 进行代码检查与格式化

## AI 辅助开发

本项目使用 [Claude Code](https://claude.ai/code)（Anthropic Harness AI）进行 AI 辅助开发。

- `CLAUDE.md` 作为项目记忆文件，Claude Code 启动时自动加载项目上下文
- `.rules/` 目录定义编码规范，AI 编码时严格遵守
- 以 `claude/` 前缀命名的分支为 AI 辅助开发分支
- 提交前仍然通过 Husky pre-commit hook 进行代码质量检查
- `.claude/` 目录用于存放 Claude Code 会话配置（已加入 `.gitignore`）

## License

当前仓库未声明开源许可证，如需公开分发，建议补充 License 信息。
