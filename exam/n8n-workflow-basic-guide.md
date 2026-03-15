# n8n Workflow - 考試頁面製作 (基本版)

## 概述

呢個係一個基礎既 n8n workflow，你可以直接 import 到 n8n 度使用。

## 使用方法

### 1. Import Workflow

1. 打開 http://localhost:5678
2. Click 「Import Workflow」
3. 選擇 `n8n-workflow-basic.json`
4. Click 「Import」

### 2. 設定 Credentials

你需要設定：
- **GitHub** - 用於 Push 到 repo
- **Telegram** (可選) - 用於通知

### 3. 運行 Workflow

1. Click 「Test Workflow」
2. 輸入考試資料：
   ```json
   {
     "year": "2025-26",
     "grade": "s5", 
     "term": "term2"
   }
   ```

---

## Workflow 節點說明

### 1. Trigger
- **類型**: Manual (手動觸發)
- **作用**: 等你手動開始 workflow

### 2. 準備結構
- **類型**: Code (JavaScript)
- **作用**: 
  - 建立資料夾結構
  - 生成主頁 HTML

### 3. 生成題目 (AI)
- **類型**: HTTP Request
- **作用**: 調用外部 API 生成題目
- **Note**: 你可以用我 (OpenClaw) 黎生成題目！

### 4. Push 到 GitHub
- **類型**: HTTP Request (GitHub API)
- **作用**: 將生成既檔案 push 到 GitHub

---

## 簡化版流程 (用 OpenClaw 生成題目)

如果你想用我生成題目，可以改為：

```
1. Trigger → 
2. 準備結構 → 
3. 通知 OpenClaw (Telegram) →
4. 等題目生成 →
5. Push 到 GitHub
```

---

## 設定 GitHub API

1. 去 https://github.com/settings/tokens
2. Generate new token (classic)
3. 選擇「repo」scope
4. 複製 token
5. 响 n8n 度新增「Header Auth」credential

---

## 設定 Telegram (可選)

1. 响 n8n 度新增 Telegram node
2. 輸入 bot token 同 chat ID
3. 用於通知你 workflow 完成

---

## 下一步

等我整多啲具體既 workflow？
A. 加入題目生成 loop
B. 加入測試功能
C. 其他 📝
