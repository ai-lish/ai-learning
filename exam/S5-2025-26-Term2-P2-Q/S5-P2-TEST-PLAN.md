# S5 2025-26 Term 2 - 卷二測試計劃

## 測試目標
- **考試**: S5 2025-26 Term 2
- **卷別**: Paper 2 (卷二 - 選擇題 + 幾何圖像)
- **題目數量**: Q1-Q30
- **圖像題數量**: 11題 (Q9, Q16-Q19, Q22, Q26-Q30)

---

## 測試項目

### 1. 基礎顯示測試
| # | 項目 | 方法 |
|---|------|------|
| 1.1 | 頁面正常載入 | browser snapshot |
| 1.2 | 標題顯示正確 | snapshot |
| 1.3 | 得分顯示 (0/45) | snapshot |
| 1.4 | 核對答案按鈕 | snapshot |

### 2. 幾何圖像測試
| # | 題號 | 項目 | 方法 |
|---|------|------|------|
| 2.1 | Q9 | 梯形圖顯示 + 文字標籤 | snapshot |
| 2.2 | Q16 | 圓形圖顯示 + 文字標籤 | snapshot |
| 2.3 | Q17 | 圓形圖顯示 + 文字標籤 | snapshot |
| 2.4 | Q18 | 圓形圖顯示 + 文字標籤 | snapshot |
| 2.5 | Q19 | 半圓圖顯示 | snapshot |
| 2.6 | Q22 | 題目 + 4個選項圖片 | snapshot |
| 2.7 | Q26 | 棒形圖顯示 | snapshot |
| 2.8 | Q27 | 累積頻數圖 + 坐標軸 | snapshot |
| 2.9 | Q28 | 幹葉圖顯示 | snapshot |
| 2.10 | Q29 | 統計圖顯示 | snapshot |
| 2.11 | Q30 | 框線圖顯示 | snapshot |

### 3. 功能測試
| # | 項目 | 方法 |
|---|------|------|
| 3.1 | 點擊選項有反應 | browser click |
| 3.2 | 核對答案功能 | browser click |
| 3.3 | 正確/錯誤標記 | snapshot |
| 3.4 | 返回按鈕正常 | browser click |

### 4. 已知問題 (待修復)
| 題號 | 問題 | 狀態 |
|------|------|------|
| Q22 | 選項圖片未提取 | ❌ 待修復 |
| Q26 | 棒形圖棒冇顯示 | ❌ 待修復 |
| Q27 | 坐標軸/格網冇顯示 | ❌ 待修復 |
| Q30 | 框線圖框不完整 | ❌ 待修復 |

---

## 測試命令

```bash
# 開啟頁面
browser action=open url="https://math-lish.github.io/ai-learning/exam/S5-2025-26-Term2/2025-26-s5-term2-p2.html"

# 截圖
browser action=screenshot

# 點擊選項
browser action=act kind=click ref=eX
```

---

## 預期結果
- ✅ 所有 Q1-Q30 題目顯示
- ✅ 幾何圖像正確顯示
- ✅ 文字標籤 (A,B,C,D,O) 可見
- ✅ 選項可點擊
- ✅ 核對答案功能正常
