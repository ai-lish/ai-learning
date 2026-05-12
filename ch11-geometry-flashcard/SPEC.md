# Spec: CH11 互動幾何公式翻轉卡

## Objective

中一學生學習「第11章 與直線和三角形相關的角」的互動公式翻轉卡系統。

**兩種模式：**
- **簡報模式**：上而下展示全部7張卡（如 Google Slides）
- **隨機模式**：隨機出現一張卡，點擊切換下一張（不重複）

**每張卡結構：**
```
┌─────────────────────┐      ┌─────────────────────┐
│   正面（公式卡）      │ ←→   │   背面（例題卡）      │
│   可拖放變量          │      │   特定角度            │
│   拖放驗證            │      │   拖放驗證            │
│                      │      │   顯示正確公式+理由   │
│                      │      │   □ □ □ 步驟方格      │
└─────────────────────┘      └─────────────────────┘
```

**流程：**
1. 學生喺封面（公式）重溫定理，可拖放變量驗證
2. 反轉卡片 → 背面（例題）出現特定角度
3. 拖放驗證後（無論答啱答錯）→ 顯示正確公式+理由
4. 剔選步驟方格 → 順序顯示步驟+答案（上而下）
5. 反轉回同卡封面 → 繼續下一個定理

**用戶：** 中一學生
**成功標準：** 
- 7個定理全部能正確展示
- 兩種模式能切換
- 翻轉動畫流暢
- 步驟揭小正確順序

---

## Tech Stack

- **純 HTML + CSS + JavaScript**（單一檔案）
- **CSS 3D Transforms** 實現翻轉動畫
- **HTML5 Canvas** 繪製幾何圖形
- **Tailwind CSS**（CDN）
- **Google Fonts**：Noto Sans TC + Kalam

---

## Project Structure

```
ch11-geometry-flashcard/
├── SPEC.md                          ← 本規格文件
├── PLANNING.md                      ← 規劃文件
├── reference-original.html           ← 原始參考 HTML（第11章互動建構區）
└── index.html                       ← 新實現（單一 HTML 檔案）
```

---

## Commands

```
# 開發測試
直接用瀏覽器打開 index.html

# 部署
push 到 GitHub → GitHub Pages 自動發布
URL: https://ai-lish.github.io/ai-learning/ch11-geometry-flashcard/
```

---

## Data Model

### 7個定理（THEOREMS 數組）

每個定理包含：

```javascript
{
  id: Number,              // 1-7
  name: String,            // "直線上的鄰角"
  
  // 正面（公式）：隨機變量
  init: Function,          // () => ({ v: ['x','y'], l: ['AB','CD'] })
  frontHtml: Function,     // 返回公式拖放區 HTML
  frontValidate: Function, // 驗證公式答案
  frontDraw: Function,     // Canvas 繪圖（變量位置）
  
  // 背面（例題）：特定角度
  examples: [              // 每個定理 2-3 個例題
    {
      angles: Object,     // { x: 40, y: 140 }
      steps: [            // 步驟陣列
        { text: "x + y = 180°", answer: "x + y = 180°" },
        { text: "x + 140 = 180°", answer: "x = 40°" }
      ]
    }
  ],
  backHtml: Function,      // 返回例題拖放區 HTML
  backValidate: Function,  // 驗證例題答案
  backDraw: Function,      // Canvas 繪圖（特定角度）
}
```

### 狀態（State）

```javascript
{
  mode: 'presentation' | 'random',
  currentIndex: Number,         // 簡報模式：當前卡 index
  randomOrder: Number[],        // 隨機模式：shuffled 順序
  randomIndex: Number,          // 隨機模式：當前位置
  isFlipped: Boolean,           // 當前卡係咪已反轉
  currentExample: Number,       // 例題 index（每卡有2-3個）
  
  // 拖放狀態
  slots: { [groupName]: value },
  
  // 步驟揭小狀態
  revealedSteps: Boolean[],      // 每個 step 係咪已揭小
  
  // 驗證狀態
  validated: Boolean,
  isCorrect: Boolean
}
```

---

## UI/UX Specification

### 頁面結構

```
┌─────────────────────────────────────────────────────────┐
│  Header: 標題 + 模式切換 (簡報/隨機)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │              卡片區域（3D 翻轉）                  │   │
│  │                                                  │   │
│  │   ┌─────────────────┬─────────────────┐        │   │
│  │   │   正面（公式）    │   背面（例題）    │        │   │
│  │   │                 │                 │        │   │
│  │   │  Canvas 圖像    │  Canvas 圖像     │        │   │
│  │   │  拖放變量區      │  拖放驗證區      │        │   │
│  │   │                 │  步驟方格        │        │   │
│  │   └─────────────────┴─────────────────┘        │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  導航：上一張 │ 定理名稱 (1/7) │ 下一張         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  進度指示器（圓點）+ 總覽按鈕（簡報模式）                  │
└─────────────────────────────────────────────────────────┘
```

### 視覺設計

**顏色：**
- Primary: `#1e3a8a`（深藍）
- Secondary: `#64748b`（灰藍）
- Accent: `#f59e0b`（琥珀）
- Success: `#22c55e`（綠）
- Error: `#ef4444`（紅）
- Background: `#f3f4f6`（淺灰）

