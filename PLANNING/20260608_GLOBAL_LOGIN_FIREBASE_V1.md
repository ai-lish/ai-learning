# 20260608 — Global Login Shell + Firebase 身份層規劃 v1

> **狀態**: Active
> **作者**: 大腦（基於 98-line 草稿擴充；Codex review/comment 由 Zach 自行加入）
> **日期**: 2026-06-08
> **目標 PR**: <https://github.com/ai-lish/ai-learning/pull/23>

---

## 1. 背景

`ai-learning` 站已部署在 GitHub Pages（`/ai-learning/` path）。現有學生登入頁（`login/index.html`）、Dashboard（`student/dashboard/index.html`）、修改密碼頁（`student/change-password.html`）三者無共用身份層。學生前線流程主要靠 localStorage 模擬（`student_token` / `student_name` / `student_class` / `student_number`），由 Google Apps Script 後端發 token。

**現有痛點**:

- Dashboard 強制跳轉未登入學生，無軟提示
- 登出使用 `localStorage.clear()`，會一併清除本機練習進度（`practice_progress`、`chapter_quiz_progress` 等）
- 登入後 redirect 無 `returnTo` 支援
- 首頁無登入狀態顯示
- Firebase 尚未真正接入，沒有統一身份層
- 學生工具如 P1/P2 練習、考試、遊戲都應可免登入使用，但目前 Dashboard 強制跳轉會令人誤會

**目標**:

- 提供全站共用 `AuthState` 殼（`js/auth-state.js`），定義 guest / legacy-student 兩種身份
- 為日後 Firebase 接入預留介面，**但本 PR 不實際接入 Firebase / Firestore**
- 修補現有 redirect、登出、登入狀態的 UX bug
- 主要學生工具保持免登入可用

---

## 2. 現況分析

### 2.1 相關檔案

| 檔案 | 角色 | PR #23 變動 |
|------|------|------------|
| `js/auth-state.js` | 全域身份殼（new） | 新增 |
| `index.html` | 首頁，header 附近顯示登入狀態 | 修改 |
| `login/index.html` | 學生登入頁，GAS endpoint | 修改（returnTo 修正） |
| `student/dashboard/index.html` | 學生 Dashboard，mock 數據 | 修改（軟提示 + 登出修補） |
| `student/change-password.html` | 修改密碼頁（endpoint 佔位） | 修改（佔位檢查） |
| `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md` | 本文件 | 修改 |

### 2.2 目前行為

- 未登入 → Dashboard 強制 `window.location.replace` 彈走
- 登出 → `localStorage.clear()` 連練習進度都清
- 首頁無登入狀態
- `returnTo` 未支援
- `login/index.html` 內部以 `new URL(r, window.location.href)` 解析相對 path，會錯誤地以 `/login/index.html` 為 base（**已確認 bug**，詳見 §6 技術邊界）

### 2.3 已知問題

- ❌ `localStorage.clear()` 會清 `practice_progress` / `chapter_quiz_progress`
- ❌ Dashboard XP/題數/連續登入/徽章以 mock 數據呈現但無明確免責聲明
- ⚠️ `student/change-password.html` endpoint 仍為佔位符 `YOUR_DEPLOY_ID`
- ⚠️ 前端有明文 teacher password（**非本 PR 範圍**，保留現況但加注釋）
- ❌ `login/index.html` 登入後只會去 Dashboard，無 `returnTo`
- ❌ `returnTo` 解析路徑錯（相對 path 會被綁到 `/login/`）

### 2.4 安全與私隱風險

- Firebase 未接入，目前身份僅為 localStorage local state
- `student_token` 由 GAS 發出，未經簽章驗證
- **GAS 部署的 token 不能視為可信身份**，這是 MVP 過渡期已接受的 trade-off

---

## 3. Firebase 方案比較（為日後接入預留決策）

