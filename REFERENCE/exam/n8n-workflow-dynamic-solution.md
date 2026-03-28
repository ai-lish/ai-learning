# N8n 動態解說頁面製作流程

## 原則

### ✅ 正確方法
1. **User send file as attachment** - 直接 send HTML file attachment
2. **Direct copy** - 我直接 copy attachment 到正確位置
3. **No modification** - 唔好改任何 code (除非有明顯破爛)

### ❌ 錯誤方法
1. **用 gog gmail get** - 會整爛 HTML encoding
2. **修改 original code** - 會整爛啲功能 (如 canvas render)
3. **加額外 elements** - 可能影響 layout

---

## 製作流程

| Step | 動作 | 說明 |
|------|------|------|
| 1 | User send attachment | Send HTML file as attachment |
| 2 | Copy to correct location | cp attachment to exam/xxx/p2/qX.html |
| 3 | Check file integrity | Verify window.onload exists |
| 4 | Git commit & push | Commit and wait for deployment |
| 5 | Test HTTP 200 | curl test |

---

## 常見問題

### Q: Canvas 唔顯示？
A: 呢個係 email version 本身既問題，唔好改佢既 code。等 user test。

### Q: 需要加導航按鈕？
A: 唔好加！之前試過會整爛 Canvas。保持原樣。

### Q: viewport 壞咗？
A: 呢個係 gog 輸出既問題，attachment 冇呢個問題。

---

## File Locations

```
exam/
├── 2025-26-s3-term2/
│   └── p2/
│       ├── q2-a.html  ✅
│       └── q27-a.html ✅
└── 2025-26-s5-term2/
    └── p2/
        └── q2-a.html  ✅
```
