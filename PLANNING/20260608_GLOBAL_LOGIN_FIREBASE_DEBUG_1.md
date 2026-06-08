# 20260608_GLOBAL_LOGIN_FIREBASE_DEBUG_1

## 1. 原始工作

- 原始 planning file：`PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md`
- 原始 PR：<https://github.com/ai-lish/ai-learning/pull/23>
- Merge commit：`dc162def6b9d4a21930363485d5fe9d49e94577c`
- GitHub Pages deploy：<https://github.com/ai-lish/ai-learning/actions/runs/27125995974>
- 正式網站：<https://ai-lish.github.io/ai-learning/>

PR #23 已完成第一階段登入狀態殼，包括首頁 auth bar、共用 `AuthState`、Dashboard guest 提示、returnTo 修正，以及 change-password 降級狀態。

出街後使用者確認真正需要的是：

- 不需要獨立登入頁作主要流程。
- 使用者應可在任何主要頁面右上角隨時登入。
- 登入應在頁內完成，不離開目前工具或教材。
- 登入後進入其他頁面或開同站其他 browser tab，仍保持登入狀態並顯示一致身份 UI。

## 2. 出街後問題

### 預期行為

- 每個主要公開頁面右上角都有一致登入狀態按鈕。
- 未登入時按右上角「登入」，在目前頁面開啟 modal / popover。
- 登入成功後 modal 關閉，使用者留在原本頁面。
- 已登入時右上角顯示簡短身份狀態，可開 Dashboard 或登出。
- 在同一 GitHub Pages origin 下切換頁面或開其他 browser tab，狀態保持一致。
- 未登入時所有主要學生工具仍可直接使用。

### 實際出街行為

- 首頁有 auth bar，但不是右上角全站一致控制。
- `login/index.html` 仍是主要獨立登入介面。
- 登入流程會導航離開原頁到獨立登入頁，再依 returnTo 返回。
- 大部分獨立教材、遊戲、自學及考試頁沒有載入 auth widget，因此看不到登入狀態或登入入口。
- `AuthState` 使用同源 localStorage，資料本身可跨頁保留，但 UI 沒有在全站主要頁面接入。
- 已開啟的其他 browser tab 未必會即時更新 UI，因現有 helper 沒有統一處理 `storage` event。

### 由首頁重現路徑

1. 開啟 <https://ai-lish.github.io/ai-learning/>。
2. 首頁 auth bar 顯示「登入我的學習紀錄」。
3. 按登入後進入獨立 `login/index.html`。
4. 返回首頁或進入年級教材、自學、遊戲、考試工具。
5. 多數頁面右上角沒有一致登入按鈕或已登入狀態。

可直接重現的受影響入口：

- `/ai-learning/`
- `/ai-learning/S1Ch1.html`
- `/ai-learning/s1/selfstudy/index.html`
- `/ai-learning/s3/selfstudy/index.html`
- `/ai-learning/games-index.html`
- `/ai-learning/exam/index.html`
- `/ai-learning/hkdse/dse-practice-p1.html`
- `/ai-learning/hkdse/dse-practice-p2.html`
- `/ai-learning/student/dashboard/index.html`

## 3. 初步原因分析

### 相關檔案

- `js/auth-state.js`
- `index.html`
- `login/index.html`
- `student/dashboard/index.html`
- `student/change-password.html`
- 所有由首頁可到達的主要公開 HTML 入口

### 原因

- PR #23 只把 auth UI 實作在首頁、login、Dashboard、change-password。
- `AuthState` 只提供資料 helper，沒有自動建立右上角 UI。
- repo 是大量獨立 HTML 靜態頁，沒有 server-side template；未載入共用 script 的頁面不會自動取得 auth widget。
- 登入 form 仍寫在 `login/index.html`，不是可重用 modal。
- 沒有共用 `storage` event listener 或 auth custom event，其他已開 browser tab 不會即時重繪身份 UI。

### 安全、私隱及路徑風險

- 今次仍是 legacy GAS login，不可稱為 Firebase 安全身份。
- 密碼只可在登入 request 當下使用，不可寫入 localStorage、sessionStorage、URL、console 或 error log。
- 顯示學生姓名／班別時必須使用 `textContent` 或安全 DOM API，不可把 localStorage 字串直接插入 `innerHTML`。
- 所有共用 script / CSS 路徑必須兼容 `/ai-learning/`。
- 老師工具仍不可因右上角顯示某角色而視為真正受保護。

## 4. 修正產品規則

