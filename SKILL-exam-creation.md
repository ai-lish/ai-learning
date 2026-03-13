# 考試頁面製作工作流程 (Exam Page Creation Workflow)

## 概述

此工作流程描述點樣由零開始製作一個學期考試既網頁，包括：
1. 建立主頁、卷一、卷二 三個分頁
2. 上載文字題目及選項
3. 標記需要圖像既題目
4. 加入 SVG 幾何圖像

---

## 階段一：建立基礎頁面

### 1.1 建立資料夾結構

```
exam-images/
├── 2024-25-s1-term2/   # S1 第二學期
├── 2025-26-s3-term2/   # S3 第二學期  
└── 2025-26-s5-term2/   # S5 第二學期
```

### 1.2 建立三個 HTML 檔案

| 檔案 | 用途 |
|------|------|
| `exam-202X-XX-sX-termX.html` | 主頁 (考試資訊 + 連結) |
| `exam-202X-XX-sX-termX-p1.html` | 卷一 (選擇題) |
| `exam-202X-XX-sX-termX-p2.html` | 卷二 (選擇題 + 幾何) |

### 1.3 主頁結構範本

```html
<!-- 主頁範本 -->
<!DOCTYPE html>
<html lang="zh-HK">
<head>
    <title>202X-XX 中X 第二學期 數學科考試</title>
    <!-- 加入 MathJax -->
    <script>
    window.MathJax = {
        tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
        startup: { ready: function() { MathJax.startup.defaultReady(); } }
    };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
</head>
<body>
    <!-- 漢堡包選單 -->
    <!-- 試卷選擇卡片 -->
    <a href="exam-202X-XX-sX-termX-p1.html" class="paper-card">卷一</a>
    <a href="exam-202X-XX-sX-termX-p2.html" class="paper-card">卷二</a>
</body>
</html>
```

---

## 階段二：上載題目

### 2.1 題目格式要求

| 元素 | 格式 | 範例 |
|------|------|------|
| 指數 | `$x^2$` | `$x^2$` → x² |
| 分數 | `$\frac{a}{b}$` | `$\frac{3}{4}$` → ¾ |
| 根號 | `$\sqrt{x}$` | `$\sqrt{16}$` → √16 |

### 2.2 圖像預留位置

對於需要圖像既題目：
- 預留 `<div class="diagram-container">` 位置
- 稍後由 SVG 工具庫提取圖像

---

## 階段三：SVG 圖像提取

### 3.1 Google Docs 結構

每個考試既分頁：
- **分頁名稱**: `P2-q13` (卷二-第13題)
- **內容**: 原圖 + 描述 + SVG Code

### 3.2 提取流程

```
1. 打開 Google Docs (exam-svg)
2. Click 分頁 (e.g., P2-q13)
3. 搵 <div class="svg-container"> ... </div>
4. Copy SVG Code
5. Send 比我 (OpenClaw)
6. 我加入 SVG 工具庫 + 更新考試網頁
```

### 3.3 SVG 工具庫格式

```javascript
{
    id: '2025-26_S3_Term2_P2_Q13',
    name: '三角形幾何證明',
    category: '平面幾何',
    tags: ['三角形', '中點', '角平分線'],
    render: () => `<svg>...</svg>`
}
```

---

## 恆常工作流程

### 當 Zach 完成一批 SVG 時：

```
1. Zach: 用 Gemini 製作 SVG
2. Zach: 加入 Google Docs (分頁 = 題號)
3. Zach: Send Google Docs 連結比我
4. 我: 
   a. 讀取文檔 → 提取 SVG Code
   b. 加入 math-svg-tools.html
   c. 更新 exam-202X-XX-sX-termX-pX.html
   d. Commit + Push
5. Zach: Continue with next batch
```

---

## 檔案命名規範

### 考試檔案

| 年級 | 學年 | 學期 | 範例 |
|------|------|------|------|
| S1 | 2024-25 | Term2 | exam-2024-25-s1-term2.html |
| S3 | 2025-26 | Term2 | exam-2025-26-s3-term2-p2.html |
| S5 | 2025-26 | Term2 | exam-2025-26-s5-term2-p1.html |

### SVG 工具庫 ID

```
2025-26_S3_Term2_P2_Q13
  ↑    ↑  ↑    ↑   ↑  ↑
  學年 年級 學期 卷 題號
```

---

## 追蹤系統 (Google Docs)

| 考試 | 狀態 | 檢查清單 |
|------|------|----------|
| 2025-26 S1 Term2 | 進行中 | q10, q11, q12... |
| 2025-26 S3 Term2 | 進行中 | q13 ✓, q17 ✓ |

---

## 常用指令

### 提取 SVG Code

```bash
# 從 Google Docs screenshot 提取
# 使用 OpenClaw browser tool 截圖
# 使用 image tool 分析
```

### 更新網頁

```bash
cd ~/workspace/ai-learning
git add -A
git commit -m "Add: S3 Term2 P2 Q13 SVG"
git push
```

---

## 負責角色

| 角色 | 負責工作 |
|------|----------|
| 🧠 大腦 | 統籌、分析需求、分配任務 |
| 💻 師弟 | 製作 SVG、寫 Code、上傳檔案 |
| 🧪 T仔 | 測試功能、驗證結果 |

---

## 相關檔案

- `math-svg-tools.html` - SVG 工具庫
- `exam-2025-26-s3-term2-p2.html` - 試卷範本
- `exam-svg` (Google Docs) - SVG 追蹤清單
