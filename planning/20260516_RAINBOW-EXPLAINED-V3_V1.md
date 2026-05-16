# 20260516_靈風大彩虹-V3_V1

## 目標
修改 `games/S3Ch11-RainbowExplained.html`，分為三項任務。

---

## 任務 1：核心體驗 — 數據列改為兩行顯示

**現況（單行）：**
```html
<span class="win-area-display" id="win-area-result">-- cm²</span>
<span class="win-prob" id="win-prob-result">-- %</span>
<span class="breakdown-stats" id="breakdown-stats"></span>
```

**改為兩行：**

### HTML（第148-158行）
```html
<div class="live-stats">
    <div class="stat-row-main">
        <span class="stat-item">
            <span class="label">🏆</span>
            <span class="win-area-display" id="win-area-result">-- cm²</span>
        </span>
        <span class="stat-item">
            <span class="label">🎯</span>
            <span class="win-prob" id="win-prob-result">-- %</span>
        </span>
    </div>
    <div class="stat-row-breakdown" id="breakdown-stats"></div>
</div>
```

### CSS（新增）
```css
.stat-row-main { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.stat-row-breakdown { font-size: 0.78rem; font-weight: bold; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 4px; }
.stat-row-breakdown span { white-space: nowrap; }
```

### JS（`drawGeometry()` 內，約第966行）
現：`breakdownStats.push(...)` → `document.getElementById('breakdown-stats').innerHTML = breakdownStats.join(' &nbsp; ')`

改為：建立一個 `breakdownRow` div 陣列，每色一個 `<span>● 藍色: X.XX cm²</span>`，最後 `breakdownRow.join('')` 寫入 `#breakdown-stats`。

### 預期呈現
```
🏆 18.579 cm²    🎯 3.8707 %
● 藍色: 2.21 cm²   ● 綠色: 3.31 cm²   ● 黃色: 5.68 cm²   ● 紅色: 7.38 cm²
```

---

## 任務 2：第一步 — 顯示「半徑」的同時顯示半圓軌跡

**現況：** 圖解1 SVG中，`s1-upper-traj` 只係一條直線（半徑線），`s1-lower-traj` 只係一條弧線，兩者獨立。

**目標：** 當滑鼠 hover 或點擊「上限半徑 / 下限半徑」時，同時顯示：
- 半徑直線（已有）
- 半圓軌跡（完整半圓弧，用半徑長度畫出）

### Step 1 SVG 修改

#### 上限（`s1-upper-radius` 已有的 `<g transform="translate(250,200)">` 內）
在 `</g>` 前加入：
```svg
<!-- 上限半圓軌跡（半徑 = s1-upper-traj 的 R 值） -->
<!-- 當前上限半徑長度 = 150（半徑線）→ 半徑值 = 外半徑 - r = 3.4 - 1.25 = 2.15 cm，但視覺上用 150px 表示 -->
<!-- 改為用變量呈現：用 SVG viewBox 內的真實半徑值，視覺上取 150px -->
<!-- 在 highlight 時：新增一條完整半圓弧，路徑為 "M -150 0 A 150 150 0 0 1 150 0" -->
<!-- 標記為 class="svg-obj s1-upper-arc-full" stroke="#e67e22" stroke-width="2" fill="none" -->
```
**關鍵邏輯：** 圖解1 SVG 係靜態插圖，唔似模擬器動態改變 r 值。所以半徑長度用固定視覺值（上限約 150px）表示，同時加一條完整半圓弧線（`M -R R A R R 0 0 1 R R`）。

#### 修正點：
1. 在上限 `<g transform="rotate(-30)">` 內，加入 `path class="svg-obj s1-upper-traj-full"` — 完整半圓弧（黑色虛線）
2. 在下限 `<g transform="rotate(-150)">` 內，加入 `path class="svg-obj s1-lower-traj-full"` — 完整半圓弧
3. `s1-upper-radius` / `s1-lower-radius` highlight 時，`.svg-container-hovered .svg-obj.highlighted` 會同時點亮這些新弧線

