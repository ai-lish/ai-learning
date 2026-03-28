# n8n 自動化功課管理系統 - 詳細指南

## 📋 系統概述

```
[功課圖片] → [Telegram Bot / Webhook] → [n8n AI OCR] → [Google Sheets] → [網站自動更新]
```

---

## 🚀 快速開始

### 準備帳戶

1. **n8n Cloud** (推薦)
   - 去 https://n8n.io
   - 註冊免費帳戶
   - 創建新 Workflow

2. **Google Cloud**
   - 去 https://console.cloud.google.com
   - 創建項目
   - 啟用 Google Sheets API
   - 創建 Service Account 下載 JSON 憑證

3. **Telegram** (可選)
   - @BotFather 創建新機器人
   - 記住 API Token

---

## 📦 n8n Workflow 節點結構

```
┌─────────────┐
│  Webhook    │  或  Telegram Trigger
└──────┬──────┘
       ▼
┌─────────────┐
│   HTTP      │  (下載圖片)
└──────┬──────┘
       ▼
┌─────────────┐
│   AI Agent  │  (Gemini OCR)
└──────┬──────┘
       ▼
┌─────────────┐
│   Edit      │  (解析 JSON)
└──────┬──────┘
       ▼
┌─────────────┐
│ Google      │  (寫入 Sheets)
│ Sheets      │
└─────────────┘
```

---

## 📝 每個節點詳細設定

### 1. Webhook 節點
- **Method**: POST
- **Path**: `/homework`
- **Response Mode**: "On receive"

### 2. Telegram Trigger (如使用)
- **Bot Token**: 你的 Telegram Bot Token
- **Update Type**: Photo

### 3. HTTP 節點 (下載圖片)
- **Method**: GET
- **URL**: `={{ $json.file[0].file_id }}` (Telegram)
- **Authentication**: None

### 4. AI Agent 節點 (最重要)
- **Model**: Gemini 2.0 Flash (推薦)
- **System Prompt**:
```
你是一個功課辨識助手。

任務：辨識圖片中的功課內容。

輸出要求：
1. 只輸出JSON陣列，無其他文字
2. 忽略：日期標題、值日生、學校通告
3. 科目可能的值：數學、中文、英文、科學、地理、歷史、公經社、電腦、音樂、視藝、體育
4. Detail：完整功課描述
5. Deadline：格式 DD/MM（如 21/3）

輸出格式：
[{"subject": "科目", "detail": "內容", "deadline": "DD/MM"}]

如果圖片中沒有功課，輸出：[]
```

### 5. Edit Fields 節點
- **JSON**: `={{ $json.text }}`
- 解析 AI 回傳的文字為物件

### 6. Google Sheets 節點
- **Operation**: Append
- **Sheet ID**: 你的 Google Sheets ID
- **Range**: Sheet1!A:D
- **Values**: 
  - Date: `={{ $now.format("YYYY-MM-DD") }}`
  - Subject: `={{ $json.subject }}`
  - Detail: `={{ $json.detail }}`
  - Deadline: `={{ $json.deadline }}`

---

## 🔧 測試步驟

### 測試 1: Webhook
```bash
curl -X POST -F "file=@homework.jpg" https://your-n8n.io/webhook/homework
```

### 測試 2: Telegram
- 發送功課圖片俾你既 Bot
- 確認收到回覆

### 測試 3: Google Sheets
- 檢查數據是否正確寫入

### 測試 4: 網站
- 刷新 https://ai-lish.github.io/ai-learning
- 確認功課顯示

---

## 💰 費用

| 服務 | 免費額度 | 收費 |
|------|----------|------|
| n8n Cloud | 100 executions/month | $20/month |
| Gemini | 15 requests/minute | 免費 |
| Google Sheets | 免費 | 免費 |
| Telegram Bot | 免費 | 免費 |

---

## ⚠️ 常見問題

### Q: AI 辨識唔準確？
A: 優化 System Prompt，提供更多範例

### Q: 圖片太大？
A: 在 HTTP 節點前加入 Image Resize 節點

### Q:點樣處理多頁功課？
A: 使用 Loop Over Items 節點

---

## 📎 相關檔案

- `n8n-workflow-plan.md` - 計劃摘要
- `n8n-workflow.json` - Workflow 匯入檔 (如有)
- `CSV_URL.md` - Google Sheets CSV 連結

---

*最後更新：2026-03-21*
