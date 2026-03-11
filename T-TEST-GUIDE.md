# T仔測試技巧指南

## ⚠️ 重要原則

**Button存在 ≠ 功能正常！**
- 必須檢查實際既 href value
- 必須驗證 Click 後既 URL 變化

---

## 🔍 正確測試流程

### 1. 檢查實際 Link（必做！）

```bash
# ❌ 錯誤 - 只檢查Button存在
grep "返回" file.html

# ✅ 正確 - 檢查實際 href
grep 'href="index.html"' file.html
```

### 2. 真正既 Click 測試

```bash
# Step 1: 去到目標頁面
browser action=open url="https://math-lish.github.io/ai-learning/S1Ch1.html"

# Step 2: Click返回按鈕
browser action=act kind=click ref=e4

# Step 3: 等待一下（重要！）
# 然後驗證當前 URL

# Step 4: 再次截圖，確認導航成功
browser action=snapshot
```

### 3. 驗證URL變化

每次Click後，必須確認：
- URL 變咗去目標Page
- 顯示既內容係預期既Page

---

## 🎯 常見測試項目

### 課題分頁測試

| # | 測試項目 | 正確做法 |
|---|----------|----------|
| 1 | 返回按鈕存在 | `grep 'href="index.html"' S1Ch1.html` |
| 2 | Click後URL正確 | 驗證URL變為 index.html |
| 3 | Tab切換正常 | Click Tab → 內容變化 |

### 遊戲返回測試

| # | 測試項目 | 正確做法 |
|---|----------|----------|
| 1 | 返回按鈕存在 | `grep 'href="../S1ChX.html"' game.html` |
| 2 | Click後去到課題分頁 | 驗證URL = S1ChX.html |

---

## 🔧 常用指令

```bash
# 檢查特定檔案既Link
grep 'href=' file.html

# 檢查所有課題分頁既返回Link
grep 'href="index.html"' S1Ch*.html

# 檢查所有遊戲既返回Link
grep 'href="../S1Ch' games/*.html
```

---

## ⚡ Quick Checklist

- [ ] 檢查實際 href value
- [ ] Click後驗證URL變化
- [ ] 截圖確認內容正確
- [ ] 發現問題要如實匯報，唔好假裝通過

---

*更新日期：2026-03-11*
