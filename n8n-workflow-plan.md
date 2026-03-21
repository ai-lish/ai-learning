# n8n 自動化功課管理系統

## 📋 系統概述

```
[圖片] → [Webhook/Telegram] → [n8n AI] → [Google Sheets]
```

## 🎯 目標

自動將功課圖片轉換為結構化數據並寫入Google Sheets

---

## 📝 製作計劃

### Phase 1: n8n 帳戶設定
| 步驟 | 內容 | 狀態 |
|------|------|------|
| 1.1 | 註冊/登入 n8n (cloud.n8n.io 或自托管) | ⏳ |
| 1.2 | 創建新 Workflow | ⏳ |
| 1.3 | 設定 Webhook 節點 | ⏳ |

---

### Phase 2: Webhook / Telegram 接收
| 步驟 | 內容 | 狀態 |
|------|------|------|
| 2.1 | **Option A: Webhook** - HTTP POST 接收圖片 | ⏳ |
| 2.2 | **Option B: Telegram Bot** - @BotFather 創建機器人 | ⏳ |
| 2.3 | 設定圖片下載節點 | ⏳ |

---

### Phase 3: AI OCR 辨識 (最關鍵)
| 步驟 | 內容 | 狀態 |
|------|------|------|
| 3.1 | 添加 AI Agent / Gemini 節點 | ⏳ |
| 3.2 | System Prompt: | ⏳ |
| | ``` | ⏳ |
| | 你是一個功課辨識助手。 | ⏳ |
| | 辨識圖片中的功課內容，輸出JSON格式。 | ⏳ |
| | 忽略日期與值日生資訊。 | ⏳ |
| | 輸出格式： | ⏳ |
| | [{"subject": "科目", "detail": "內容", "deadline": "DD/MM"}] | ⏳ |
| | ``` | ⏳ |
| 3.3 | 解析 AI 回傳的 JSON | ⏳ |

---

### Phase 4: Google Sheets 寫入
| 步驟 | 內容 | 狀態 |
|------|------|------|
| 4.1 | 連接 Google Sheets | ⏳ |
| 4.2 | 設定工作表 ID | ⏳ |
| 4.3 | 寫入欄位：Date, Subject, Detail, Deadline | ⏳ |
| 4.4 | 設定日期格式 | ⏳ |

---

### Phase 5: 測試
| 步驟 | 測試內容 | 狀態 |
|------|----------|------|
| 5.1 | 發送圖片至 Webhook/Telegram | ⏳ |
| 5.2 | 確認 AI 正確辨識 | ⏳ |
| 5.3 | 確認寫入 Google Sheets | ⏳ |
| 5.4 | 確認網頁自動更新 | ⏳ |

---

## 🔧 技術細節

### Input (圖片來源)
- **Telegram Bot**: @BotFather 創建 → 获取 API Token
- **HTTP Webhook**: 直接 POST 圖片

### AI Model
- **Gemini 2.0 Flash** (推薦) - 免費、快速、準確
- 或 **GPT-4o** - 更準確但收費

### Google Sheets 格式
| Date | Subject | Detail | Deadline |
|------|---------|--------|----------|
| 2026-03-17 | 數學 | 練習13C | 21/3 |

---

## 📦 交付物

1. **n8n Workflow JSON** - 可匯入的 workflow 檔案
2. **Telegram Bot 設定指南** (如使用)
3. **測試記錄**

---

## ⚠️ 注意事項

1. **API Keys** - 需要：
   - Google Cloud service account (Sheets API)
   - Gemini API key / OpenAI API key
   - Telegram Bot Token (如使用)

2. **Quota Limits** - 留意免費額度

3. **圖片質量** - 建議使用清晰、正面的功課圖片

---

*最後更新：2026-03-21*
