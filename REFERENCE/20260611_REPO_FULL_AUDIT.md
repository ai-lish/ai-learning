# 20260611 REPO FULL AUDIT — ai-lish/ai-learning

> 審核者：Claude Code（產品／UX oversight agent，audit mode，依 `CLAUDE.md` §9）
> 日期：2026-06-11
> 對應狀態：branch `claude/ai-learning-repo-audit-jde2j7`（起點 = `origin/main` commit `0997e4d`），working tree clean
> 正式網站：<https://ai-lish.github.io/ai-learning/>（GitHub Pages，base path `/ai-learning/`）
> 配套文件：`REFERENCE/REPO_MAP.md`（同日建立）

> **2026-06-11 使用者裁決（owner clarifications，已併入下文）：**
> 1. 功課上傳／修改／刪除**刻意開放**給同學自由共享（非官方頻道，不求絕對準確）；
>    限制只有登入同學可改屬「更好但非必要」。→ C1 由 Critical 改列為 **設計如此（可選增強）**。
> 2. 已部署但無入口的頁面，多為**測試重複或已棄置的誤上傳檔案**；視為清理候選，
>    非「缺入口」bug。
> 3. 已按要求**更新 `README.md`**（reflect 現況）。
> 4. **未為學生建立帳號／密碼**；預期只用**訪客或 Google 登入**。→ 舊版 GAS 班別／學號／
>    密碼登入實質**已過時**；H1 明文密碼疑慮在「無真實帳號」前提下大幅降低，重點改為
>    「退役 legacy 登入、推進 Google 登入」。

**本文件只作分析與紀錄，未修改任何功能、未重構、未開 PR。**
所有結論分為三類：**【已確認】**（程式碼／設定直接證實）、**【高可信推論】**、**【尚待確認】**（需在正式網站或後端實測）。

---

## 1. Executive Summary

`ai-learning` 是一個圍繞香港中學真實課堂逐件製作的數學教學網站，以大量獨立 HTML
靜態頁透過 GitHub Pages 部署。整體「訪客優先」方向落實得不錯：主要教材、自學練習、
遊戲、考試與 DSE 練習基本上免登入可用。最大問題不是個別半成品，而是 **安全邊界、
身份可信度、文件與程式碼脫節，以及全站協作一致性**。

最高優先（已併入 2026-06-11 owner 裁決重排）：

1. **【已確認】身份方向未落地**：使用者確認**未為學生建立帳號／密碼**，只用訪客或 Google
   登入；但現網站仍是**舊版 GAS 班別／學號／密碼**登入（`auth-state.js` + `gas/Code.gs`），
   既無用又對學生誤導。V2 Firebase Google 登入 planning **完全未實作**。→ 最高實作優先。
2. **【已確認】前端明文老師密碼非保安**：`lscmath`（`index.html:690`）、`s1math`
   （s1/s3 練習頁）。只作入口遮掩；應隨 Google 登入改 email 分類授權。
3. **【已確認，設計如此】開放式功課共享**：`API_TOKEN='homework-secret-2026'` + `no-cors`
   寫入。使用者確認**刻意開放**給同學自由共享，非安全漏洞；可選增強為「只限登入同學可改」
   並移除 no-cors 假成功。
4. **【已處理】文件脫節**：原 `README.md` 停留在 2024-04-20（已不符）。本次**已更新 README**。

整體可發布性：網站可用且有真實課堂價值。因「目前沒有受保護資料、無真實學生帳號」，
多數安全項目屬可控過渡期 trade-off，與 planning 自述一致。關鍵是**在加入任何真實學生
紀錄／成績寫入之前，先落地可信的 Google 登入身份**。

---

## 2. Project Purpose

**【已確認，依 `PROJECT.md`／`CLAUDE.md`】**

- 與香港中學課堂直接掛鈎的數學教學網站，老師（少康老師 / Zach Li）按真實課堂需要逐件
  製作教材、練習、遊戲、試卷、班務工具及教學輔助。
- 產品方向：**訪客優先、登入增強**。學生免登入可用主要學習工具；登入只加進度、紀錄、
  同步等增強功能。首頁是統一入口；Dashboard 是可選個人區。
- 多代理協作：Claude（產品／UX oversight）、Codex（planning steward / Ready Review）、
  Copilot / Gemini / OpenClaw（實作 / check-test-merge）。

---

## 3. User Groups

