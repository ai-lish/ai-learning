# 20260611_GLOBAL_LOGIN_FIREBASE_GOOGLE_V3

## 1. 文件定位

本文件是 `ai-learning`「訪客 + Google 登入」的正式實作交接。

- 狀態：待實作
- 建立日期：2026-06-11
- 取代：`PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md`
- 相關歷史：
  - `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md`
  - `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_DEBUG_1.md`
  - `PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md`

V2 仍保留作歷史，但不可直接作實作規格，原因如下：

1. V2 假設共用 auth widget、modal、`js/auth-state.js` 及相關 CSS 已存在；目前 repository 並沒有這些已落地的 Firebase 元件。
2. V2 假設 `login/index.html` 已是兼容轉址；目前它仍是班別／學號／密碼 GAS 登入表單。
3. V2 規劃 custom login modal；使用者最新決定是不使用登入 modal，只要右上角小型登入按鈕直接開 Google popup。
4. V2 把 legacy GAS 登入視為可過渡來源；使用者已確認從未為學生建立這類帳號／密碼，因此不應保留會誤導學生的 fallback。

如 V2 與本文件衝突，以本文件為準。

## 2. 已核對基線

本次以 2026-06-11 工作區 commit `88355fd` 核對：

- `PROJECT.md`
- `CODEX.md`
- `PLANNING/README.md`
- `PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md`
- `index.html`
- `login/index.html`
- `student/dashboard/index.html`
- `student/change-password.html`
- `gas/Code.gs`
- repository 內 Firebase、GAS、auth、localStorage、student token、teacher login 相關命中

使用者提及的 `REFERENCE/20260611_REPO_FULL_AUDIT.md` 在本工作區未找到，因此本文件不把該檔案當作可驗證 repository artifact；相關結論已直接以現有程式碼重新核對。

實作 AI 開工前必須先同步最新 `main`，重新執行相同掃描，並在 PR 描述列明 base commit。

## 3. 現況分析

### 3.1 現有學生登入不是真正可信身份

`login/index.html` 目前：

- 顯示班別、學號、密碼欄位。
- 把資料傳到公開 Google Apps Script endpoint。
- 成功後把 `student_token`、`student_name`、`student_class`、`student_number` 寫入 localStorage。
- 使用錯誤 root path `/student/dashboard/index.html`，不兼容 GitHub Pages `/ai-learning/` project base。

`gas/Code.gs` 目前：

- 從 Google Sheet 讀取及比較學生密碼。
- 密碼以可直接比較的字串處理，並非受管理身份服務。
- token 是把班別、學號、timestamp 組合後 Base64 編碼，可預測，並非安全隨機 session。
- token 沒有過期、撤銷或 rotation 機制。
- 雖有 `verifyToken()`，但目前 Dashboard 沒有向後端驗證 token。
- 同一檔案提供修改學生密碼功能。

使用者已確認沒有為學生建立這套帳號／密碼。因此這個介面既不可作正式身份來源，也會令學生誤以為已有可用校內帳戶。

### 3.2 Dashboard 會把 localStorage 當成已登入

`student/dashboard/index.html` 目前：

- 只檢查 localStorage 是否有 `student_token`。
- 沒有驗證 token 是否有效。
- 顯示 localStorage 內的姓名、班別及學號。
- XP、題數、答對數、連續登入、章節完成及徽章均是硬編碼 mock data。
- `logout()` 使用 `localStorage.clear()`，會誤刪其他工具的本機資料。
- 多個導航使用 `/login`、`/S1ChX.html` 等錯誤 root path。

### 3.3 修改密碼頁是假功能

`student/change-password.html` 目前：

- 顯示網站自訂舊密碼／新密碼表單。
- endpoint 仍是 `YOUR_DEPLOY_ID` placeholder。
- 依賴舊 student localStorage keys。
- 會令學生誤以為網站提供正式密碼管理。

Google provider 不需要網站自訂修改密碼功能，因此這個表單必須退役。

### 3.4 首頁老師入口是前端視覺分類

`index.html` 目前：

- 含硬編碼前端老師密碼。
- 只在 browser 記憶體設定 `teacherLoggedIn`。
- 通過後顯示老師工具連結。
- 這不是後端授權，不能保護 Google Sheets、GitHub API、學生資料或任何寫入。