#### 具體代碼位置（第223-255行）：
在第231行 `</g>` 前，在上限 `rotate(-30)` 組內加入：
```svg
<!-- 上限完整半圓軌跡 -->
<path class="svg-obj s1-upper-arc" d="M -150 0 A 150 150 0 0 1 150 0" fill="none" stroke="#e67e22" stroke-width="2" stroke-dasharray="6,4"/>
```
在下限 `rotate(-150)` 組內加入：
```svg
<!-- 下限完整半圓軌跡 -->
<path class="svg-obj s1-lower-arc" d="M -140 0 A 140 140 0 0 1 140 0" fill="none" stroke="#2980b9" stroke-width="2" stroke-dasharray="6,4"/>
```

#### CSS highlight 邏輯
`.interactive-word` 的 `data-target` 追加：
- `s1-upper-radius` → 追加 `s1-upper-arc`
- `s1-lower-radius` → 追加 `s1-lower-arc`

#### 文字標示
在半徑線旁（已存在的 `上限軌跡` / `下限軌跡` 文字旁），加入文字標示半徑值（如 `R=150` 或數值形式 `R_up`）。

---

## 任務 3：第二步 — θ 顯示移除，合併入弓形圖文

**現況：**
- SVG（第313-316行）有單獨的 `θ = 2α` 顯示（在弓形外側）
- HTML（第330行）文字：「該 <span class="interactive-word" data-target="s2-segment">弓形</span> <span class="interactive-word" data-target="s2-segment s2-angle">總圓心角 $\theta = 2\alpha$</span>」

**目標：**
1. 移除 SVG 中的 `θ = 2α` 標示（紫色弧線 + 文字）
2. 合併入弓形的圖文說明中 — 強調弓形本身就代表完整的 `θ` 角度
3. 文字改為：「弓形的總圓心角是 $\theta = 2\alpha$，即硬幣能覆蓋的角度範圍」

### SVG 修改（第313-316行）
刪除：
```svg
<!-- 總角度 Theta = 2 alpha -->
<line class="svg-obj s2-segment" x1="200" y1="240" x2="320" y2="150" stroke="#9b59b6" stroke-width="2" stroke-dasharray="3,3"/>
<path class="svg-obj s2-segment" d="M 168 216 A 40 40 0 0 1 232 216" fill="none" stroke="#9b59b6" stroke-width="3"/>
<text class="svg-obj s2-segment" x="200" y="205" font-size="14" font-weight="bold" fill="#9b59b6" text-anchor="middle">θ = 2α</text>
```

### 弓形 SVG 增強（代替 θ 標示）
在 `path class="svg-obj s2-segment"`（第291行的弓形）上，添加更明顯的圓心角弧線，使弓形本身即是角度的視覺證明，而不是外加一個獨立的 θ 標示。

### HTML 第330行修改
```html
<!-- 改前 -->
<p>因為圖形對稱，該 <span class="interactive-word" data-target="s2-segment">弓形</span> <span class="interactive-word" data-target="s2-segment s2-angle">總圓心角 $\theta = 2\alpha$</span>：</p>

<!-- 改後 -->
<p>從圖中可見，硬幣從左側極限位置移到右側極限位置，覆蓋了完整的弓形區域。這個弓形的總圓心角是 <span class="interactive-word" data-target="s2-segment s2-angle">$\theta = 2\alpha$</span>，它代表硬幣能覆蓋的最大角度範圍。</p>
```

### 同時更新第二步的公式 Block
移除獨立的 `θ = 2 cos⁻¹(r/R)` 公式行，合併入弓形面積公式的推導過程中。

---

## 技術備註

- 圖解1 係靜態插圖（唔似模擬器），所以「顯示半徑時顯示半圓軌跡」指 highlight 互動效果，而非動態數值變化
- 任務2和3唔涉及 JS 改動，純 SVG + HTML + CSS
- 任務1 需要修改 JS `drawGeometry()` 中的 `breakdownStats` 陣列邏輯