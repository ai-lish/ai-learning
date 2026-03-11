# AI-Learning 工作流程手冊

---

## 📋 總覽

### 網站結構
```
ai-learning/
├── index.html              # 主頁
├── S1Ch1.html - S1Ch7.html  # 課題分頁 (8個)
├── S1Ch10.html
├── games/                 # 遊戲 (35個)
│   ├── S1Ch1-1-xxx.html
│   ├── S1Ch2-1-xxx.html
│   └── ...
├── exam-xxx.html          # 考試頁面
└── stories.html           # 數學故事
```

---

## 🏗️ 建立課題分頁

### 檔案命名
```
S1Ch1.html  - Ch1 基礎運算
S1Ch2.html  - Ch2 有向數
S1Ch3.html  - Ch3 代數式
S1Ch4.html  - Ch4 多項式
S1Ch5.html  - Ch5 面積與體積
S1Ch6.html  - Ch6 多項式
S1Ch7.html  - Ch7 方程
S1Ch10.html - Ch10 坐標
```

### 每課題結構 (3個Tab)
```html
[📖 筆記] [📝 例題重做] [🎮 互動練習]
```

### 返回按鈕
```html
<a href="index.html" class="back-link">← 返回</a>
```
⚠️ **注意**：係同一folder，要用 `index.html`，唔係 `../index.html`

---

## 🎮 遊戲系統

### 檔案命名格式
```
S1Ch1-1-PrimeFactor.html    # Ch1 第1個遊戲
S1Ch2-1-DirectedNumber.html # Ch2 第1個遊戲
```

### 遊戲數量
| 課題 | 數量 |
|------|------|
| Ch1 | 5個 |
| Ch2 | 3個 |
| Ch3 | 1個 |
| Ch4 | 7個 |
| Ch5 | 9個 |
| Ch6 | 4個 |
| Ch7 | 1個 |
| Ch10 | 4個 |

### 返回按鈕 (浮動)
```html
<a href="../S1Ch1.html" style="position:fixed;top:10px;left:10px;background:#3498DB;color:white;padding:8px 16px;border-radius:8px;text-decoration:none;z-index:9999;">← 返回</a>
```

---

## 🏠 首頁結構

### 課題Card
```html
<div class="chapter-card" onclick="location.href='S1Ch1.html'">
    <div class="chapter-header">
        <div class="chapter-num">Ch1</div>
        <div class="chapter-title">基礎運算</div>
    </div>
    <div class="tools-row">
        <span style="color:#999;">📖 筆記 (待更新)</span>
        <span style="color:#27ae60;">📚 5個互動練習</span>
    </div>
</div>
```

### CSS
```css
.chapter-card {
    cursor: pointer;
}
```

---

## 🔧 常見任務

### 1. 新增課題分頁
```bash
# 1. 複製現有課題分頁
cp S1Ch1.html S1ChX.html

# 2. 修改內容
# - 標題顏色
# - 課題名稱
# - 遊戲連結
# - 返回按鈕 href="index.html"

# 3. 加入 index.html
# - 新增 chapter-card div
# - 加入 onclick="location.href='S1ChX.html'"
```

### 2. 新增遊戲
```bash
# 1. 放入 games/ folder
# - 命名格式：S1ChX-N-Name.html

# 2. 加入返回按鈕
# - 在 <body> 後加入浮動按鈕
# - href="../S1ChX.html"

# 3. 更新課題分頁
# - 在 🎮 互動練習 Tab 加入遊戲卡片
```

### 3. 發布到GitHub
```bash
cd ~/.openclaw/workspace/ai-learning
git add -A
git commit -m "Update: 描述"
git push
```

---

## 🧪 測試流程

### T仔測試技巧

#### ⚠️ 重要原則
**Button存在 ≠ 功能正常！**

#### 正確流程

**1. 檢查實際 Link（必做！）**
```bash
# ❌ 錯誤
grep "返回" file.html

# ✅ 正確
grep 'href="index.html"' S1Ch1.html
```

**2. 真正既 Click 測試**
```bash
# Step 1: 去到目標頁面
browser action=open url="https://math-lish.github.io/ai-learning/S1Ch1.html"

# Step 2: Click返回按鈕
browser action=act kind=click ref=e4

# Step 3: 截圖驗證
browser action=snapshot
```

**3. 驗證URL變化**
- 每次Click後，必須確認URL變咗去目標Page

---

### 測試清單 (TEST-PLAN.md)

| 類別 | 項目 |
|------|------|
| 主頁面 | 課題可點擊、顯示正確 |
| 課題分頁 | Tab切換、返回按鈕、遊戲連結 |
| 遊戲 | 返回按鈕、遊戲運作 |
| 考試 | Tab切換、試題顯示 |

---

## 📁 常用指令

### 檢查Link
```bash
# 課題分頁返回
grep 'href="index.html"' S1Ch*.html

# 遊戲返回
grep 'href="../S1Ch' games/*.html
```

### 更新發布
```bash
cd ~/.openclaw/workspace/ai-learning
git add -A
git commit -m "Update: 描述"
git push
```

---

## ⚡ Quick Reference

| 任務 | Command |
|------|---------|
| 新課題 | `cp S1Ch1.html S1ChX.html` |
| 新遊戲 | 放入 games/ + 加返回按鈕 |
| 發布 | `git add -A && git commit -m "..." && git push` |
| 測試 | 先 grep 實際href，再 browser click |

---

*建立日期：2026-03-11*
*最後更新：2026-03-11*