本 PR 可把老師顯示分類接到 Google 帳戶 email allowlist，但仍只屬 UI 分類，不可聲稱是安全權限。

### 3.5 Firebase 尚未落地

排除 planning/reference 文件後，目前 repository 未見：

- Firebase Web SDK 接入。
- Firebase web config。
- `onAuthStateChanged`。
- `GoogleAuthProvider`。
- `signInWithPopup`。
- Firebase `signOut()`。

因此本次是由舊 GAS 假登入直接遷移到 Firebase Google Auth，不是延續一個已存在的 Firebase shell。

## 4. 已確認產品決定

### 4.1 訪客優先

- 未登入是正常、完整支援的使用狀態。
- 未登入仍可直接使用首頁、教材、自學、遊戲、考試及 HKDSE 練習等主要工具。
- 登入只是身份、將來進度與額外功能的增強，不是主要內容門檻。
- Firebase 載入失敗、網絡中斷或 popup 取消時，工具仍須可用。

### 4.2 Google 是唯一登入 provider

MVP 只提供：

- 訪客。
- Firebase Authentication Google provider 登入。

不提供：

- 班別／學號／密碼。
- Firebase Email/password。
- Anonymous Auth。
- 自製帳號。
- 自製 session token。

### 4.3 右上角輕量登入，不設 custom modal

每個已接入的主要頁面只加入右上角輕量 auth widget：

- 未登入：一個小型「登入」按鈕。
- 按下後：直接呼叫 Firebase Google popup。
- 已登入：顯示短名稱或安全 fallback，再提供獨立登出按鈕。
- 不建立 form、class picker、說明卡、dropdown 或 custom login modal。
- 錯誤只用不阻擋操作的短暫 bottom toast 顯示。
- 小於 390px 時可縮成 icon／截短名稱。
- widget 不得遮擋漢堡選單、標題、遊戲 HUD、計時器或主要操作。
- 需要時允許個別頁面設定安全 offset 或 opt-out。

### 4.4 登入狀態

- `onAuthStateChanged` 是唯一身份真相。
- Firebase 首次 callback 前顯示 loading，不可先顯示錯誤 guest／student 狀態。
- 使用 Firebase LOCAL persistence。
- 登入後刷新、跨頁及重新開 browser 應維持狀態。
- 登入／登出後留在目前頁面，不清除工具答案、計時器、scroll 或本機進度。
- 不把 Firebase ID token、refresh token 或整個 user object 另存到自訂 localStorage。

### 4.5 老師角色

- 完整老師 email allowlist 可作前端 UI 分類。
- allowlist 空白時，所有 Google 帳戶預設為 student。
- 不使用 display name 判斷老師。
- email 比較要 trim、轉小寫。
- teacher role 只控制標籤或入口可見性。
- 前端 allowlist 可被繞過，絕不可用作保護資料或管理寫入。

## 5. 過渡策略決定

### 5.1 決定：一次過移除學生 legacy 登入

不保留可操作的 legacy fallback。

理由：

1. 使用者沒有為學生建立這類帳號，fallback 沒有真實使用價值。
2. 保留班別／學號／密碼會繼續誤導學生。
3. 同時維護 GAS token 與 Firebase user 會產生兩個身份真相。
4. 舊 token 不安全、不過期，而且前端沒有 verify。
5. Git history 已保留舊實作，不需要在 production 留 dead code。

### 5.2 保留的只有 URL 兼容

`login/index.html` 可保留作舊 bookmark 兼容頁，但必須：

- 移除班別、學號、密碼及忘記密碼文案。
- 不再呼叫 GAS login endpoint。
- 不再寫入 legacy auth keys。
- 安全返回 `/ai-learning/` 首頁或經驗證的同 project `returnTo`。
- 不建立第二套 Google 登入 UI。
- 不自動在無 user gesture 的情況強開 popup。

### 5.3 Legacy localStorage 處理

Firebase auth helper 初始化時可逐一移除：

- `student_token`
- `student_name`
- `student_class`
- `student_number`

要求：

- 只使用 `removeItem()` 處理上述 keys。
- 禁止 `localStorage.clear()`。
- 不把舊 token、姓名、班別或學號遷移成 Firebase profile。
- 舊 keys 即使仍存在，也不可令 UI 顯示已登入。

### 5.4 GAS 退役

實作 PR 應：

