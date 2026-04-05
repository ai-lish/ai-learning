# 校內考試 OCR + 仿題系統

> 更新日期：2026年4月5日

---

## 📁 檔案架構

```
exam/
├── README.md                    # 本檔案
├── review-p1.html              # 老師 OCR 審核頁（所有卷一共用）
├── review-p2.html              # 老師 OCR 審核頁（所有卷二共用）
├── review-p3.html              # 老師 OCR 審核頁（所有卷三共用）
├── practice.html               # 仿題模板審批頁面（統一練習入口）
│
├── ocr/                        # OCR JSON（統一存放）
│   ├── s1-term3-p1.json       # S1 Term3 卷一
│   ├── s1-term3-p2.json       # S1 Term3 卷二
│   ├── s3-term3-p2.json       # S3 Term3 卷二
│   ├── s5-term2-p1.json       # S5 Term2 卷一
│   ├── s5-term2-p2.json       # S5 Term2 卷二
│   └── s5-term3-p2.json       # S5 Term3 卷二
│
├── mimic/                      # 仿題模板 JSON（重做生成新題用）
│   ├── s5-term2-p1-mimic.json
│   ├── s5-term2-p2-mimic.json
│   └── ...
│
├── 2025-26-s5-term2/          # 示範：完整結構
│   ├── index.html              # 試卷入口（揀卷一/卷二）
│   ├── p1.html                 # 學生練習（卷一）+ 重做按鈕
│   ├── p2.html                 # 學生練習（卷二）+ 重做按鈕
│   ├── p1-ms/                  # 卷一答案详解
│   ├── paper1_ms.pdf           # 卷一官方答案 PDF
│   └── paper2.pdf               # 卷二 PDF
│
├── 2025-26-s3-term3/          # S3 Term3
│   ├── index.html
│   ├── p2.html
│   ├── p3.html
│   ├── review.html             # 老師 OCR 審批頁（卷二）
│   ├── review_p3.html          # 老師 OCR 審批頁（卷三）
│   ├── data/questions.json    # 卷二 OCR 數據
│   ├── p3_data/questions.json  # 卷三 OCR 數據
│   └── paper*.pdf
│
├── 2025-26-s5-term3/          # S5 Term3
│   ├── index.html
│   ├── p2.html
│   ├── review.html
│   ├── data/questions.json
│   └── paper*.pdf
│
├── 2025-26-s3-term2/
├── 2025-26-s1-term2/
├── 2024-25-s1-term2/
└── ...
```

---

## 🔧 頁面功能

| 頁面 | 對象 | 功能 |
|------|------|------|
| `index.html` | 學生 | 試卷入口，揀卷一/卷二/卷三 |
| `p1.html` / `p2.html` / `p3.html` | 學生 | 做題 + 重做按鈕 |
| `review-p1.html` | 老師 | OCR 審核所有校內考試卷一 |
| `review-p2.html` | 老師 | OCR 審核所有校內考試卷二 |
| `review-p3.html` | 老師 | OCR 審核所有校內考試卷三 |
| `practice.html` | 老師 | 仿題模板審批頁面（統一練習入口） |

---

## 🔀 頁面關係圖

```
主頁 (index.html)
└── 考試專區
    └── 篩選：年份 / 年級 / 學期
        └── exam/2025-26-sX-termY/index.html
            ├── 卷一 → p1.html → 讀取 ocr/*.json + mimic/*.json
            ├── 卷二 → p2.html → 讀取 ocr/*.json + mimic/*.json
            └── 卷三 → p3.html → 讀取 ocr/*.json + mimic/*.json
```

**共享頁面讀取路徑：**
```
p1/p2/p3.html → 讀取 ocr/XX.json（題目）
              → 讀取 mimic/XX.json（重做生成新題）

review-p1/p2/p3.html → 讀取 ocr/*.json → 老師審批 → 保存 OCR JSON

practice.html → 讀取 ocr/*.json → 仿題練習
```

---

## 📊 數據格式

### OCR JSON (`ocr/[exam]-p[1|2|3].json`)

```json
{
  "info": { "year": "2025-26", "grade": "s1", "term": "term3", "paper": "p1", "total": 31 },
  "2026S1Q01": {
    "question": "題目文字",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "answer": "B",
    "topic": "課題名稱"
  }
}
```

### Mimic JSON (`mimic/[exam]-p[1|2]-mimic.json`)

```json
{
  "2026S1Q01": {
    "topic": "課題名稱",
    "template": "含變量的題目模板",
    "variables": [
      { "name": "a", "min": 1, "max": 9 }
    ]
  }
}
```

---

## 📝 製作次序（每個新 exam）

```
1. PDF → 放入 exam/2025-XX/folder/
2. OCR → pdftotext + 截圖OCR + 手動修復 → ocr/XX.json
3. JSON → 整理成 *.json → ocr/
4. review-p1/p2/p3.html → 舊版更新
5. practice.html → 舊版
6. index.html → exam/XX/index.html
7. p1/p2/p3.html + 重做按鈕 → 複製舊版 + update path
8. 導航 → 更新主頁 availableExams
9. 測試 → 小詩 PDF vs 網頁對照
```

---

## 🔄 數據流向

### Student Journey（學生旅程）
```
首頁 → 搜索引擎 → p1.html / p2.html / p3.html
                           → 讀取 ocr/*.json（題目）
                           → 讀取 mimic/*.json（重做生成新題）
```

### Teacher Journey（老師旅程）
```
review-p1/p2/p3.html → 讀取 ocr/*.json → 老師審批 → 保存 OCR JSON
```

---

## 📦 數據來源

**Google Drive Folder（MacD Files）：**
- Folder ID: `1GUZ0C-grqBdtWGBB0mgO9izuN7Qrs-Gb`
- PDFs + Marking Schemes 存放於此

---

## ✅ 完成標準

### 老師 OCR 審核頁 (`review-p1.html`, `review-p2.html`, `review-p3.html`)

- [ ] 可選擇考試（年級/學年/學期）
- [ ] 顯示題目列表
- [ ] 可標記正確/錯誤
- [ ] 可編輯題目和答案
- [ ] ☁️ GitHub sync 按鈕同步到 GitHub

### 學生練習頁 (`p1.html`, `p2.html`, `p3.html`)

- [ ] 根據 URL 參數自動載入對應 OCR 數據
- [ ] 顯示所有題目
- [ ] 支援選擇/輸入答案
- [ ] 「核對答案」按鈕顯示 ✓/✗
- [ ] 「重做類似題」按鈕（答錯時出現）
- [ ] 從 mimic 模板生成新題目

---

## 🧪 測試原則

1. **學生視角** — 小詩由首頁進入，模仿學生使用
2. **PDF vs 網頁對照** — 同一份卷用 PDF 版做一次，再用網頁版做一次
3. **逐題確認** — 兩份卷嘅問題文字、MathJax 顯示、選項必須一致
4. **失敗回環** — 發現差異 → 匯報 → 修復 → 再測試

---

## 🔄 迭代記錄

| 日期 | 版本 | 更新內容 |
|------|------|----------|
| 2026-04-04 | v1.0 | 初版規劃 |
| 2026-04-05 | v1.1 | 加入 Term3 架構、更新製作次序、頁面關係圖 |
