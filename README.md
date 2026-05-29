# ai-learning — 少康老師教學網站

> 香港中學數學互動自學網站 | 課題筆記 + 自學練習 + 遊戲 + 校內考試 + HKDSE 練習

**🌐 網址：** https://ai-lish.github.io/ai-learning/

---

## 📋 目錄

- [現狀概覽](#現狀概覽)
- [目錄結構](#目錄結構)
- [課題頁面](#課題頁面)
- [自學練習](#自學練習)
- [課題遊戲](#課題遊戲)
- [考試專區](#考試專區)
- [HKDSE 練習](#hkdse-練習)
- [其他功能](#其他功能)
- [技術架構](#技術架構)
- [部署流程](#部署流程)
- [已知問題](#已知問題)

---

## 現狀概覽

| 功能 | 狀態 | 說明 |
|------|------|------|
| 首頁導航 | ✅ 正常 | 課題/遊戲/考試/工具入口 |
| 中一課題頁面 | ✅ 正常 | S1Ch1–S1Ch13（13 頁） |
| 中二課題頁面 | ✅ 正常 | S2Ch10（畢氏定理） |
| 中三課題頁面 | ✅ 正常 | S3Ch2/4/7/8/9/11（6 頁） |
| 中四課題頁面 | ✅ 正常 | S4Ch3 直線方程（4 頁） |
| 中五課題頁面 | ✅ 正常 | S5Ch14/17/18 + Tutorial（4 頁） |
| 自學練習（中一） | ✅ 正常 | 23 個練習，含第二/三學期甲部 |
| 自學練習（中三） | ✅ 正常 | 16 個練習 |
| 課題遊戲 | ✅ 正常 | 40+ HTML 遊戲（`games/`） |
| 挑戰區 | ✅ 正常 | `games-index.html` |
| 考試練習 | ✅ 正常 | `exam/practice.html` |
| 考試頁面 | ✅ 正常 | 7 學期考試資料夾 |
| HKDSE 練習 | ✅ 正常 | `hkdse/dse-practice-p1/p2.html` |
| 資料圖表 | ✅ 正常 | `infographics/`（S1Ch11/13） |
| 幾何概念卡 | ✅ 正常 | `ch11-geometry-flashcard/` |
| 概率概念卡 | ✅ 正常 | `ch11-probability-flashcard/` |
| 學生登入 | ✅ 正常 | `login/`、`student/dashboard/` |
| 功課日曆 | ⚠️ 部分 | Google Sheets CSV fetch CORS 問題 |

---

## 目錄結構

```
ai-learning/
├── index.html                    # 首頁（功課日曆 + 課題導航）
├── games-index.html              # 挑戰區（遊戲快速入口）
├── stories.html                  # 數學小故事
├── seat.html                     # 座位表
├── math-svg-tools.html           # SVG 工具庫
│
├── S1Ch1.html ~ S1Ch13.html      # 中一課題（13 頁）
├── S2Ch10.html                   # 中二 Ch10：畢氏定理
├── S3Ch2/4/7/8/9/11.html         # 中三課題（6 頁）
├── S4Ch3.html                    # 中四 Ch3：直線的方程（主頁）
├── S4Ch3-line-practice.html      # 直線方程隨機練習
├── S4Ch3-line-concept.html       # 跳遠求最短距離概念動畫
├── S4Ch3-line-mystery.html       # 神秘線團挑戰
├── S5Ch14.html                   # 中五 Ch14
├── S5Ch17.html                   # 中五 Ch17
├── S5Ch18.html                   # 中五 Ch18
├── S5Tutorial.html               # 中五 Tutorial
│
├── s1/selfstudy/                 # 中一自學練習
│   ├── index.html                # 總目錄
│   ├── practice-01.html ~ practice-23.html  # 23 個練習
│   ├── practice-s2甲部.html      # 第二學期甲部
│   ├── practice-s3甲部.html      # 第三學期甲部
│   ├── chapter-1-quiz.html ~ chapter-6-quiz.html  # 章節測驗
│   ├── S1CH12-1.html             # Ch12 練習
│   └── S1Ch8-Worksheet.html      # Ch8 工作紙
│
├── s3/selfstudy/                 # 中三自學練習
│   ├── index.html                # 總目錄
│   └── practice-01.html ~ practice-16.html  # 16 個練習
│
├── games/                        # 課題遊戲（40+ HTML）
│   ├── index.html                # 遊戲目錄
│   ├── S1Ch1-* ~ S1Ch13-*       # 中一遊戲（34 個）
│   ├── S3Ch2/4/8/11-*           # 中三遊戲
│   ├── S5Ch18-*                  # 中五遊戲
│   └── S1Exam-1-BasicShort.html  # 中一考試練習遊戲
│
├── exam/                         # 考試專區
│   ├── index.html                # 考試首頁
│   ├── practice.html             # 校內考試練習系統
│   ├── review-p1.html            # OCR 審核 P1
│   ├── review-p2.html            # OCR 審核 P2
│   ├── scoring.py                # 評分腳本
│   ├── mimic/                    # 仿題模板系統
│   ├── ocr/                      # OCR 試卷來源
│   ├── 2024-25-s1-term2/         # 中一第二學期考試
│   ├── 2024-25-s1-term3/         # 中一第三學期考試
│   ├── 2024-25-s3-term3/         # 中三第三學期考試
│   ├── 2024-25-s5-term3/         # 中五第三學期考試
│   ├── 2025-26-s1-term2/         # 中一第二學期考試
│   ├── 2025-26-s3-term2/         # 中三第二學期考試
│   └── 2025-26-s5-term2/         # 中五第二學期考試
│
├── hkdse/                        # HKDSE 練習
│   ├── dse-practice-p1.html      # HKDSE 卷一練習
│   ├── dse-practice-p2.html      # HKDSE 卷二練習
│   ├── guide.html                # 使用指南
│   ├── review_p1.html            # P1 審核
│   ├── review_p2.html            # P2 審核
│   └── topic-analysis/           # 課題分析
│
├── infographics/                 # 資料圖表
│   ├── index.html
│   ├── S1Ch11-Infographic.html   # Ch11 圖表
│   └── S1Ch13-Infographic.html   # Ch13 圖表
│
├── ch11-geometry-flashcard/      # 幾何定理概念卡
│   └── index.html
│
├── ch11-probability-flashcard/   # 概率概念卡
│   └── index.html
│
├── login/                        # 學生登入
│   └── index.html
│
├── student/                      # 學生系統
│   ├── change-password.html
│   └── dashboard/
│
├── gas/                          # Google Apps Script（代理）
│   ├── Code.gs
│   └── appsscript.json
│
├── css/styles.css                # 全站樣式
├── images/                       # 圖片資源
└── planning/                     # 規劃文檔
```

---

## 課題頁面

### 中一（S1）— 13 個課題

| 頁面 | 課題 |
|------|------|
| S1Ch1.html | 基礎運算 |
| S1Ch2.html | 有向數 |
| S1Ch3.html | 代數式 |
| S1Ch4.html | 一元一次方程（一） |
| S1Ch5.html | 面積和體積（一） |
| S1Ch6.html | 多項式的運算 |
| S1Ch7.html | 一元一次方程（二） |
| S1Ch8.html | 統計（一） |
| S1Ch9.html | 百分法 |
| S1Ch10.html | 坐標簡介 |
| S1Ch11.html | 與直線和三角形相關的角 |
| S1Ch12.html | 全等三角形 |
| S1Ch13.html | 數值估算 |

### 中二（S2）

| 頁面 | 課題 |
|------|------|
| S2Ch10.html | 畢氏定理 |

### 中三（S3）— 6 個課題

| 頁面 | 課題 |
|------|------|
| S3Ch2.html | 指數法則 |
| S3Ch4.html | 立體圖形 |
| S3Ch7.html | 統計 |
| S3Ch8.html | 角與三角形 |
| S3Ch9.html | 相似形 |
| S3Ch11.html | 概率 |

### 中四（S4）— S4Ch3 直線的方程

| 檔案 | 說明 |
|------|------|
| `S4Ch3.html` | 課題主頁（📖筆記 + 📝例題 + 🎮互動練習） |
| `S4Ch3-line-practice.html` | 直線方程隨機練習（三步批改：斜率→點斜式→一般式） |
| `S4Ch3-line-concept.html` | 跳遠求最短距離概念動畫 |
| `S4Ch3-line-mystery.html` | 神秘線團挑戰 |

### 中五（S5）

| 頁面 | 課題 |
|------|------|
| S5Ch14.html | Ch14 |
| S5Ch17.html | Ch17 |
| S5Ch18.html | Ch18 |
| S5Tutorial.html | Tutorial |

---

## 自學練習

### 中一自學練習（`s1/selfstudy/`）

**入口：** 首頁 → 中一區 → 「📚 自學練習」

| 章節 | 練習編號 | 題目類型 |
|------|----------|----------|
| Ch1：有向數 | 01–06 | 排列、加減、乘除、四則、括號 |
| Ch2：基礎代數 | 07–17 | 代數式、代入、化簡、同類項、指數、展開 |
| Ch3：一元一次方程 | 18–20 | 基礎、移項、括號 |
| Ch4：百分法 | 21–23 | 分數/小數化百分數、求百分數值 |
| 第二學期甲部 | practice-s2甲部 | 複習練習 |
| 第三學期甲部 | practice-s3甲部 | 複習練習 |

共 **23 個練習**，每頁有「📝 全部題目」和「🎯 隨機測驗5題」兩種模式。

另有章節測驗（`chapter-1-quiz.html` 至 `chapter-6-quiz.html`）及工作紙。

### 中三自學練習（`s3/selfstudy/`）

**入口：** 首頁 → 中三區 → 「📚 中三自學練習」

| 課題 | 練習 |
|------|------|
| 多項式、展開 | 01–02 |
| 解方程 | 03 |
| 因式分解 | 04 |
| 變主項 | 05 |
| 指數 | 06 |
| 百分數 | 07 |
| 扇形 | 08 |
| 畢氏定理 | 09 |
| 全等 / 相似三角形 | 10–11 |
| 集中趨勢 | 12 |
| 聯立 / 不等式 | 13–14 |
| 二元一次方程 / 坐標 | 15–16 |

共 **16 個練習**。

---

## 課題遊戲

**入口：** `games/index.html`（遊戲總目錄） | `games-index.html`（挑戰區快捷入口）

### 中一遊戲（`games/S1Ch*`）— 34 個

| 課題 | 遊戲 |
|------|------|
| Ch1：基礎運算 | 質因數回收站 |
| Ch2：有向數 | 有向數（3 個版本） |
| Ch5：面積體積 | 面積獵人、幾何獵人（計時）、幾何大師、面積偵探等（10+ 個） |
| Ch6：多項式 | 代數語言、代數加減、單項式、代數挑戰 |
| Ch8：統計 | 柱/餅形圖、莖葉圖 |
| Ch9：百分法 | 混合運算、百分比變化、利潤虧損、折扣、售價 |
| Ch10：坐標 | 坐標幾何、坐標冒險（4 個版本） |
| Ch11：角 | 角度工具 |
| Ch13：估算 | 位值大挑戰、有效數字 |

### 中三遊戲（`games/S3Ch*`）

| 課題 | 遊戲 |
|------|------|
| Ch2：指數 | IndexSimplify |
| Ch4：立體 | 圓柱球體、圓柱挑戰、圓錐台、幾何探索 |
| Ch8：角 | 角度工具 |
| Ch11：概率 | Rainbow Explained |

### 中五遊戲（`games/S5Ch*`）

| 課題 | 遊戲 |
|------|------|
| Ch18 | HappyRainbow、LuckyDraw |

---

## 考試專區

**入口：** `exam/index.html`

| 頁面 | 說明 |
|------|------|
| `exam/practice.html` | 校內考試練習系統（題目載入） |
| `exam/review-p1.html` | OCR 審核 P1 |
| `exam/review-p2.html` | OCR 審核 P2 |
| `exam/mimic/` | 仿題模板系統 |

### 考試試卷資料夾

| 資料夾 | 學期 |
|--------|------|
| `2024-25-s1-term2/` | 2024-25 中一第二學期 |
| `2024-25-s1-term3/` | 2024-25 中一第三學期 |
| `2024-25-s3-term3/` | 2024-25 中三第三學期 |
| `2024-25-s5-term3/` | 2024-25 中五第三學期 |
| `2025-26-s1-term2/` | 2025-26 中一第二學期 |
| `2025-26-s3-term2/` | 2025-26 中三第二學期 |
| `2025-26-s5-term2/` | 2025-26 中五第二學期 |

每個資料夾包含 `index.html`、`p1.html`、`p2.html`。

---

## HKDSE 練習

**位置：** `hkdse/`

| 頁面 | 說明 |
|------|------|
| `dse-practice-p1.html` | HKDSE 數學卷一練習 |
| `dse-practice-p2.html` | HKDSE 數學卷二練習 |
| `guide.html` | 使用指南 |
| `review_p1.html` | P1 題目審核 |
| `review_p2.html` | P2 題目審核 |

題庫來源：Google Sheet（ID：`1Qk84gFeBEG2gTEmmM6wOz8PgI226hKL7jtFkpoTOhw0`），約 715 題。

---

## 其他功能

| 頁面 / 資料夾 | 說明 |
|--------------|------|
| `infographics/` | 資料圖表（S1Ch11、S1Ch13） |
| `ch11-geometry-flashcard/` | 幾何定理概念卡 |
| `ch11-probability-flashcard/` | 概率概念卡 |
| `stories.html` | 數學小故事 |
| `seat.html` | 座位表 |
| `math-svg-tools.html` | SVG 工具庫（幾何圖形繪製） |
| `login/` | 學生登入頁面 |
| `student/dashboard/` | 學生儀表板 |
| `gas/` | Google Apps Script（功課日曆代理） |

---

## 技術架構

### 前端
- **HTML5 + CSS3 + JavaScript**（純靜態，無框架依賴）
- **MathJax：** 數學公式渲染（S4Ch3 使用）
- **KaTeX：** 部分頁面使用（速度較快）
- **HTML5 Canvas：** 遊戲圖形

### 後端 / 代理
- **Google Apps Script（`gas/`）：** 功課日曆 CSV 代理
- **Google Sheets：** 功課日曆數據源

### 部署
- **GitHub Pages：** 靜態托管
- **網址：** https://ai-lish.github.io/ai-learning/

---

## 部署流程

```bash
# 編輯 HTML 文件後推送
git add .
git commit -m "Update description"
git push origin main
```

推送後約 1–2 分鐘於 GitHub Pages 生效。

| 問題 | 解決方案 |
|------|----------|
| 404 錯誤 | 檢查 GitHub Pages 設置及檔案名稱大小寫 |
| CORS 錯誤 | 使用 GAS 代理（`gas/Code.gs`） |
| CSS/JS 無效 | 清除瀏覽器緩存 |

---

## 已知問題

| 優先 | 問題 | 說明 |
|------|------|------|
| 🟡 中 | 首頁功課日曆 CORS | Google Sheets CSV fetch 受 CORS 限制，GAS 代理已備（`gas/`），需部署 |
| 🟢 低 | `calculator-game.html` 缺失 | `games-index.html` 有連結，待重構 |
| 🟢 低 | 無學生進度追蹤 | 登入系統已有框架，進度儲存待實現 |

---

## 聯絡

- **作者：** Zach Li
- **用途：** LSC 中學數學自學
- **反饋：** 歡迎提交 Issue 或 Pull Request

---

*最後更新：2026-05-29*