| 用家 | 說明 | 現況 |
|---|---|---|
| 未登入學生（guest） | 主要對象，免登入用教材／練習／遊戲／考試 | ✅ 大致可用 |
| 已登入學生（legacy-student） | localStorage + GAS token，換取 Dashboard（示範數據） | ⚠️ 身份不可信、無真實紀錄 |
| 老師 | 前端密碼後可見 OCR 審核、仿題、功課／通告編輯、成績（即將推出） | ⚠️ 只有前端遮掩 |
| 管理／作者 | 透過本機 python / GAS / GitHub PAT 處理 OCR、試卷、評分、資料 | — |

---

## 4. Repository Structure

**【已確認】** 約 2007 個 tracked 檔案。類型：jpg ~970、json ~332、png ~267、
html ~219、txt ~90、svg ~38、md ~37、py ~13、js ~12。大部分為圖像／OCR／題庫資料，
實際程式入口佔少數。詳細目錄地圖見 `REFERENCE/REPO_MAP.md`。

要點：

- 課題頁多數放 repo root（`S1Ch*` 等），自學練習在 `s1/` `s3/`，遊戲在 `games/`，
  考試在 `exam/`，DSE 在 `hkdse/`。
- 登入相關集中於 `js/auth-state.js`、`css/auth-widget.css`、`login/`、`student/`。
- 後端碼在 `gas/`（學生登入）與 `hkdse/gas-project/`（圖片代理），不部署。
- 共用程式極少：`js/` 只有一個檔案，大量頁面各自內聯處理樣式與邏輯。

---

## 5. Architecture

**【已確認】**

- 純前端靜態站，無 bundler、無框架；每頁多為單檔內聯 CSS/JS。
- 數學渲染：MathJax / KaTeX（依頁面而異）。部分遊戲用 Canvas、Tailwind CDN、GeoGebra iframe。
- 「後端」= Google Apps Script（學生登入、功課／通告、quiz 匯出）+ Google Sheets 作資料庫。
- 首頁用 `showSection()` 做分頁切換（非真實路由），其餘工具各自為獨立頁。
- 共用身份層：`auth-state.js` 自動 render 右上角 widget + 頁內 modal + 跨 tab storage 同步，
  但**只接入了部分頁面**（見 §12）。

---

## 6. Page and Tool Inventory

完成狀態用詞：課堂可用 / 可用但需改善 / 測試中 / 半完成 / 原型 / 舊版保留 / 無法確認 / 疑似失效。

