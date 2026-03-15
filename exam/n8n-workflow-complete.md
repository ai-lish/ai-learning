# n8n Workflow - 考試頁面製作完整流程

## 概述

此 workflow 涵蓋建立完整既考試系統，包括：
1. 考試主頁
2. 卷一 (選擇題)
3. 卷二 (選擇題 + SVG 圖像)
4. 題目獨立頁面 (自動化測試、批核、製作彷題)
5. 同步修改機制

---

## 數據結構

### Input
```json
{
  "year": "2025-26",
  "grade": "s5",
  "term": "term2",
  "title": "中五 第二學期 2025-26",
  "p1_questions": 30,
  "p2_questions": 30,
  "p2_svg_questions": [9, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30]
}
```

### 輸出結構
```
exam/
└── {year}-{grade}-{term}/
    ├── index.html              # 考試主頁
    ├── p1.html                # 卷一
    ├── p2.html                # 卷二
    └── questions/              # 獨立題目頁面
        ├── q1.html
        ├── q2.html
        ├── ...
        └── q30.html
```

---

## Workflow 流程圖

```
[開始]
    │
    ▼
[建立資料夾結構]
    │
    ▼
[製作考試主頁]
    │
    ├──→ [製作卷一] ────────────────┐
    │       │                           │
    │       ▼                           │
    │   [製作題目] (Loop Q1-Q30)         │
    │       │                           │
    │       ▼                           │
    │   [製作題目獨立頁面] (Loop)         │
    │       │                           │
    │       ▼                           │
    │   [測試卷一]                       │
    │       │                           │
    │       ▼                           │
    │   [如有錯誤 → 修改]                 │
    │       │                           │
    ├───────────────┬───────────────────┘
    │
    ├──→ [製作卷二] ────────────────────┐
    │       │                           │
    │       ▼                           │
    │   [提取SVG] (Loop 圖像題)          │
    │       │                           │
    │       ▼                           │
    │   [修正SVG屬性]                    │
    │       │                           │
    │       ▼                           │
    │   [插入題目] (Loop Q1-Q30)         │
    │       │                           │
    │       ▼                           │
    │   [製作題目獨立頁面] (Loop)         │
    │       │                           │
    │       ▼                           │
    │   [測試卷二]                       │
    │       │                           │
    │       ▼                           │
    │   [如有錯誤 → 修改]                 │
    │       │                           │
    ├───────────────┬───────────────────┘
    │
    ▼
[設定同步修改鉤子]
    │
    ▼
[Commit & Push]
    │
    ▼
[通知完成]
    │
    ▼
[結束]
```

---

## Node 詳細說明

### 1. Trigger Node
```json
{
  "name": "觸發條件",
  "type": "manual", 
  "parameters": {
    "batchSize": 1
  }
}
```

### 2. 建立資料夾結構
```
Actions:
- mkdir exam/{year}-{grade}-{term}/
- mkdir exam/{year}-{grade}-{term}/questions/
- mkdir exam/{year}-{grade}-{term}/p1-images/
- mkdir exam/{year}-{grade}-{term}/p2-images/
```

### 3. 製作考試主頁 (index.html)
```html
<!-- 範本變量 -->
{YEAR} = 2025-26
{GRADE} = s5
{TERM} = term2
{TITLE} = 中五 第二學期 2025-26
```

**功能：**
- [ ] 顯示考試標題
- [ ] 顯示卷一/卷二連結
- [ ] 顯示考試資訊 (時限、分數)
- [ ] 返回首頁按鈕

### 4. 製作卷一 (p1.html)

**Question 結構：**
```html
<div class="question" data-correct="A">
    <div class="question-num">1.</div>
    <div class="question-text">題目內容...</div>
    <div class="options-container">
        <div class="option" onclick="selectOption(this, 'A')">A. 選項A</div>
        <div class="option" onclick="selectOption(this, 'B')">B. 選項B</div>
        <div class="option" onclick="selectOption(this, 'C')">C. 選項C</div>
        <div class="option" onclick="selectOption(this, 'D')">D. 選項D</div>
    </div>
    <div class="answer">正確答案：A</div>
</div>
```

**Loop 製作題目：**
```
For q in range(1, 31):
    - Insert question data
    - Insert options A/B/C/D
    - Insert answer
```

### 5. 製作卷二 (p2.html)

**額外功能：**
- [ ] 得分顯示
- [ ] 核對答案按鈕
- [ ] 正確/錯誤標記
- [ ] SVG 圖像容器