| 方案 | 描述 | 優點 | 缺點 | 適用場景 |
|------|------|------|------|----------|
| **A. 不接 Firebase，純 localStorage 殼**（本 PR MVP） | 維持 GAS login，僅加 `AuthState` 殼、redirect 防禦、UX 修補 | 零外部依賴、零成本、合 GitHub Pages static site、立即可上 | 身份只喺本機可信、跨裝置失效、token 未簽章 | 過渡期、MVP |
| **B. Firebase Authentication（client SDK）** | 用 `firebase/auth` 做 Email/Password 或 Anonymous | 跨裝置身份、token 自動簽章、有 reset password flow | 需要 Firebase project 配置、需 import 9.x SDK、登入 UI 改動大 | 學生要登入才看到紀錄嘅場景 |
| **C. Firebase Identity Platform + OAuth** | 用 Google / Microsoft 學校帳號登入 | 學校 SSO、合規較強 | 需學校 IT 配發 OAuth client、家長/學生阻力、setup 慢 | 跨校 / 全校平台 |
| **D. Supabase Auth** | 第三方開源 auth，跟 Supabase DB 配 | 開源、SQL、後端更完整 | 引入新服務、需 hosting | 已有 Supabase 計劃嘅項目 |
| **E. Custom JWT + 自家後端** | 自家 Express/FastAPI + JWT | 完全控制 | 維運成本高、需 hosting | 有專屬後端時 |
| **F. no-cors + 假登入** | 純前端假登入，繞過 CORS | 「貌似可用」 | **❌ 安全性 0、token 偽造容易、列入禁止方案** | ❌ 永不採用 |

**本 PR 決定**: 採 **A 方案（不接 Firebase）**，但 `js/auth-state.js` 嘅介面要設計成日後可平順升級到 B / C / D / E。

### 3.1 介面約定

```js
// js/auth-state.js（v1）
window.AuthState = {
  get(): { state: 'guest' | 'legacy-student' | 'firebase-user' | 'firebase-anon', name?, studentClass?, number?, hasToken, claims? },
  isLegacyStudent(): boolean,
  loginUrl(loginPageRelPath, returnTo?): string,
  logout(redirectPath?): void,
  AUTH_KEYS: string[]   // 登出時只清呢啲 key
};
```

`state` 預留 `firebase-user` / `firebase-anon` 兩個 value，等日後接入 Firebase 唔使改 call site。

---

## 4. MVP 範圍

> **MVP 定義**: 解決現有 4 個 UX bug + 為日後身份層預留介面。**不接 Firebase / Firestore**。

### 4.1 包含（本 PR 必須做）

- ✅ `js/auth-state.js`（new, ~90 lines）：提供 `get` / `isLegacyStudent` / `loginUrl` / `logout` / `AUTH_KEYS` 五個出口
- ✅ `index.html` 加 `#auth-bar`，顯示訪客提示 + 登入入口 / 已登入名稱 + Dashboard + 登出
- ✅ `login/index.html`：
  - 加入 `?returnTo=` 支援
  - **修正 returnTo 路徑解析 bug**（以 `/ai-learning/` 為 base，唔係 `/login/index.html`）
  - 拒絕同源但離開 `/ai-learning/` 嘅 path
- ✅ `student/dashboard/index.html`：
  - 未登入顯示提示 banner，**不強制跳轉**
  - 登出改用 `AuthState.logout('../../login/index.html')`，**唔用 `localStorage.clear()`**
  - 加 mock 數據免責聲明
- ✅ `student/change-password.html`：
  - Endpoint 含 `YOUR_DEPLOY_ID` 時禁用按鈕 + 顯示「功能未設定」提示
  - 未登入時禁用按鈕 + 顯示提示

### 4.2 不在 MVP（本 PR 唔做）