| 工具 | 路徑 | 用家 | 由首頁入 | 需登入 | 儲存 | 完成狀態 | 主要風險 |
|---|---|---|---|---|---|---|---|
| 首頁 | `index.html` | 全部 | — | 否 | localStorage + GAS + CSV | 課堂可用 | 公開 API_TOKEN、no-cors 假成功、明文老師密碼 |
| 中一課題頁 | `S1Ch1–13.html` | 學生 | ✅ | 否 | 無／少 | 課堂可用 | 多數未接 auth widget |
| 中二課題 | `S2Ch10.html` | 學生 | ✅（標測試中） | 否 | — | 測試中 | 單章 |
| 中三課題頁 | `S3Ch2/4/7/8/9/11.html` | 學生 | ✅ | 否 | — | 課堂可用 | — |
| 中四直線 | `S4Ch3*.html`、`straight-line.html` | 學生 | ✅（部分） | 否 | — | 課堂可用 | `straight-line.html` 已部署但無入口 |
| 中五課題 | `S5Tutorial/Ch14/Ch17/Ch18.html` | 學生 | ✅ | 否 | — | 課堂可用 | S5Ch18 110KB，偏大 |
| 中一自學 | `s1/selfstudy/`（~35 html） | 學生 | ✅ | 否 | `practice_progress`/`chapter_quiz_progress` | 課堂可用 | 第三學期甲部含明文密碼+no-cors 匯出 |
| 中三自學 | `s3/selfstudy/`（~17 html） | 學生 | ✅ | 否 | 無（stateless） | 課堂可用 | 不存進度（設計如此） |
| 中三基礎練習 | `s3甲部基礎練習.html` | 學生 | ✅ | 否 | localStorage + GAS 匯出 | 課堂可用 | 明文 `s1math` + GAS endpoint + no-cors |
| 遊戲（48） | `games/`、`games-index.html` | 學生 | ✅ | 否 | 無 | 課堂可用 | `games-index.html` 只列 7，`games/index.html` 列全部；無 localStorage |
| 校內考試 | `exam/index.html`、`practice.html` | 學生 | ✅ | 否 | 本地 JSON fetch | 課堂可用 | 大量試卷圖／PDF 拖慢部署 |
| 校內 OCR 審核 | `exam/review-p1/p2.html` | 老師 | 老師區 | 前端密碼 | localStorage | 可用但需改善 | 老師區連 `review-p3.html`（**不存在**） |
| 仿題模板 | `exam/mimic/`、`hkdse/mimic-generator/` | 老師 | 老師區 | 前端密碼 | 本地 JSON | 半完成 | MiniMax API key 佔位；無真實授權 |
| DSE 練習 | `hkdse/dse-practice-p1/p2.html`、`guide.html` | 學生 | 考試專區 | 否 | localStorage | 課堂可用 | — |
| DSE OCR 審核 | `hkdse/review_p1/p2/p1_answers.html` | 老師 | 老師區 | 前端密碼 | localStorage + **GitHub API PUT** | 可用但需改善 | 需貼 repo-scoped GitHub PAT 入前端頁 |
| 學生 Dashboard | `student/dashboard/index.html` | 學生 | 我的學習紀錄 | 增強 | localStorage | 測試中（mock，有免責聲明） | 無真實資料 |
| 改密碼 | `student/change-password.html` | 學生 | Dashboard | 增強 | — | 半完成（endpoint 佔位，按鈕停用） | — |
| 登入殼 | `js/auth-state.js`、`login/index.html` | 全部 | 右上角 | — | localStorage + GAS | 可用但需改善 | legacy GAS，身份不可信 |
| 座位表 | `seat.html` | 老師 | 班務工具 | 否 | localStorage | 課堂可用 | — |
| SVG 工具庫 | `math-svg-tools.html` | 老師/學生 | 漢堡選單 | 否 | — | 可用但需改善 | — |
| PDF 分割 | `tools/slp-split-pdf.html` | 老師 | 班務工具 | 否 | 本地 | 課堂可用 | — |
| 數學小故事 | `stories.html` | 學生 | ✅ | 否 | — | 課堂可用 | — |
| 因式／餘式工作紙 | `worksheet-factor-remainder.html` | 學生 | ❌（已部署無入口） | 否 | — | 可用但需改善 | 無入口 |
| 資訊圖 | `infographics/`（index + 2） | 學生 | ❌ | 否 | — | 舊版保留 | **未部署**（workflow 無 copy）→ 若連結會 404 |
| Ch11 幾何卡 | `ch11-geometry-flashcard/` | 學生 | `S1Ch11.html` | 否 | — | 課堂可用 | 已部署、有入口 |
| Ch11 概率卡 | `ch11-probability-flashcard/` | 學生 | ❌ | 否 | — | 舊版保留 | 已部署但無入口（S3Ch11 用遊戲取代） |
| 三角仰角專題 | `projects/s3-ch8-trig-elevation/` | 學生 | ❌ | 否 | — | 無法確認入口 | 已部署 |
| 資訊圖編輯器 | `infographic-editor.html` | 老師 | ❌ | 否 | — | 半完成／疑似停用 | 無入口 |

---

## 7. Main User Flows

### 7.1 未登入學生 **【已確認】**
首頁 → 年級分頁／快速入口卡 → 課題頁／自學練習／遊戲／考試。流程順暢，免登入可用。
返回首頁路徑多數存在（`← 返回首頁`）。遊戲與多數課題頁為獨立頁，靠瀏覽器返回或內建連結。

### 7.2 已登入學生 **【已確認 + 尚待確認】**
右上角 widget「登入」→ 頁內 modal（班別／學號／密碼）→ POST GAS → 寫 localStorage →
留在原頁。跨頁／跨 tab 透過 storage event 同步 UI。**【尚待確認】** 正式網站上各獨立
課題／遊戲頁是否都載入了 widget（程式上多數未接入，見 §12）。Dashboard 顯示 mock 數據
並有「測試中／尚未同步」聲明。登出只清四個 auth key，不清進度（符合 planning）。

### 7.3 老師／管理 **【已確認】**
首頁「老師工具」卡或頁底「老師版」→ 輸入 `lscmath` → 顯示 OCR/仿題連結。
其中 `校內卷三 OCR 審核 → exam/review-p3.html` 指向**不存在**檔案（broken link）。
DSE OCR 審核頁需老師貼上 GitHub classic PAT（repo scope）才能 PUT `*_verified.json`。
功課／通告編輯透過 admin FAB → no-cors POST（帶公開 token）。

