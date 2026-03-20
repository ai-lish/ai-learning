# 🧪 TEST.md - 測試備忘

本文件記錄 AI Learning 網站的所有功能測試清單及測試方法。

---

## ⚠️ 測試原則

> **Button存在 ≠ 功能正常！**

正確測試流程：
1. 檢查實際 href value：`grep 'href="..."' filename.html`
2. 真正既 Click 測試：使用 browser 工具進行功能測試
3. 驗證 URL 變化

---

## 📋 測試清單

### 1️⃣ 首頁測試 (index.html)

| # | 測試項目 | 測試方法 | 預期結果 | 狀態 |
|---|---------|---------|---------|------|
| 1.1 | 漢堡包按鈕存在 | `grep 'class="hamburger"' index.html` | 找到 hamburger class | ⬜ |
| 1.2 | 漢堡包Click顯示菜單 | browser click | 側邊菜單滑出 | ⬜ |
| 1.3 | 中一至中六按鈕存在 | snapshot | 看到6個年級按鈕 | ⬜ |
| 1.4 | 考試專區按鈕存在 | snapshot | 看到綠色考試按鈕 | ⬜ |
| 1.5 | 年級按鈕切換課題 | browser click | 課題列表切換 | ⬜ |
| 1.6 | 課題卡片可點擊 | browser click | 進入課題分頁 | ⬜ |
| 1.7 | 功課日曆顯示 | snapshot | 看到日曆網格 | ⬜ |
| 1.8 | 日期點擊顯示詳情 | browser click | modal 彈出 | ⬜ |
| 1.9 | 今日日期高亮 | snapshot | 今日有邊框標記 | ⬜ |

**測試連結：** https://ai-lish.github.io/ai-learning

---

### 2️⃣ 課題分頁測試

| # | 測試項目 | 測試方法 | 預期結果 | 狀態 |
|---|---------|---------|---------|------|
| 2.1 | 標題欄存在 | snapshot | 看到課題標題 | ⬜ |
| 2.2 | 漢堡包功能正常 | browser click | 菜單彈出 | ⬜ |
| 2.3 | 標題正確顯示 | snapshot | 顯示正確課題名稱 | ⬜ |
| 2.4 | 返回主頁按鈕Link正確 | `grep 'href="index.html"' S1Ch1.html` | 正確 href | ⬜ |
| 2.5 | 返回主頁功能正常 | browser click | 返回 index.html | ⬜ |
| 2.6 | 筆記Tab正常 | browser click | 顯示筆記內容 | ⬜ |
| 2.7 | 例題重做Tab正常 | browser click | 顯示練習內容 | ⬜ |
| 2.8 | 互動練習Tab正常 | browser click | 顯示遊戲列表 | ⬜ |

**測試檔案：** S1Ch1.html, S1Ch2.html, S1Ch10.html

---

### 3️⃣ 遊戲頁面測試

| # | 測試項目 | 測試方法 | 預期結果 | 狀態 |
|---|---------|---------|---------|------|
| 3.1 | 標題欄存在 | snapshot | 看到遊戲標題 | ⬜ |
| 3.2 | 遊戲標題正確 | snapshot | 顯示正確遊戲名稱 | ⬜ |
| 3.3 | 返回課題按鈕存在 | `grep 'href="../S1Ch' games/*.html` | 正確 href | ⬜ |
| 3.4 | 返回功能正常 | browser click | 返回課題分頁 | ⬜ |
| 3.5 | 遊戲互動正常 | 实际操作游戏 | 遊戲可運行 | ⬜ |
| 3.6 | 遊戲計時器（如有） | 開始遊戲計時 | 計時器運作 | ⬜ |
| 3.7 | 遊戲計分（如有） | 完成遊戲 | 顯示得分 | ⬜ |

**測試檔案：** games/S1Ch1-1-PrimeFactor.html, games/S1Ch2-1-Integer.html

---

### 4️⃣ 考試專區測試

