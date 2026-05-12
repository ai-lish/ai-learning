# PLANNING: CH11 互動幾何公式翻轉卡

## 目標
中一「第11章 與直線和三角形相關的角」互動公式翻轉卡

## 兩種模式
- 簡報模式：上而下展示全部7張卡
- 隨機模式：隨機順序，點擊切換

## 每張卡結構
```
正面（公式）←→ 背面（例題）
```
- 正面：可拖放變量（x, y, 180°等）
- 背面：特定角度，拖放驗證後顯示步驟方格

## 流程
1. 封面重溫公式 → 反轉
2. 例題拖放驗證 → 顯示正確公式+理由
3. 剔選步驟方格 → 順序揭小步驟+答案
4. 反轉回同卡封面 → 下一個定理

## 7個定理
1. 直線上的鄰角（x + y = 180°）
2. 同頂角（x + y + z = 360°）
3. 對頂角（x = y）
4. 同位角（x = y, AB//CD）
5. 內錯角（x = y, AB//CD）
6. 同旁內角（x + y = 180°, AB//CD）
7. 三角形內角和（x + y + z = 180°）

## Tasks

### Phase 1：基礎架構
- [ ] HTML結構 + CSS 3D flip動畫
- [ ] State管理（mode切換、currentIndex、isFlipped）
- [ ] 響應式設計

### Phase 2：數據與繪圖
- [ ] THEOREMS數據結構（7個定理）
- [ ] Canvas系統（正面：變量 / 背面：特定角度）

### Phase 3：互動邏輯
- [ ] 拖放系統（改編現有代碼）
- [ ] 驗證邏輯（即時驗證 + 顯示正確公式/理由）
- [ ] 步驟揭小器（□剔選 → 順序reveal）

### Phase 4：導航與模式
- [ ] 導航系統（prev/next、進度指示器）
- [ ] 簡報模式（7卡總覽 → 點擊進入）
- [ ] 隨機模式（shuffle → 不重複切換）

## Tech Stack
- 純HTML + CSS + JavaScript
- CSS 3D Transforms
- HTML5 Canvas
- Tailwind CSS（CDN）

## 風險
- Canvas代碼要大幅改寫
- 3D flip backface-visibility兼容性

## Spec
https://github.com/ai-lish/ai-learning/blob/main/ch11-geometry-flashcard/SPEC.md