### 7.4 手機 **【尚待確認】**
CSS 有 mobile breakpoint，widget 設計考慮 320–390px。實際遮擋／overflow 需在正式網站
分 viewport 測試（本次未跑瀏覽器）。

---

## 8. Authentication and Firebase

### 8.1 現況 **【已確認】**
- 身份來源仍是 **legacy GAS**：`auth-state.js` 用 localStorage `student_token` 等判斷登入，
  modal POST 班別／學號／密碼到 `GWS_ENDPOINT`（GAS）。
- **全 repo 無任何 Firebase 程式**：grep `initializeApp|getAuth|firebaseConfig|GoogleAuthProvider|onAuthStateChanged|signInWithPopup` = **0 命中**。

### 8.2 後端身份模型（`gas/Code.gs`）**【已確認，重大】**
- 密碼**明文**存於 Google Sheet `學生資料` 並以 `stored !== String(password)` 比對 →
  違反 `PROJECT.md` §5.3（學生密碼不可純文字保存）。
- Session token = `Utilities.base64Encode(class + '|' + number + '|' + timestamp)` →
  **可預測、可偽造、永不過期**，違反 `PROJECT.md` §5.4。
- 前端 `auth-state.js.get()` 只檢查 localStorage 是否有 token 字串，**從不呼叫 `verify`**；
  即任何人 `localStorage.setItem('student_token','x')` 即顯示為已登入。
- 影響目前有限（**無受保護資料**），與 planning 自述的「MVP 過渡期 trade-off」一致；
  但**在加入任何真實成績／紀錄寫入前必須先做可信身份**。

### 8.3 Firebase 規劃 vs 實作 **【已確認】**
- `PLANNING/20260608_..._V1.md`：A 方案（不接 Firebase，只做殼）— **已實作**。
- `PLANNING/20260608_..._DEBUG_1.md`：全站右上角 widget + 頁內 modal — **已實作**（legacy）。
- `PLANNING/20260609_..._GOOGLE_V2.md`：Firebase Auth + Google provider，共用
  project `math-rpg-1eebc` — **完全未實作**（planning 自述「今次不直接實作」）。

### 8.4 最小可行登入方案（建議，不實作）
若要可信身份：採 V2 規劃方向（Firebase Auth + Google provider，compat SDK 集中於
`js/firebase-*.js`，`onAuthStateChanged` 為唯一真相，web config 非 secret）。teacher role
僅作 UI 分類，需要時再以 Custom Claims／後端 rules 升級。**現有 GAS 學生密碼方案
應隨之退役，並停止明文存儲。**

---

## 9. Data Storage and Integrations

| 整合 | 位置 | 類型 | 風險 |
|---|---|---|---|
| GAS 功課／通告 | `index.html` `WEBAPP_URL` + `API_TOKEN='homework-secret-2026'` + `no-cors` | 寫入 | **Critical**：公開 token、假成功 |
| GAS 學生登入 | `js/auth-state.js` `GWS_ENDPOINT`；後端 `gas/Code.gs`（Sheet `1gbCWh6_…`） | 讀寫 | **High**：明文密碼、可偽造 token |
| GAS quiz 匯出 | `s1/selfstudy/2025-26-…甲部.html`、`s3甲部基礎練習.html`（`AKfycbzx…`，`no-cors`，前端密碼 `s1math`） | 寫入 | Medium：假成功、明文密碼 |
| Google Sheets CSV 功課來源 | `index.html` `CSV_URL`（公開 export csv） | 讀取 | Low（公開資料） |
| GitHub API PUT | `hkdse/review_p1/p2.html` → `contents/hkdse/pages/p*_verified.json` | 寫入 | Medium：需貼 repo-scoped PAT 入前端頁（**未硬編碼**，由 `#ghToken` 輸入） |
| GAS 圖片代理 | `hkdse/gas-project/Code.gs`（Drive thumbnail 代理，scriptId 為 metadata） | 讀取 | Low |
| MiniMax API | `exam/mimic/config.js`、`hkdse/mimic-generator/config.js` | LLM | None（值為 `YOUR_MINIMAX_API_KEY_HERE` 佔位） |
| 本地端儲存 | `practice_progress`、`chapter_quiz_progress`、`hkdse_p1/p2_*`、`hkdse_templates*`、`student_*` | localStorage | Medium：schema 不統一（見 §15） |

---

## 10. GitHub Pages and Deployment

