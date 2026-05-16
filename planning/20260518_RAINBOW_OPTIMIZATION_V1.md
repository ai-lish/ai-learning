# 《靈風大彩虹》前端效能優化計劃

**檔案：** `games/S3Ch11-RainbowExplained.html`
**GitHub：** https://github.com/ai-lish/ai-learning/blob/main/games/S3Ch11-RainbowExplained.html
**目標：** 提升程式碼可維護性 + 60fps 滑桿體驗

---

## Phase 1：巨型函式拆分 + 狀態封裝（安全，低風險）

### 任務 1.1：建立 AppState 狀態管理物件

```javascript
const AppState = {
    r: 1.25,                    // 代幣半徑
    R: 4.0,                     // 軌道半徑
    activeLayers: new Set(),    // 當前高亮圖層
    step5ActiveLayer: null,     // Step 5 當前層
    isMathJaxReady: false       // MathJax 渲染狀態
};
```

### 任務 1.2：拆分 drawGeometry() 巨型函式

**重構前：** `drawGeometry()` ~150 行，同時做數學運算 + SVG 繪圖 + 面板更新 + Step5 HTML 重組

**重構後：**
```javascript
function updateApp() {
    const r = parseFloat(rangeR.value);
    const calcResults = performCalculations(r, AppState.activeLayers);
    updateSimulatorSVG(calcResults);
    updateDashboardStats(calcResults);
    updateStep5Panel(calcResults);
}

function performCalculations(r, activeLayers) {
    // 純數學計算，無 DOM 操作
    return { /* 面積、機率、座標 */ };
}

function updateSimulatorSVG(results) {
    // 只管上方模擬器 SVG 更新
}

function updateDashboardStats(results) {
    // 只管數據文字面板更新
}

function updateStep5Panel(results) {
    // 只管第五步面板更新
}
```

**效益：**
- 每個函式 < 30 行，易讀易 Debug
- 符合 Single Responsibility Principle
- 為後續優化打好架構基礎

---

## Phase 2：SVG DOM 重繪策略（60fps 優化）

### 任務 2.1：預先建立 SVG 元素

**重構前：** 滑桿拉動 → `innerHTML = ''` → `createElementNS` 重建 → 大量 GC

**重構後：**
```javascript
// init() 時建立所有元素（預設 hidden）
const svgNS = "http://www.w3.org/2000/svg";
const paths = {
    segmentPaths: [],
    upperArc: null,
    lowerArc: null,
    // ...
};

// 滑桿拉動時，只更新屬性
paths.upperArc.setAttribute('d', newPath);
paths.upperArc.setAttribute('opacity', isActive ? 1 : 0);
```

### 任務 2.2：使用 requestAnimationFrame 同步

```javascript
function onSliderInput() {
    requestAnimationFrame(() => {
        updateApp();  // 確保在下一幀更新
    });
}
```

**效益：**
- 消除 DOM 節點銷毀/重建
- 滑桿拉動達到 60fps
- 減少 Garbage Collection 壓力

---

## Phase 3：MathJax 渲染瓶頸突破（無延遲）

### 任務 3.1：固定符號 + 動態數字分離

**重構前：** 每次滑桿拉動 → 重新組裝 LaTeX 字串 → MathJax 渲染（250ms 延遲）

**重構後：**
```html
<!-- 固定符號（MathJax 一次性渲染） -->
<span class="formula-base">$\pi \times \cos^{-1}\left(\frac{r}{R}\right)$</span>

<!-- 動態數字（普通 HTML，無需 MathJax） -->
<span class="formula-dynamic" id="num-r">1.25</span>
```

```javascript
// 滑桿拉動時，只更新數字
document.getElementById('num-r').innerText = newR;
```

### 任務 3.2：CSS 絕對定位疊加

```css
.formula-wrapper {
    position: relative;
}
.formula-base {
    /* 固定公式符號 */
}
.formula-dynamic {
    position: absolute;
    /* 疊加在公式對應空白處 */
}
```

**效益：**
- 完全消除 MathJax 重新渲染
- 滑桿拉動零延遲
- 學生睇到即時更新的數字

---

## Phase 4：樣式與邏輯分離（Dark Mode 準備）

### 任務 4.1：建立 CSS 變數系統

```css
:root {
    /* 顏色系統 */
    --color-orange: rgba(241, 196, 15, 0.15);
    --color-blue: rgba(52, 152, 219, 0.15);
    --color-green: rgba(46, 204, 113, 0.15);
    --color-yellow: rgba(241, 196, 15, 0.5);
    --color-red: rgba(231, 76, 60, 0.5);
    --color-purple: rgba(155, 89, 182, 0.5);
    
    /* 邊界 */
    --border-black: rgba(0, 0, 0, 1);
    
    /* 文字 */
    --text-primary: #333;
    --text-secondary: #666;
}

/* Dark Mode 預留 */
@media (prefers-color-scheme: dark) {
    :root {
        --text-primary: #f0f0f0;
        --text-secondary: #aaa;
    }
}
```

### 任務 4.2：移除 JS 寫死樣式

**重構前：**
```javascript
coin.setAttribute("fill", "rgba(241, 196, 15, 0.15)");
```

**重構後：**
```javascript
coin.classList.add('coin-fill-orange');
coin.classList.remove('coin-fill-blue');
```

```css
.coin-fill-orange { fill: var(--color-orange); }
.coin-fill-blue { fill: var(--color-blue); }
```

---

## Phase 5：全域變數封裝（State 管理）

### 任務 5.1：移除全域污染

**移除清單：**
- `globalActiveWord` → `AppState.step5ActiveLayer`
- `activeLayers` → `AppState.activeLayers`
- 其他 hardcoded全域變數

**效益：**
- 避免命名衝突
- 為未來加入 React/Vue 打好基礎
- 所有狀態集中在 AppState，易於 Debug

---

## 執行順序

| Phase | 任務 | 風險 | 優先度 |
|-------|------|------|--------|
| 1 | 巨型函式拆分 + 狀態封裝 | 🟢 低 | 🔥 高 |
| 2 | SVG DOM 效能優化 | 🟡 中 | 🔥 高 |
| 3 | MathJax 無延遲渲染 | 🔴 高 | 🟡 中 |
| 4 | 樣式與邏輯分離 | 🟢 低 | 🟡 中 |

**預計工作時間：** 3-4 小時（可分開執行）

---

## 驗證方法

1. **滑桿拉動測試** — 確認 60fps，無卡頓
2. **MathJax 渲染測試** — 確認數字即時更新，無延遲
3. **Dark Mode 測試** — CSS 變數一改，全域顏色跟變
4. **功能回歸測試** — 所有互動功能正常運作