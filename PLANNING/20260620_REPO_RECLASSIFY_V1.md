# 20260620_REPO_RECLASSIFY_V1

> 角色：本 planning 由 Claude（依 CLAUDE.md v2，使用者明確指派建立正式 planning file）撰寫並定案，
> 供 Codex Ready Review 及實作 AI 跟隨。
> 性質：**只定案 planning，今次不搬檔、不實作、不開始 Phase 0。**
> 對應狀態：`origin/main` @ `1814373`（已含 Firebase V3 登入）。
> 必讀依據：`AGENTS.md`、`PROJECT.md`、`CODEX.md`、`PLANNING/README.md`、
> `REFERENCE/20260611_REPO_FULL_AUDIT.md`、`REFERENCE/REPO_MAP.md`。

---

## 1. 背景

`ai-learning` repo root 平鋪大量檔案：經核對共 **38 個 root HTML**，當中約 28 個係課題頁
（`S1Ch1–13`、`S2Ch10`、`S3Ch2/4/7/8/9/11`、`S4Ch3` 系列、`S5*`），其餘係獨立工具
（`seat.html`、`math-svg-tools.html`、`stories.html`、`straight-line.html`、
`worksheet-factor-remainder.html`、`infographic-editor.html`、`s3甲部基礎練習.html`、
`games-index.html`）、首頁 `index.html`，以及一個疑似誤上傳、與數學科無關的 `JLPT-N1.html`。

老師希望按功能重新分類入資料夾，令 repo 結構更清晰，但**正式網站（GitHub Pages
`/ai-learning/`）行為不變，舊書籤盡量不死**。此為高改動面、跨頁、跨路徑工作，須分階段、
可回退、逐階段出街驗證。

## 2. 現況分析

### 2.1 連結面（baseline 規模，本機 grep 概數）
- `href="…"`：約 **2901** 處（全 repo HTML）
- `src="…"`：約 **483** 處
- JS 導航（`location.href=` / `onclick=…location`）：約 **162** 處
- `fetch(…)`（HTML+JS）：約 **72** 處
- CSS `@import` / `url(`：本機掃描 0（仍須 Phase 0 正式核實）
- 硬編根路徑：bare `/` 約 1 處；`/ai-learning/` 絕對引用約 **16** 個檔案

### 2.2 高風險連結型態（容易被簡單 grep 遺漏）
- **動態字串組路徑**：課題頁側選單用 `goToCh(n){ location.href = 'S1Ch'+n+'.html' }`、
  `'S3Ch'+n+'.html'` 等**字串拼接**，靜態 `href` 掃描捉唔到。搬課題頁時必須一併改 JS。
- **每頁已注入 Firebase / Auth**：課題頁 head 現含
  `<script src="js/firebase-config.js">`、`<script src="js/auth-state.js">`、
  `<link href="css/auth-widget.css">`、`<link href="css/styles.css">`。搬頁 → 呢啲相對
  `js/`、`css/` 路徑深度全改。
- **`js/auth-state.js` 自動偵測 PROJECT_BASE**：靠 `u.pathname.replace(/\/js\/[^/?#]+(\?.*)?$/, '/')`。
  若 `js/` 搬位（如 `assets/js/`），偵測失效 → 全站登入連結錯。
- **本地 fetch**：`exam/practice.html` 等 `fetch('./ocr/xxx.json')`、`hkdse/` 讀本地 JSON、
  review 頁 GitHub API。只要**整個工具資料夾一齊搬、內部結構不變**，相對 fetch 仍有效。

### 2.3 結構現況（詳見 `REFERENCE/REPO_MAP.md`）
- 已組織好嘅大目錄：`games/`、`exam/`、`hkdse/`、`s1/selfstudy`、`s3/selfstudy`、
  `student/`、`login/`、`css/`、`js/`、`images/`、`tools/`、`projects/`。
- 未部署目錄：`infographics/`（但 `S1Ch13.html` 引用其圖，PR 已修部署）、`content/`、
  `ch11-*-flashcard/`、`gas/`、`prompts/`、`tests/`、`PLANNING/`、`REFERENCE/`。
- 已知大量誤上傳／重複／棄置檔（audit §14）。

### 2.4 部署
`.github/workflows/pages-deploy.yml` 用**白名單** `cp -Rv` 逐個 top-level 目錄；
任何新頂層資料夾若不加入清單，出街即 404。