- 未登入學生仍可直接使用所有主要教材、自學、遊戲及考試練習。
- 登入入口放在主要頁面右上角，固定位置與行為一致。
- 按登入後在頁內開 modal / dialog，不導航離開目前頁面。
- 登入成功後留在原頁，立即把右上角 UI 更新為已登入狀態。
- 已登入 UI 顯示簡短學生名稱或身份，不顯示不必要個人資料。
- 已登入 menu 可提供「我的學習紀錄 / Dashboard」及「登出」。
- 登出後留在目前頁面，立即改回 guest UI，不清除本機練習進度。
- 同一 origin 的其他 browser tab 要透過 `storage` event 即時更新身份 UI。
- 新開同站頁面要從 localStorage 讀取現有狀態並立即顯示已登入。
- Auth helper、widget 或 GAS endpoint 載入失敗時，頁面仍可作 guest 正常使用。

## 5. 修正範圍

### 實作 AI 可以修改

- `js/auth-state.js`
- 新增 `js/auth-widget.js`，或在 `js/auth-state.js` 內加入清楚分離的 widget API
- 新增共用 auth widget CSS，例如 `css/auth-widget.css`
- `index.html`
- `login/index.html`
- `student/dashboard/index.html`
- `student/change-password.html`
- 由首頁可到達的主要公開 HTML 入口，用於加入共用 auth widget script / stylesheet

第一批必須接入：

- `index.html`
- `games-index.html`
- `s1/selfstudy/index.html`
- `s3/selfstudy/index.html`
- `exam/index.html`
- `hkdse/dse-practice-p1.html`
- `hkdse/dse-practice-p2.html`
- `student/dashboard/index.html`
- 目前首頁直接列出的年級課題頁：`S1Ch*.html`、`S2Ch10.html`、`S3Ch*.html`、`S4Ch3.html`、`S5Tutorial.html`、`S5Ch14.html`、`S5Ch17.html`、`S5Ch18.html`

實作 AI 應從 `index.html` 的真實入口清單產生接入 manifest，列出所有本 PR 加入 widget 的頁面。不可只憑檔名 wildcard 假設所有頁面仍在使用。

### 實作 AI 不應修改

- 題庫、答案、OCR JSON、DSE evidence、試卷圖片或 PDF
- 遊戲核心計分、數學出題、隨機生成及答案邏輯
- Firestore、Firebase Admin SDK、service account 或資料庫 rules
- 老師工具真正權限系統
- 現有 GAS backend，除非另有 planning
- 與登入 widget 無關的大型導航或視覺重寫

## 6. 修正任務

### 6.1 建立全站右上角 auth widget

新增共用 widget，載入後自動：

- 在頁面右上角建立穩定容器。
- 未登入顯示「登入」按鈕。
- 已登入顯示簡短身份按鈕。
- 點已登入按鈕可開小型 menu，提供 Dashboard 和登出。
- 不要求每個頁面自行寫重複 render 邏輯。
- 若頁面已有 header，可用固定 top-right 或不破壞原 layout 的 absolute/fixed anchor。
- 不遮擋漢堡選單、題目控制、計時器、遊戲 HUD 或手機 safe area。

### 6.2 把登入 form 改成頁內 modal / dialog

共用 widget 內提供登入 modal：

- 班別、學號、密碼欄位沿用現有 GAS login request。
- 使用 `<dialog>` 或可存取的 modal pattern。
- 可用右上角關閉、Cancel、Escape 關閉。
- 開啟時聚焦第一個欄位，關閉後把焦點還給登入按鈕。
- 登入中禁用 submit，失敗時在 modal 內顯示可理解錯誤。
- 成功後寫入現有 auth keys、關閉 modal、留在目前頁面並更新 widget。
- 不再依賴 returnTo 作主要登入流程。

### 6.3 保留 `login/index.html` 作兼容入口

舊連結不可直接 404，但不再提供獨立登入 UI：

- `login/index.html` 應轉到首頁或原 `returnTo` 頁，並帶 `auth=open` 之類參數要求目標頁自動開啟登入 modal。
- 只允許 `/ai-learning/` 內安全 return path。
- 若 JS 失敗，顯示簡短 fallback：返回首頁並從右上角登入。
- 不保留第二套重複 login form。

### 6.4 全站狀態同步

擴充 `AuthState`：

- 提供 `loginSuccess(profile)` 或等效集中寫入方法。
- 提供 `subscribe(callback)` / `notify()` 或 custom event。
- 監聽 `window.storage`，讓其他 browser tab 在 auth keys 改變時重繪。
- 目前 tab 登入／登出後直接發 custom event，無需 reload。
- 新頁載入時立即以 localStorage render。
- 登出只移除 auth keys，不可使用 `localStorage.clear()`。

### 6.5 接入主要頁面

- 按入口 manifest 為主要公開頁面加入共用 CSS / JS。
- 每頁只加入必要引用，不改核心教材或工具 DOM。
- `index.html` 現有大型 auth bar 可移除或縮減，避免同時有 auth bar 和右上角 widget。
- Dashboard 保留 guest 提示，但右上角 widget 仍要存在。
- 工具頁登入成功後不得重置題目、遊戲、答案、計時器或頁面 scroll position。

