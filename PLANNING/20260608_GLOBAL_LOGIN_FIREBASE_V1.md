# 20260608_GLOBAL_LOGIN_FIREBASE_V1

## 1. 背景

網站目前有學生登入頁（`login/index.html`）、Dashboard（`student/dashboard/index.html`）及修改密碼頁（`student/change-password.html`），但三者之間無共用身份層，且：
- Dashboard 強制跳轉未登入學生，沒有軟提示
- 登出使用 `localStorage.clear()`，會清除本機練習進度
- 登入後 redirect 無 `returnTo` 支援
- 首頁無登入狀態顯示
- Firebase 尚未真正接入

## 2. 現況分析

- 相關檔案：`index.html`、`login/index.html`、`student/dashboard/index.html`、`student/change-password.html`
- 目前行為：未登入直接被 Dashboard 彈走；登出清空所有 localStorage；首頁無登入狀態
- 已知問題：
  - `localStorage.clear()` 清除 `practice_progress`、`chapter_quiz_progress` 等本機學習進度
  - Dashboard XP/題數/連續登入/徽章以 mock 數據呈現但無明確免責聲明
  - `student/change-password.html` endpoint 仍為佔位符 `YOUR_DEPLOY_ID`
  - 前端有明文 teacher password（非本 PR 範圍，保留現況但加注釋）
  - `login/index.html` 登入後只會去 Dashboard，無 `returnTo`
- 安全或私隱風險：Firebase 未接入，目前身份僅為 localStorage local state

## 3. 使用者要求整理

1. 新增 `js/auth-state.js`：支援 guest / legacy-student 狀態；登出只清 auth keys
2. 修改 `index.html`：header 附近加入登入狀態 UI
3. 修改 `login/index.html`：支援 `returnTo`，修正登入後跳轉
4. 修改 `student/dashboard/index.html`：軟提示未登入（不強制跳轉），修正登出，加 mock 數據免責聲明
5. 修改 `student/change-password.html`：標示 endpoint 未設定，修正路徑

## 4. 產品原則

- 主要學生流程免登入可用（訪客優先）
- 登入只作進度、紀錄增強
- 不破壞現有課堂工具或本機練習進度
- 不新增 Firebase Admin SDK、secret、no-cors 假成功
- GitHub Pages 路徑必須保留 `/ai-learning/`
- Firebase 尚未接入時降級為 guest / legacy-local-state

## 5. 實作範圍

可以修改：
- `js/auth-state.js`（新增）
- `index.html`
- `login/index.html`
- `student/dashboard/index.html`
- `student/change-password.html`
- `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md`（本文件）

不應修改：
- 題庫、答案、OCR JSON、DSE evidence、試卷
- 遊戲核心計分、數學出題邏輯
- 其他未在上述列出的頁面

## 6. 具體任務

1. 新增 `js/auth-state.js`：全域 `AuthState` 物件，提供 `get()`、`isLegacyStudent()`、`loginUrl()`、`logout()` 方法；只清 auth keys；Firebase 未設定時降級為 guest/legacy
2. `index.html`：在 header 下方加入 `#auth-bar`，顯示訪客提示 + 登入入口，或 legacy-student 名稱 + Dashboard + 登出；引入 `js/auth-state.js`
3. `login/index.html`：讀取 `?returnTo=` URL 參數，登入成功後優先跳 returnTo，否則去 Dashboard；加入 `js/auth-state.js`；不聲稱已接 Firebase
4. `student/dashboard/index.html`：未登入顯示登入提示 banner，不強制跳轉；修正登出只清 auth keys；加 mock 數據免責聲明；引入 `js/auth-state.js`
5. `student/change-password.html`：endpoint 若含 `YOUR_DEPLOY_ID` 則顯示功能未設定提示，禁用提交按鈕；引入 `js/auth-state.js`

## 7. 驗收條件

- [ ] 訪客首頁可直接使用所有教材、遊戲、考試，無需登入
- [ ] 首頁 header 顯示訪客提示與登入入口
- [ ] 已登入（legacy local）首頁顯示名稱、Dashboard、登出
- [ ] 登出後本機 `practice_progress`、`chapter_quiz_progress` 等進度 key 仍存在
- [ ] Login 頁支援 `?returnTo=` 參數並正確跳轉
- [ ] Dashboard 未登入顯示提示 banner，不強制跳轉
- [ ] Dashboard mock 數據有「測試中 / 尚未同步真實學習紀錄」說明
- [ ] Change-password endpoint 佔位符時顯示功能未設定
- [ ] 路徑掃描無新增根路徑 `/login`、`/student/...`
- [ ] 無新增 `no-cors` 寫入、`localStorage.clear()`、明文 secret

## 8. 實作 AI PR 前測試清單

- [ ] 未登入首頁：所有主要教材入口可見可點
- [ ] 未登入首頁：auth-bar 顯示訪客提示 + 登入連結
- [ ] 登入後首頁：auth-bar 顯示名稱 + Dashboard + 登出
- [ ] 登出後：practice_progress 等 key 未被清除
- [ ] Login 頁 returnTo：`login/index.html?returnTo=games-index.html` 登入後跳到正確頁
- [ ] Dashboard 未登入：顯示提示 banner，不被彈走
- [ ] Dashboard 登入：正常顯示 mock 數據（帶免責聲明）
- [ ] Change-password：endpoint 佔位符時提交按鈕 disabled
- [ ] Desktop 1280x720、mobile 390x844、mobile 320x568 均可用
- [ ] 路徑掃描：`rg 'href="/|src="/|location\.href\s*=\s*["'"'"']/' --glob '*.html' --glob '*.js'`
- [ ] 安全掃描：`rg -n 'no-cors|localStorage\.clear|student_token|TEACHER_PASSWORD|API_TOKEN|initializeApp|getAuth|firebase|authDomain|projectId' --glob '*.html' --glob '*.js'`

## 9. PR 指示

PR 描述必須包含：
- Planning file：`PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md`
- 完成內容、測試結果、未完成與風險
- 是否未接資料庫（本 PR：未接 Firebase / Firestore）
- 路徑掃描結果
- 安全掃描摘要