- 移除所有前端 GAS login／change-password 呼叫。
- 確認 `gas/Code.gs` 目前只服務學生 legacy auth 後，刪除該 legacy auth source，或以清楚的 retired 說明取代，避免 repository 繼續把它當正式方案。
- 不修改其他不相關 Google Apps Script。

Repository 改動不能自動關閉已部署的 Apps Script Web App。PR 合併後，project owner 應在確認無其他 caller 後停用或撤銷舊學生登入 deployment。

## 6. Firebase Console 前置

實作 AI 不應自行建立另一個 Firebase project。使用 project：

```text
math-rpg-1eebc
```

開工前由使用者／project owner 核對：

- [ ] Authentication > Sign-in method > Google 已啟用。
- [ ] Authentication > Settings > Authorized domains 已包含 `ai-lish.github.io`。
- [ ] 本地真人 popup 測試需要時，Authorized domains 已包含 `localhost`。
- [ ] OAuth consent／support email 已完成基本設定。
- [ ] `ai-learning` 使用的 Firebase web config 與 Math RPG 現時實際 config 一致。
- [ ] config 對應正確 Firebase Web App、project ID `math-rpg-1eebc`。
- [ ] 沒有把 service account、Admin SDK credential、private key、OAuth client secret 或 refresh token交給前端。

Firebase web config 中的 `apiKey`、`authDomain`、`projectId`、`appId` 等是公開 client configuration，不當作真正 secret；但實作 AI 必須由 Math RPG 的可信現行設定取得，不可猜測或留下 `PLACEHOLDER` 後聲稱完成。

如上述設定尚未完成：

- PR 可保留 guest-safe unavailable 狀態。
- 不可用假 config 或假成功完成驗收。
- 真人 Google popup／production persistence 必須標示未驗收。

## 7. 建議實作範圍

### 7.1 可新增

- `js/firebase-config.js`
- `js/firebase-init.js` 或等效集中初始化 helper
- `js/auth-state.js`
- `css/auth-widget.css`
- auth 專用測試檔案

檔名可按現有 repo pattern 微調，但 config、Firebase 初始化、狀態管理及 UI rendering 必須分層，且不能把相同 config 複製到多個 HTML。

### 7.2 可修改

- `index.html`
- `login/index.html`
- `student/dashboard/index.html`
- `student/change-password.html`
- `gas/Code.gs`
- 主要公開 HTML 頁面的共用 auth CSS／JS 引用
- 只與本功能直接相關的測試或文件

### 7.3 不應修改

- 題庫、答案、評分、考試內容、OCR 原始資料。
- 遊戲核心、計時器、答題流程。
- Math RPG repo 或其資料庫。
- Dashboard 大型產品重寫。
- 與登入無關的首頁重構。
- 老師工具內部寫入流程。
- Firestore、Realtime Database、Storage、Cloud Functions 或資料 schema。

## 8. 具體實作任務

### 8.1 集中 Firebase 初始化

- 使用 Firebase 官方 Web SDK。
- 選擇與 Math RPG 相容且適合無 bundler Vanilla HTML 的 SDK 方式。
- 固定並記錄 SDK 版本。
- 集中保存公開 web config。
- 初始化必須 idempotent，避免同頁重複 default app。
- 設定 LOCAL persistence；如設定失敗，捕捉錯誤並安全降級，不能產生 unhandled rejection。
- SDK、config 或初始化失敗時狀態為 `unavailable`，但頁面核心功能仍載入。

### 8.2 建立共用 `AuthState`

至少提供等效 API：

```js
AuthState.get()
AuthState.onChange(handler)
AuthState.whenReady()
AuthState.signInWithGoogle()
AuthState.logout()
AuthState.renderWidget()
AuthState.isWidgetSuppressed()
AuthState.PROJECT_BASE
```

建議 state shape：

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

- `onAuthStateChanged` 是 user state 唯一來源。
- 公開 user shape 只含 UI 所需欄位。
- state snapshot 不可被 caller 任意改寫。
- listener 失敗要隔離，不可阻止其他 listener。
- `onChange()` 返回 unsubscribe。
- `whenReady()` 在首次 non-loading 狀態後穩定 resolve。
- 所有 user text 使用 `textContent` 或安全 DOM API。

### 8.3 Google popup

