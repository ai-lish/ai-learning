# S5 2025-26 Term 2 - 卷一測試計劃

## 測試目標
- **考試**: S5 2025-26 Term 2
- **卷別**: Paper 1 (卷一)
- **題目數量**: Q1-Q30

---

## 測試項目

### 1. 基礎顯示測試
| # | 項目 | 方法 |
|---|------|------|
| 1.1 | 頁面正常載入 | browser snapshot |
| 1.2 | 標題顯示正確 | snapshot |
| 1.3 | 題目 Q1-Q30 全部顯示 | snapshot |

### 2. 內容測試
| # | 項目 | 方法 |
|---|------|------|
| 2.1 | 數學公式顯示 (指數) | snapshot |
| 2.2 | 數學公式顯示 (分數) | snapshot |
| 2.3 | 數學公式顯示 (根號) | snapshot |
| 2.4 | 選項 A/B/C/D 顯示 | snapshot |

### 3. 功能測試
| # | 項目 | 方法 |
|---|------|------|
| 3.1 | 點擊選項有反應 | browser click |
| 3.2 | 選中狀態顯示 | snapshot |
| 3.3 | 返回按鈕正常 | browser click |

### 4. 響應式測試
| # | 項目 | 方法 |
|---|------|------|
| 4.1 | 桌面版顯示正常 | browser resize |
| 4.2 | 手機版顯示正常 | browser resize |

---

## 測試命令

```bash
# 開啟頁面
browser action=open url="https://math-lish.github.io/ai-learning/exam/S5-2025-26-Term2/S5-2025-26-Term2-P1-Q/2025-26-s5-term2-p1.html"

# 截圖
browser action=screenshot

# 點擊測試
browser action=act kind=click ref=eX
```

---

## 預期結果
- ✅ 所有 Q1-Q30 題目顯示
- ✅ 數學公式正確顯示
- ✅ 選項可點擊
- ✅ 返回功能正常