- ❌ Firebase Authentication 接入（client SDK / config）
- ❌ Firestore / Realtime Database
- ❌ Firebase Admin SDK / service account key
- ❌ 任何 server-side backend（除咗現有 GAS endpoint）
- ❌ OAuth / 學校 SSO
- ❌ Email 驗證流程
- ❌ 跨裝置身份同步
- ❌ 刪除 `localStorage.clear()` 以外嘅 `localStorage` 行為
- ❌ 老師/管理員身份層（teacher password 保留現況）
- ❌ 任何修改題庫、答案、OCR JSON、DSE evidence、試卷嘅改動
- ❌ 任何修改遊戲計分、數學出題邏輯嘅改動

### 4.3 開放問題（待日後開新 PR）

- 真實 XP / 答題紀錄 / 連續登入同步（要 backend 或 Firebase）
- 老師 / 學生角色分界
- `student/change-password.html` 嘅真 endpoint
- 登出後動畫 / 確認 dialog

---

## 5. Not-in-Scope（明確排除清單）

**永遠唔做**（任何 PR 都不應做）：

- ❌ 把 `no-cors` 加入 fetch 寫入
- ❌ `localStorage.clear()` 喺任何用戶可觸發嘅路徑
- ❌ 引入 Firebase Admin SDK / service account key / 任何 secret 入 repo
- ❌ 把 `student_token` / 老師密碼明文 commit（已有嘅保留但唔外洩）
- ❌ 修改 `PLANNING/20260607_HOME_ENTRY_ORGANIZATION_V1.md`（PR #21 已 merged）
- ❌ 改動 GitHub Pages base path（必須保留 `/ai-learning/`）
- ❌ 把 `practice_progress` / `chapter_quiz_progress` 等本機進度 key 列入 `AUTH_KEYS`

**本 PR 唔做**（其他 PR 做）：

- ❌ Firebase 接入
- ❌ Firestore schema
- ❌ 真實 Dashboard 數據（XP、答題、徽章）
- ❌ 老師/管理員身份層
- ❌ 自動測試框架（Playwright / Jest）
- ❌ CI / CodeQL 改動（沿用現狀，PR body 內交代「CodeQL 0 alerts」）
- ❌ 任何遊戲邏輯、P1/P2 試題、考試工具嘅改動

---

## 6. 技術邊界（Technical Boundaries）

### 6.1 路徑處理（**最 critical**）

| Input `returnTo` | 期望 resolve | 規則 |
|------------------|-------------|------|
| `student/dashboard/index.html` | `/ai-learning/student/dashboard/index.html` | 相對 path → 以 `/ai-learning/` 為 base |
| `games-index.html` | `/ai-learning/games-index.html` | 同上 |
| `/ai-learning/student/dashboard/index.html` | `/ai-learning/student/dashboard/index.html` | 絕對 path 必須 `startsWith('/ai-learning/')` |
| `https://evil.com/foo` | `null`（reject） | 跨 origin |
| `//evil.com/foo` | `null`（reject） | protocol-relative |
| `/etc/passwd` | `null`（reject） | 唔喺 `/ai-learning/` 下 |
| `../../etc/passwd` | `/etc/passwd`（reject，因 `!startsWith('/ai-learning/')`） | path traversal |
| `javascript:alert(1)` | `null`（reject） | non-http scheme |
| `data:text/html,<script>...` | `null`（reject） | non-http scheme |
| `''` / 缺參數 / >200 chars | `null`（reject） | input validation |

**實作**：

