# S5 卷二 SVG 手工視覺測試報告

## 測試日期
2026-03-14 20:30

---

## 測試結果

### ✅ 全部通過 (11/11)

| 題號 | 預期圖像 | 實際顯示 | 元素特徵 | 狀態 |
|------|----------|----------|-----------|------|
| Q9 | 梯形ABCD + 點E | ✅ 梯形 | poly=4, labels: D,C,A,E,B | ✅ |
| Q16 | 圓ABCD + 圓心O | ✅ 圓形 | circle=1, labels: O,C,B,A,D | ✅ |
| Q17 | 圓ABDE + 直徑AD | ✅ 幾何圖 | poly+circle+path+lines | ✅ |
| Q18 | 圓ABCDE + 直徑BE | ✅ 圓形 | circle=1, path=2 | ✅ |
| Q19 | 半圓ABCDE | ✅ 半圓 | path=1, line=3 | ✅ |
| Q22 | 圓直徑AB + 點 | ✅ 圓形 | circle=1, line=1 | ✅ |
| Q26 | 棒形圖 | ✅ 棒形圖 | line=22, labels: 球拍數目 | ✅ |
| Q27 | 累積頻數多邊形 | ✅ 曲線圖 | path=3, labels: 時間(分鐘) | ✅ |
| Q28 | 統計數據表 | ✅ 數據表 | line=5, labels: 參與訓練次數 | ✅ |
| Q29 | 幹葉圖 | ✅ 莖葉圖 | line=3, labels: 幹（十位） | ✅ |
| Q30 | 框線圖 | ✅ 框線圖 | path=3, line=7, labels: A組,B組 | ✅ |

---

## 元素特徵比對

| 題號 | Google Docs | 網頁 | 匹配 |
|------|-------------|------|------|
| Q9 | poly=4, text=5 | poly=4, text=5 | ✅ |
| Q16 | circle=1, path=1, text=5 | circle=1, path=1, text=5 | ✅ |
| Q17 | poly=1, circle=1, path=2, line=4, text=8 | poly=1, circle=1, path=2, line=4, text=8 | ✅ |
| Q18 | circle=1, path=2, text=6 | circle=1, path=2, text=6 | ✅ |
| Q19 | path=1, line=3, text=7 | path=1, line=3, text=7 | ✅ |
| Q22 | circle=1, line=1, text=2 | circle=1, line=1, text=2 | ✅ |
| Q26 | line=22, text=14 | line=22, text=14 | ✅ |
| Q27 | path=3, text=17 | path=3, text=17 | ✅ |
| Q28 | line=5, text=10 | line=5, text=10 | ✅ |
| Q29 | line=3, text=33 | line=3, text=33 | ✅ |
| Q30 | path=3, line=7, text=11 | path=3, line=7, text=11 | ✅ |

---

## 結論

**全部 11 題 SVG 圖像已正確插入並顯示！**

- ✅ viewBox 尺寸正確
- ✅ 元素數量正確
- ✅ 文字標籤正確
- ✅ 圖像類型正確

---

## 待處理

- Q32, Q35, Q36, Q37 - 需要上傳到 Google Docs