**SVG 處理流程：**
```
For each SVG question:
    1. 從 Google Docs 提取 SVG
    2. 修正 width: \d+ → 100%
    3. 移除 height 屬性
    4. 修正 stroke: #333333 → #000000
    5. 修正 fill: shape elements → none (保留 text fill)
    6. 修正 pattern fill → none
    7. 插入 HTML
```

### 6. 題目獨立頁面 (questions/q{n}.html)

**功能：**
- [ ] 顯示完整題目
- [ ] 顯示選項
- [ ] 顯示答案
- [ ] 顯示詳解
- [ ] 編輯按鈕
- [ ] 複製按鈕
- [ ] 製作彷題按鈕

**與卷一/卷二既關聯：**
- 每個獨立頁面包含 `data-question-id` 屬性
- 修改時會更新對應既 p1.html 或 p2.html

### 7. 同步修改機制

**實現方式：**
```javascript
// questions/q{n}.html 修改時觸發
function syncChange(questionId, newData) {
    // 1. 更新 p{n}.html 中既題目
    updateQuestionInPaper(questionId, newData);
    
    // 2. 更新其他相關獨立頁面
    updateRelatedQuestions(questionId, newData);
    
    // 3. Commit changes
    gitCommit(`Update Q${questionId}`);
}
```

**鉤子 (Webhook)：**
```
URL: n8n/webhook/sync-question
Method: POST
Data: { questionId, changes }
```

### 8. 自動化測試

**測試項目：**
```
For each question page:
    1. Open browser
    2. Screenshot
    3. Check: Question visible
    4. Check: Options visible (if multiple choice)
    5. Check: MathJax rendered
    6. Check: SVG visible (if has image)
    7. Record result
```

**測試報告：**
```json
{
  "total": 60,
  "passed": 55,
  "failed": 5,
  "details": [
    { "question": "Q9", "status": "pass" },
    { "question": "Q22", "status": "fail", "reason": "SVG not visible" }
  ]
}
```

### 9. 批核系統

**流程：**
```
1. 完成題目製作
2. 發送通知畀 Zach (Telegram)
3. Zach 審視題目
4. 如有問題 → 記錄反饋
5. 修改題目
6. 重新測試
7. 直到通過
```

### 10. 製作彷題

**功能：**
- 輸入：原始題目
- 輸出：類似結構既新題目
- 工具：Gemini API

---

## 完整 Node 清單

| # | Node Name | 類型 | 描述 |
|---|-----------|------|------|
| 1 | Trigger | Manual | 觸發workflow |
| 2 | CreateFolders | Code | 建立資料夾結構 |
| 3 | CreateMainPage | Code | 製作考試主頁 |
| 4 | CreateP1 | Code | 製作卷一 |
| 5 | LoopP1Questions | Loop |  Loop Q1-Q30 |
| 6 | CreateP1Question | Code | 製作卷一單題 |
| 7 | CreateP1QuestionPage | Code | 製作獨立頁面 |
| 8 | TestP1 | HTTP Request | 測試卷一 |
| 9 | CreateP2 | Code | 製作卷二 |
| 10 | ExtractSVG | HTTP Request | 從Google Docs提取SVG |
| 11 | FixSVG | Code | 修正SVG屬性 |
| 12 | LoopP2Questions | Loop | Loop Q1-Q30 |
| 13 | CreateP2Question | Code | 製作卷二單題 |
| 14 | CreateP2QuestionPage | Code | 製作獨立頁面 |
| 15 | TestP2 | HTTP Request | 測試卷二 |
| 16 | SetupSyncWebhook | Webhook | 設定同步鉤子 |
| 17 | GitCommit | Code | Commit到GitHub |
| 18 | NotifyZach | Telegram | 發送通知 |

---

## 錯誤處理

### Retry Logic
```
Max retries: 3
Wait between retries: 30 seconds
```

### Error Notification
```
On error:
- Log error details
- Send Telegram to Zach
- Pause workflow
- Wait for manual intervention
```

---

## 使用說明

### 1. 觸發 Workflow
```bash
# Manual trigger in n8n
```

### 2. 監控進度
```
- View n8n dashboard
- Check execution history
- View test results
```

### 3. 處理問題
```
- Review failed tests
- Make corrections
- Re-run specific nodes
```

---

## 數據流向

```
Google Docs (SVG)
       │
       ▼
   [Extract]
       │
       ▼
   [Fix SVG]
       │
       ▼
   [Insert to P2]
       │
       ▼
   [Create Question Pages]
       │
       ▼
   [Test]
       │
       ▼
   [Sync]
       │
       ▼
   [GitHub]
```

---

## 更新歷史

- **v1.0**: 初始版本 - 完整製作流程