- `signInWithGoogle()` 使用官方 `GoogleAuthProvider` 與 `signInWithPopup()`。
- 不顯示 custom modal。
- 建立 helper-level in-flight promise guard。
- 重複 call 必須返回同一個進行中的 promise，避免彈出兩個 popup。
- promise 在 resolve、reject 或同步 throw 後均於 `finally` 清空。
- UI event handler 必須顯式 catch；公開 API 可 reject，但不能造成 page-level unhandled rejection。
- 不把 raw Firebase error、token 或敏感內容顯示給使用者。

至少處理：

| Firebase error | 顯示文案 | 類型／時長 |
| --- | --- | --- |
| `auth/popup-closed-by-user` | 已取消登入 | status，約 2 秒 |
| `auth/cancelled-popup-request` | 已取消登入 | status，約 2 秒 |
| `auth/popup-blocked` | 瀏覽器已阻擋登入視窗 | error，4 至 5 秒 |
| `auth/network-request-failed` | 網絡連線失敗，請稍後再試 | error，4 至 5 秒 |
| `auth/unauthorized-domain` | 此網站暫未獲授權登入 | error，4 至 5 秒 |
| `auth/operation-not-allowed` | 登入服務尚未完成設定 | error，4 至 5 秒 |
| config／auth unavailable | 登入服務尚未完成設定 | error，4 至 5 秒 |
| persistence failure | 無法保存登入狀態，將繼續嘗試登入 | warning，4 至 5 秒 |
| unknown | 登入失敗，請稍後再試 | error，4 至 5 秒 |

Toast：

- fixed bottom，不放右上角。
- 單一 DOM node 復用。
- `role="status"`、`aria-live="polite"`。
- 新 toast 出現前清除舊 timer。
- 不擋住工具操作。

### 8.4 右上角 widget

- 未登入只顯示一個緊湊「登入」按鈕。
- loading 時避免誤導性閃動。
- 已登入顯示短名稱或 avatar fallback，加獨立登出按鈕。
- 不顯示完整 email 於固定列。
- 不建立 dropdown、modal、class picker 或說明卡。
- 登出使用 Firebase `signOut()`。
- 登出後留在目前頁面。
- 允許 `data-no-auth-widget` 或等效 page opt-out。
- 允許個別頁面提供 top/right offset，避免與現有控制重疊。
- 390px 以下縮短名稱；320px 不得水平 overflow。
- widget 尺寸穩定，不引起原頁 layout shift。

### 8.5 退役獨立學生登入與修改密碼

`login/index.html`：

- 移除班別、學號、密碼 form。
- 移除 GAS endpoint 與 login fetch。
- 移除 legacy localStorage writes。
- 只保留安全兼容轉址。
- `returnTo` 只接受同 origin、`/ai-learning/` 內安全路徑。

`student/change-password.html`：

- 移除舊密碼／新密碼 form。
- 移除 placeholder endpoint 及 fetch。
- 清楚說明網站使用 Google 帳戶登入，網站不管理 Google 密碼。
- 提供正確 `/ai-learning/` 返回首頁／Dashboard 路徑。
- 不接 Firebase Email/password API。

### 8.6 修正 Dashboard

- 不再用 legacy localStorage token 判斷登入。
- guest 可進入頁面並看到簡短登入提示，不強制 redirect。
- 已登入使用 Firebase display name／email／photo。
- 移除或明確改成「未有同步紀錄」的 mock XP、題數、連續登入、章節完成及徽章。
- 不得把硬編碼數字呈現成真實學生紀錄。
- 不建立資料庫讀寫。
- 登出只呼叫 Firebase `signOut()`，不得 `localStorage.clear()`。
- 修正本次觸及的 `/login`、`/student/...`、`/S1ChX.html` root path。

### 8.7 首頁老師 UI

- 移除 repo 內硬編碼老師密碼及前端 password comparison。
- teacher allowlist email 可顯示老師工具入口。
- guest／student 可按產品需要隱藏或低調顯示入口，但文案不可宣稱真正受保護。
- 不把 Firebase teacher UI role 接到任何未經後端驗證的敏感寫入授權。
- 不在本 PR 重寫老師工具。

### 8.8 接入主要頁面

實作 AI 應先列出由首頁可到達的主要公開頁面，再機械式加入一致 SDK／helper 引用。

要求：

