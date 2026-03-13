# Gemini 數學 SVG 圖像製作流程

## 簡介

使用 Gemini 製作精確既中學數學幾何圖像，輸出兩種格式：
- 模式 1：靜態考卷 HTML
- 模式 2：動態參數化工具 JavaScript

---

## Gemini Prompt (Copy & Paste)

```
你是一位專業的「中學數學考卷插圖設計師」與「SVG/JS 程式碼專家」。
你的任務是根據我提供的數學題目，草圖或要求，繪製出精確、專業、且能完美適應響應式網頁的圖形。

【核心版面與視覺規範】
1. 絕對響應式：SVG 標籤必須包含 `viewBox="0 0 W H"`（W與H請依圖形比例設定），不要設定固定的 width 或 height。請統一使用 `width="100%"`。
2. 防裁切留白：圖形邊緣與 viewBox 之間必須保留適當的 padding (至少 15-20 單位)。
3. 數學字體：所有代表點、線，面、角度的英文字母 (如 A, B, x, y, θ) 必須使用 `font-family="'Times New Roman', Times, serif"` 且 `font-style="italic"`。純數字不需要斜體。
4. 線條與標記：預設線條 `stroke="black" stroke-width="1.5"`。直角標記、等角標記、平行箭頭必須精準繪製。原點請以斜體 `O` 標示。

【雙模式輸出格式】

👉 模式 1：靜態考卷 HTML（用於直接貼入考卷）
- 只需要輸出 HTML 程式碼。
- 必須將 <svg> 標籤包裝在 `div.figure-container` 中：
  <div class="figure-container">
      <svg viewBox="0 0 400 300" width="100%" xmlns="http://www.w3.org/2000/svg">
          <!-- 靜態圖形內容 -->
      </svg>
  </div>

👉 模式 2：動態參數化工具 JS（用於匯入 SVG 圖像工具網頁）
- 只需要輸出 JavaScript 物件格式。
- 必須包含 `id`, `title`, `inputs` (陣列), 以及 `render` (函數)。
- 格式：
  {
      id: 'unique-graph-id',
      title: '圖形標題',
      inputs: [
          { label: '點 A X座標', name: 'Ax', type: 'number', value: 100, min: 0, max: 300, step: 10 }
      ],
      render: (d) => {
          return `<svg viewBox="0 0 400 300" width="100%">...</svg>`;
      }
  }
```

---

## 使用方法

### 模式 1：考卷用 (Static HTML)

1. **打開 Gemini** 
2. **貼上上面個 Prompt**
3. **輸入指示**：
   ```
   我要畫一個等腰三角形，底邊為 10cm，高為 12cm，頂點為 A, B, C。請用模式 1。
   ```
4. **Copy 輸出既 HTML Code**
5. **放入考卷**：
   ```html
   <div class="svg-container">
       [Paste Gemini Output]
   </div>
   ```

### 模式 2：工具網站用 (Dynamic JS)

1. **打開 Gemini**
2. **貼上上面個 Prompt**
3. **輸入指示**：
   ```
   我要一個直角坐標系，裡面有一個三角形 ABC。請將 A, B, C 三個點的座標設為可調整的參數。請用模式 2。
   ```
4. **Copy 輸出既 JavaScript**
5. **放入 math-svg-tools.html**：
   ```javascript
   {
       id: '...',
       title: '...',
       inputs: [...],
       render: (d) => `...`
   }
   ```

---

## 實際例子

### 例子 1：等腰三角形 (模式 1)

**輸入**：
```
畫一個等腰三角形 ABC，AB = AC = 8cm，BC = 10cm。標記頂點 A, B, C。
```

**輸出**：
```html
<div class="figure-container">
    <svg viewBox="0 0 300 250" width="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="150,30 50,220 250,220" fill="none" stroke="black" stroke-width="1.5"/>
        <text x="150" y="20" font-family="'Times New Roman', Times, serif" font-style="italic" font-size="24">A</text>
        <text x="40" y="240" font-family="'Times New Roman', Times, serif" font-style="italic" font-size="24">B</text>
        <text x="260" y="240" font-family="'Times New Roman', Times, serif" font-style="italic" font-size="24">C</text>
    </svg>
</div>
```

### 例子 2：可調參數坐標系 (模式 2)

**輸入**：
```
畫一個直角坐標系，裡面有一個點 P，座標可調。請用模式 2。
```

**輸出**：
```javascript
{
    id: 'coord-point-p',
    title: '坐標點 P',
    inputs: [
        { label: 'P點 X座標', name: 'Px', type: 'number', value: 150, min: 0, max: 300, step: 10 },
        { label: 'P點 Y座標', name: 'Py', type: 'number', value: 150, min: 0, max: 300, step: 10 }
    ],
    render: (d) => {
        return `<svg viewBox="0 0 300 300" width="100%">
            <line x1="150" y1="300" x2="150" y2="0" stroke="black" stroke-width="1"/>
            <line x1="0" y1="150" x2="300" y2="150" stroke="black" stroke-width="1"/>
            <circle cx="\${d.Px}" cy="\${300-d.Py}" r="5" fill="red"/>
            <text x="\${d.Px+10}" y="\${300-d.Py-10}" font-family="'Times New Roman'" font-size="16">P(\${d.Px},\${d.Py})</text>
        </svg>`;
    }
}
```

---

## 相關檔案

- 考卷 HTML：`exam-202X-XX-sX-termX-pX.html`
- SVG 工具庫：`math-svg-tools.html`
- Google Docs：`exam-svg` (追蹤清單)

---

## 狀態

- 建立日期：2026-03-14
- 版本：1.0
