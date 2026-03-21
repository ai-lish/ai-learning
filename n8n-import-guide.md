# n8n Workflow Import 指南

## 📥 如何 Import Workflow

### 方法 1: 直接 Import JSON
1. 去你既 n8n (https://your-n8n.io)
2. Workflows → Import from File
3. 選擇 `n8n-homework-workflow.json`
4. Click Import

### 方法 2: 手工創建
如果Import失敗，可以手工創建：

---

## 🔧 節點設定

### 1. Trigger (選擇一種)

#### Option A: Telegram Trigger (推薦)
- Add Node → Telegram
- Bot API Token: 你既 Telegram Bot Token
- Update Type: Photo

#### Option B: Webhook
- Add Node → Webhook
- Path: `/homework`
- Method: POST

#### Option C: Manual (測試用)
- Add Node → Function
- 用上面既 functionCode

---

### 2. AI OCR

**節點:** AI → LangChain → Chat

**設定:**
- Model: `gemini-2.0-flash` (或 OpenAI GPT-4)
- Messages:
  - System: 
    ```
    你是一個功課辨識助手。
    辨識圖片中的功課內容。
    輸出JSON格式：[{"subject": "科目", "detail": "內容", "deadline": "DD/MM"}]
    ```
  - User: Image URL

**注意:** 需要設定 LangChain Credential (API Key)

---

### 3. Google Sheets

**節點:** Google Sheets → Append

**設定:**
- Operation: Append
- Sheet ID: 你的 Sheets ID (URL中 e/ 後既野)
- Range: `Sheet1!A:D`
- Values:
  - A: `{{ $now.format("YYYY-MM-DD") }}`
  - B: `{{ $json.subject }}`
  - C: `{{ $json.detail }}`
  - D: `{{ $json.deadline }}`

**注意:** 需要設定 Google Sheets Credential

---

## 🔑 需要既 Credentials

### 1. Google Sheets
- Service Account JSON
- 或 OAuth

### 2. AI (二選一)
- **Gemini**: API Key from https://aistudio.google.com/app/apikey
- **OpenAI**: API Key from https://platform.openai.com/api-keys

### 3. Telegram (可選)
- Bot Token from @BotFather

---

## ⚠️ 重要設定

### 係JSON入面替換呢啲：

1. **Sheet ID**
   - 搵你家下既 Google Sheets URL:
   - `https://docs.google.com/spreadsheets/d/e/2PACX-xxx/edit#gid=0`
   - 紅色部分就係 Sheet ID: `2PACX-xxx`

2. **AI Model**
   - 如果用 Gemini: 設定 Gemini API Key
   - 如果用 OpenAI: 設定 OpenAI API Key

---

## 🧪 測試

1. **先啟用 Workflow**
2. **Send test image** (via Telegram or Webhook)
3. **Check Google Sheets** - 應該有新既 row
4. **Check website** - 刷新睇下有冇更新

---

## 📝 Troubleshooting

| 問題 | 解決 |
|------|------|
| AI not responding | Check API Key |
| Sheets not writing | Check Sheet ID & Credentials |
| No image received | Check Trigger settings |
| Wrong format | Check JSON parsing |

---

*最後更新：2026-03-21*