```js
var returnTo = (function(){
  var PROJECT_BASE = '/ai-learning/';
  try {
    var r = new URLSearchParams(window.location.search).get('returnTo');
    if (!r || typeof r !== 'string' || r.length === 0 || r.length > 200) return null;
    // Protocol-relative 同 absolute URL 必須以 http(s) 開頭
    if (/^[a-z][a-z0-9+.-]*:/i.test(r) || r.startsWith('//')) return null;
    var origin = window.location.origin;
    var resolved;
    if (r.startsWith('/')) {
      // 絕對 path：以 origin 為 base，path normalize
      resolved = new URL(r, origin).pathname + new URL(r, origin).search + new URL(r, origin).hash;
    } else {
      // 相對 path：以 PROJECT_BASE 為 base（唔係 window.location.href）
      resolved = new URL(r, origin + PROJECT_BASE).pathname + new URL(r, origin + PROJECT_BASE).search + new URL(r, origin + PROJECT_BASE).hash;
    }
    // 嚴格同源 + 必須在 PROJECT_BASE 下
    if (resolved.indexOf(PROJECT_BASE) !== 0) return null;
    return resolved;
  } catch(e){ return null; }
})();
```

**測試覆蓋**（§10 測試矩陣）：

- ✅ `returnTo=student/dashboard/index.html` → `/ai-learning/student/dashboard/index.html`
- ✅ `returnTo=games-index.html` → `/ai-learning/games-index.html`
- ❌ `returnTo=//evil.com/x` → `null`
- ❌ `returnTo=https://evil.com/x` → `null`
- ❌ `returnTo=/etc/passwd` → `null`
- ❌ `returnTo=javascript:alert(1)` → `null`

### 6.2 登出 / localStorage

- ✅ 登出用 `AuthState.logout(redirectPath)`，內部 iterate `AUTH_KEYS` `localStorage.removeItem`
- ❌ 唔用 `localStorage.clear()`
- ✅ `AUTH_KEYS = ['student_token', 'student_name', 'student_class', 'student_number']`（**只有呢四個**）
- ❌ 唔加入 `practice_progress` / `chapter_quiz_progress` / 其他進度 key 入 `AUTH_KEYS`

### 6.3 Firebase / 後端

- ❌ 唔 import `firebase/app` / `firebase/auth` / `firebase/firestore`
- ❌ 唔 commit `firebaseConfig` / `apiKey` / `projectId` / `authDomain` / `measurementId`
- ❌ 唔引入 service account JSON / Admin SDK
- ❌ 唔喺 `index.html` / `login/index.html` / `student/*.html` 出現 `initializeApp` / `getAuth` / `firebase` 字眼（`AuthState` 唔算）
- ❌ 唔新增 `no-cors` fetch
- ✅ 仍用現有 GAS endpoint `https://script.google.com/macros/s/AKfycbw-.../exec`
- ✅ `student/change-password.html` 嘅 endpoint 維持 `YOUR_DEPLOY_ID` 佔位符，部署前不替換

### 6.4 安全掃描

PR 必須跑以下 grep，0 hits：

```bash
rg -n 'no-cors|localStorage\.clear|TEACHER_PASSWORD|API_TOKEN|initializeApp|getAuth|firebaseConfig|projectId|authDomain|apiKey.*firebase' --glob '*.html' --glob '*.js'
```

PR body 內附結果截圖 / 命令輸出。

### 6.5 路徑掃描

```bash
rg -n 'href="/|src="/|location\.href\s*=\s*[\x27"]?/' --glob '*.html' --glob '*.js'
```

預期：所有 `href="/..."` / `src="/..."` / `location.href='/...'` 必須以 `/ai-learning/` 開頭（除咗外部 CDN / API endpoint）。

### 6.6 兼容性

- iOS Safari 14+、Chrome 90+、Firefox 88+、Edge 90+
- Mobile viewport: 320×568 (iPhone SE 1st gen) 至 390×844 (iPhone 12+)
- Desktop viewport: 1280×720 (HD) 至 2560×1440 (QHD)
- 純 static site，GitHub Pages hosting

---

## 7. 具體任務（Action Items）