| # | 測試項目 | 測試方法 | 預期結果 | 狀態 |
|---|---------|---------|---------|------|
| 4.1 | 考試專區入口 | browser click | 進入考試頁面 | ⬜ |
| 4.2 | 學期選擇正常 | browser click | 顯示試卷列表 | ⬜ |
| 4.3 | 卷一切換 | browser click | 顯示卷一題目 | ⬜ |
| 4.4 | 卷二切換 | browser click | 顯示卷二題目 | ⬜ |
| 4.5 | 卷二得分顯示 | snapshot | 顯示「得分: X/40」 | ⬜ |
| 4.6 | 選擇題作答 | browser click 選項 | 選項被選中 | ⬜ |
| 4.7 | 核對答案功能 | browser click 按鈕 | 顯示對錯標記 | ⬜ |
| 4.8 | 正確標記(綠色) | snapshot | 正確答案顯示綠色 | ⬜ |
| 4.9 | 錯誤標記(紅色) | snapshot | 錯誤答案顯示紅色 | ⬜ |
| 4.10 | 答案顯示/隱藏 | browser click | 答案顯示切換 | ⬜ |
| 4.11 | 詳解顯示/隱藏 | browser click | 詳解顯示切換 | ⬜ |
| 4.12 | 甲部摺疊功能 | browser click | 內容展開/收起 | ⬜ |
| 4.13 | 乙部摺疊功能 | browser click | 內容展開/收起 | ⬜ |
| 4.14 | 丙部摺疊功能 | browser click | 內容展開/收起 | ⬜ |
| 4.15 | 返回主頁按鈕 | browser click | 返回 index.html | ⬜ |

**測試檔案：** exam-2025-26-s1-term2.html, exam-2025-26-s1-term2-p1.html, exam-2025-26-s1-term2-p2.html

---

### 5️⃣ 漢堡包菜單測試

| # | 測試項目 | 測試方法 | 預期結果 | 狀態 |
|---|---------|---------|---------|------|
| 5.1 | 漢堡包按鈕可點擊 | browser click | 菜單滑出 | ⬜ |
| 5.2 | 菜單遮罩層出現 | snapshot | 看到半透明遮罩 | ⬜ |
| 5.3 | 中一按鈕存在 | snapshot | 看到紅色中一按鈕 | ⬜ |
| 5.4 | 中六按鈕存在 | snapshot | 看到紫色中六按鈕 | ⬜ |
| 5.5 | 考試專區按鈕存在 | snapshot | 看到綠色考試按鈕 | ⬜ |
| 5.6 | 點擊年級進入 | browser click | 切換到該年級課題 | ⬜ |
| 5.7 | 關閉菜單 | browser click 關閉按鈕 | 菜單收起 | ⬜ |

---

### 6️⃣ 數學故事測試 (stories.html)

| # | 測試項目 | 測試方法 | 預期結果 | 狀態 |
|---|---------|---------|---------|------|
| 6.1 | 頁面正常加載 | snapshot | 看到故事標題 | ⬜ |
| 6.2 | 故事內容顯示 | snapshot | 看到數學故事 | ⬜ |
| 6.3 | 每日挑戰題 | snapshot | 看到挑戰題 | ⬜ |

---

### 7️⃣ SVG 幾何工具測試 (math-svg-tools.html)

| # | 測試項目 | 測試方法 | 預期結果 | 狀態 |
|---|---------|---------|---------|------|
| 7.1 | SVG 圖像顯示 | snapshot | 看到幾何圖像 | ⬜ |
| 7.2 | 互動功能 | 操作 SVG | 可互動 | ⬜ |
| 7.3 | 數學符號渲染 | snapshot | 正確顯示數學符號 | ⬜ |

---

## 🔧 測試命令

### Link 檢查
```bash
# 首頁課題Link
grep 'href="S1Ch' index.html

# 課題返回Link
grep 'href="index.html"' S1Ch*.html

# 遊戲返回Link
grep 'href="../S1Ch' games/*.html

# 考試返回Link
grep 'href="index.html"' exam-*.html
```

### Browser 功能測試
```bash
# 打開頁面
browser action=open url="https://ai-lish.github.io/ai-learning"

# 截圖快照
browser action=snapshot

# 點擊元素
browser action=act kind=click ref=e4

# 輸入文字
browser action=act kind=type ref=input1 text="答案"
```

---

## 🐛 匯報問題

發現問題時，請記錄：
1. **頁面名稱** - e.g., index.html
2. **問題描述** - 具體問題
3. **測試方法** - 你做了什麼
4. **預期結果** vs **實際結果**
5. **截圖** - 如有需要

---

## ✅ 完成標準

- [ ] 首頁所有功能測試通過
- [ ] 課題分頁返回功能正常
- [ ] 遊戲可正常運行
- [ ] 考試專區所有功能正常
- [ ] 漢堡包菜單運作正常

---

*最後更新：2026-03-20*
