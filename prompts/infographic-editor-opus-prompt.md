# Infographic Editor - 制作 prompt

## 目標
制作一個網頁工具，用於制定 Infographic 初稿。

## 檔案
- 保存為 `infographic-editor.html`
- 推送到 `ai-lish/ai-learning` repo

## 技術要求
- Vanilla JS + HTML + CSS（唔使用 React）
- 單一 HTML 檔案（所有代碼內聯）
- 手機優先的響應式設計

## 核心功能

### 1. 畫布
- 固定尺寸畫布（1024 x 559 或自定義）
- 背景可上傳圖片（作為參照）
- 全螢幕模式

### 2. 元素系統
元素類型：
- `title_bar` - 標題欄
- `column_header` - 欄目標題
- `case_card` - Case 卡片（A、B、C...）
- `math_area` - 數學算式區
- `answer_btn` - 答案按鈕
- `divider` - 分隔線
- `method_desc` - 方法描述

每個元素包含：
```json
{
  "id": "elem_001",
  "type": "case_card",
  "x": 100,
  "y": 150,
  "width": 200,
  "height": 80,
  "content": "Case A: 2 × 9 × 9 = 162",
  "style": {
    "backgroundColor": "#f5f5f5",
    "color": "#333333",
    "fontSize": 14
  }
}
```

### 3. 交互
- **添加元素**：底部按鈕點擊添加
- **拖放**：Touch / Mouse 拖曳移動
- **縮放**：右下角控制點調整大小
- **選擇**：點擊選中，顯示座標 badge
- **刪除**：選中後刪除按鈕

### 4. 導出/載入
- **Export JSON**：導出完整元素數組
- **Load JSON**：載入 JSON 恢復編輯
- **LocalStorage**：自動保存

### 5. UI 設計
- 底部抽屜式面板（Bottom Sheet）
- 元素列表側邊欄
- 座標即時顯示
- 深色主題（方便睇清楚元素）

## JSON Schema

```json
{
  "canvas": {
    "width": 1024,
    "height": 559,
    "background": "data:image/png;base64,..." // 可選
  },
  "elements": [
    {
      "id": "string",
      "type": "title_bar | column_header | case_card | math_area | answer_btn | divider | method_desc",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "content": "string",
      "style": {
        "backgroundColor": "string",
        "color": "string",
        "fontSize": number,
        "borderRadius": number
      }
    }
  ]
}
```

## 優先級

### Phase 1（MVP）
1. 基礎畫布 + 拖放
2. 添加/刪除元素
3. JSON 導出/載入
4. LocalStorage 自動保存

### Phase 2（可選）
1. 背景圖上傳
2. 數學算式渲染（KaTeX）
3. 預設模板

## 輸出
- 保存為 `/Users/zachli/.openclaw/workspace/ai-learning/infographic-editor.html`
- Commit 到 `ai-lish/ai-learning` repo

## 備注
- 用繁體中文介面
- 觸控友好的大按鈕（44px+ hit area）
- 代碼簡潔，注釋清晰
