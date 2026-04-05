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

### 老師版入口

**位置：** 首頁 → 考試專區 → 最底灰色「老師版」連結

**功能：**
- 📝 DSE 卷一/卷二 OCR 審核
- 📝 DSE 卷一答案 OCR
- 🎯 DSE 仿題模板系統
- 📝 校內卷一/卷二/卷三 OCR 審核
- 📝 校內考試仿題模板

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
- 詳細位置請查閱 `TOOLS.md`（機密資料，不在 README 公開）
- PDFs + Marking Schemes 存放於 MacD Files Folder

---

## 📁 DSE 自主練習系統架構

```
hkdse/                          # DSE 自主練習主目錄
├── README.md                   # DSE 系統說明
├── dse-practice-p1.html       # 學生練習卷一
├── dse-practice-p2.html       # 學生練習卷二
├── guide.html                  # 使用指南
├── pages/
│   ├── review_p1.html         # 老師 OCR 審批頁（卷一）
│   ├── review_p2.html         # 老師 OCR 審批頁（卷二）
│   ├── review_p1_answers.html  # 卷一答案審批
│   ├── p1_sheet_data.json     # 卷一工作表數據
│   ├── p2_sheet_data.json     # 卷二工作表數據
│   ├── p1_latex_ocr_results.json
│   ├── p2_latex_ocr_results.json
│   └── ...
├── ocr-output/                 # OCR 原始輸出
│   ├── p1_all_scan_results.json
│   ├── p2_final_results.json
│   ├── images-p1/             # 卷一截圖
│   ├── images-p2/             # 卷二截圖
│   ├── svg_p1/                # 卷一 SVG
│   └── svg_p2/                # 卷二 SVG
└── mimic-generator/            # 仿題生成器
    ├── index.html             # 仿題生成頁面
    ├── generate.py            # 生成腳本
    └── auto_templates_*.json  # 仿題模板
```

### DSE 頁面功能

| 頁面 | 對象 | 功能 |
|------|------|------|
| `dse-practice-p1.html` | 學生 | DSE 卷一練習 |
| `dse-practice-p2.html` | 學生 | DSE 卷二練習 |
| `pages/review_p1.html` | 老師 | DSE 卷一 OCR 審批 |
| `pages/review_p2.html` | 老師 | DSE 卷二 OCR 審批 |
| `mimic-generator/index.html` | 老師 | 仿題生成 |

### DSE 製作次序

```
1. PDF → 下載 DSE PDF
2. OCR → 截圖 + Vision OCR → ocr-output/
3. JSON → 整理 → pages/*.json
4. review_p1/p2.html → 老師審批 → 保存
5. dse-practice-p1/p2.html → 學生練習頁
6. mimic-generator → 仿題生成
```

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
