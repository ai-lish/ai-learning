# Google Apps Script 圖片代理部署指南

## 步驟 1：創建 Apps Script 項目

1. 前往 https://script.google.com
2. 點擊「+ 新增項目」
3. 刪除默認代碼，粘貼 `gas-image-proxy.gs` 的內容

## 步驟 2：部署為 Web App

1. 點擊 💾 儲存
2. 點擊「部署」> 「新增部署」
3. 選擇類型為「網頁應用程式」
4. 配置：
   - 說明：HKDSE Image Proxy
   - 執行身份：我自己
   - 誰有存取權限：任何人
5. 點擊「部署」
6. **複製 Web App URL**

## 步驟 3：更新 JSON 數據

你的 Web App URL 會係咁：
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

使用方式：
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?id=GOOGLE_DRIVE_FILE_ID
```

## 步驟 4：分享 Google Drive 文件

確保試卷圖片嘅 Google Drive 資料夾設為「知道連結的人都可以檢視」

## 測試

喺瀏覽器打開：
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?id=16cu2OcT44O3vC2fmgaPKUL0kkNCqp5vU
```

如果見到圖片，恭喜！你嘅代理已成功運作。

---

## 關於容量

- Google Apps Script 每日有 30,000 次請求限制
- 每個請求可以處理最大 50MB 嘅檔案
-呢個方法唔使用 GitHub 容量，只係用 Google 嘅 quota