1. **新增 `js/auth-state.js`** — 全域 `AuthState` 物件（§3.1 介面）。`AUTH_KEYS` 只列四個 key。`logout` iterate `AUTH_KEYS` 唔用 `clear`。
2. **`index.html`** — header 下方加 `<div id="auth-bar">`，JS render 訪客 / 登入態對應 UI；引入 `js/auth-state.js`。
3. **`login/index.html`**:
   - 引入 `js/auth-state.js`
   - 改寫 `returnTo` 解析邏輯為 §6.1 規則
   - 登入成功後優先跳 returnTo，否則去 Dashboard
   - 移除「已接 Firebase」字眼，改為「目前使用 GAS 驗證，尚未接入 Firebase 身份系統」
4. **`student/dashboard/index.html`**:
   - 引入 `js/auth-state.js`
   - 未登入 → 顯示 `id="login-prompt-wrap"`，**唔跳轉**
   - 登出 → `AuthState.logout('../../login/index.html')`，加 fallback
   - 加 mock 數據免責聲明
5. **`student/change-password.html`**:
   - 引入 `js/auth-state.js`
   - 偵測 `YOUR_DEPLOY_ID` → 禁用 + 提示
   - 未登入時禁用 + 提示

---

## 8. 驗收條件（Acceptance Criteria）

> 即係 PR description 嘅「Completion Checklist」section。每項都要可驗證。

- [ ] 訪客首頁可直接使用所有教材、遊戲、考試，**無需登入**
- [ ] 首頁 header 顯示訪客提示 + 登入入口
- [ ] 已登入（legacy local）首頁顯示名稱、Dashboard、登出
- [ ] 登出後本機 `practice_progress`、`chapter_quiz_progress` 等進度 key **仍存在**（console 驗證）
- [ ] `login/index.html?returnTo=student/dashboard/index.html` 登入後跳到 `/ai-learning/student/dashboard/index.html`（唔係 `/ai-learning/login/student/dashboard/index.html`）
- [ ] `login/index.html?returnTo=games-index.html` 登入後跳到 `/ai-learning/games-index.html`
- [ ] Dashboard 未登入顯示提示 banner，**唔彈走用戶**
- [ ] Dashboard mock 數據有「測試中 / 尚未同步真實學習紀錄」說明
- [ ] Change-password endpoint 佔位符時提交按鈕 disabled + 顯示「功能未設定」
- [ ] 路徑掃描：所有 `href="/..."` / `src="/..."` 必須以 `/ai-learning/` 開頭
- [ ] 安全掃描：無 `no-cors` / `localStorage.clear` / `firebase` / `initializeApp` / `apiKey` 命中
- [ ] CodeQL：0 alerts

---

## 9. 實作 AI PR 前測試清單

> Copilot AI 喺開 PR 前必須跑（埋入 PR description）。

- [ ] `node tests/returnTo.test.js`（或同類 unit test）全綠
- [ ] 未登入首頁：所有主要教材入口可見可點
- [ ] 未登入首頁：auth-bar 顯示訪客提示 + 登入連結
- [ ] 登入後首頁：auth-bar 顯示名稱 + Dashboard + 登出
- [ ] 登出後：practice_progress 等 key 未被清除（DevTools localStorage 驗證）
- [ ] Login 頁 returnTo：兩個 test case 跳轉正確（見 §6.1）
- [ ] Dashboard 未登入：顯示提示 banner，唔被彈走
- [ ] Dashboard 登入：正常顯示 mock 數據（帶免責聲明）
- [ ] Change-password：endpoint 佔位符時提交按鈕 disabled
- [ ] Desktop 1280x720、mobile 390x844、mobile 320x568 均可用
- [ ] 路徑掃描命令 0 hits（除咗已加註解嘅外部 CDN / API）
- [ ] 安全掃描命令 0 hits

---

## 10. 測試矩陣（Test Matrix）

### 10.1 returnTo 解析（unit-level, node 跑）