- 正確處理 root、第一層及第二層子目錄相對路徑。
- 所有路徑兼容 `/ai-learning/`。
- 不因 auth script 失敗阻止頁面原本 script。
- 對控制密集頁面檢查 widget overlap；必要時使用 offset 或 opt-out。
- PR 必須列出實際接入頁數及未接入頁面，不可籠統聲稱「全站」。

## 9. 明確不在本 PR

- 不加入 Firestore。
- 不加入 Realtime Database。
- 不加入 Firebase Storage。
- 不加入 Cloud Functions。
- 不加入 Admin SDK。
- 不加入 service account、private key、OAuth client secret、refresh token 或真正 secret。
- 不建立學生 profile、班別、學號配對。
- 不建立成績、答題、進度、錯題、收藏或跨裝置同步。
- 不把 Math RPG 資料讀入 Dashboard。
- 不建立 Custom Claims。
- 不把前端 teacher role 當真正授權。
- 不重寫所有工具或 Dashboard。
- 不用 `no-cors` 假定登入或寫入成功。

## 10. 身份與學生紀錄安全閘門

在 Firebase Google 身份於 production 完成真人驗證前：

- 不可加入任何真實學生紀錄寫入。
- 不可加入成績、答題內容、班別、學號或姓名表寫入。
- 不可把 localStorage 舊資料自動上載到 Firebase。
- 不可顯示「已同步」或「已儲存到雲端」。

即使 Firebase Auth 已完成，日後加入學生紀錄仍須另開 planning，至少處理：

- 最小資料 schema。
- Firestore／Realtime Database rules。
- `request.auth.uid` ownership。
- 老師查看學生資料的可信授權。
- 資料保留、刪除及私隱。
- 離線與衝突處理。

前端 email allowlist、`hd`、display name 或隱藏 UI 均不足以授權學生資料讀寫。

## 11. 測試矩陣

### 11.1 Viewport

- Desktop：1280 x 720
- Mobile：390 x 844
- Narrow mobile：320 x 568

### 11.2 Guest

- 未登入開首頁，主要工具可用。
- 未登入直接開教材、自學、遊戲、考試及 HKDSE 頁面，不 redirect。
- Firebase SDK 被阻擋／config 錯誤／離線時，工具仍可用。
- 舊 `student_token` 等 keys 存在時仍顯示 guest，並只清理指定 legacy keys。

### 11.3 Google popup

- 成功登入。
- `popup-closed-by-user`。
- `cancelled-popup-request`。
- popup blocked。
- network failure。
- unauthorized domain。
- operation not allowed／invalid config。
- unknown error。
- persistence 設定失敗後 popup 仍可繼續。
- 重複快速點擊只建立一個 popup promise。
- 每條失敗路徑均為 0 unhandled rejection、0 page error。

### 11.4 Persistence

- 登入後刷新。
- 登入後開另一個已接入頁面。
- 同 origin 新 tab 顯示相同狀態。
- 關閉及重開 browser 後保持登入。
- tab A 登出，tab B 更新。
- 登出後刷新顯示 guest。
- 登入／登出不清除工具 localStorage。

### 11.5 Legacy retirement

- `login/index.html` 不再出現班別、學號、密碼。
- 舊 login URL 可安全回到 `/ai-learning/`。
- `student/change-password.html` 不再顯示修改網站密碼 form。
- 前端不再呼叫 legacy GAS auth endpoint。
- Dashboard 不再信任 legacy token。
- repository 不再把 GAS student auth source 當正式登入實作。

### 11.6 Dashboard

- guest 顯示登入提示，不 redirect。
- Google user 顯示正確名稱／fallback。
- 沒有假 XP、假成績或假同步聲明。
- 登出後 UI 即時更新。

### 11.7 Layout

- Widget 不遮擋首頁標題或漢堡選單。
- 至少抽查一個教材頁、一個遊戲頁、一個考試頁及一個控制密集工具頁。
- 320px 沒有水平 overflow。
- 長 display name ellipsis。
- toast 不擋主要操作。
- widget／avatar 圖片失敗有 fallback。

### 11.8 GitHub Pages 與 Math RPG

- Production path：`https://ai-lish.github.io/ai-learning/`
- `ai-learning` 使用 `math-rpg-1eebc` 正確 project/config。
- 在 `ai-learning` 與 Math RPG 登入同一 Google 帳戶，核對 Firebase UID。
- 如兩個 app 因 origin／persistence 實際不能共享 browser session，PR 必須如實記錄，不可只因共用 project 就聲稱已共享。

