# 課題分頁改動檢查清單

## 每次改動前檢查

- [ ] 確認 `<title>` 正確 (unique per chapter)
- [ ] 確認 `<h1>` 正確
- [ ] 確認 description 正確
- [ ] 確認遊戲 links 正確
- [ ] 確認漢堡包功能正常

## 驗證指令

```bash
./verify_chapters.sh
```

## 常見問題

1. **所有課題一樣** → 檢查有唔好用錯同一個檔案
2. **title 重複** → 用 grep 確認每個檔案既 title unique
3. **遊戲入唔到** → 確認 href 路徑正確

## Git Commit 前必做

1. `git status` - 確認改咗啲乜
2. `./verify_chapters.sh` - 執行驗證
3. `git diff` - 睇清楚改動內容