| # | Input `returnTo` | 期望輸出 | 期望 resolve 路徑 |
|---|------------------|----------|-------------------|
| 1 | `student/dashboard/index.html` | `/ai-learning/student/dashboard/index.html` | ✅ |
| 2 | `games-index.html` | `/ai-learning/games-index.html` | ✅ |
| 3 | `/ai-learning/student/dashboard/index.html` | `/ai-learning/student/dashboard/index.html` | ✅ |
| 4 | `/ai-learning/games-index.html` | `/ai-learning/games-index.html` | ✅ |
| 5 | `../student/dashboard/index.html` | `null` | ❌ normalize 後 escape `/ai-learning/` |
| 6 | `//evil.com/foo` | `null` | ❌ reject |
| 7 | `https://evil.com/foo` | `null` | ❌ reject |
| 8 | `http://evil.com/foo` | `null` | ❌ reject |
| 9 | `/etc/passwd` | `null` | ❌ reject |
| 10 | `../../etc/passwd` | `null` | ❌ normalize 後唔喺 `/ai-learning/` |
| 11 | `javascript:alert(1)` | `null` | ❌ non-http scheme |
| 12 | `data:text/html,<script>...` | `null` | ❌ non-http scheme |
| 13 | `''` / 缺參數 | `null` | ❌ input validation |
| 14 | 超過 200 chars | `null` | ❌ input validation |

### 10.2 Dashboard login prompt return path

| # | 場景 | 預期行為 |
|---|------|----------|
| 1 | 未登入 → 訪問 `/ai-learning/student/dashboard/index.html` | 顯示登入提示 banner，連結 href = `/ai-learning/login/index.html?returnTo=student/dashboard/index.html` |
| 2 | 點擊登入連結 → 輸入正確學號密碼 | 跳 `/ai-learning/student/dashboard/index.html`（**唔係** `/ai-learning/login/student/dashboard/index.html`） |
| 3 | 已登入 → 訪問 Dashboard | 直接顯示 dashboard 內容 |
| 4 | Dashboard 登出按鈕 | 跳 `/ai-learning/login/index.html`，不清 `practice_progress` 等 key |

### 10.3 GitHub Pages `/ai-learning/` production-style paths

| # | 頁面 | 預期 HTTP 200 | 預期內容 |
|---|------|----------------|----------|
| 1 | `/ai-learning/` (root index) | ✅ | 首頁含 `#auth-bar` |
| 2 | `/ai-learning/login/index.html` | ✅ | 登入 form + `?returnTo=` 支援 |
| 3 | `/ai-learning/login/index.html?returnTo=games-index.html` | ✅ | 同上 |
| 4 | `/ai-learning/student/dashboard/index.html` | ✅ | 登入提示 banner（未登入） |
| 5 | `/ai-learning/student/change-password.html` | ✅ | 功能未設定提示 |
| 6 | `/ai-learning/js/auth-state.js` | ✅ | `AuthState` 物件 |
| 7 | `/ai-learning/S1Ch1.html` | ✅ | 教材頁（原有） |
| 8 | `/ai-learning/games-index.html` | ✅ | 遊戲入口（原有） |

### 10.4 Viewport 可用性

| Viewport | 裝置參考 | 預期 |
|----------|---------|------|
| 1280×720 | Desktop HD | Auth-bar 喺 header 右下；登入 form 居中 max-width 360px；Dashboard 3-column stats |
| 390×844 | iPhone 12+ | Auth-bar wrap 居中（`@media max-width:480px`）；登入 form 100% width + 16px padding；Dashboard stats 變 2-column |
| 320×568 | iPhone SE 1st | 同上；form padding 確保唔出 screen edge |

### 10.5 跨瀏覽器 smoke

| Browser | Version | Pass criteria |
|---------|---------|---------------|
| Chrome | 90+ | auth-bar render、login form、dashboard display |
| Firefox | 88+ | 同上 |
| Safari iOS | 14+ | 320×568 viewport 唔出 screen |
| Edge | 90+ | 同 Chrome |

---

## 11. PR 指示

### 11.1 PR 描述必須包含（依 Codex 既有風格）