**【已確認】** `.github/workflows/pages-deploy.yml`：push 到 `main` → 明確白名單 copy 到
`site/`：root `index.html` + root `*.html`、`games/`、`student/`、`login/`、`css/`、
`images/`、`js/`、`projects/`、`hkdse/`、`exam/`、`s1/`、`s3/`、`tools/` → upload Pages。

部署相關發現：

1. **未部署但存在 HTML 入口**：`infographics/index.html`（+2）、`content/`、
   `ch11-probability-flashcard/`／`ch11-geometry-flashcard/` 的 `reference-original.html` 等。
   `ch11-geometry-flashcard/index.html` 因目錄非 workflow copy 清單成員 — **【尚待確認】**
   需於正式網站實測該 flashcard 是否真的可達（S1Ch11 有連到它）。
   > 註：兩個 ch11 flashcard 目錄內各有 2 個指向 `https://ai-lish.github.io/ai-learning/ch11-…/`
   > 的絕對連結；若目錄未部署，這些連結會 404。
2. **部署體積偏大**：`hkdse` ~54M、`exam` ~33M、`images` ~26M（其中 `images/ch8-books`
   ~24M = 5 張 ~3.4MB jpg；`exam/2024-25-s5-term3/paper1_ms.pdf` ~6.1MB）。對手機與
   Pages 載入不利，違反 `PROJECT.md` §8 performance 期望（新增圖片應壓縮）。
3. **路徑**：`login/index.html` 用絕對 `/ai-learning/`（刻意，符合 base）；其餘多用相對路徑。

---

## 11. Planning Status

| Planning | 狀態 |
|---|---|
| `PLANNING/20260607_HOME_ENTRY_ORGANIZATION_V1.md` | **已實作**（首頁分類入口、tag、老師區已存在） |
| `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md` | **已實作**（auth shell、returnTo 防禦、登出不清進度） |
| `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_DEBUG_1.md` | **已實作**（右上角 widget、頁內 modal、跨 tab、login 轉址） |
| `PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md` | **未實作**（無任何 Firebase 程式） |
| `planning/20260511_s1-selfstudy-improvements_v1.md` | 高可信：對應 s1/selfstudy（已大致存在） |
| `planning/20260512_CH11_Geometry_Flashcard_V1.md` | 高可信：對應 ch11-geometry-flashcard（已存在） |
| `planning/20260516/0518 RAINBOW *` | 高可信：對應 `games/S3Ch11-RainbowExplained.html`、`S5Ch18-*Rainbow*` |

---

## 12. Documentation vs Code Differences（差異表）

