# HKDSE 仿題生成器

## 📋 簡介

呢個係 HKDSE 仿題生成系統嘅 Phase 1 — 一個用於生成數學仿題嘅網頁介面。

### 功能

- 📚 選擇課題（目前支持概率）
- 📝 查看原題列表
- ✨ 生成仿題（概念位移 + 數值變化）
- 🔄 重做按鈕（隨機再生成）
- 💾 儲存並導出 JSON

## 🔧 安裝與設置

### 1. 設置 MiniMax API Key

```bash
export MINIMAX_API_KEY='your_api_key_here'
```

或者喺 `config.js` 中設置：

```javascript
const API_KEY = 'your_api_key_here';
```

### 2. 運行

由於涉及 API 調用，建議用 Python 腳本批量生成：

```bash
cd ~/ai-learning/hkdse/mimic-generator
python3 generate.py "原題文字" "課題" [--displacement 位移方向]
```

## 📁 檔案結構

```
mimic-generator/
├── index.html      # 主介面
├── config.js       # API 配置
├── generate.py     # Python 生成器
├── SPEC.md         # 詳細規格
└── README.md       # 本文件
```

## 🔄 工作流程

1. **選擇課題** → 載入原題列表
2. **選擇原題** → 查看題目內容
3. **填寫概括**（可選）→ 描述題目模式
4. **點擊生成** → M2.7 API 生成仿題
5. **審核結果** → 滿意就儲存
6. **導出 JSON** → 用於動態題庫

## 📊 JSON 輸出格式

```json
{
  "question_text": "仿題內容",
  "answer": "答案",
  "solution": "解題步驟",
  "displacement_applied": "加法 → 減法",
  "source_id": "P1-001",
  "source_question": "原題內容",
  "topic": "概率",
  "generated_at": "2026-04-01T15:00:00+08:00"
}
```

## 🎯 課題優先順序

1. ✅ 概率（Phase 1）
2. 🔲 三角學
3. 🔲 幾何
4. 🔲 代數
5. 🔲 ...

## ⚠️ 已知問題

- MiniMax Text API Key 需要单独配置
- 目前僅支持概率課題（示範用）

## 📅 更新日誌

- 2026-04-01: Phase 1 初始版本