**字體：**
- 正文：Noto Sans TC, 400/500/700
- 數學：Kalam（手寫風格）

**卡片尺寸：**
- Desktop: 600px × 480px
- Mobile: 100vw × 80vw（最大）

### 翻轉動畫

```css
.card-container {
  perspective: 1000px;
}

.card-inner {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-inner.flipped {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
```

### 步驟揭小動畫

```css
.step-item {
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease-out;
}

.step-item.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* 順序延遲 */
.step-item:nth-child(1) { transition-delay: 0ms; }
.step-item:nth-child(2) { transition-delay: 150ms; }
.step-item:nth-child(3) { transition-delay: 300ms; }
```

---

## Functionality Specification

### 模式切換

**簡報模式（Presentation）：**
- 顯示全部7個定理嘅縮略圖（總覽）
- 點擊任一縮略圖進入該卡
- 按順序（上而下）瀏覽

**隨機模式（Random）：**
- 進入時隨機打亂7張卡順序
- 顯示當前卡
- 點擊「下一張」按鈕按隨機順序前進
- 完成全部7張後可重新開始

### 翻轉邏輯

| 點擊 | 行為 |
|------|------|
| 點擊「反轉」按鈕 | 卡片翻轉（正面↔背面） |
| 雙擊卡片 | 卡片翻轉 |
| 手機：長按卡片 | 卡片翻轉 |

### 拖放驗證

**正面（公式）：**
- 變量（x, y, z, 180°, 360°）可拖
- 放入空格後即時驗證
- 正確：綠色閃爍 + ✅
- 錯誤：紅色震動 + 顯示正確答案

**背面（例題）：**
- 同上，但角度係特定數值
- 驗證後顯示「正確公式 + 理由」區塊
- 步驟方格出現

### 步驟揭小

1. 驗證完成後，步驟方格（□）出現
2. 每個方格代表一個步驟
3. 剔選方格 → 該步驟及其答案淡入顯示
4. 順序：從上而下，剔選即顯示
5. 所有方格剔選後 → 顯示「完成」提示

---

## Component Inventory

### 1. ModeToggle（模式切換器）

- 兩個按鈕：簡報模式、隨機模式
- 當前模式高亮
- 切換時重置進度

### 2. FlashCard（翻轉卡）

**狀態：**
- default：顯示當前面
- flipped：已反轉
- validating：驗證中（變量放入空格）
- correct：答案正確
- incorrect：答案錯誤

### 3. CanvasPanel（Canvas 繪圖區）

- 接收 `state`（變量值或角度）
- 繪製幾何圖形
- 可拖放元素定位

### 4. DragDropZone（拖放區）

- 多個 slot（空格）
- 接收 draggable item
- 驗證邏輯

### 5. StepsRevealer（步驟揭小器）

- 複選框列表
- 順序揭小動畫
- 顯示步驟文字 + 答案

### 6. Navigation（導航）

- 上一張 / 下一張按鈕
- 定理名稱 + 進度 (3/7)
- 總覽按鈕（返回簡報模式總覽）

### 7. ProgressIndicator（進度指示器）

- 7個圓點
- 當前卡高亮
- 已完成卡填充

---

## 7個定理數據

### 1. 直線上的鄰角
- 公式：x + y = 180°（可選 2-4 個鄰角）
- 理由：（直線上的鄰角）
- 正面：學生可選擇鄰角數量（2/3/4個）
- 背面：例題，鄰角數量隨機

### 2. 同頂角
- 公式：x + y + z = 360°（可選 3-5 個角）
- 理由：（同頂角）
- 正面：學生可選擇角數量（3/4/5個）
- 背面：例題，角數量隨機

### 3. 對頂角
- 公式：x = y
- 理由：（對頂角）
- 例題：x = 50°, y = 50°

### 4. 同位角
- 公式：x = y
- 理由：（同位角, AB//CD）
- 例題：特定角度

### 5. 錯角（內錯角）
- 公式：x = y
- 理由：（錯角, AB//CD）
- 例題：特定角度

### 6. 同旁內角
- 公式：x + y = 180°
- 理由：（同旁內角, AB//CD）
- 例題：特定角度

### 7. 三角形內角和
- 公式：x + y + z = 180°
- 理由：（三角形內角和）
- 例題：三個角 60°, 70°, 50°

---

## Success Criteria

- [ ] 兩種模式能正確切換（簡報/隨機）
- [ ] 卡片翻轉動畫流暢（0.6s, 3D）
- [ ] 7個定理全部正確顯示
- [ ] 正面可拖放變量並驗證
- [ ] 背面顯示特定角度
- [ ] 驗證後顯示正確公式+理由
- [ ] 步驟方格剔選後順序揭小
- [ ] 響應式設計（桌面 + 平板 + 手機）
- [ ] 隨機模式不重複
- [ ] 簡報模式可總覽全部卡
- [ ] 直線上的鄰角：正面可選2-4個鄰角
- [ ] 同頂角：正面可選3-5個角
- [ ] 錯角（代替內錯角）名稱正確

---

## Open Questions（已確認）

1. ✅ 每個例題 2-3 個步驟
2. ✅ 例題角度隨機生成（非固定）
3. ✅ 唔需要防作弊機制
4. ✅ 唔需要 localStorage 保存進度