| 類別 | 具體 | 證據 |
|---|---|---|
| **文件已過時** | `README.md` 整份停留在 2024-04-20：稱 `exam/` 與 `games/` 無 index（**兩者皆已存在**）、稱「30+ 遊戲」（**實 48**）、稱首頁 CSV CORS 失敗為未解 | `README.md`；`exam/index.html`、`games/index.html` 存在；`ls games/*.html` = 48 |
| **planning 未實作** | V2 Firebase Google 登入 | grep firebase = 0；`auth-state.js` 仍 legacy |
| **planning 已實作** | 全站右上角 widget + 頁內 modal | `js/auth-state.js`、`css/auth-widget.css` |
| **程式存在但文件少記錄** | `worksheet-factor-remainder.html`、`math-svg-tools.html`、`projects/s3-ch8-trig-elevation/`、`stories.html` 細節 | 檔案存在 |
| **首頁有入口但功能不完整** | 老師區「校內卷三 OCR」連 `exam/review-p3.html`（不存在）；「成績統計」標「即將推出」 | `index.html:529`；`ls exam/review-p*` 只有 p1/p2 |
| **功能存在但首頁無入口** | `straight-line.html`、`worksheet-factor-remainder.html`、`infographic-editor.html`、`ch11-probability-flashcard/`、`infographics/`（且未部署） | grep 首頁 href 無命中 |
| **接入不一致** | DEBUG_1 要求 S1Ch*/S2/S3/S4/S5、games-index、selfstudy、exam、hkdse、dashboard 全接 widget；實際只有部分頁面引用 `auth-widget.css`/`auth-state.js` | grep `auth-widget.css` 命中集中於 index、s3 selfstudy index、student/* 等 |
| **名稱不一致** | `README.md` 作者路徑 `/Users/zachli/`；首頁標題「少康老師」；planning 提「明亮老師 G11」 | 多檔 |

> **【尚待確認】** widget 接入清單需逐頁 grep 核實（本次抽樣顯示大量獨立課題頁未接入，
> 與 DEBUG_1 §5「第一批必須接入」目標未完全達成）。

---

## 13. Security and Privacy Findings

### ~~Critical~~ → 設計如此（owner 裁決 #1）
- **C1【已確認，已重新分類】homework 寫入無真實授權**：`index.html:582`
  `API_TOKEN='homework-secret-2026'` + `index.html:1185+` 多處 `mode:'no-cors'`
  POST `add`/`delete`/`saveAnnouncement`。**使用者確認此為刻意開放的社群共享功能**
  （非官方頻道、不求準確），故公開 token 不視為安全漏洞。前端 token 本就不構成保護，
  與開放意圖一致。**可選增強**：改為「只有已登入同學可修改」以減少誤改 —— 此項依賴
  可信身份（見 #4 / 第 4 項），優先度低。`no-cors` 假成功仍建議改善（見 M1）。

### High
- **H1【已確認，已降級（owner 裁決 #4）】legacy 登入已過時**：`gas/Code.gs` 明文比對密碼、
  token = `base64(class|number|ts)`、`auth-state.js.get()` 只看 localStorage。**使用者確認
  未為學生建立任何帳號／密碼**，預期只用訪客或 Google 登入。因此 `學生資料` Sheet 很可能
  無真實資料，明文密碼疑慮大幅降低。重點轉為：**退役舊版班別／學號／密碼 modal（目前對
  學生有誤導），推進 Firebase Google 登入**。仍違反 `PROJECT.md` §5.4 的「token 不可預測」
  原則，但在無真實帳號下屬過渡殘留而非實時風險。
- **H2【已確認】前端明文老師密碼**：`index.html:690` `TEACHER_PASSWORD='lscmath'`；
  `s1/selfstudy/2025-26-中一-第三學期-甲部.html` 及 `s3甲部基礎練習.html` 內
  `teacherPassword:"s1math"`。純前端遮掩，非授權；密碼值公開於源碼。

### Medium
- **M1【已確認】no-cors 假成功**：功課／通告（`index.html`）與 quiz 匯出（s1/s3 練習）
  皆 `no-cors`，無法驗證寫入是否成功，違反 `PROJECT.md` §5.7。
- **M2【已確認】GitHub PAT 貼入前端頁**：`hkdse/review_p1/p2.html` 由老師於 `#ghToken`
  貼上 repo-scoped classic PAT 以 PUT `*_verified.json`。**未硬編碼（好）**，但模式有
  外洩風險（shoulder-surf / 殘留 DOM / 共用裝置）。建議改用受限部署流程或 fine-grained PAT。
- **M3【尚待確認】學生 PII**：`學生資料` Sheet 含班別、學號、姓名、ID、密碼。需確認該
  Sheet 權限、是否含真實學生資料，以及 GAS 部署的存取範圍。

### Low
- **L1【已確認】placeholder 不是 secret**：mimic `config.js` 為 `YOUR_MINIMAX_API_KEY_HERE`；
  `change-password.html` 為 `YOUR_DEPLOY_ID`（按鈕已停用）。保持佔位即可。

---

## 14. UX and Accessibility Findings

- **U1【已確認】broken link**：老師區「校內卷三 OCR」→ `exam/review-p3.html`（404）。
- **U2【已確認】重複／分散入口**：root `games-index.html`（7 個）與 `games/index.html`
  （48 個）並存，學生可能見到不同子集。
- **U3【已確認，owner 裁決 #2】孤立工具（已逐項核實）**：
  - **真正 0 引用（清理候選）**：`straight-line.html`、`infographic-editor.html`、
    `ch11-probability-flashcard/`（S3Ch11 改用遊戲）。
  - **更正：`worksheet-factor-remainder.html` 並非孤立** —— 由 `S5Tutorial.html:56-57` 連入，
    屬課堂使用中，**不是清理候選**（先前只查首頁致誤判）。
  - 使用者確認 repo 內有大量歷史誤上傳／重複／棄置檔案；清理候選須逐一確認非課堂使用中
    才下架（依 oversight 角色，不擅自刪除）。
- **U4／U7【已確認，更正為實際 bug】S1Ch13 視覺學習圖在正式網站 404**：`S1Ch13.html:379-384`
  以 `<img src="infographics/images/ch13_*.jpg">` 顯示 6 張圖，圖檔存在但 `infographics/` 不在
  部署白名單 → 正式網站破圖（本機正常故易忽略）。故 `infographics/images/` **並非可棄置**。
  已開 planning `PLANNING/20260611_NAV_DEADLINKS_INFOGRAPHIC_FIX_V1.md`。
- **U5【尚待確認】手機**：widget／modal 在 320–390px 的遮擋與 overflow、長姓名截短、
  鍵盤彈出、MathJax 不被裁切，需正式網站分 viewport 實測。
- **U6【已確認】accessibility 基礎尚可**：widget 有 `aria-*`、Escape 關 modal、role=button +
  鍵盤 handler；但大量獨立頁未統一，需逐頁確認。

---

## 15. Technical Debt

- **D1【已確認】localStorage schema 不統一**：`practice_progress`、`chapter_quiz_progress`、
  `hkdse_p1/p2_*`、`hkdse_templates*`、`student_*` 各自定義；未採用 `PROJECT.md` §4.4 的
  共用 learning-record 事件格式。
- **D2【已確認】共用程式極少**：`js/` 只有 auth-state.js；樣式／設定／資料寫入散落各頁，
  維護成本高（與 `PROJECT.md` §3 所述一致）。
- **D3【已確認】部署體積大**：見 §10.2（hkdse 54M / exam 33M / images 26M）。
- **D4【已確認】單檔過大**：`S5Ch18.html` 110KB、`s3甲部基礎練習.html` ~76KB、
  `S3Ch8.html` ~56KB、`straight-line.html` ~60KB；不利維護與載入。
- **D5【已確認】文件債**：`README.md` 過時、作者本機路徑外洩（非 secret）。

---

## 16. Recommended Priorities（5–8 項）

> 每項：問題／受影響／建議結果／原因／依賴／風險／建議 planning filename／時機。
> Claude 不直接實作；以下為交回 Codex／使用者的方向。

> 已依 2026-06-11 owner 裁決重排：homework 由 Critical 降為可選增強；orphans 由「補入口」
> 改為「清理」；README 已完成；Firebase Google 登入升為最高實作優先。

1. **訪客 + Google 登入（取代 legacy）（H1 / §8 / 裁決 #4）** — 受影響：未來所有學生紀錄／
   成績／個人化。建議結果：實作 V2 Firebase Google 登入，退役舊版班別／學號／密碼 modal，
   移除誤導學生的「學生登入」表單；落地前不加任何真實紀錄寫入。原因：使用者確認無學生帳號、
   只用訪客或 Google；現有 legacy 登入既無用又誤導，且是「登入增強」的根本阻塞。
   依賴：Firebase Console（`math-rpg-1eebc`）設定、與 math-rpg 協調。風險：中（跨 origin
   session 需實測）。filename：沿用 `PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md`。
   **現在做（最高優先）。**

2. **修死連結 + 清理孤立／誤上傳檔案（U1 / U3 / 裁決 #2）** — 受影響：老師導航、repo 清晰度。
   建議結果：移除或建立 `exam/review-p3.html`；逐一確認 `infographics/`、
   `ch11-probability-flashcard/`、`worksheet-factor-remainder.html`、`straight-line.html`、
   `infographic-editor.html` 等是否棄置，非課堂使用中才下架。原因：使用者確認多為測試重複／
   誤上傳。依賴：逐項確認去留。風險：低（須避免誤刪仍在用的工具）。
   filename：`PLANNING/20260611_REPO_CLEANUP_DEADLINKS_V1.md`。**現在做。**

3. **更新 README（D5 / §12 / 裁決 #3）** — ✅ **已完成**（2026-06-11，本次直接更新
   `README.md`，反映現況：exam/games 已有 index、約 48 遊戲、登入仍 legacy 且方向為 Google、
   開放式功課共享、孤立檔案說明、部署白名單）。

4. **功課共享：可選登入限制 + 移除 no-cors 假成功（C1 / M1 / 裁決 #1）** — 受影響：功課／通告
   共享品質。建議結果：保留開放上傳意圖，可選「只有登入同學可改」；把 `no-cors` 改為可驗證
   回應，避免顯示未經確認的成功。原因：使用者要的是方便共享，不是嚴格保安。依賴：第 1 項
   身份層。風險：低。filename：`PLANNING/20260611_HOMEWORK_SHARING_V1.md`。**稍後做（依賴 #1）。**

5. **老師工具改 email 分類授權（H2 / M2）** — 受影響：OCR 審核、仿題、功課編輯。建議結果：
   以 Google 登入 email allowlist 作 UI 分類，敏感寫入改後端授權；移除前端明文密碼
   （`lscmath`、`s1math`）；GitHub PAT 流程改 fine-grained / 受限方案。原因：前端密碼非保安。
   依賴：第 1 項。風險：中。filename：`PLANNING/20260611_TEACHER_TOOLS_AUTH_V1.md`。**稍後做。**

6. **統一學習紀錄 schema（D1）** — 受影響：跨工具進度／Dashboard。建議結果：新功能與被整合
   舊工具改用 `PROJECT.md` §4.4 事件格式，localStorage 先存、登入後同步。原因：為真實
   Dashboard 鋪路。依賴：第 1 項。風險：中。
   filename：`PLANNING/20260611_LEARNING_RECORD_SCHEMA_V1.md`。**稍後做。**

7. **部署體積與手機效能（D3 / U5）** — 受影響：手機學生載入。建議結果：壓縮 `images/ch8-books`
   與大 PDF、評估是否需把全部試卷圖部署到 Pages。原因：效能與 Pages 限制。依賴：無。風險：低。
   filename：`PLANNING/20260611_ASSET_WEIGHT_V1.md`。**暫不做（待課堂回饋）。**

8. **全站 widget 接入收尾（§12 接入不一致）** — 受影響：跨頁登入狀態一致性。建議結果：
   依 manifest 補接尚未載入 widget 的主要課題／遊戲頁。原因：完成 DEBUG_1 未竟目標。
   依賴：宜與第 1 項（Firebase）一併做以免重工。風險：低但量多。
   filename：併入 #1。**暫不做（與 #1 合併）。**

---

## 17. Open Questions（會影響決策／範圍）

1. **【尚待確認】** 各獨立課題／遊戲頁在正式網站是否已載入右上角 widget？（程式抽樣顯示
   多數未接，需逐頁核實或實測。）
2. **【尚待確認】** `ch11-geometry-flashcard/` 在正式 Pages 是否真的可達（目錄不在 workflow
   copy 清單，但 S1Ch11 有連結）？
3. **【尚待確認】** `學生資料` Google Sheet 是否含真實學生個資與密碼，權限如何？
4. **使用者決策**：`infographics/`、`ch11-probability-flashcard/`、`straight-line.html`、
   `worksheet-factor-remainder.html`、`infographic-editor.html` — 連結、部署、還是下架？
5. **使用者決策**：是否現在推進 V2 Firebase 登入，還是維持 legacy 過渡期？

---

## 18. Evidence and File References

- 部署：`.github/workflows/pages-deploy.yml`（白名單 copy）
- 公開 token / no-cors：`index.html:581-582`、`index.html:1185,1201,1414,1426,1464,1477,1508,1560,1570,1579,1636`
- 老師密碼：`index.html:690`；`s1/selfstudy/2025-26-中一-第三學期-甲部.html`（CONFIG.teacherPassword）；`s3甲部基礎練習.html:442`
- GAS quiz 匯出：`s1/selfstudy/2025-26-…甲部.html`、`s3甲部基礎練習.html:443`（`AKfycbzx…`，no-cors）
- 學生登入後端：`gas/Code.gs`（明文密碼 `:58-59`、token `:105-110`、Sheet ID `:31`）
- 前端登入殼：`js/auth-state.js`（`get()` `:58-70`、GAS endpoint `:32`、modal `:295-388`）
- login 轉址：`login/index.html`（returnTo 防禦 `:59-104`）
- GitHub PAT 寫入：`hkdse/review_p1.html:718,752,763`、`hkdse/review_p2.html:729,740`
- 圖片代理：`hkdse/gas-project/Code.gs`
- placeholder：`exam/mimic/config.js:3`、`hkdse/mimic-generator/config.js:3`、`student/change-password.html`（`YOUR_DEPLOY_ID`）
- broken link：`index.html:529` → `exam/review-p3.html`（不存在；`exam/` 只有 review-p1/p2）
- Firebase 0 命中：grep `initializeApp|getAuth|firebaseConfig|GoogleAuthProvider|onAuthStateChanged|signInWithPopup` over `*.html`/`*.js`
- 過時 README：`README.md`（2024-04-20 測試、exam/games 404 等）
- 部署體積：`hkdse` ~54M、`exam` ~33M、`images` ~26M（`images/ch8-books` ~24M、`exam/2024-25-s5-term3/paper1_ms.pdf` ~6.1M）
- 遊戲數：`ls games/*.html` = 48；`games/index.html` 列全部、`games-index.html` 列 7

---

*本 audit 為參考文件，不證明任何功能已完成。未測試或未 merge 的工作不得視為完成。*
