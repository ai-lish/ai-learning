# 校內考試 OCR + 仿題系統

> 更新日期：2026年4月4日

---

## 📁 檔案架構

```
exam/
├── README.md                    # 本檔案
├── review-p1.html              # 老師 OCR 審核頁（所有卷一共用）
├── review-p2.html              # 老師 OCR 審核頁（所有卷二共用）
│
├── ocr/                        # OCR 數據（統一存放）
│   ├── s5-term2-p1.json       # S5 Term2 卷一 OCR
│   ├── s5-term2-p2.json       # S5 Term2 卷二 OCR
│   ├── s3-term2-p1.json
│   ├── s3-term2-p2.json
│   ├── s1-term2-p1.json
│   └── s1-term2-p2.json
│
├── mimic/                      # 仿題模板（統一存放）
│   ├── s5-term2-p1-mimic.json
│   ├── s5-term2-p2-mimic.json
│   ├── s3-term2-p1-mimic.json
│   └── ...
│
├── 2025-26-s5-term2/
│   ├── index.html
│   ├── p1.html                # 學生練習（含重做按鈕）
│   └── p2.html                # 學生練習（含重做按鈕）
│
├── 2025-26-s3-term2/
│   └── ...
│
├── 2025-26-s1-term2/
│   └── ...
│
└── 2024-25-s1-term2/
    └── ...
```

---

## 🔧 頁面功能

| 頁面 | 對象 | 功能 |
|------|------|------|
| `review-p1.html` | 老師 | OCR 審核所有校內考試卷一 |
| `review-p2.html` | 老師 | OCR 審核所有校內考試卷二 |
| `p1.html` | 學生 | 做題 + 重做按鈕（讀取 ocr/mimic） |
| `p2.html` | 學生 | 做題 + 重做按鈕（讀取 ocr/mimic） |

---

## 📊 數據格式

### OCR JSON (`ocr/[exam]-p[1|2].json`)

```json
{
  "[Year][QNum]": {
    "question": "題目文字",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "answer": "B",
    "topic": "課題名稱",
    "hasSvg": false,
    "svgSlots": []
  }
}
```

### Mimic JSON (`mimic/[exam]-p[1|2]-mimic.json`)

```json
{
  "[Year][QNum]": {
    "topic": "課題名稱",
    "template": "含變量的題目模板",
    "variables": [
      { "name": "a", "min": 1, "max": 9 }
    ]
  }
}
```

---

## ✅ 完成標準

### 老師 OCR 審核頁 (`review-p1.html`, `review-p2.html`)

- [ ] 可選擇考試（年級/學年/學期）
- [ ] 顯示題目列表
- [ ] 可標記正確/錯誤
- [ ] 可編輯題目和答案
- [ ] 可上傳/更新 OCR 數據

### 學生練習頁 (`p1.html`, `p2.html`)

- [ ] 根據 URL 參數自動載入對應 OCR 數據
- [ ] 顯示所有題目
- [ ] 支援選擇/輸入答案
- [ ] 「核對答案」按鈕顯示 ✓/✗
- [ ] 「重做類似題」按鈕（答錯時出現）
- [ ] 從 mimic 模板生成新題目
- [ ] 「睇官方答案」按鈕

### 測試原則

1. **逐題測試** — 每題必須測試通過
2. **失敗回環** — 測試失敗 → 交回製作 → 修復 → 再測試
3. **原則達成** — 所有 README 標準達成先算完結

### 測試清單

#### review-p1.html / review-p2.html
- [ ] 可選擇不同考試
- [ ] 題目正確顯示
- [ ] 可標記審核狀態
- [ ] 可保存更改

#### p1.html / p2.html
- [ ] Q1 顯示正確
- [ ] Q1 可選擇/輸入答案
- [ ] Q1 核對答案顯示正確/錯誤
- [ ] Q1 答錯時「重做」按鈕出現
- [ ] Q1 重做生成新題
- [ ] ... (逐題測試直到最後一題)

---

## 📝 工作流程

### 1. OCR 審核（新題目）
```
老師 → review-p1.html → 選擇考試 → 審核題目 → 保存 OCR JSON
```

### 2. 仿題模板製作
```
老師 → 制作 mimic JSON → 存入 exam/mimic/
```

### 3. 學生練習
```
學生 → p1.html → 選擇答案 → 核對 → 答錯 → 重做類似題
```

---

## 🔄 迭代記錄

| 日期 | 版本 | 更新內容 |
|------|------|----------|
| 2026-04-04 | v1.0 | 初版規劃 |

