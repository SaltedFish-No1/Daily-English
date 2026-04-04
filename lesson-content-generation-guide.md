# Daily English 内容生产指南（Schema v2.1）

本文档基于当前课程详情协议 v2.1，为教研、内容运营和 AI 内容生产链路提供统一的数据生成标准。

---

## 1. 根数据结构

每个课程详情文件位于 `data/lessons/<date>.json`，采用以下结构：

```json
{
  "schemaVersion": "2.1",
  "meta": {
    "title": "文章主标题"
  },
  "speech": {
    "enabled": true
  },
  "article": { ... },
  "focusWords": [ ... ],
  "chart": { ... },
  "quiz": { ... }
}
```

说明：

- `schemaVersion` 必须固定为 `"2.1"`
- 课程概览信息如分类、摘要、难度，不放在 lesson 详情文件里，而是维护在 `data/lessons.json`

---

## 2. 文章模块（Article）

新版文章模块采用纯文本结构，不允许在英文正文中写 HTML 标签，也不再维护单词 offset。

```json
"article": {
  "title": "The Psychology of Awe: How Nature Changes Our Minds",
  "paragraphs": [
    {
      "id": "p1",
      "en": "In modern society, daily life requires intense mental focus.",
      "zh": "在现代社会，日常生活需要高度集中的精神专注。"
    }
  ]
}
```

字段要求：

- `id`：段落唯一标识，建议从 `p1` 开始递增
- `en`：英文纯文本正文
- `zh`：中文翻译纯文本

---

## 3. 重点词（Focus Words）

`focusWords` 用于表达“本课重点词”，它只负责高亮与查询归一化，不保存完整词典释义。

```json
"focusWords": [
  {
    "key": "intense",
    "forms": ["intense"]
  }
]
```

字段说明：

- `key`：归一化后的查询词主键
- `forms`：正文中可能出现的词形，用于运行时高亮和点击归一

- `focusWords[].key` 必须唯一
- `forms.length >= 1`
- `forms` 内部不可重复
- `forms` 至少应覆盖正文中的实际出现形式

---

## 4. 图表模块（Chart）

图表模块保留为课程内容的一部分，支持 `line` 与 `bar` 两种类型。

```json
"chart": {
  "type": "line",
  "title": "Visualizing the Evolutionary Mismatch",
  "description": "This chart illustrates the growing gap between ancient needs and modern abundance.",
  "labels": ["1950", "1970", "1990", "2010"],
  "datasets": [
    {
      "label": "Biological Need",
      "data": [40, 40, 40, 40],
      "borderColor": "#0f766e",
      "backgroundColor": "rgba(15,118,110,0.15)"
    }
  ],
  "insights": [
    {
      "icon": "📈",
      "title": "Mismatch Gap",
      "text": "Modern food availability rises faster than biological need."
    }
  ]
}
```

字段要求：

- `type`：必须是 `"line"` 或 `"bar"`
- `labels.length` 必须等于每个 dataset 的 `data.length`

---

## 5. 测验模块（Quiz）与雅思 6 大题型配置

测验模块只保留内容字段，不再包含按钮文案、结果页文案等 UI 配置。

```json
"quiz": {
  "title": "Knowledge Check",
  "questions": [ ... ]
}
```

### 5.0 通用字段

所有结构化题目都建议包含：

- `id`
- `type`
- `prompt`
- `rationale`
- `evidenceRefs`（可选）

### 5.1 判断题（TFNG / YNNG）

```json
{
  "id": "q-1",
  "type": "tfng",
  "mode": "TFNG",
  "prompt": "True / False / Not Given",
  "statement": "Researchers were the first to study the psychological effects.",
  "answer": "NOT_GIVEN",
  "rationale": {
    "en": "...",
    "zh": "..."
  }
}
```

### 5.2 标题配对题（Matching Headings）

```json
{
  "id": "q-2",
  "type": "matching_headings",
  "prompt": "Choose the correct heading for Paragraph B.",
  "paragraphs": [
    { "id": "p2", "label": "Paragraph B", "textRef": "Paragraph B" }
  ],
  "headings": [
    { "id": "i", "text": "The physical benefits", "isDistractor": true },
    { "id": "ii", "text": "How natural settings replenish mental fatigue" }
  ],
  "answerMap": { "p2": "ii" }
}
```

### 5.3 细节信息配对题（Matching Information）

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

### 5.4 填空题（Completion）

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

### 5.5 特征配对题（Matching Features）

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

### 5.6 多项选择题（Multiple Choice）

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

## 6. 课程列表更新（lessons.json）

当新增课程详情文件后，必须同步更新根目录下的 `data/lessons.json`，否则课程不会出现在首页。

示意结构如下：

```json
{
  "date": "2026-03-31",
  "path": "pages/2026-03-31.html",
  "title": "新文章的标题",
  "category": "文章所属分类",
  "teaser": "首页摘要文案，同时作为详情页 metadata 描述来源",
  "published": true,
  "featured": true,
  "tag": "文章标签",
  "difficulty": "C1"
}
```

说明：

- 新纪录通常放在数组最前面
- `difficulty` 必须是 `"A1" | "A2" | "B1" | "B2" | "C1" | "C2"` 之一

---

## 7. 生产与校验要求

内容入库前至少需要完成以下校验：

- lesson 根结构字段完整
- `schemaVersion === "2.0"`
- 高亮区间合法且不重叠
- 所有高亮 key 都能在 vocab 中找到
- vocab key 唯一
- 图表 labels 与 datasets 长度一致
- quiz 题目 id 唯一
- completion 模板占位符与 blanks 一一对应

不允许：

- 在 `article.en.text` 中出现 HTML 标签
- 在 `article.zh` 中嵌入 tooltip 或样式标签
- 生成未被引用的词汇项
