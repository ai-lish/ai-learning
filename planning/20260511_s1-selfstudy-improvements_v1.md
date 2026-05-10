# 中一自學平台 — 改進計劃

**狀態：** DRAFT
**日期：** 2026-05-11
**版本：** v0.1

---

## 1. 練習頁面加入「上一頁 / 下一頁」導航

**目標：** 讓學生可以連貫地完成所有練習

**實作方式：**
- 每個練習頁面底部加入 `← 上一練習` 和 `下一練習 →` 按鈕
- 按鈕固定於頁尾，不會覆蓋題目
- 最後一個練習隱藏「下一練習」
- 第一個練習隱藏「上一練習」

**設計參考：**
```
[← 練習 1]           [練習 3 →]
```

**CSS 方向：**
- 固定底部 bar，半透明背景
- 按鈕用與現有 `.mode-btn` 一樣的風格

---

## 2. 每章加入章節測驗（通關制）

**目標：** 鞏固每章學習成果，確保學生掌握基本概念後才進入下一章

**實作方式：**
- 每章（ch1, ch2, ...）加入一個 `chapter-X-quiz.html` 頁面
- 收集該章所有練習的隨機題目（每練習抽 2-3 題）
- **通關門檻：** 正確率 ≥ 80% 方可解鎖下一章
- 不合格可以重考，冇限次數
- 合格後記錄進 localStorage，跨 session 保留

**數據結構（localStorage）：**
```javascript
{
  "chapter-1-quiz": { "completed": true, "score": 85, "date": "2026-05-11" },
  "chapter-2-quiz": { "completed": false, "score": null, "date": null }
}
```

**UI 流程：**
```
完成練習 1-4 → 出現「章節測驗」按鈕 → 點擊進入 quiz → 達標 → 解鎖下一章
```

**章節劃分：**
- ch1: 練習 1-4（有向數運算）
- ch2: 練習 5-8（代數基礎）
- ch3: 練習 9-12（一元一次方程）
- ch4: 練習 13-15（代數運算）
- ch5: 練習 16-19（指數運算）
- ch6: 練習 20-23（百分比與價格計算）

---

## 3. 卡牌進度顯示（顏色狀態）

**目標：** 讓學生一眼睇到各練習的完成狀態

**狀態定義：**
| 狀態 | 顏色 | 條件 |
|------|------|------|
| 🟢 完成 | 綠色 | 該練習全部答對（100%）|
| 🔴 不合格 | 紅色 | 曾經做過但未合格 |
| ⚪ 未開始 | 透明/灰色 | 從未進入 |

**實作方式：**
- 在 `index.html` 練習列表的每個連結加入顏色 indicator
- 練習連結旁邊加小圓點或徽章
- 顏色由 localStorage 中的完成數據決定
- 測驗卡都需要顯示狀態（合格=綠，不合格=紅，未做=灰）

**CSS 方向：**
```css
.badge-complete { background: #4CAF50; }
.badge-failed   { background: #f44336; }
.badge-pending  { background: #e0e0e0; opacity: 0.5; }
```

**localStorage key：`practice_progress`**：
```javascript
{
  "practice-01": { "status": "complete", "bestScore": 100 },
  "practice-02": { "status": "complete", "bestScore": 100 },
  "practice-03": { "status": "failed",   "bestScore": 60 },
  "practice-04": { "status": "pending",  "bestScore": null }
}
```

---

## 4. 鍵盤按鍵輸入（不彈出手機鍵盤）

**目標：** 提升桌面和手機使用體驗，學習時可直接用鍵盤答題

**實作方式：**
- 頁面監聽 `keydown` 事件
- 方向鍵 ↑/↓ 或 數字鍵 1-9 選擇答案（如果係選擇題）
- Enter 提交答案
- Tab 移動到下一題
- 輸入框仍然可用，但鍵盤捷徑提供快速操作
- **防止手機鍵盤彈出：** 使用 `inputmode="none"` 或自定義無 input 的按鍵模式

**具體功能：**
1. **輸入框以外的區域** — 按數字鍵直接輸入答案（不入 input field）
2. **Enter** — 提交當前答案，等同點擊「確定」
3. **Arrow Right** — 跳到下一題
4. **Escape** — 清除輸入

**代碼方向：**
```javascript
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return; // 唔干擾 normal input
  if (e.key === 'Enter') {
    checkAnswer(); // 提交
  } else if (e.key >= '0' && e.key <= '9') {
    // 直接輸入數字（跳過 input）
    e.preventDefault();
    // 附加到 current input value
  }
});
```

**移動端考量：**
- 避免使用 `type="text"` 触发键盘
- 可以用 ` contenteditable="true"` 的 div 配合 `inputmode="numeric"`
- 或者用自定义的「数字按钮面板」（避免系统键盘）

---

## 優先次序

| 優先 | 項目 | 原因 |
|------|------|------|
| 1 | #1 上一頁/下一頁 | 最簡單，學生立竿見影受惠 |
| 2 | #3 卡牌顏色 | 可視化進度，提升動機 |
| 3 | #4 鍵盤輸入 | 體驗優化，技術要求中等 |
| 4 | #2 章節測驗 | 最複雜，涉及跨頁面狀態管理 |

---

## 待確認事項

- [ ] 章節測驗的題目數量（每章抽幾題？時間限制？）
- [ ] 合格門檻是否 80%？或可調整？
- [ ] 卡牌顯示喺邊度？index 頁？還是每個章節頁？
- [ ] 鍵盤捷徑是否需要設定頁面說明？