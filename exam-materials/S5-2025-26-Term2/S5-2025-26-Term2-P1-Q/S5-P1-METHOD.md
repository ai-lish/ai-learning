# S5 2025-26 Term 2 - 卷一製作方法

## 考試資料
- **年份**: 2025-26
- **級別**: S5 (中五)
- **學期**: Term 2 (第二次考試)
- **卷別**: Paper 1 (卷一 - 選擇題)

## 題目數量
- Q1-Q30 (30題)
- 每題有題目、選項(A/B/C/D)、答案

---

## 製作流程

### Step 1: 建立基礎結構
```html
<div class="question" data-correct="A">
    <div class="question-num">1.</div>
    <div class="question-text">題目內容...</div>
    <div class="options-container">
        <div class="option" onclick="selectOption(this, 'A')">A. 選項A</div>
        <div class="option" onclick="selectOption(this, 'B')">B. 選項B</div>
        <div class="option" onclick="selectOption(this, 'C')">C. 選項C</div>
        <div class="option" onclick="selectOption(this, 'D')">D. 選項D</div>
    </div>
    <div class="answer">正確答案：A</div>
</div>
```

### Step 2: 數學公式格式
| 類型 | 格式 | 範例 |
|------|------|------|
| 指數 | `$x^2$` | x² |
| 分數 | `$\frac{a}{b}$` | a/b |
| 根號 | `$\sqrt{x}$` | √x |
| 平方 | `$x^2$` | x² |

### Step 3: 加入 MathJax
```html
<script>
window.MathJax = {
    tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
    startup: { typeset: true }
};
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
```

---

## 測試檢查清單

- [ ] Q1-Q30 所有題目顯示
- [ ] 選項 A/B/C/D 正確顯示
- [ ] 數學公式正確顯示 (指數、分數、根號)
- [ ] 點擊選項有反應
- [ ] 答案正確

---

## 已知問題
- 無 (卷一主要係文字題，較少問題)
