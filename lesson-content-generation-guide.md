# Daily English 内容生产指南（Schema v2）

本文档基于当前课程详情协议 v2，为教研、内容运营和 AI 内容生产链路提供统一的数据生成标准。

---

## 1. 根数据结构

每个课程详情文件位于 `data/lessons/<date>.json`，采用以下结构：

```json
{
  "schemaVersion": "2.0",
  "meta": {
    "title": "文章主标题"
  },
  "speech": {
    "enabled": true
  },
  "article": { ... },
  "vocab": [ ... ],
  "chart": { ... },
  "quiz": { ... }
}
```

说明：

- `schemaVersion` 必须固定为 `"2.0"`
- 课程概览信息如分类、摘要、难度，不放在 lesson 详情文件里，而是维护在 `data/lessons.json`

---

## 2. 文章模块（Article）

新版文章模块采用“纯文本 + 标注数组”结构，不允许在英文正文中写 HTML 标签。

```json
"article": {
  "title": "The Psychology of Awe: How Nature Changes Our Minds",
  "paragraphs": [
    {
      "id": "p1",
      "en": {
        "text": "In modern society, daily life requires intense mental focus.",
        "highlights": [
          {
            "start": 39,
            "end": 46,
            "key": "intense"
          }
        ]
      },
      "zh": "在现代社会，日常生活需要高度集中的精神专注。"
    }
  ]
}
```

字段要求：

- `id`：段落唯一标识，建议从 `p1` 开始递增
- `en.text`：英文纯文本正文
- `en.highlights`：需要高亮的词汇区间
- `zh`：中文翻译纯文本

高亮规则：

- `start` 和 `end` 为字符区间，采用左闭右开
- `0 <= start < end <= text.length`
- 同一段内高亮区间不得重叠
- `key` 必须在 `vocab[].key` 中存在

---

## 3. 核心词汇（Vocabulary）

`vocab` 在 v2 中改为数组结构，每一项都带有显式 `key`。

```json
"vocab": [
  {
    "key": "intense",
    "lemma": "intense",
    "forms": ["intense"],
    "pos": "adj.",
    "def": "Of extreme force, degree, or strength.",
    "trans": "十分强烈的，高度集中的，紧张的",
    "speakText": "intense",
    "notes": "可用于描述注意力、竞争与情绪强度。"
  }
]
```

字段说明：

- `key`：词条主键，供 `article.en.highlights[].key` 引用
- `lemma`：词元，可选
- `forms`：常见变体，可选
- `pos`：词性，必填
- `def`：英文释义，必填
- `trans`：中文释义，必填
- `speakText`：发音文本，可选
- `notes`：教学备注，可选

生成要求：

- `vocab[].key` 必须唯一
- 不允许存在未被正文高亮引用的词条

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
