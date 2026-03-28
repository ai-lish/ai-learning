# CSV URL 記錄

## Google Sheets CSV 連結

> 請將Google Sheets發布為CSV格式後，將連結貼在此處

### 當前連結
```csv
https://docs.google.com/spreadsheets/d/e/xxx/pub?output=csv
```

### 更新步驟

1. 打開 Google Sheets
2. 點擊 **檔案** → **共用** → **發布到網路**
3. 選擇 **全份文件**
4. 選擇 **CSV**
5. 點擊 **發布**
6. 複製連結
7. 更新 `index.html` 中的 `CSV_URL` 常量 (約第230行)

### CSV 格式
```csv
Date,Subject,Detail,Deadline
2026-03-17,數學,練習13C,21/3
2026-03-17,中文,作文,25/3
```

### 列說明
| 欄位 | 說明 | 格式 |
|------|------|------|
| Date | 發佈日期 | YYYY-MM-DD |
| Subject | 科目 | 文字 |
| Detail | 詳細內容 | 文字 |
| Deadline | 截止日期 | DD/MM |

---

*最後更新：2026-03-21*
