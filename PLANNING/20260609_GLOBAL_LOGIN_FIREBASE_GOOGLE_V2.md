# 20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2

## 1. 背景

V1 及 DEBUG_1 已建立全站右上角登入殼：

- 主要公開頁面可顯示共用 auth widget。
- 登入可以在目前頁面的 modal 內完成。
- localStorage 狀態可跨頁及跨 browser tab 更新。
- 未登入仍可直接使用主要教材、練習、遊戲及考試工具。

但截至 `origin/main` commit `e245af8`，目前身份來源仍是舊有 Google Apps Script 班別／學號／密碼登入：

- `js/auth-state.js` 以 `student_token` 等 localStorage keys 判斷登入。
- modal 仍要求班別、學號及密碼。
- Firebase Auth 尚未接入。
- Dashboard 仍只有示範數據，未同步真實學習紀錄。
- 首頁老師工具仍使用公開前端密碼作視覺入口。

使用者已確認下一階段方向：

1. 登入體驗以 [`ai-lish/math-rpg`](https://github.com/ai-lish/math-rpg) 為參考。
2. 使用 Firebase Authentication + Google provider。
3. `ai-learning` 與將來由網站連入的 Math RPG 共用 Firebase project `math-rpg-1eebc`。
4. 登入仍在右上角隨時進行，不建立獨立主要登入介面。
5. 未登入仍可使用網站及遊戲的主要功能。
6. 老師／學生角色只作介面及工作分類，不作敏感資料保安邊界。
7. 老師角色可由前端電郵白名單或清楚的電郵規則判斷。
8. 本網站目前不以登入角色保護敏感資料；如日後加入學生紀錄、成績或管理寫入，必須另開安全升級 planning。

本文件規劃 V2 真實 Firebase Google 登入。今次 planning 不直接實作功能、不建立資料庫 schema，也不修改 Math RPG repo。

## 2. 已檢查範圍

### 2.1 `ai-lish/ai-learning`

已按 `origin/main` commit `e245af8` 檢查：

- `PROJECT.md`
- `CODEX.md`
- `PLANNING/README.md`
- `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md`
- `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_DEBUG_1.md`
- `js/auth-state.js`
- `css/auth-widget.css`
- `index.html`
- `login/index.html`
- `student/dashboard/index.html`
- `student/change-password.html`
- 已接入 auth widget 的主要公開 HTML 頁面
- 現有 `student_token`、Firebase、Google auth、teacher role、localStorage 相關程式

### 2.2 `ai-lish/math-rpg`

已檢查：

- `firebase-config.js`
- `SETUP.md`
- `shared/shared-main.js`
- 根頁及 hub 等場景的登入 UI
- Firebase Auth、Realtime Database、localStorage、Google provider 相關程式

Math RPG 現有模式：

- 使用 Firebase project `math-rpg-1eebc`。
- 使用 Firebase Auth Google popup。
- 使用 `onAuthStateChanged` 更新頁面身份。
- 未登入時遊戲仍可使用，進度存於 `localStorage`。
- 登入後以 Firebase UID 讀寫遊戲進度。
- Firebase 初始化失敗時保留離線模式。
- Google provider 使用 `hd: 'lsc.edu.hk'` 提示選擇學校帳戶。

Math RPG repo 未見可供本次審核的 Realtime Database rules 檔案。其 `SETUP.md` 亦包含開發期 test mode 建議，因此只參考登入體驗，不把舊資料庫設定視為安全規格。

## 3. 現況與差距

### 3.1 已有可保留部分

- `css/auth-widget.css` 已提供固定右上角 widget、dropdown、modal 及手機樣式。
- 主要頁面已加入 auth widget CSS / JS。
- `login/index.html` 已降級為兼容轉址，不再是主要登入表單。
- `AuthState` 已有集中狀態 API、同 tab event 及跨 tab 更新概念。
- Dashboard 已清楚標示 XP、題數及徽章不是已同步真實資料。
- 未登入使用工具的路徑已保留。

### 3.2 必須取代部分

- `student_token` 不再作真實登入判斷。
- 班別／學號／密碼 modal 要改為 Google 登入操作。
- 舊 Google Apps Script login request 不再是主要身份來源。
- `legacy-student` 狀態要由 Firebase user 狀態取代。
- 登出要呼叫 Firebase `signOut()`，而不是只刪 localStorage。
- 頁面初始化不能在 Firebase 尚未回報狀態前錯誤閃成 guest。
- Dashboard、首頁及 widget 要使用同一個 Firebase user snapshot。
- 首頁老師前端密碼入口要由登入帳戶的 UI role 分類取代或降級。

### 3.3 共用 Firebase project 的實際意義

共用 `math-rpg-1eebc` 可帶來：

- 同一 Google 帳戶只建立一個 Firebase UID。
- `ai-learning` 與 Math RPG 可用同一身份識別學生。
- 兩個 app 日後可在不同資料路徑保存各自資料。
- 若兩個網站都部署在同一 origin，例如：
  - `https://ai-lish.github.io/ai-learning/`
  - `https://ai-lish.github.io/math-rpg/`
  
  並使用同一 Firebase project / web app config，Firebase Auth persistence 應可共用；仍必須以正式網站實測確認。

限制：

- 共用 Firebase project 不代表不同網域必然共享 browser session。
- 若 Math RPG 日後在另一個 custom domain 或不同 origin，不能假設登入狀態自動傳遞。
- 共用 project 不代表兩個 app 要共用同一資料路徑。
- 本 PR 不應修改 Math RPG 玩家資料、Realtime Database 結構或 rules。

## 4. 產品規則

### 4.1 訪客

- 未登入可直接使用首頁、教材、自學、遊戲、考試及 DSE 練習。
- 未登入可看到右上角「登入」。
- Firebase SDK 未載入、網絡中斷或 popup 失敗時，主要工具仍可使用。
- 未登入本機進度不得因加入 Firebase Auth 而被清除。

### 4.2 Google 登入

- 使用者在任何已接入主要頁面按右上角「登入」。
- 頁面顯示簡潔 modal，主要操作是「使用 Google 登入」。
- 按鈕呼叫 Firebase Auth Google provider。
- 成功後 modal 關閉，留在原頁，不重載工具、不清空答案、不重置遊戲。
- 新頁、刷新頁及同 origin 的其他 tab 顯示相同登入狀態。
- 已登入時顯示短名稱或頭像、Dashboard／我的學習紀錄及登出。

### 4.3 Google 帳戶範圍

MVP 採用：

- Google provider 設定 `hd: 'lsc.edu.hk'`，優先提示使用學校 Workspace 帳戶。
- `hd` 只屬帳戶選擇提示，不宣稱是安全限制。
- 由於目前角色只作介面分類且沒有受保護資料，MVP 不因非 `lsc.edu.hk` Google 帳戶而中斷整個網站。
- 非學校帳戶如成功登入，預設分類為 `student`，可顯示簡短提示「建議使用學校帳戶」。
- 不使用曾在舊文件出現的 `lsh.edu.hk` 拼法。

如日後必須只接受學校帳戶，另開 planning 加入可信後端／rules 驗證，不只依賴前端 email suffix 或 `hd`。

### 4.4 老師／學生 UI role

本階段 role 定義：

- `guest`：Firebase 尚未登入。
- `student`：已登入 Google 帳戶，且不符合 teacher UI 規則。
- `teacher`：已登入 Google 帳戶，email 符合明確前端 teacher allowlist。
- `loading`：等待 Firebase 首次 auth state。
- `unavailable`：Firebase SDK 或初始化失敗。

老師判斷建議：

```js
const TEACHER_EMAILS = [
  // 使用者確認的完整老師電郵，小寫儲存
];
```

規則：

- 優先使用完整 email allowlist，不使用 display name 猜測身份。
- email 比較前要 trim 及轉小寫。
- 如 allowlist 暫時未填，所有已登入帳戶預設為 student。
- teacher role 只控制老師工具入口、標籤、提示及首頁區域顯示。
- 前端 teacher role 可被繞過，不能用作保護學生資料、成績、寫入 secret、GitHub token、Google Sheets 或管理 API。
- 本階段不建立 Custom Claims、Admin SDK 或角色後端。

### 4.5 登出

- 呼叫 Firebase Auth 官方 `signOut()`。
- 登出後留在目前頁面並即時顯示 guest UI。
- 不使用 `localStorage.clear()`。
- 不清除練習、遊戲、題目、OCR 或其他工具本機資料。
- 可清除舊身份殘留 keys：
  - `student_token`
  - `student_name`
  - `student_class`
  - `student_number`
- 登出 `ai-learning` 後，若 Math RPG 使用相同 origin、project 及 persistence，應實測 Math RPG 是否同步變成登出。

## 5. Firebase 方案決定

### 5.1 採用

- Firebase Authentication
- Google provider
- Firebase project：`math-rpg-1eebc`
- Firebase 官方 Web SDK
- Firebase 管理 session persistence
- `onAuthStateChanged` 作唯一身份狀態來源
- 現有右上角 auth widget 作 UI 外殼

### 5.2 不採用

- 不再以班別／學號／密碼作主要登入。
- 不再以 GAS 返回 token 作全站登入真相。
- 不做 Email/password。
- 不做 Anonymous Auth。
- 不做自製 Google ID token 驗證。
- 不把 Firebase user object 手動複製成長期 localStorage session。
- 不使用 service account、Admin SDK、private key 或 refresh token。

### 5.3 SDK 方式

實作 AI 必須使用官方 Firebase Web SDK。

考慮 repo 是大量獨立 Vanilla HTML，MVP 可選：

1. 使用與 Math RPG 相容的 Firebase compat CDN，減少現有 script 架構改動。
2. 使用官方 modular browser modules，將 Firebase 初始化集中在共用 helper。

建議 MVP 使用與 Math RPG 相同 major SDK 的 compat browser scripts，原因：

- 現有網站沒有 bundler。
- Math RPG 已使用 compat API。
- 較容易確保兩個 app 使用同一 default app、project config 及 auth persistence。
- 可把改動集中在 `js/auth-state.js` 與頁面 script 引用。

不得：

- 混用多個不相容 Firebase major versions。
- 每個頁面重複不同 Firebase config。
- 同一頁重複 initialize default Firebase app。

## 6. Firebase Console 前置設定

實作 PR 可以加入公開 Firebase web config，但以下 Firebase Console 設定需要由 project owner 核對：

- Project：`math-rpg-1eebc`
- Authentication > Sign-in method > Google：已啟用
- Authentication > Settings > Authorized domains 至少包括：
  - `ai-lish.github.io`
  - 本地測試所需 domain，如 Firebase 支援的 `localhost`
- Web app config 與 Math RPG 實際使用 config 一致
- 不建立或下載 service account 到 repo
- 不把 OAuth client secret、private key 或 Admin credentials 放入前端

Firebase web config：

- `apiKey`
- `authDomain`
- `projectId`
- `appId`
- 需要時的其他公開 web config

以上屬 Firebase client identification，不當作真正 secret；PR 不應宣稱把 web API key 放在前端等同洩漏管理權限。

本階段不新增 Firestore、Storage 或 Realtime Database 寫入。現有 Math RPG Database rules 需另行審核，不在本 PR 範圍。

## 7. 建議實作範圍

### 7.1 可以修改

- `js/auth-state.js`
- `css/auth-widget.css`
- `index.html`
- `login/index.html`
- `student/dashboard/index.html`
- `student/change-password.html`
- 已接入 widget 的主要公開 HTML，用於加入統一 Firebase SDK script
- 可新增集中 config/helper，例如：
  - `js/firebase-config.js`
  - `js/firebase-auth.js`

檔名可按現有 repo pattern 調整，但 config、Firebase 初始化與 UI rendering 必須清楚分層。

### 7.2 不應修改

- Math RPG repo 或遊戲核心。
- 題庫、答案、考試資料、OCR JSON、PDF 或圖片。
- 學習紀錄 schema 或同步系統。
- Dashboard 大型重寫。
- Realtime Database、Firestore 或 Storage 資料寫入。
- Firebase Admin SDK、Cloud Functions 或 service account。
- 與登入無關的首頁、工具或導航重構。
- 現有老師工具內部寫入流程。

## 8. 具體技術任務

### 8.1 集中 Firebase config

建立單一公開 Firebase config 來源：

- 使用 `math-rpg-1eebc` web config。
- 不在多個 HTML 複製 config。
- 初始化前使用 `firebase.apps.length` 或等效官方方式避免重複初始化。
- Firebase config 載入失敗時提供可診斷但不阻塞頁面的狀態。

### 8.2 重構 `AuthState`

`AuthState` 應提供或保留等效 API：

```js
AuthState.get()
AuthState.signInWithGoogle()
AuthState.logout()
AuthState.openLoginModal()
AuthState.closeLoginModal()
AuthState.renderWidget()
AuthState.onChange(handler)
AuthState.whenReady()
AuthState.PROJECT_BASE
```

`get()` 建議回傳：

```js
{
  state: 'loading' | 'guest' | 'student' | 'teacher' | 'unavailable',
  user: null | {
    uid,
    email,
    displayName,
    photoURL,
    emailVerified
  },
  role: 'guest' | 'student' | 'teacher',
  source: 'firebase' | 'none',
  error: null
}
```

要求：

- `onAuthStateChanged` 是 user state 唯一真相。
- 第一次 callback 前顯示 loading，不先假定 guest。
- 不把 Firebase ID token 或 refresh token寫入自訂 localStorage。
- 只向 UI 暴露必要 user fields。
- 所有 user text 使用 `textContent` 或安全 escaping。
- Firebase callback 後派發現有 `auth-state-changed` 或等效事件。
- `onChange` subscription 在登入、登出、其他 tab 更新及初始化完成時一致觸發。

### 8.3 Google 登入 modal

取代現有班別／學號／密碼 form：

- 標題可為「登入」或「使用 Google 登入」。
- 主要按鈕清楚標示 Google 登入。
- 不再顯示班別、學號、密碼欄位。
- 不再向 GAS endpoint 傳送 login password。
- popup 開啟期間顯示 loading，防止重複按。
- 處理：
  - 使用者關閉 popup
  - popup 被 browser 阻擋
  - network failure
  - unauthorized domain
  - Firebase SDK unavailable
- 取消或失敗後留在原頁，工具狀態不變。
- 成功後關閉 modal並更新 widget。

Google provider：

```js
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({
  hd: 'lsc.edu.hk',
  prompt: 'select_account'
});
```

`prompt: 'select_account'` 可避免共用裝置不小心沿用上一位學生帳戶；如實測令課堂操作過慢，可在 PR 說明後調整。

### 8.4 Persistence 與跨頁狀態

- 明確設定或確認 Firebase Auth 使用 LOCAL persistence。
- 同 origin 新頁及刷新後維持登入。
- 依賴 Firebase Auth 自身 persistence，不再手動模擬 session。
- 保留 `auth-state-changed` 供頁面 UI 更新。
- 可保留 storage listener 作 legacy cleanup 或 UI fallback，但不得以舊 auth keys 判斷 Firebase 登入。
- 測試 `ai-learning` 與 Math RPG 的相同 Firebase UID 及登入持續狀態。

### 8.5 舊登入狀態遷移

Firebase Auth 上線後：

- `student_token` 不再令 UI 顯示已登入。
- 若 Firebase user 為 null，即使舊 token 存在亦顯示 guest。
- 初始化時可安全移除舊 auth keys，或在首次登出時移除。
- 不刪除其他 localStorage。
- 不嘗試把舊 GAS token 轉成 Firebase user。
- 不把舊班別／學號自動當成已驗證 profile。
- PR 要列明 migration 行為，避免使用者因舊 token 看見錯誤登入狀態。

### 8.6 Widget 已登入 UI

已登入時：

- 顯示 Google display name，過長時截短。
- 可顯示 Google photo，載入失敗時用普通 user icon。
- menu 提供：
  - `我的學習紀錄`
  - teacher 時可加 `老師工具`
  - `登出`
- 不在固定右上角顯示完整 email。
- 完整 email 可放在 menu 內作帳戶識別。
- 320px 寬度不能變成全寬頂部橫條而遮擋教材；應改為緊湊 icon／短名稱。

### 8.7 老師工具 UI 分流

首頁應逐步移除公開前端密碼作主要老師分類：

- Firebase user email 在 `TEACHER_EMAILS` 時，顯示 teacher UI。
- teacher UI 可直接看到老師工具入口或「老師模式」按鈕。
- student／guest 可隱藏老師快捷入口，或保留低調公共入口提示。
- 不再要求老師輸入 repo 內硬編碼密碼作身份分類。
- 如為降低 PR 範圍而暫時保留舊老師入口，必須：
  - 不把它與 Firebase teacher role 混稱。
  - 不新增或重複硬編碼密碼。
  - PR 清楚列為待移除 legacy UI。

由於使用者已確認 role 只作分工分類，本 PR 不需要 Custom Claims 或後端驗證。

### 8.8 Dashboard

- 使用 Firebase user 顯示名稱、email 或頭像。
- guest 顯示登入提示，不強制 redirect。
- teacher 可看到 teacher 標籤，但不需要建立另一個大型 Dashboard。
- 現有 XP、題數及徽章仍要標示為示範／未同步。
- 不讀取 Math RPG 玩家資料填入 Dashboard。
- 不建立學習紀錄資料庫。

### 8.9 `login/index.html`

- 保留為舊 bookmark 兼容入口。
- 仍轉到安全 `/ai-learning/` 內頁並要求開啟右上角登入 modal。
- 不包含第二套 Google 登入實作。
- 已登入時直接返回安全 return path 或首頁。
- return path 驗證沿用現有 same-origin + `/ai-learning/` 限制。

### 8.10 `student/change-password.html`

Google provider 不使用網站自訂密碼：

- 頁面應清楚說明帳戶由 Google 管理。
- 不顯示假的「修改學生密碼」流程。
- 可提供返回首頁／Dashboard。
- 不連接 Firebase Email/password API。

## 9. 失敗與降級狀態

### 9.1 SDK 未載入

- Widget 顯示「登入暫時不可用」或維持訪客狀態。
- 不顯示已登入。
- 不阻止工具操作。
- console 可有一次可診斷 warning，不重複大量 error。

### 9.2 Firebase config 錯誤

- 狀態為 `unavailable`。
- 不 fallback 到舊 GAS token 假裝登入成功。
- 不跳去獨立 login page。
- 頁面仍可使用。

### 9.3 Popup 取消或失敗

- 留在原頁。
- modal 顯示簡短訊息。
- 不清除本機進度。
- 不把取消當系統錯誤反覆 alert。

### 9.4 離線

- 已載入頁面的教材及本機工具繼續使用。
- 不顯示「已同步」。
- Auth 狀態若 Firebase 可從本機 persistence 恢復，可顯示帳戶；任何資料同步狀態需另行設計。

## 10. 不建議今次處理

- 不做完整學習紀錄系統。
- 不把 Math RPG 進度搬到 `ai-learning` Dashboard。
- 不做大型 Dashboard 重寫。
- 不重寫所有工具。
- 不建立班別／學號 profile onboarding。
- 不做 Google 帳戶與學生名冊配對。
- 不做 Email/password 或 forgot-password。
- 不做 Anonymous Auth。
- 不做 Custom Claims。
- 不做 Firebase Admin、Cloud Functions 或後端 role API。
- 不修改 Math RPG Database rules。
- 不加入公開可濫用的 Admin 權限。
- 不把 Firebase web config 當 secret；同時不可把真正 secret 放前端。
- 不把前端 role check 當真正保安。
- 不用 `no-cors` 假定登入或寫入成功。
- 不順手修正所有既有 no-cors、GitHub token、Apps Script 或老師工具問題。

## 11. 技術與安全邊界

- 必須使用 Firebase 官方 Web SDK。
- Firebase session 必須由 Firebase Auth 管理。
- 不可自行製造、解析後信任或長期儲存 Google ID token。
- 不可在前端使用 service account、Admin SDK、client secret、private key 或 refresh token。
- `hd`、email suffix、display name 及前端 allowlist 都不是安全授權。
- 本階段 teacher role 只作 UI 分類，程式及文案必須反映這一點。
- 若任何功能開始涉及學生個人紀錄、成績、他人資料或受限制寫入，必須先另開 planning 設計 Rules／後端授權。
- 所有路徑兼容 `/ai-learning/`。
- Auth helper failure 不得令頁面核心 script 停止。
- 所有新增 UI 在 320px 寬度不可水平 overflow。
- 登入／登出不得重載或重置進行中的題目與遊戲。
- 不在 console、URL、DOM attribute 或 error message 輸出 token。

## 12. 測試矩陣

### 12.1 環境

- 本地 HTTP server
- GitHub Pages production：
  - `https://ai-lish.github.io/ai-learning/`
- Math RPG production：
  - 實際 `ai-lish.github.io` Math RPG URL

### 12.2 Viewport

- Desktop：1280 x 720
- Mobile：390 x 844
- Narrow mobile：320 x 568

### 12.3 頁面

- `/ai-learning/`
- `/ai-learning/S1Ch1.html`
- `/ai-learning/s1/selfstudy/index.html`
- `/ai-learning/s3/selfstudy/index.html`
- `/ai-learning/games-index.html`
- `/ai-learning/exam/index.html`
- `/ai-learning/hkdse/dse-practice-p1.html`
- `/ai-learning/hkdse/dse-practice-p2.html`
- `/ai-learning/student/dashboard/index.html`
- `/ai-learning/login/index.html`
- 一個頁面控制密集的遊戲／工具頁
- Math RPG 首頁及至少一個子場景

### 12.4 Guest flow

- 未登入直接進首頁，主要工具可用。
- 未登入直接開教材／遊戲／考試頁，不被 redirect。
- 開 Google login modal 後取消，留在原頁。
- Firebase SDK 阻擋／離線時，工具仍可用。

### 12.5 Login flow

- 在首頁登入。
- 在教材進行中登入。
- 在遊戲或考試進行中登入。
- Google popup 選學校帳戶。
- Google popup 選非學校帳戶，確認依產品規則分類為 student 並顯示建議提示。
- popup 關閉、popup blocked、network error 均有合理訊息。
- 成功後原頁 scroll、答案、計時器及工具狀態不變。

### 12.6 Persistence

- 登入後刷新同頁。
- 登入後開另一個 `ai-learning` 頁面。
- 登入後開同 origin 新 tab。
- tab A 登出，tab B 更新。
- 關閉 browser 後重新開啟，依 LOCAL persistence 保持登入。
- 登出後刷新顯示 guest。
- 登出後本機練習／遊戲進度仍存在。

### 12.7 Math RPG 共用身份

- 在 `ai-learning` 登入後開 Math RPG。
- Math RPG 顯示同一 Google 帳戶。
- 兩邊 Firebase UID 相同。
- Math RPG 不要求再次登入；如實際 origin 不同而無法共享，PR 必須如實記錄，不能聲稱已共享。
- 從任一 app 登出後，另一 app 的實際行為已測試及記錄。
- Math RPG 離線遊玩仍可用。

### 12.8 Role UI

- teacher allowlist email 顯示 teacher UI。
- 非 allowlist email 顯示 student UI。
- email 大小寫不影響 allowlist。
- 空 allowlist 不會把所有人判斷為 teacher。
- 修改前端 role 可繞過 UI，文件沒有宣稱這是保安權限。

### 12.9 Mobile / accessibility

- 右上角 widget 不遮擋漢堡選單、遊戲 HUD、題目控制或計時器。
- 320 x 568 不水平 overflow。
- 長 Google display name 被安全截短。
- Google 登入按鈕可用鍵盤操作。
- modal 可用 Escape 關閉並還原焦點。
- loading、error、signed-in 狀態有可理解 accessible name。
- 頭像失敗有 fallback。

### 12.10 技術掃描

```bash
rg -n 'student_token|student_name|student_class|student_number|GWS_ENDPOINT|action:\s*["'"'"']login' \
  --glob '*.html' --glob '*.js'

rg -n 'localStorage\.clear|serviceAccount|private_key|client_secret|refresh_token|firebase-admin' \
  --glob '*.html' --glob '*.js' --glob '*.json'

rg -n 'no-cors|TEACHER_PASSWORD|teacherLoggedIn|GoogleAuthProvider|onAuthStateChanged|signInWithPopup|signOut' \
  --glob '*.html' --glob '*.js'

rg 'href="/|src="/|location\.href\s*=\s*["'"'"']/' \
  --glob '*.html' --glob '*.js'
```

PR 必須分辨既有命中及本 PR 新增命中，不可未核實便聲稱全 repo 零風險。

## 13. 完成定義

- [ ] PR 描述引用 `PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md`。
- [ ] 使用 Firebase project `math-rpg-1eebc`。
- [ ] Google provider 已在 Firebase Console 啟用。
- [ ] `ai-lish.github.io` 已列入 Authorized domains。
- [ ] 使用官方 Firebase Web SDK。
- [ ] Firebase config 集中管理，沒有 service account 或真正 secret。
- [ ] `onAuthStateChanged` 是登入狀態唯一真相。
- [ ] Widget 不再以 `student_token` 判斷已登入。
- [ ] Modal 不再要求班別、學號或網站密碼。
- [ ] Google 登入成功後留在原頁。
- [ ] Google 登入失敗或取消後仍可使用工具。
- [ ] 登出使用 Firebase `signOut()`。
- [ ] 登出不清除本機學習或遊戲進度。
- [ ] 舊 auth keys 不會造成假登入。
- [ ] Dashboard 顯示 Firebase user，但仍清楚標示學習數據未同步。
- [ ] `login/index.html` 只作兼容入口。
- [ ] `change-password.html` 不再假裝可修改 Google 密碼。
- [ ] teacher email allowlist 只控制 UI 分類。
- [ ] student／guest 不會被誤標為 teacher。
- [ ] 未加入 Custom Claims、Admin SDK 或資料庫寫入。
- [ ] 未登入仍可直接使用主要學生工具。
- [ ] Firebase SDK/config 失敗時安全降級為 guest/unavailable。
- [ ] 所有修改路徑兼容 `/ai-learning/`。
- [ ] Desktop 1280 x 720 通過。
- [ ] Mobile 390 x 844 通過。
- [ ] Mobile 320 x 568 通過。
- [ ] 跨頁、刷新、跨 tab、browser reopen persistence 已測試。
- [ ] `ai-learning` 與 Math RPG 的同 UID／session 行為已在 production 實測並如實記錄。
- [ ] 無新增 console error、404、水平 overflow 或公開真正 secret。
- [ ] OpenClaw check/test/merge 後，由 Codex 再確認正式 GitHub Pages 行為。

## 14. PR 指示

實作 AI 的 PR 描述必須包含：

- Planning file：`PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md`
- Base commit / branch
- Firebase SDK 版本及 compat／modular 選擇
- Firebase project ID（可列 `math-rpg-1eebc`，不要列真正 secret）
- Firebase Console 需要人工完成或已確認的設定
- 修改檔案清單
- 舊 GAS login／legacy auth keys 的遷移方式
- teacher allowlist 的設定位置及目前是否已填
- 未登入、登入、登出、錯誤降級測試結果
- Desktop 及兩個 mobile viewport 結果
- 跨頁、跨 tab、browser reopen persistence 結果
- `ai-learning` 與 Math RPG 共用登入實測結果及 Firebase UID 是否一致
- 路徑與安全掃描結果
- 未完成項目、外部設定及剩餘風險

實作 AI 不得自行 merge。PR 完成後交回 Codex Ready Review。
