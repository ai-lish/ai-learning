# AI-Learning 教學網站測試計劃

## 📋 測試範圍

| 類別 | 數量 | 測試方法 |
|------|------|----------|
| 課題分頁 | 8個 | Browser自動化 |
| 遊戲頁面 | 35個 | Browser抽查 |
| 主頁面 | 1個 | Browser自動化 |
| 考試頁面 | 3個 | Browser自動化 |

---

## 🎯 第一輪：主頁面 + 課題分頁 (8個)

### 1.1 主頁面 (index.html)

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 1.1.1 | 進入首頁，驗證標題「少康老師教學網站」 | browser → snapshot | ✅ |
| 1.1.2 | 點擊S1按鈕，驗證課題列表出現 | browser → click → snapshot | ✅ |
| 1.1.3 | 點擊S1Ch1連結，驗證進入課題頁面 | browser → navigate → snapshot | ✅ |
| 1.1.4 | 返回首頁，點擊S1Ch2，驗證進入 | browser → navigate → snapshot | ✅ |
| 1.1.5 | 抽查其他課題連結 (Ch4, Ch5, Ch10) | browser → navigate → snapshot | ⚠️ 部分問題 |
| 1.1.6 | 考試專區顯示正常 | browser → snapshot | ✅ |
| 1.1.7 | 手機尺寸顯示正常 (375px) | browser → resize → snapshot | ⬜ |

