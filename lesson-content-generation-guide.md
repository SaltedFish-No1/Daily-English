# Daily English 内容生产指南 (JSON 数据结构详解)

本文档基于工程实际类型定义（`src/types/lesson.ts` 与 `src/features/lesson/components/quiz/types.ts`）以及规范范本（`2026-03-30.json`），为教研和内容运营团队提供详尽的数据生成标准。

---

## 1. 根数据结构 (Root Structure)

每个课程文件是一个 JSON 对象，包含多个核心模块。**请注意字段的层级与命名，切勿随意更改。**

```json
{
  "meta": {
    "date": "2026-03-30",
    "slug": "2026-03-30",
    "title": "文章主标题",
    "subtitle": "副标题/模块名称",
    "pageTitle": "网页Title",
    "difficulty": "B2" 
  },
  "ui": { ... },
  "speech": { ... },
  "article": { ... },
  "vocab": { ... },
  "chart": { ... },
  "quiz": { ... }
}
```
*注：`difficulty` 必须是 `"A1" | "A2" | "B1" | "B2" | "C1" | "C2"` 之一。*

---

## 2. 文章模块 (Article)

文章由标题和双语段落数组构成。在英文段落中，可以使用 `<span class="vocab-word" data-word="word">word</span>` 语法来高亮核心词汇。

```json
"article": {
  "title": "The Psychology of Awe: How Nature Changes Our Minds",
  "paragraphs": [
    {
      "en": "In modern society, daily life requires <span class=\"vocab-word\" data-word=\"intense\">intense</span> mental focus.",
      "zh": "在现代社会，日常生活需要高度集中的精神专注。"
    }
  ]
}
```

---

## 3. 核心词汇 (Vocabulary)

`vocab` 是一个**键值对对象 (Object)**，键名必须与文章中 `data-word` 对应。

```json
"vocab": {
  "intense": {
    "pos": "adj.",
    "def": "Of extreme force, degree, or strength.",
    "trans": "十分强烈的，高度集中的，紧张的",
    "speakText": "intense"
  }
}
```

---

## 4. 课后测验 (Quiz) 与雅思 6 大题型配置

测验模块由外层配置和 `questions` 数组组成。

```json
"quiz": {
  "title": "Knowledge Check",
  "description": "Test your comprehension of the reading passage.",
  "questions": [ ... ]
}
```

### 4.0 题目通用字段 (Base Fields)
所有题目都必须包含以下基础字段：
- `id`: 字符串，唯一标识（如 `"q-1"`）。
- `type`: 题目类型标识。
- `prompt`: 题目指导语或大标题。
- `rationale`: 答案解析，必须包含 `en` 和 `zh` 双语。
- `evidenceRefs`: （可选）字符串数组，用于指明出处段落（如 `["Paragraph B"]`）。

### 4.1 判断题 (True/False/Not Given 或 Yes/No/Not Given)
- **type**: `"tfng"`
- **mode**: `"TFNG"` 或 `"YNNG"`
- **statement**: 需要判断的陈述句。
- **answer**: 必须是大写枚举，如 `"TRUE", "FALSE", "NOT_GIVEN", "YES", "NO"`。

```json
{
  "id": "q-1",
  "type": "tfng",
  "mode": "TFNG",
  "prompt": "True / False / Not Given",
  "statement": "Researchers were the first to study the psychological effects.",
  "answer": "NOT_GIVEN",
  "rationale": { "en": "...", "zh": "..." }
}
```

### 4.2 标题配对题 (Matching Headings)
- **type**: `"matching_headings"`
- **paragraphs**: 目标段落数组。
- **headings**: 标题选项数组，可包含干扰项 (`isDistractor: true`)。
- **answerMap**: 键为 paragraph id，值为 heading id。

