# n8n Workflow - 考試頁面製作自動化

## 概述

此 workflow 涵蓋由零開始建立考試頁面既完整流程，包括製作、測試同修改循環。

---

## Workflow 結構

### 主流程圖
```
[開始]
    │
    ▼
[建立資料夾結構]
    │
    ▼
[製作試卷主頁]
    │
    ├──→ [製作卷一] → [測試卷一] ──┐
    │                                  │
    ├──→ [製作卷二] → [測試卷二] ──┤
    │                                  │
    ├──→ [製作SVG] → [測試SVG] ─────┤
    │                                  │
    ◄─────────────────────────────────┘
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

### 1. Trigger - Webhook 或 Manual

```json
{
  "name": "Trigger",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "exam-creation",
    "responseMode": "onReceived"
  }
}
```

### 2. 建立資料夾結構

```
Input: {year: "2025-26", grade: "s5", term: "term2"}

Actions:
- mkdir exam/{year}-{grade}-{term}/
- mkdir exam/{year}-{grade}-{term}/P1-Q/
- mkdir exam/{year}-{grade}-{term}/P1-MS/
- mkdir exam/{year}-{grade}-{term}/P2-Q/
- mkdir exam/{year}-{grade}-{term}/P2-A/
```

### 3. 複製範本

```
Actions:
- cp exam-template/main.html exam/{year}-{grade}-{term}/
- cp exam-template/p1.html exam/{year}-{grade}-{term}/P1-Q/
- cp exam-template/p2.html exam/{year}-{grade}-{term}/P2-Q/
```

### 4. 更新內容

```
Actions:
- sed -i 's|{YEAR}|2025-26|g' *.html
- sed -i 's|{GRADE}|s5|g' *.html
- sed -i 's|{TERM}|term2|g' *.html
```

### 5. 製作卷一 (Loop over questions)

```
For each question Q1-Q30:
- Insert question text
- Insert options A/B/C/D
- Insert answer
```

### 6. 測試卷一

```
Actions:
- Open browser: exam/{year}-{grade}-{term}/P1-Q/p1.html
- Screenshot
- Check: All questions visible
- Check: MathJax rendering
- Check: Options clickable
```

### 7. 製作卷二 (Loop over questions)

```
For each question with image:
- Extract SVG from Google Docs
- Fix SVG attributes (width, stroke, fill)
- Insert into HTML
```

### 8. 測試卷二

```
Actions:
- Open browser: exam/{year}-{grade}-{term}/P2-Q/p2.html
- Screenshot
- For each SVG question:
  - Check diagram visible
  - Check labels visible
  - Mark pass/fail
```

### 9. 修改循環 (Iteration)

```
If test fails:
- Record issue
- Return to step 5/7
- Repeat until pass

Max iterations: 5
```

### 10. Commit & Push

```
Actions:
- git add -A
- git commit -m "Add: {year} {grade} {term} exam"
- git push
```

### 11. 通知完成

```
Actions:
- Send Telegram message to Zach
- Include: test results summary
- Include: URLs
```

---

## 錯誤處理

### Error Node

```
On error:
- Log error details
- Send notification to Zach
- Ask for manual intervention
```

### Retry Logic

```
Max retries: 3
Wait between retries: 30 seconds
```

---

## 數據結構

### Input Schema
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

### Output Schema
```json
{
  "status": "success",
  "exam_url": "https://.../exam/2025-26-s5-term2.html",
  "p1_url": "https://.../exam/2025-26-s5-term2-p1.html",
  "p2_url": "https://.../exam/2025-26-s5-term2-p2.html",
  "test_results": {
    "p1": {"total": 30, "passed": 30},
    "p2": {"total": 11, "passed": 11}
  },
  "commit_hash": "abc123"
}
```

---

## 安裝說明

### 1. 建立 n8n Workflow

1. 打開 n8n
2. Create new workflow
3. Import JSON (see below)

### 2. 設定環境變數

```
GITHUB_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx
TELEGRAM_BOT_TOKEN=xxx
```

### 3. 設定 Webhook

```
URL: https://your-n8n.com/webhook/exam-creation
Method: POST
```

---

## 使用方法

### 觸發 Workflow

```bash
curl -X POST https://your-n8n.com/webhook/exam-creation \
  -H "Content-Type: application/json" \
  -d '{
    "year": "2025-26",
    "grade": "s5",
    "term": "term2"
  }'
```

---

## 監控面板

### n8n Dashboard

- View execution history
- Monitor success/failure rate
- View execution time

---

## 更新歷史

- **v1.0**: 初始版本
