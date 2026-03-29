# Daily English

一个基于数据驱动的交互式英语学习平台，旨在通过沉浸式内容和即时反馈提升英语水平。

## 项目特点

- **移动端优先**：针对手机端优化，包含底部导航和抽屉式词汇面板。
- **交互式学习**：
  - **点击查词**：文章中高亮单词可点击查看详细释义、词性及中文翻译。
  - **语音朗读**：集成 Web Speech API，支持单词真人发音。
  - **数据可视化**：使用 Chart.js 展示与主题相关的量化数据。
  - **知识检测**：内置交互式 Quiz 模块，实时反馈答题正确性及原由。
- **数据驱动**：内容与逻辑完全分离，通过 JSON 文件即可轻松维护和新增课程。

## 目录结构

```text
Daily-English/
├── build.py                # Python 构建脚本（将 JSON 转换为 HTML）
├── index.html              # 网站首页（构建生成）
├── pages/                  # 生成的课程页面目录
├── data/
│   ├── lessons.json        # 课程清单（控制首页显示）
│   └── lessons/            # 存放每节课的详细内容 JSON
├── templates/
│   ├── index.html          # 首页模版
│   └── lesson.html         # 课程页面模版
└── README.md
```

## 如何维护内容

### 1. 新增课程
1. 在 `data/lessons/` 目录下创建一个新的 JSON 文件（建议命名格式：`YYYY-MM-DD.json`）。
2. 参考现有 JSON 结构填入文章、词汇、图表和 Quiz 数据。
3. 在 `data/lessons.json` 中添加该课程的简要信息。

### 2. 构建页面
本项目不需要复杂的开发环境，只需运行构建脚本即可同步所有更改：

```bash
python3 build.py
```

执行后，`pages/` 下的 HTML 文件和根目录的 `index.html` 将会自动更新。

## 技术栈

- **前端**: Tailwind CSS (样式), Chart.js (图表), Web Speech API (发音)
- **构建**: Python 3 (静态页面生成)
- **部署**: 适合直接托管于 GitHub Pages

---
© 2026 Daily English · Designed for Learning