### 1.2 課題分頁 - S1Ch1.html

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 1.2.1 | 進入S1Ch1，驗證標題「Ch1 基礎運算」 | browser → snapshot | ✅ |
| 1.2.2 | 驗證3個Tab顯示 (📖筆記、📝例題重做、🎮互動練習) | browser → snapshot | ✅ |
| 1.2.3 | 點擊📝例題重做Tab，驗證切換 | browser → click → snapshot | ✅ |
| 1.2.4 | 點擊🎮互動練習Tab，驗證遊戲列表 | browser → click → snapshot | ✅ |
| 1.2.5 | 點擊第一個遊戲，驗證進入遊戲頁面 | browser → navigate → snapshot | ✅ |
| 1.2.6 | 點擊返回按鈕，驗證返回課題頁面 | browser → click → snapshot | ⚠️ 返回index.html |
| 1.2.7 | 驗證課題顏色正確 (藍色 #3498DB) | browser → snapshot | ✅ |

### 1.3 課題分頁 - S1Ch2.html

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 1.3.1 | 進入S1Ch2，驗證標題「Ch2 有向數」 | browser → snapshot | ✅ |
| 1.3.2 | 驗證課題顏色紅色 (#e74c3c) | browser → snapshot | ✅ |
| 1.3.3 | 3個Tab功能正常 | browser → click → snapshot | ✅ |
| 1.3.4 | 遊戲列表顯示3個遊戲 | browser → snapshot | ✅ |

### 1.4 課題分頁 - S1Ch3.html

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 1.4.1 | 進入S1Ch3，驗證標題「Ch3 代數式」 | browser → snapshot | ✅ |
| 1.4.2 | 驗證課題顏色紫色 (#9b59b6) | browser → snapshot | ✅ |

### 1.5 課題分頁 - S1Ch4.html

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 1.5.1 | 進入S1Ch4，驗證標題「Ch4 多項式」 | browser → snapshot | ✅ |
| 1.5.2 | 驗證課題顏色橙色 (#e67e22) | browser → snapshot | ✅ |
| 1.5.3 | 遊戲列表顯示7個遊戲 | browser → snapshot | ✅ |

### 1.6 課題分頁 - S1Ch5.html

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 1.6.1 | 進入S1Ch5，驗證標題「Ch5 面積與體積」 | browser → snapshot | ✅ |
| 1.6.2 | 驗證課題顏色綠色 (#27ae60) | browser → snapshot | ✅ |
| 1.6.3 | 遊戲列表顯示9個遊戲 | browser → snapshot | ✅ |

### 1.7 課題分頁 - S1Ch6.html

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 1.7.1 | 進入S1Ch6，驗證標題「Ch6 多項式」 | browser → snapshot | ✅ |
| 1.7.2 | 驗證課題顏色青色 (#1abc9c) | browser → snapshot | ✅ |

### 1.8 課題分頁 - S1Ch7.html

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 1.8.1 | 進入S1Ch7，驗證標題「Ch7 方程」 | browser → snapshot | ✅ |
| 1.8.2 | 驗證課題顏色金黃色 (#f39c12) | browser → snapshot | ✅ |

### 1.9 課題分頁 - S1Ch10.html

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 1.9.1 | 進入S1Ch10，驗證標題「Ch10 坐標幾何」 | browser → snapshot | ✅ |
| 1.9.2 | 驗證課題顏色深灰色 (#34495e) | browser → snapshot | ✅ |
| 1.9.3 | 遊戲列表顯示4個遊戲 | browser → snapshot | ✅ |

---

## 🎮 第二輪：遊戲頁面抽查

### 2.1 遊戲返回按鈕測試

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 2.1.1 | S1Ch1-1-PrimeFactor.html 返回按鈕 | browser → snapshot | ⬜ |
| 2.1.2 | S1Ch1-2-Area.html 返回按鈕 | browser → snapshot | ⬜ |
| 2.1.3 | S1Ch2-1-DirectedNumber.html 返回按鈕 | browser → snapshot | ⬜ |
| 2.1.4 | S1Ch4-5-AlgebraFactory.html 返回按鈕 | browser → snapshot | ⬜ |
| 2.1.5 | S1Ch5-2-CylinderSphere.html 返回按鈕 | browser → snapshot | ⬜ |
| 2.1.6 | S1Ch10-1-CoordinateGeometry.html 返回按鈕 | browser → snapshot | ⬜ |

---

## 📝 第三輪：考試頁面

| # | 測試項目 | 測試方法 | 狀態 |
|---|----------|----------|------|
| 3.1.1 | exam-2024-25-s1-term2.html 正常顯示 | browser → snapshot | ✅ |
| 3.1.2 | exam-2025-26-s3-term2.html 正常顯示 | browser → snapshot | ✅ |
| 3.1.3 | S3卷一/卷二Tab切換正常 | browser → click → snapshot | ✅ |

---

## 📊 測試工具

### T仔工作流程

1. **Browser快照** - 使用 `browser` tool 截圖驗證
2. **點擊測試** - 使用 `browser act` 進行互動
3. **狀態記錄** - 記錄每項測試結果 (⬜待測 / ✅通過 / ❌失敗)

### 自動化腳本

```bash
# 啟動瀏覽器
browser action=start profile=openclaw

# 測試頁面
browser action=navigate url="https://math-lish.github.io/ai-learning/"

# 截圖驗證
browser action=snapshot
```

---

## ✅ 測試完成標準

- 第一輪：所有8個課題分頁 + 主頁面 = 100% 覆蓋
- 第二輪：抽查6個遊戲返回按鈕
- 第三輪：所有考試頁面正常運作

---

*更新日期：2026-03-11*

---

## ⚠️ 發現既問題

### 問題1：遊戲返回按鈕
- **現象**：遊戲既返回按鈕返回到 index.html，應該返回課題頁面
- **影響**：35個遊戲
- **優先級**：高
- **建議**：修改返回按鈕為 `../S1Ch1.html` (或其他課題頁面)

### 問題2：index.html課題連結
- **現象**：
  - Ch4連結到 "#" (應該係S1Ch4.html)
  - Ch6連結到 S1Ch4.html (應該係S1Ch6.html)
  - Ch7連結到 "#" (應該係S1Ch7.html)
- **優先級**：高
- **建議**：修正index.html內既連結