### 6.6 文案

未登入：

- `登入`

已登入：

- 顯示名字或「學生」。
- menu：`我的學習紀錄`、`登出`

身份提示：

- 可在 menu 內小字顯示「本機登入狀態，尚未接 Firebase」。
- 不要在每頁使用大段功能說明。

## 7. 驗收條件

- [ ] 首頁右上角有登入按鈕，沒有重複大型 auth bar。
- [ ] 在 `S1Ch1.html`、中一自學、遊戲、考試、DSE 練習頁右上角都可見同一 auth widget。
- [ ] 按登入後在目前頁開 modal，不跳到獨立 login page。
- [ ] 登入成功後留在原頁，scroll position、題目狀態、遊戲狀態不被重置。
- [ ] 登入後導航到其他已接入頁面，右上角立即顯示已登入。
- [ ] 登入後開同站另一 browser tab，新 tab 顯示已登入。
- [ ] 登入／登出時，已開啟的同站其他 tab 透過 `storage` event 更新。
- [ ] 登出後留在目前頁，UI 即時變回「登入」。
- [ ] 登出不清除 `practice_progress`、`chapter_quiz_progress` 或其他工具本機資料。
- [ ] `login/index.html` 不再保留第二套主要登入 form，只作安全兼容轉址／fallback。
- [ ] 未登入仍可完整使用主要學生工具。
- [ ] Widget/helper 載入失敗時，主要工具仍可用。
- [ ] 不新增 Firebase、Firestore、Admin SDK、service account、private key 或公開 secret。
- [ ] 不新增 `no-cors` 假成功流程。
- [ ] 所有路徑兼容 `/ai-learning/`。

## 8. 測試矩陣

### 頁面

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

### 狀態流程

- 未登入直接開每個頁面。
- 在首頁右上角開／關 login modal。
- 在工具進行中開 login modal，再取消，工具狀態不變。
- 在工具進行中成功登入，留在同頁且狀態不變。
- 已登入後逐一進入其他頁面。
- 已登入後開新 browser tab。
- 兩個同站 tab 同時開啟，在 tab A 登入，tab B 即時更新。
- 在 tab A 登出，tab B 即時更新。
- 登出後刷新頁面。
- GAS login 失敗。
- GAS endpoint 或 network 失敗。
- auth widget JS 載入失敗時 guest fallback。
- 舊 `/login/index.html?returnTo=games-index.html` 兼容流程。

### Viewport

- Desktop：1280 x 720
- Mobile：390 x 844
- Mobile：320 x 568

每個 viewport 必須檢查：

- 右上角 widget 不遮擋現有控制。
- modal 不超出畫面。
- 鍵盤彈出後欄位和 submit 仍可操作。
- 長學生名稱不令 widget 爆位；必要時截短並保留完整 accessible label。
- 無水平 overflow。

### 技術掃描

```bash
rg -n 'localStorage\.clear|no-cors|firebaseConfig|serviceAccount|private_key|initializeApp|getAuth' --glob '*.html' --glob '*.js'
rg 'href="/|src="/|location\.href\s*=\s*["'"'']/' --glob '*.html' --glob '*.js'
```

PR 必須解釋既有命中與本 PR 新增命中；不可聲稱全 repo 0 hits，除非命令真的為 0。

## 9. 完成定義

- [ ] Debug PR 引用 `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_DEBUG_1.md`。
- [ ] PR 描述引用原始 PR #23 和 merge commit `dc162def6b9d4a21930363485d5fe9d49e94577c`。
- [ ] 主要公開頁面有一致右上角 auth widget。
- [ ] 登入以頁內 modal 完成，不離開原頁。
- [ ] 跨頁與跨 browser tab 登入狀態一致。
- [ ] 未登入工具仍完整可用。
- [ ] Dashboard、首頁、工具頁不再出現互相矛盾的身份 UI。
- [ ] 舊 login URL 有兼容處理。
- [ ] 桌面及兩個手機 viewport 通過。
- [ ] 無新增 console error、404、錯誤 root path 或公開 secret。
- [ ] OpenClaw check/test/merge 後，Codex 再驗證正式 GitHub Pages。

## 10. PR 指示

實作 AI 的 PR 描述必須包含：

- Debug planning file：`PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_DEBUG_1.md`
- 原始 planning file：`PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md`
- 原始 PR：#23
- 原始 merge commit：`dc162def6b9d4a21930363485d5fe9d49e94577c`
- 接入 auth widget 的完整頁面 manifest
- 登入 modal 實作方式
- 跨 tab `storage` event 測試結果
- 未登入／登入／登出流程測試
- Desktop 1280 x 720、mobile 390 x 844、mobile 320 x 568 測試
- 路徑與安全掃描結果
- 未完成項目與剩餘風險