- **Planning file link**: `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md`
- **Summary**: 解決 4 個 UX bug（redirect、登出、returnTo、登入狀態）
- **Files changed**: `js/auth-state.js` (new) + 4 個 html + 本文件
- **Test results**:
  - returnTo 解析 §10.1 全部 case
  - Dashboard login prompt §10.2 全部 case
  - GH Pages paths §10.3 全部 case
  - Viewport §10.4（**如果環境無 Playwright，可僅列 breakpoints 設定 + CSS 驗證**）
- **Security scan**: 0 hits
- **Path scan**: 0 unexpected hits
- **CodeQL**: 0 alerts
- **未接 Firebase / Firestore / 後端**: 確認聲明

### 11.2 PR title 風格

`feat: add global auth shell + redirect/returnTo safety (no Firebase)`

### 11.3 PR 標籤

- `enhancement`
- `security`（returnTo 防禦）
- `no-deploy-blocker`

### 11.4 不可做嘅事

- ❌ Auto-merge（保留 Zach click）
- ❌ 改 PR #21 已 merged 嘅 `PLANNING/20260607_HOME_ENTRY_ORGANIZATION_V1.md`
- ❌ 把 `firebaseConfig` / `apiKey` commit 入 repo
- ❌ 刪 `student/change-password.html` 嘅 `YOUR_DEPLOY_ID` 佔位符

---

## 12. Completion Checklist（PR Description 內）

> 全部 ✅ 先可以 mark PR ready for review。

- [ ] 所有 §8 acceptance criteria 過
- [ ] §10.1 14 個 returnTo case 全綠
- [ ] §10.2 4 個 dashboard 場景全綠
- [ ] §10.3 8 個 path 全部 200
- [ ] §10.4 3 個 viewport（manual 或 Playwright）
- [ ] §6.4 安全掃描 0 hits
- [ ] §6.5 路徑掃描 0 unexpected hits
- [ ] CodeQL 0 alerts
- [ ] 本 PR 冇引入 Firebase / Firestore
- [ ] `student/change-password.html` 嘅 `YOUR_DEPLOY_ID` 仍係 placeholder
- [ ] 規劃 file 喺 `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md` commit 入 PR
- [ ] `js/auth-state.js` 介面穩定，documented 喺 file 頭

---

## 13. 風險與後續

### 13.1 已知風險

| 風險 | 嚴重度 | 緩解 |
|------|--------|------|
| `student_token` 未經簽章驗證 | 中 | MVP 過渡期接受；日後 Firebase 接入解決 |
| `localStorage` 跨裝置失效 | 中 | MVP 接受；未來 sync 到 Firestore |
| 老師密碼明文 | 中（**非本 PR 範圍**） | 保留現況 + 加注釋 |
| GitHub Pages base path 改動 | 高 | §6.1 嚴格檢查 returnTo |
| GAS endpoint 失效 | 中 | fallback 改變 `student_token` 寫入失敗時 alert |

### 13.2 後續 PR 候選

- 真實 XP / 答題同步（**需要後端決策**：Firebase / Supabase / 自家）
- 老師 / 學生角色分界
- 自動測試（Playwright / Jest）入 CI
- `change-password` endpoint 真正部署
- 老師密碼移除 / 換 SSO
- 登出確認 dialog
- Dashboard 真實數據（要 backend 同步）

---

## 14. 變更記錄

| 日期 | 版本 | 變更 |
|------|------|------|
| 2026-06-08 | v1 初稿（98 lines, 5264 bytes） | Copilot 草擬：背景、現況、要求、原則、範圍、任務、驗收、測試、PR 指示 |
| 2026-06-08 | v1 完整版（本文件） | 大腦 擴充：§3 Firebase 方案比較、§4 MVP 範圍、§5 Not-in-scope、§6 技術邊界（含 returnTo 規則）、§10 測試矩陣、§12 Completion Checklist |
