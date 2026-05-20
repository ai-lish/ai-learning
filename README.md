# ai-learning — LSC 數學自學平台

> 香港 LSC 中學數學互動自學網站 | HKDSE 試卷 + 課題遊戲 + 考試練習

**🌐 網址：** https://ai-lish.github.io/ai-learning/

**📁 Repo：** `/Users/zachli/ai-learning`

---

## 📋 目錄

- [現狀概覽](#現狀概覽)
- [測試結果（2024-04-20）](#測試結果2024-04-20)
- [各部分分析與建議](#各部分分析與建議)
- [中一自學練習分頁](#中一自學練習分頁)
- [已知問題](#已知問題)
- [改進建議優先序](#改進建議優先序)
- [技術架構](#技術架構)
- [數據來源](#數據來源)
- [部署流程](#部署流程)

---

## 現狀概覽

### ✅ 已完成功能

| 功能 | 狀態 | 說明 |
|------|------|------|
| 首頁導航 | ✅ 正常 | 課題/考試/遊戲入口 |
| 中一課題頁面 | ✅ 正常 | S1Ch1-S1Ch13 課題頁面 |
| 課題遊戲 | ✅ 正常（部分） | 質因數、座標、幾何等 30+ 遊戲 |
| 考試練習頁面 | ✅ 正常 | practice.html 題目載入 |
| HKDSE 試卷 | ✅ 有數據 | exam/ 內有 OCR 試卷 JSON |
| README | ✅ 本文件 | 項目文檔 |

### ⚠️ 有問題功能

| 功能 | 狀態 | 說明 |
|------|------|------|
| 首頁功課日曆 | ❌ CSV fetch 失敗 | CORS 錯誤 |
| exam/ 首頁 | ❌ 404 | 沒有 index.html |
| games/ 首頁 | ❌ 404 | 沒有 index.html |
| 課題遊戲按鈕 | ⚠️ 部分失效 | S1Ch1 課題頁遊戲按鈕無反應 |

### 📁 目錄結構

```
ai-learning/
├── index.html              # 首頁
├── S1Ch1.html ~ S1Ch13.html # 課題頁面（中一）
├── S2Ch1.html ~ S2Ch10.html # 課題頁面（中二）
├── S3Ch1.html ~ S3Ch5.html  # 課題頁面（中三）
├── exam/                   # 考試專區
│   ├── practice.html       # 練習系統頁面
│   ├── review-p1.html      # OCR 審核 P1
│   ├── review-p2.html      # OCR 審核 P2
│   ├── mimic/              # 仿題模板
│   ├── ocr/                # OCR 試卷來源
│   ├── 2024-25-s1-term2/   # 試卷資料夾
│   ├── 2024-25-s1-term3/
│   ├── 2025-26-s1-term2/
│   └── scoring.py          # 評分腳本
├── games/                  # 課題遊戲（30+ HTML）
│   ├── S1Ch1-1-PrimeFactor.html
│   ├── S1Ch5-*-GeometryHunter*.html
│   └── S1Ch10-*-Coordinate*.html
└── hkdse/                  # HKDSE 試卷 JSON
```

---

## 測試結果（2024-04-20）

### 首頁測試
- **網址：** https://ai-lish.github.io/ai-learning/
- **結果：** ⚠️ 部分正常
- **問題：** 功課日曆顯示 `⚠️ 請嘗試其他功能：Error fetching CSV data`
- **原因：** Google Sheets CSV fetch 遇到 CORS 限制

### 課題頁面測試
| 頁面 | 網址 | 結果 |
|------|------|------|
| S1Ch1（起動正數） | https://ai-lish.github.io/ai-learning/S1Ch1.html | ✅ 正常 |
| S1Ch5（續距和面積） | https://ai-lish.github.io/ai-learning/S1Ch5.html | ✅ 正常 |
| S1Ch10（續坐標幾何） | https://ai-lish.github.io/ai-learning/S1Ch10.html | ✅ 正常 |

### 課題遊戲測試
| 遊戲 | 網址 | 結果 |
|------|------|------|
| 質因數回收站 | `/games/S1Ch1-1-PrimeFactor.html` | ✅ 正常，可運行 |
| 幾何獵人 | `/games/S1Ch5-6-GeometryHunter.html` | ✅ 正常 |
| 座標冒險 | `/games/S1Ch10-3-CoordinateAdventure.html` | ✅ 正常 |

### 考試專區測試
| 頁面 | 網址 | 結果 |
|------|------|------|
| 練習首頁 | `/exam/` | ❌ 404（無 index.html） |
| 練習系統 | `/exam/practice.html` | ✅ 正常，題目載入正常 |
| OCR 審核 P1 | `/exam/review-p1.html` | ✅ 正常 |
| 仿題模板 | `/exam/mimic/index.html` | ✅ 正常 |

### 遊戲按鈕測試
- **S1Ch1.html 遊戲按鈕：** ⚠️ 點擊後無反應
- **懷疑原因：** 按鈕連結可能指向不存在的遊戲檔案

---

## 各部分分析與建議

### 1. 首頁（index.html）

#### 現狀
- 有導航列（中一～中六課題）
- 有功課日曆（CORS 錯誤）
- 有快捷連結到考試/遊戲

#### 建議
1. **緊急修復：CORS 問題**
   - Google Sheets CSV 無法直接 fetch（Google 政策）
   - 解決方案 A：使用 GAS 作為代理（推薦）
   - 解決方案 B：使用 cors-anywhere 之類的代理服務
   - 解決方案 C：將 CSV 內容直接嵌入 HTML

2. **增加功能**
   - 學生登入功能（追蹤進度）
   - 個人化功課提醒
   - 最新公告區

#### 參考資源
- [CORS Errors in Google Apps Script](https://iith.dev/blog/app-script-cors/)
- [Fixing CORS Errors in GAS](https://diyavijay.medium.com/struggling-with-cors-in-google-apps-script-heres-th)
- [Fetching Google Sheet CSV CORS Error - Stack Overflow](https://stackoverflow.com/questions/62587802)

---

### 2. 課題頁面（S1Ch*.html）

#### 現狀
- 13 個中一課題頁面
- 每頁有課題簡介、範例、練習、遊戲
- 部分課題頁面遊戲按鈕失效

#### 建議
1. **修復失效遊戲按鈕**
   - 檢查 `games/` 資料夾內的檔案名稱
   - 更新課題頁面的連結

2. **增加互動元素**
   - 課題完成进度条
   - 課題內導航（上一課題/下一課題）
   - 課題收藏功能

3. **響應式設計**
   - 確保手機上課題內容正確顯示
   - 參考 [Best Design Practices for Higher Education Websites](https://gmb.com/insights/best-design-practices-for-higher-education-websites/)

#### 課題頁面覆蓋
| 年級 | 課題數 | 狀態 |
|------|--------|------|
| 中一 | 13 | ✅ 基本正常 |
| 中二 | 10 | 未完整測試 |
| 中三 | 5 | 未完整測試 |

---

### 3. 課題遊戲（games/）

#### 現狀
- 30+ 個 HTML 遊戲
- 包括：質因數、座標、幾何、面積等課題
- 使用 HTML5 Canvas 或 DOM

#### 建議
1. **增加遊戲數量**
   - 中二課題遊戲
   - 中三課題遊戲
   - HKDSE 試卷題型遊戲

2. **統一遊戲框架**
   - 建立通用遊戲模板
   - 統一 UI 風格
   - 統一積分系統

3. **增加遊戲化元素**
   - 等級系統
   - 成就徽章
   - 排行榜

4. **技術建議**
   - Canvas 適合複雜圖形遊戲
   - DOM 適合簡單 UI 遊戲
   - 參考 [Canvas vs DOM Performance](https://www.kirupa.com/html5/dom_vs_canvas.htm)

#### 現有遊戲列表（部分）
```
S1Ch1-1-PrimeFactor.html     # 質因數回收站
S1Ch2-1-DirectedNumber.html # 正負數
S1Ch5-6-GeometryHunter.html  # 幾何獵人
S1Ch5-7-GeometryHunterTimed.html
S1Ch10-3-CoordinateAdventure.html # 座標冒險
```

---

### 4. 考試專區（exam/）

#### 現狀
- 有練習系統（practice.html）
- 有 OCR 審核系統
- 有仿題模板系統
- **缺少首頁 index.html**

#### 建議
1. **緊急創建 exam/index.html**
   - 列出所有可用考試
   - 提供快速連結

2. **增加功能**
   - 模擬考試計時
   - 答題記錄
   - 成績統計
   - 錯題本

3. **題庫整合**
   - HKDSE P1 試卷（選擇題）已 OCR
   - HKDSE P2 試卷（長答題）已 OCR
   - 可直接用於練習

4. **安全性**
   - 答案驗證放後端
   - 防止作弊

#### 參考資源
- [Exam Practice System Design](https://www.proprofs.com/quiz-school/)
- [Multiple Choice Question System Best Practices](https://www.geeksforgeeks.org/quizzes/)

---

### 5. HKDSE 試卷（hkdse/）

#### 現狀
- 有 2024-25、2025-26 學年試卷
- OCR 後的 JSON 格式
- Google Sheet 有完整題庫

#### 建議
1. **擴展題庫**
   - 加入更多年份試卷
   - 加入其他學校試卷
   - 加入 Mock Paper

2. **題目標籤**
   - 按課題分類
   - 按難度分類
   - 按 HKDSE 課題分類

3. **智能推薦**
   - 根據學生弱點推薦題目
   - 根據考試時間推薦溫習範圍

#### Google Sheet 題庫
- **ID：** `1Qk84gFeBEG2gTEmmM6wOz8PgI226hKL7jtFkpoTOhw0`
- **內容：** HKDSE P1 + P2 試題

---

### S4 課題頁面

#### S4Ch3 直線的方程
| 檔案 | 說明 |
|------|------|
| `S4Ch3.html` | 課題主頁（📖筆記 + 📝例題 + 🎮互動練習） |
| `S4Ch3-line-practice.html` | 直線方程隨機練習（新版：三步批改） |
| `S4Ch3-line-concept.html` | 跳遠求最短距離概念動畫 |
| `S4Ch3-line-mystery.html` | 神秘線團挑戰 |
| `straight-line.html` | 獨立工具（iframe 嵌入用） |

**練習工具功能對比：**

|| 舊版 | 新版（2026-05-20） |
|------|------|---------------------|
| 題型 | A.點+斜率 / B.點+點 / C.截距 | 🎲混合 / A / B / C（預設混合） |
| 流程 | 一次性列式→斜率→答案 | 分三步：斜率→點斜式→一般式 |
| 計分 | 列式/斜率/答案 | 斜率/公式/一般式 |
| 鍵盤 | 虛擬鍵盤 | 虛擬鍵盤 + 即時 MathJax 預覽 |
| 反饋 | 一次性揭示答案 | 分步解答，兩次答錯自動帶入 |
| 負數 | 分數 div 渲染 | MathJax $...$ 渲染 |

**Tab 3 卡片佈局：**
```
🎮 互動學習工具
├── 直線方程隨機練習（📝 綠色）⭐ 主力工具
├── 跳遠求最短距離（🏃‍♂️ 橙色）⭐ 概念理解
└── 神秘線團（🎯 紫色）⭐ 挑戰遊戲
```

### 中一自學練習分頁

### 📍 位置
`/s1/selfstudy/index.html` — 主目錄頁（從首頁中一區進入）
`/s1/selfstudy/practice-01.html` 至 `practice-23.html` — 各練習頁面

### 📚 內容

| 章節 | 練習 | 題目類型 |
|------|------|----------|
| 第一章：有向數 | 練習 1-6 | 有向數排列、加法、減法、乘除、四則、括號 |
| 第二章：基礎代數 | 練習 7-17 | 代數式、代入法、化簡、同類項、代數加減、指數、展開 |
| 第三章：一元一次方程 | 練習 18-20 | 解方程（基礎、移項、括號） |
| 第四章：百分法 | 練習 21-23 | 分數化百分數、小數化百分數、求百分數值 |

共 **23 個練習**，每個練習 10-15 題。

### 🎮 功能

每個練習頁面有兩種模式：

1. **📝 全部題目** — 按順序做所有題目，即時反饋正誤
2. **🎯 隨機測驗5題** — 從題庫隨機抽出5題，可反覆練習

完成後顯示得分，並可選「再做一次」或「切換測驗模式」。

### 🔗 入口
從首頁 `index.html` → 中一區 → 「📚 自學練習」綠色卡片進入總目錄。

---

## 已知問題

### 🔴 緊急（影響使用）

1. **首頁功課日曆 CORS 錯誤**
   - 錯誤：`Error fetching CSV data`
   - 原因：Google Sheets CSV 無法直接 fetch
   - 修復：使用 GAS 作為代理

2. **exam/ 和 games/ 無 index.html**
   - 404 錯誤
   - 修復：創建 index.html

### 🟡 中等（影響體驗）

3. **課題頁面遊戲按鈕失效**
   - 部分連結失效
   - 修復：檢查連結、更新檔案名

4. **無響應式設計**
   - 手機上可能顯示不佳
   - 修復：增加 media queries

### 🟢 低優先（未來改進）

5. **無學生進度追蹤**
6. **無排行榜**
7. **無個人化推薦**
8. **美術資源不足**

---

## 改進建議優先序

### Phase 1：緊急修復（1-2天）

1. **修復 CORS 問題**
   ```
   方案：使用 GAS 代理
   1. 建立 GAS 專案
   2. 部署為 Web App
   3. 修改前端 fetch URL
   ```

2. **創建 exam/index.html**
   ```html
   <meta charset="UTF-8">
   <h1>考試專區</h1>
   <ul>
     <li><a href="practice.html">校內考試練習</a></li>
     <li><a href="review-p1.html">OCR 審核 P1</a></li>
     <li><a href="review-p2.html">OCR 審核 P2</a></li>
     <li><a href="mimic/index.html">仿題模板</a></li>
   </ul>
   ```

3. **創建 games/index.html**
   ```html
   <meta charset="UTF-8">
   <h1>課題遊戲</h1>
   <h2>中一課題</h2>
   <ul>
     <!-- 按課題列出遊戲 -->
   </ul>
   ```

### Phase 2：功能完善（1-2週）

4. **修復課題頁面遊戲按鈕**
5. **增加響應式設計**
6. **統一 UI 風格**
7. **增加課題導航**

### Phase 3：功能擴展（1個月）

8. **學生登入系統**
9. **進度追蹤**
10. **排行榜**
11. **錯題本**

### Phase 4：智能化（長期）

12. **個人化推薦**
13. **智能題庫**
14. **數據分析**

---

## 技術架構

### 前端
- **HTML5 + CSS3 + JavaScript**
- **MathJax/KaTeX：** 數學公式渲染
- **Canvas：** 遊戲圖形
- **Phaser.js（建議）：** 遊戲引擎

### 後端
- **Google Apps Script：** API 代理
- **Google Sheets：** 數據庫（備份）
- **Firebase（建議）：** 即時數據

### 部署
- **GitHub Pages：** 免費托管
- **自定義域名：** 可設置

### 數學渲染比較

| 方案 | 速度 | 渲染質量 | 檔案大小 | 建議 |
|------|------|----------|----------|------|
| **KaTeX** | 最快 | 高 | ~200KB | ✅ 首選 |
| **MathJax 3** | 快 | 高 | ~300KB | 備選 |
| **MathJax 2** | 慢 | 高 | ~500KB | 不建議 |

> 參考：[KaTeX vs MathJax Comparison](https://www.intmath.com/cg5/katex-mathjax-comparison.php)

---

## 數據來源

### Google Sheet 題庫
- **ID：** `1Qk84gFeBEG2gTEmmM6wOz8PgI226hKL7jtFkpoTOhw0`
- **內容：** HKDSE P1 + P2 試題（~715 題）
- **格式：** 課題、難度、題目、答案、提示

### OCR 試卷
- **位置：** `exam/ocr/`
- **年份：** 2024-25、2025-26
- **格式：** PNG/JPG 圖片 + JSON 文字

### 課題遊戲
- **位置：** `games/`
- **數量：** 30+ 個 HTML 遊戲
- **課題：** 覆蓋中一主要課題

---

## 部署流程

### 1. 本地開發
```bash
cd /Users/zachli/ai-learning
# 編輯 HTML 文件
# 測試後推送
```

### 2. 推送 GitHub
```bash
cd /Users/zachli/ai-learning
git add .
git commit -m "Update description"
git push origin main
```

### 3. GitHub Pages 自動部署
- 推送後約 1-2 分鐘生效
- 網址：https://ai-lish.github.io/ai-learning/

### 4. 常見問題
| 問題 | 解決方案 |
|------|----------|
| 404 錯誤 | 檢查 GitHub Pages 設置 |
| CORS 錯誤 | 使用 GAS 代理 |
| CSS/JS 無效 | 清除瀏覽器緩存 |

---

## 參考資源

### 遊戲化學習
- [Gamification in Math Learning - Wiris](https://www.wiris.com/en/blog/gamification-math-learning-benefits-challenges/)
- [Mathigon - Mathematical Playground](https://mathigon.org/)
- [Mangahigh - Game-based Learning](https://www.mangahigh.com/)

### 教育網站設計
- [Best Design Practices for Higher Education Websites](https://gmb.com/insights/best-design-practices-for-higher-education-websites/)
- [UX in Edtech Best Practices](https://www.linkedin.com/pulse/ux-edtech-what-best-practices-designmonks-wk8zc)
- [A Practical Guide to School Website UI & UX](https://www.ubiqeducation.com/best-ui-and-ux-practices-for-a-school-website)

### 技術資源
- [CORS Errors in Google Apps Script](https://iith.dev/blog/app-script-cors/)
- [Fixing CORS Errors in GAS](https://diyavijay.medium.com/struggling-with-cors-in-google-apps-script-heres-th)
- [Canvas vs DOM Performance](https://www.kirupa.com/html5/dom_vs_canvas.htm)
- [KaTeX vs MathJax](https://www.intmath.com/cg5/katex-mathjax-comparison.php)

### 香港數學教育
- [Hong Kong Mathematics Education](https://www.hku.hk/)
- [HKDSE Mathematics Curriculum](https://www.edb.gov.hk/)

---

## 聯絡

- **作者：** Zach Li
- **用途：** LSC 中學數學自學
- **反饋：** 歡迎提交 Issue 或 Pull Request

---

*最後更新：2026-05-20*