### 11.9 掃描

```bash
rg -n 'student_token|student_name|student_class|student_number|GWS_ENDPOINT|changePassword|action.*login' \
  --glob '*.html' --glob '*.js' --glob '*.gs'

rg -n 'localStorage\.clear|serviceAccount|private_key|client_secret|refresh_token|firebase-admin' \
  --glob '*.html' --glob '*.js' --glob '*.json' --glob '*.gs'

rg -n 'TEACHER_PASSWORD|teacherLoggedIn|GoogleAuthProvider|onAuthStateChanged|signInWithPopup|signOut' \
  --glob '*.html' --glob '*.js'

rg 'href="/|src="/|location\.href\s*=\s*["'"'"']/' \
  --glob '*.html' --glob '*.js'
```

PR 要區分既有命中與本 PR 新增命中，不得未核實便聲稱全 repo 零風險。

## 12. 完成定義

- [ ] PR 引用本 planning file。
- [ ] V2 沒有被當成唯一實作規格。
- [ ] 使用 Firebase project `math-rpg-1eebc`。
- [ ] Google provider、Authorized domains 及 web config 已核對。
- [ ] 使用官方 Firebase Web SDK及固定版本。
- [ ] config 集中管理，與 Math RPG 現行 config 一致。
- [ ] 沒有加入真正 secret、Admin SDK 或 service account。
- [ ] `onAuthStateChanged` 是唯一登入狀態來源。
- [ ] 未登入仍可使用主要工具。
- [ ] 右上角只有輕量登入／帳戶／登出 UI，沒有 custom modal。
- [ ] Google popup 成功、取消、blocked、network 及 config failure 已處理。
- [ ] 所有 popup failure path 0 unhandled rejection、0 page error。
- [ ] 登入成功後留在原頁且不重置工具。
- [ ] Firebase LOCAL persistence 已驗證。
- [ ] 登出使用 Firebase `signOut()`。
- [ ] 不使用 `localStorage.clear()`。
- [ ] 舊 auth keys 不再產生假登入。
- [ ] 班別／學號／密碼登入 form 已移除。
- [ ] `student/change-password.html` 假功能已退役。
- [ ] Legacy GAS auth 不再被前端呼叫。
- [ ] Dashboard 不再顯示誤導性的假登入或假學生紀錄。
- [ ] 首頁硬編碼老師密碼已移除。
- [ ] Teacher email role 只標示為 UI 分類。
- [ ] 沒有加入 Firestore、Realtime Database、Storage 或任何學生紀錄寫入。
- [ ] `/ai-learning/` 路徑正確。
- [ ] 1280 x 720、390 x 844、320 x 568 通過。
- [ ] 主要頁面沒有 widget overlap、404、水平 overflow 或新增 console error。
- [ ] Production Google popup 及 persistence 已真人測試；未測項目如實列出。
- [ ] `ai-learning`／Math RPG 共用身份行為已實測及如實記錄。
- [ ] PR 未自行 merge，已交回 Codex Ready Review。

## 13. 實作 AI 交接要求

實作 AI 必須先讀：

1. `PROJECT.md`
2. `CODEX.md`
3. `PLANNING/README.md`
4. 本文件

PR 描述必須列：

- Planning file：`PLANNING/20260611_GLOBAL_LOGIN_FIREBASE_GOOGLE_V3.md`
- Base commit
- Firebase SDK 版本及選擇 compat／modular 的理由
- Firebase Console 已確認及仍待確認項目
- Firebase project ID `math-rpg-1eebc`
- 修改及刪除檔案清單
- 接入 auth widget 的實際頁面清單／數量
- Legacy GAS、舊 login form、change-password 及 localStorage keys 的退役方式
- Dashboard mock data 處理方式
- Teacher UI role 的非安全邊界
- 自動測試及真人測試結果
- Desktop／mobile viewport 結果
- 0 unhandled rejection／0 page error 證據
- GitHub Pages `/ai-learning/` 路徑掃描結果
- `ai-learning` 與 Math RPG 共用 UID／session 的實測結果
- 未完成項目及剩餘風險

實作 AI 不得自行 merge。完成後開 Draft PR，測試完成才轉 Ready，交回 Codex 按本文件 review。
