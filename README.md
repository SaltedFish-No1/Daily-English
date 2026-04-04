# Daily English

一个基于 Next.js 16 构建的英语学习应用，围绕“每日一课”提供阅读、词汇、图表理解与测验练习，并支持 PWA 安装与本地学习记录持久化。

## 项目特性

- 每日课程首页，展示课程卡片、难度标签与课程简介
- 课程详情页包含 3 个学习区块：阅读、数据图表、知识测验
- 支持高亮词点击查看释义、中文翻译与英文发音
- 内置生词收藏与生词库页面，自动记录词汇出现位置
- 记录课程测验成绩，学习数据保存在浏览器本地
- 支持 PWA 安装，可部署为 GitHub Pages 静态站点
- 课程难度采用 CEFR 分级展示，并提供分级说明弹窗

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript 5
- Zustand
- Tailwind CSS 4
- Chart.js + react-chartjs-2
- Framer Motion
- `@ducanh2912/next-pwa`

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

## 常用命令

```bash
pnpm dev
pnpm lint
pnpm build
pnpm format
```

- `pnpm dev`：启动本地开发环境
- `pnpm lint`：运行 ESLint 校验
- `pnpm build`：执行 Next.js 静态导出，产物输出到 `out/`
- `pnpm format`：格式化仓库文件

## 目录结构

```text
.
├── data/
│   ├── lessons.json          # 首页课程列表
│   └── lessons/*.json        # 每日课程内容
├── public/                   # PWA 资源、图标与静态文件
├── src/
│   ├── app/                  # App Router 页面入口
│   ├── features/             # 按业务划分的页面与组件
│   ├── hooks/                # 自定义 Hook
│   ├── store/                # Zustand 状态管理
│   └── types/                # 课程数据类型定义
├── .github/workflows/        # GitHub Pages 部署流程
└── README.md
```

## 页面说明

### 首页 `/`

- 从 `data/lessons.json` 读取课程列表
- 展示课程标题、日期、摘要、分类标签与 CEFR 难度
- 展示最近收藏的词汇预览
- 提供 PWA 安装入口

### 课程页 `/lessons/[slug]`

- 从 `data/lessons/<slug>.json` 读取完整课程
- 阅读区支持高亮词交互
- 数据区展示图表与要点解读
- 测验区支持答题、评分与成绩记录
- 桌面端显示固定词汇面板，移动端显示底部学习导航

### 生词库 `/vocab`

- 汇总本地收藏词汇
- 展示词性、英文释义、中文翻译与最近收藏信息
- 可查看词汇来自哪节课、出现在哪一段

## 数据维护

课程内容由两个层级组成：

1. `data/lessons.json`：控制首页课程列表
2. `data/lessons/<date>.json`：存放具体课程内容

### 新增一节课程

1. 在 `data/lessons/` 新建一个以日期命名的 JSON 文件，例如 `2026-04-03.json`
2. 按照课程内容结构填写文章、词汇、图表和测验
3. 在 `data/lessons.json` 中追加课程概览信息，例如标题、分类、摘要和难度
4. 运行 `pnpm lint` 和 `pnpm build` 确认无误
5. 推送到 `main` 分支后自动触发 GitHub Pages 部署

### 课程文件结构

`data/lessons/<date>.json` 只保留课程正文与学习任务本身；课程标题、分类、摘要、难度等概览信息统一维护在 `data/lessons.json`。

下面是课程文件的示意结构，字段名需要与项目类型定义保持一致：

```json
{
  "schemaVersion": "2.1",
  "meta": {
    "title": "Lesson Title"
  },
  "speech": {
    "enabled": true
  },
  "article": {
    "title": "Article Title",
    "paragraphs": [
      {
        "id": "p1",
        "en": "English paragraph with sample.",
        "zh": "对应中文翻译。"
      }
    ]
  },
  "focusWords": [
    {
      "key": "sample",
      "forms": ["sample"]
    }
  ],
  "chart": {
    "type": "line",
    "title": "Chart Title",
    "description": "图表说明",
    "labels": ["A", "B", "C"],
    "datasets": [
      {
        "label": "Series 1",
        "data": [1, 2, 3],
        "borderColor": "#10b981",
        "backgroundColor": "rgba(16,185,129,0.15)"
      }
    ],
    "insights": [
      {
        "icon": "trend",
        "title": "Insight",
        "text": "图表结论"
      }
    ]
  },
  "quiz": {
    "title": "Knowledge Check",
    "questions": [
      {
        "q": "Question text",
        "options": [
          {
            "text": "Option A",
            "correct": true,
            "rationale": {
              "en": "Reason in English",
              "zh": "中文解析"
            }
          }
        ]
      }
    ]
  }
}
```

### 课程列表项结构

下面是 `data/lessons.json` 中单条课程记录的示意结构：

```json
{
  "date": "2026-04-03",
  "path": "pages/2026-04-03.html",
  "title": "Lesson Title",
  "category": "Science & Nature",
  "teaser": "首页摘要文案，同时作为详情页 metadata 描述来源",
  "published": true,
  "featured": true,
  "tag": "Science",
  "difficulty": "B2"
}
```

## 本地状态说明

项目使用浏览器本地存储保存学习数据，不依赖后端服务：

- 生词收藏保存在 `daily-english-user-storage`
- 课程答题成绩同样保存在本地持久化状态中
- 课程页面当前激活标签与选词上下文通过 Zustand 管理

这意味着刷新页面后收藏记录和成绩仍会保留，但更换浏览器或清理本地存储后数据会丢失。

## 部署说明

- 项目使用 `next build --webpack` 生成静态站点
- `next.config.ts` 中启用了 `output: 'export'`
- 生产环境 `basePath` 为 `/Daily-English`
- GitHub Actions 会在推送到 `main` 分支后自动构建并部署到 GitHub Pages
- 构建产物目录为 `out/`

## 开发提示

- 新增课程时，优先参考现有 `data/lessons/*.json` 文件格式
- 高亮词必须在正文 HTML 中使用 `data-word` 标记，才能与右侧词卡联动
- 如果课程启用了发音，浏览器需要支持 Web Speech API
- 生词库页面的数据来源于本地收藏，不会自动扫描所有课程词汇

## License

当前仓库未声明开源许可证，如需公开分发，建议补充 License 信息。