## 3. 使用者要求整理（可驗收）
1. 把 root 平鋪檔按功能重新分類入資料夾，repo 結構更清晰。
2. 完成後全站連結同步更新，**0 dangling link**。
3. 正式網站主要行為（首頁、課題、遊戲、考試、登入、導航）**不變**。
4. 舊 URL 盡量不死（redirect stub 保書籤）。
5. 分階段、每階段獨立可回退、逐階段出街驗證。

## 4. 產品原則（必須遵守）
- 學生主要工具**毋須登入**即可使用；登入只作進度／紀錄／同步／增強。
- 不破壞現有課堂工具；獨立或半完成工具**不可因不完整而刪除或大重構**。
- 不新增公開密碼、token、學生私隱風險。
- 尊重 GitHub Pages `/ai-learning/` 路徑，優先相對路徑，不硬編根 `/`。
- 優先改善入口、導航、身份層、工具配合。

## 5. 目標資料夾結構建議

**建議採用「混合分類」**：頂層按**功能**分，課題頁內部按**年級**分。理由：首頁 IA 本身就係
功能分類（年級／自學／考試／遊戲／班務／老師／紀錄），與功能頂層一致；課題頁數量多且天然
按年級，年級子資料夾最直觀。

```
/index.html                         ← 首頁留 root（全站入口，最多書籤）
/topics/s1/ … s5/                   ← 課題頁（現 root S*Ch*.html，按年級）
/selfstudy/s1/  /selfstudy/s3/      ← 現 s1/selfstudy, s3/selfstudy（+ s3甲部基礎練習）
/games/                             ← 維持（內部結構不動）
/exam/                              ← 維持（學生考試；內部 fetch 不動）
/hkdse/                             ← 維持
/tools/                             ← 班務／學生工具：seat, slp-split-pdf, math-svg-tools,
                                       stories, straight-line, worksheet-factor-remainder,
                                       infographic-editor, games-index
/teacher/                           ← 老師工具（現散落 exam/review-*, hkdse/review_*, mimic）
/student/  /login/                  ← 維持
/assets/css  /assets/js  /assets/images  /assets/infographics
/archive/                           ← 誤上傳／重複／棄置（逐項確認後遷入，不刪）
/PLANNING /REFERENCE /gas /tests    ← 非部署，維持
```

