# 卷二整合入主頁面 - 不會Timeout既方案

## 問題分析

之前Timeout既原因：
1. Task太大 - 40題一次過
2. 需要format轉換 - p2既選項格式 → 主頁面格式

## 解決方案

### 我自己直接做 (不經subagent)

因為：
- 我既token limit高好多
- 可以一次性處理

---

## 執行步驟

### Step 1: 讀取p2既40題內容
- 從 exam-2024-25-s1-term2-p2.html 拎Q1-40

### Step 2: 轉換格式
p2格式:
```html
<div class="question" id="q1">
    <span class="question-num">1</span>
    <div class="question-text">題目</div>
    <div class="options">...</div>
    <div class="answer">答案</div>
</div>
```

目標格式 (適配主頁面CSS):
```html
<div class="question">
    <div class="question-header">
        <span><span class="question-num">Q1</span>題目</span>
    </div>
    <div class="sub-question">
        <span class="option-letter">A.</span> 選項
    </div>
    ...
</div>
```

### Step 3: 替換位置
- 定位 `<div id="paper2">` 既 part-content
- 替換為40題

### Step 4: Commit + Push

---

## 預計時間

- 讀取內容: 1分鐘
- 轉換格式: 5分鐘
- 替換: 2分鐘
- Commit: 1分鐘
- **Total: ~10分鐘**

---

## 開始執行

(我直接做，唔經subagent)