```json
{
  "id": "q-2",
  "type": "matching_headings",
  "prompt": "Choose the correct heading for Paragraph B.",
  "paragraphs": [
    { "id": "pB", "label": "Paragraph B", "textRef": "Paragraph B" }
  ],
  "headings": [
    { "id": "i", "text": "The physical benefits", "isDistractor": true },
    { "id": "ii", "text": "How natural settings replenish mental fatigue" }
  ],
  "answerMap": { "pB": "ii" }
}
```

### 4.3 细节信息配对题 (Matching Information)
- **type**: `"matching_information"`
- **items**: 需要配对的细节信息描述。
- **targets**: 被配对的段落或目标。
- **allowReuse**: 布尔值，目标是否可重复选择。

```json
{
  "id": "q-3",
  "type": "matching_information",
  "prompt": "Which paragraph contains the following information?",
  "items": [
    { "id": "1", "statement": "A reference to a specific negative emotion." }
  ],
  "targets": [
    { "id": "A", "label": "Paragraph A" },
    { "id": "B", "label": "Paragraph B" }
  ],
  "answerMap": { "1": "A" },
  "allowReuse": true
}
```

### 4.4 填空题 (Completion)
- **type**: `"completion"`
- **subtype**: `"sentence" | "summary" | "table" | "flowchart"`
- **contentTemplate**: 包含填空占位符的文本，必须使用 `{{blank_id}}` 格式。
- **blanks**: 每个占位符的详细配置，包含可接受的答案数组 `acceptedAnswers`。

```json
{
  "id": "q-4",
  "type": "completion",
  "subtype": "sentence",
  "prompt": "Sentence Completion",
  "instruction": "Choose NO MORE THAN TWO WORDS.",
  "contentTemplate": "Human attention functions much like a {{blank1}}, which natural environments recharge.",
  "blanks": [
    {
      "id": "blank1",
      "acceptedAnswers": ["battery"],
      "wordLimit": 2,
      "caseSensitive": false,
      "posHint": "noun"
    }
  ]
}
```

### 4.5 特征配对题 (Matching Features)
- **type**: `"matching_features"`
- **statements**: 需要被配对的陈述或发现。
- **features**: 特征实体（如人名、时间段等）。

```json
{
  "id": "q-5",
  "type": "matching_features",
  "prompt": "Match the following finding with the correct group of people.",
  "statements": [
    { "id": "f1", "text": "Concluded that environments allow the brain to rest." }
  ],
  "features": [
    { "id": "A", "label": "Rachel and Stephen Kaplan" },
    { "id": "B", "label": "Medical professionals" }
  ],
  "answerMap": { "f1": "A" }
}
```

### 4.6 多项选择题 (Multiple Choice)
- **type**: `"multiple_choice"`
- **selectionMode**: `"single"` 或 `"multiple"`。
- **options**: 选项数组。
- **correctOptionIds**: 正确答案的 ID 数组（单选时数组长度为 1）。

```json
{
  "id": "q-6",
  "type": "multiple_choice",
  "selectionMode": "single",
  "prompt": "According to the passage, what is the primary social effect?",
  "options": [
    { "id": "A", "text": "It makes people want to isolate themselves." },
    { "id": "C", "text": "It decreases self-centeredness." }
  ],
  "correctOptionIds": ["C"]
}
```

---

## 5. 课程列表更新 (lessons.json)

当完成一篇新课程的 JSON 文件（例如 `data/lessons/2026-03-31.json`）后，**必须同步更新根目录下的索引文件 `data/lessons.json`**。否则新课程将不会显示在首页列表中。

在 `lessons.json` 的 `lessons` 数组中添加一条新记录，字段需与课程 JSON 的 `meta` 对应：

```json
{
  "date": "2026-03-31",
  "path": "pages/2026-03-31.html",
  "title": "新文章的标题",
  "category": "文章所属分类 (如: Science & Nature)",
  "summary": "在首页列表展示的简短中文摘要",
  "published": true,
  "featured": true,
  "tag": "文章标签",
  "difficulty": "C1"
}
```
*注：新增记录通常放置在数组的最前面，以保证最新的文章显示在首页最上方。`difficulty` 字段用于在首页展示 CEFR 分级标签。*