**強烈建議：先做「只收拾 root」最小版**（見 §6 決定 B），即第一輪只處理 root 平鋪區
（課題頁 → `topics/`、工具 → `tools/`、棄置 → `archive/`），其餘大目錄（games/exam/hkdse/
s1/s3/student/login）**原地不動**，`css/ js/ images/` **暫不搬入 assets/**（因為搬 `js/` 會
觸發 auth regex 風險、且 css/js 被幾乎每頁引用，改動面與風險最大）。`assets/` 化留待後續另案。

## 6. Owner 需要拍板的決定
- **決定 A — 分類法**：混合（建議）／純功能／純年級。
- **決定 B — 是否先做最小版**：建議**是**（只收拾 root，大目錄與 css/js/images 暫不搬）。
- **決定 C — `archive/` 是否部署**：建議**不部署**（留 repo、排除出 Pages）。理由：棄置／重複
  檔無公開價值、減少部署體積；代價係該等舊 URL 會死，但既屬棄置即可接受（不設 redirect）。
- **決定 D（次要）**：`topics/` 定 `grades/` 命名；`games-index.html`（root，7 個）與
  `games/index.html`（48 個）入口重複是否一併收斂；`JLPT-N1.html` 是否確認棄置入 archive；
  `assets/` 化（搬 css/js/images）放後續定本輪。

## 7. 實作範圍（實作 AI 可改）
- root 課題頁與工具 HTML 的**檔案位置**（用 `git mv` 保留歷史）。
- 因搬位而需要的**連結／路徑改寫**（href/src/JS 導航/fetch/favicon/og/canonical）。
- 舊位置的 **redirect stub** 檔。
- `.github/workflows/pages-deploy.yml`（部署清單／改黑名單式）。
- 如本輪搬 `js/`：`js/auth-state.js` 的 PROJECT_BASE 邏輯（**最小版建議不搬 js/，避開此項**）。
- 新增 link checker script（`tests/` 或 `scripts/`，不部署）。

## 8. 不應修改範圍
- ❌ 題目內容、答案、評分／隨機生成邏輯。
- ❌ 遊戲內部邏輯。
- ❌ 登入**功能本身**（只在搬 js/ 時改 base 偵測，且須實測）。
- ❌ 大型 UI redesign；獨立工具內部邏輯重構。
- ❌ 刪除半完成工具；盲刪、盲搬。
- ❌ 新增公開密碼／token／學生私隱。
- ❌ 與本任務無關的功能改動（含 Firebase 登入行為）。

## 9. Repo 特定風險與處理策略
| # | 風險 | 處理 |
|---|---|---|
| 1 | GitHub Pages base `/ai-learning/`；不可硬編根 `/` | 全用相對路徑；Phase 0 掃出現有 16 個 `/ai-learning/` 絕對引用逐一評估 |
| 2 | 部署白名單漏新資料夾 → 404 | Phase 4 改 workflow；建議改「黑名單式」copy（複製全部，排除 PLANNING/REFERENCE/gas/tests/.github/archive） |
| 3 | 搬位後相對深度全改（href/src/location.href/onclick/fetch/@import/url()/favicon/og/canonical） | 自動改寫 script + link checker + 人手抽查；逐型態核對 |
| 4 | **動態字串組路徑** `goToCh(n)` 等 | 專項處理：搜 `'S'+...+'.html'`、`location.href='…'` 拼接，按新結構改 |
| 5 | `js/auth-state.js` PROJECT_BASE regex | 最小版**不搬 js/**；若日後搬，同步改 regex 並實測登入跨頁／跨 tab |
| 6 | 本地 fetch（exam/ocr、hkdse JSON） | 工具資料夾整體搬、內部結構不變；Phase 後驗證 fetch 200 |
| 7 | 舊 URL 死 → 書籤／外部連結斷 | 每個已搬且有公開價值的 root HTML 留 redirect stub（§13） |
| 8 | 誤上傳／重複／棄置檔 | 逐項確認準則（§17）後才入 archive；不盲搬不盲刪 |
| 9 | 每頁已注入 Firebase/auth 相對引用 | 搬頁時連 `js/firebase-config.js`、`auth-state.js`、`auth-widget.css`、`styles.css` 深度一齊改 |
| 10 | **CJK 檔名**（如 `s3甲部基礎練習.html`） | `git mv` 後 redirect stub 的 `meta refresh` content 與 `location.replace()` 參數須 **URL-encode**；link checker 須支援 **CJK regex** 解析路徑 |

## 10. 分階段 PR 計劃（每階段一個獨立、可回退 PR）
- **Phase 0**：link checker + baseline + **切換黑名單式部署**（不搬檔）。
- **Phase 1**：archive 清理（只處理確定棄置／重複／誤上傳）。
- **Phase 2**：搬低連結檔（驗證流程 + redirect stub + checker）。
- **Phase 3**：搬高流量課題頁 `S*Ch*` + redirect stub。
- **Phase 4**：全域 0 dangling 驗收 +（如需）auth regex + 全站出街驗證。

## 11. 每階段具體任務
**Phase 0** —
(1) 建立 link checker（掃 HTML `href/src`、JS `location.href`/字串拼接、`fetch`、
CSS `url()/@import`；**須支援 CJK 檔名 regex**），輸出 dangling 清單、內部連結圖，**以及
「被頁面引用、但不在部署清單的目錄」清單**（特別確認 `ch11-geometry-flashcard/` 是否已部署 ——
現行 `pages-deploy.yml` 未見明確 copy 指令）；baseline 記入 PR。
(2) **切換 `pages-deploy.yml` 為黑名單式 copy**（複製全部，排除：
`archive/ PLANNING/ REFERENCE/ gas/ tests/ scripts/ prompts/`）。理由：Phase 2/3 搬檔後
redirect stub 會指向**新建資料夾**,若該等資料夾未部署則 stub 目標 404；故必須喺搬檔之前
先令新資料夾自動部署。本步**不搬檔**,只改部署機制並確認現有頁面出街不變（copy 範圍只增不減）。
**Phase 1** — 依 §17 準則，逐項列出 archive 候選（含 `JLPT-N1.html`、確認重複檔），每個附理由；
`git mv` 入 `archive/`；更新少量引用；確認無主要入口受影響。
**Phase 2** — 揀被引用最少嘅工具頁（如 `infographic-editor.html`、`straight-line.html` 若確認在用）
搬入 `tools/`；建 redirect stub；跑 checker。
**Phase 3** — 課題頁 `S*Ch*` → `topics/sN/`；改首頁入口、側選單 `goToCh` JS、頁內 `css/js`
相對深度；舊 root 路徑放 redirect stub。**CJK 檔名**（如 `s3甲部基礎練習.html`）`git mv` 後,
redirect stub 的 `<meta http-equiv="refresh" content="0; url=…">` 及 `location.replace()` 參數
必須 **URL-encode**（例：`%E7%94%B2%E9%83%A8%E5%9F%BA%E7%A4%8E%E7%B7%B4%E7%BF%92.html`）。
**Phase 4** — 全域 checker **0 dangling** 最終驗收；（若本輪搬 js/）改 `auth-state.js`
PROJECT_BASE regex 並實測登入；全站出街驗證。**注意：連結改寫已喺 Phase 2/3 完成,Phase 4
不重做改寫,只做最終驗收;部署機制已喺 Phase 0 切換為黑名單,Phase 4 不再改 workflow
（除非需新增排除目錄）。**

## 12. 每階段驗收條件
- **共通**：`git diff` 只見 `git mv` + 路徑改寫（無內容竄改）；checker 0 dangling；
  首頁／一課題／一遊戲／考試／登入 desktop(1280×720)+mobile(390×844, 320×568) 0 console error。
- **Phase 0**：checker 能掃 HTML/CSS/JS 常見連結並報 dangling；baseline 已記錄。
- **Phase 1**：不影響首頁、課題、遊戲、考試、登入；無盲刪；每 archive 檔有理由。
- **Phase 2**：0 dangling；舊 URL redirect 正常；主要行為不變。
- **Phase 3**：首頁入口正常；課題頁 desktop+mobile 正常；舊書籤正常跳轉；0 console error。
- **Phase 4**：0 dangling；Pages 部署包含新資料夾；五大流程 desktop+mobile 0 error；
  舊 URL redirect 正常；**登入狀態實測正常**（跨頁／跨 tab）。

## 13. Redirect stub 策略
每個已搬、且舊位置可能被書籤／外部連結引用的 root HTML，在**原路徑**保留 stub：
- `<link rel="canonical" href="<新相對路徑>">`
- `<meta http-equiv="refresh" content="0; url=<新相對路徑>">`
- 內聯 JS：`location.replace('<新相對路徑>')`（用 replace 不留 history）
- `<noscript>` + 可見 fallback 連結（清楚文字，指向新位置）
- stub 路徑一律相對、保持 `/ai-learning/` 相容；**不可硬編完整網域**（除 canonical 可用站內相對）。
- 入 `archive/` 且不部署者**不設 stub**（接受 URL 失效）。

## 14. Link checker / baseline 策略
- 建一個本機 / CI script（Node 或 shell），輸入 repo root，掃：
  HTML `href`/`src`、inline/外部 JS 的 `location.href=`、字串拼接路徑啟發式、`fetch('./…')`、
  CSS `url()`/`@import`、favicon/og/canonical。
- 對每個內部相對連結，解析目標檔是否存在；輸出 dangling 清單（檔:行）。
- 排除外部 `http(s)`、CDN、GAS、GitHub API。
- baseline（搬檔前）數量記入 Phase 0 PR；之後每階段對比，目標趨向 0。
- 放 `tests/` 或 `scripts/`（非部署）。

## 15. GitHub Pages workflow 更新策略
- **在 Phase 0 就切換為黑名單式 copy**（不再等 Phase 4）：`rsync`／`cp` 全 repo 入 `site/`，
  排除清單 `archive/ PLANNING/ REFERENCE/ gas/ tests/ scripts/ prompts/`（按需另加 `.git .github *.md`），
  令日後新增資料夾自動部署、唔使逐個補。
  **理由**：Phase 2/3 搬檔後 redirect stub 指向**新建資料夾**,若新資料夾未部署則 stub 目標 404；
  故必須喺搬檔之前先令新資料夾會自動出街。
- 切換時須確認現有頁面出街不變（黑名單後 copy 範圍只增不減）。
- `archive/` 依決定 C 預設**在排除清單內**（不部署）。
- Phase 0 link checker 須確認「被引用但未部署」目錄（如 `ch11-geometry-flashcard/`）；切換黑名單後
  應一併解決,但要實證。
- 保 `.nojekyll`；每次部署後核 `site/` tree 包含預期資料夾。

## 16. Auth / PROJECT_BASE 檢查策略
- 最小版**不搬 `js/`**，PROJECT_BASE 不受影響（最安全）。
- 若任何階段搬 `js/`（例如 `assets/js/`）：
  - 同步改 `auth-state.js` 內 `/\/js\/[^/?#]+(\?.*)?$/` 為新路徑模式；
  - 確認 `detectBase()` 仍 resolve 到 `/ai-learning/`；
  - 出街實測：登入 modal、widget render、跨頁保持、跨 tab storage 同步、登出。
- 每頁 `<script src="…/firebase-config.js">`、`auth-state.js`、`auth-widget.css` 的相對深度，
  搬頁後必須一併更新並實測。

## 17. Archive 判斷準則（逐項，全部成立才可入 archive）
某檔可入 `archive/` 僅當以下**全部**成立：
1. 無任何**部署中**頁面以 `href/src/JS/fetch` 引用（經 link checker 確認）。
2. 非首頁、年級入口、課堂流程、老師工具、資料處理流程的一部分。
3. 屬下列之一：與保留版本**位元組重複**、明顯誤上傳（如 `JLPT-N1.html` 與數學科無關）、
   或作者確認棄置。
4. **半完成 ≠ 棄置**：未完成但仍可能課堂用嘅工具**不**入 archive（標「測試中」即可）。
5. owner 對清單逐項確認。
> 不可盲搬、不可盲刪、不可因不完整而移除。

## 18. 實作 AI PR 前測試清單（每階段）
- [ ] link checker 跑過，dangling 數有記錄（目標趨 0）
- [ ] `git diff` 確認只 `git mv` + 路徑改寫，無內容竄改
- [ ] 首頁入口、側選單、`goToCh` 動態導航可達新位置
- [ ] redirect stub：舊 URL 自動跳新位置（含 noscript fallback）
- [ ] 相對路徑無誤用根 `/`；`/ai-learning/` 相容
- [ ] css/js/firebase/auth 引用在搬位後仍正確載入（無 404、無 console error）
- [ ] 本地 fetch（exam/hkdse JSON）仍 200
- [ ] desktop 1280×720 + mobile 390×844 + 320×568 主要流程可用
- [ ] 未登入主要工具仍可用；（如涉 js/）登入實測正常

## 19. PR 描述要求
每階段 PR 必須包含：
- 引用本 planning：`PLANNING/20260620_REPO_RECLASSIFY_V1.md` + Phase 編號
- 本階段搬咗邊啲檔（`git mv` 對照表：舊路徑 → 新路徑）
- 連結改寫摘要 + link checker 前後 dangling 數
- redirect stub 清單
- workflow / auth regex 是否改動及原因
- 測試結果（§18）、未完成項目、剩餘風險、回退方式
- **誠實標明**：若 self-review，註明非獨立 review

## 20. Ready Review 時 Codex 要檢查的項目
- [ ] 改動檔案與本階段 scope 一致，無越界（特別係無順手改題目／答案／遊戲／登入功能）
- [ ] `git mv` 有保留歷史；無內容竄改
- [ ] link checker 0 dangling（或差異有合理解釋）
- [ ] redirect stub 齊全且只用相對路徑；舊書籤可達
- [ ] 相對路徑深度正確；無硬編根 `/`；`/ai-learning/` 保留
- [ ] 動態 JS 導航（`goToCh` 等）已改
- [ ] css/js/firebase/auth 引用正確；（如搬 js/）PROJECT_BASE 已改且實測
- [ ] 部署清單已更新，新資料夾會出街；`archive/` 依決定 C
- [ ] 訪客主要流程免登入仍可用；無新增公開 secret
- [ ] PR 描述與實際 diff 一致；測試可信
- [ ] 明確 `Ready for OpenClaw check/test/merge` 或 `Not ready` + 修正指示

---

## 附：本 planning 未決、待 owner 拍板（摘要）
A 分類法（建議混合）｜B 先做最小版（建議是）｜C archive 不部署（建議是）｜
D 命名 topics/grades、games-index 收斂、JLPT-N1 歸檔、assets/ 化時機。

*本文件只定案 planning。未經 owner 拍板及指派，不開始 Phase 0 實作、不搬檔、不改功能。*
