# 卷一二合併 - 詳細計劃

## 📋 現有結構分析

### 主頁面：exam-2024-25-s1-term2.html

**卷二部分結構 (line 451-493):**
```html
<div id="paper2" class="paper-content">
    <div class="section-info">...</div>
    
    <!-- 甲部 -->
    <div class="part-section">
        <div class="part-header">甲部 (Q1-Q28)</div>
        <div class="part-content">
            <div class="question">
                <div class="question-header">
                    <span>Q1</span><span>$2(-3) - 5 = ?$</span>
                    <span class="question-score">1分</span>
                </div>
            </div>
            <!-- 只有 Q1-Q3 有content -->
            <!-- Q4-Q28, Q29-Q40 得 placeholder -->
        </div>
    </div>
    
    <!-- 乙部 -->
    <div class="part-section">...</div>
</div>
```

**問題：** 
- 卷二只有 Q1-Q3 真正內容
- Q4-Q28, Q29-Q40 得 placeholder

---

## 🔧 解決方案

### 需要做既野：

1. **將 p2 file 既 40題 COPY 去主頁面**
2. **轉換格式** - p2 既題目有 A/B/C/D 選項，需要適配主頁面既 CSS

### p2 題目格式 (需要轉換)
```html
<!-- p2 既格式 -->
<div class="question" id="q1">
    <span class="question-num">1</span>
    <div class="question-text">計算 $2(-3) - 5$ 的值。</div>
    <div class="options">
        <div class="option"><span class="option-letter">A.</span> -11</div>
        <div class="option"><span class="option-letter">B.</span> -10</div>
    </div>
    <div class="answer">答案: A</div>
</div>
```

### 主頁面既問題格式 (目標)
```html
<!-- 主頁面既格式 -->
<div class="question">
    <div class="question-header">
        <span><span class="question-num">Q1</span>$2(-3) - 5 = ?$</span>
        <span class="question-score">1分</span>
    </div>
</div>
```

---

## 📝 執行步驟

### Step 1: 準備p2題目
- 拎40題既內容
- 轉為適合既HTML格式

### Step 2: 替換卷二section
- 定位 `<!-- 卷二 -->`
- 替換 `<div id="paper2">` 既 content

### Step 3: 測試
- Tab切換
- Q1-Q40顯示
- MathJax渲染

---

## 🧪 完整測試計劃

### 1. 基本功能測試
| # | 項目 | 預期 | 狀態 |
|---|------|------|------|
| 1.1 | 進入頁面 | 正常顯示 | ⬜ |
| 1.2 | 預設顯示卷一 | Q1-Q29 | ⬜ |
| 1.3 | 點擊「卷二」Tab | 切換到卷二 | ⬜ |

### 2. 卷二內容測試
| # | 項目 | 預期 | 狀態 |
|---|------|------|------|
| 2.1 | Q1 顯示 | 正確顯示題目 | ⬜ |
| 2.2 | Q1 選項 | A/B/C/D顯示 | ⬜ |
| 2.3 | Q1 答案 | 答案正確 | ⬜ |
| 2.4 | Q2 顯示 | 正確顯示題目 | ⬜ |
| 2.5 | Q3 顯示 | 正確顯示題目 | ⬜ |
| 2.6 | ... | ... | ⬜ |
| 2.40 | Q40 顯示 | 正確顯示題目 | ⬜ |

### 3. UI/UX測試
| # | 項目 | 預期 | 狀態 |
|---|------|------|------|
| 3.1 | Tab切換動畫 | 流暢 | ⬜ |
| 3.2 | MathJax渲染 | 數學公式正常顯示 | ⬜ |
| 3.3 | 手機版 | 正常顯示 | ⬜ |
| 3.4 | 電腦版 | 正常顯示 | ⬜ |

### 4. 功能測試
| # | 項目 | 預期 | 狀態 |
|---|------|------|------|
| 4.1 | 答案摺疊 | 可以show/hide | ⬜ |
| 4.2 | 返回按鈕 | 正常運作 | ⬜ |
| 4.3 | 卷一切換 | 正常 | ⬜ |

---

## ✅ 成功標準

- [ ] Q1-Q40 全部正確顯示
- [ ] Tab切換正常
- [ ] MathJax正常
- [ ] 答案正確
- [ ] 手機/電腦版正常

---

## 📅 預計時間

| 步驟 | 時間 |
|------|------|
| 製作 | 10分鐘 |
| Commit | 2分鐘 |
| 測試 | 15分鐘 |
| **Total** | **~30分鐘** |
