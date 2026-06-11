# REPO_MAP — ai-lish/ai-learning

> 建立日期：2026-06-11
> 建立者：Claude Code（產品／UX oversight，audit mode）
> 對應 commit：`0997e4d`（branch `claude/ai-learning-repo-audit-jde2j7` 起點 = `origin/main`）
> 正式網站：<https://ai-lish.github.io/ai-learning/>（GitHub Pages，base path `/ai-learning/`）

本檔是「在哪裡找東西」的導航地圖，不是功能完成度證明。完成度與風險見
`REFERENCE/20260611_REPO_FULL_AUDIT.md`。

repo 共約 2007 個 tracked 檔案，主要類型：jpg ~970、json ~332、png ~267、
html ~219、txt ~90、svg ~38、md ~37、py ~13、js ~12。大量為圖像、OCR、
題庫資料；只有少量為實際程式入口。

---

## 1. 主要目錄用途

| 目錄／檔案 | 用途 | 是否部署到 GH Pages |
|---|---|---|
| `index.html` | 全站首頁／統一入口（含年級分頁、考試專區、班務工具、老師登入、功課日曆、通告） | ✅ |
| `S1Ch*.html` `S2Ch10.html` `S3Ch*.html` `S4Ch3*.html` `S5*.html` | 各年級課題頁（root level） | ✅（root `*.html`） |
| `s1/selfstudy/` | 中一自學練習（~35 html，practice-*.html + index） | ✅ |
| `s3/selfstudy/` | 中三自學練習（~17 html，practice-*.html + index） | ✅ |
| `games/` | 課題遊戲（48 個 html）+ `games/index.html` 目錄頁 | ✅ |
| `games-index.html` | root 層遊戲入口（首頁連到此，再可連 `games/`） | ✅ |
| `exam/` | 校內考試專區：練習、OCR 審核、仿題、評分、各學期試卷資料 | ✅ |
| `hkdse/` | HKDSE 題庫與 workflow：DSE 練習頁、OCR python、仿題 generator、GAS project | ✅ |
| `student/` | 學生個人區：`dashboard/index.html`、`change-password.html`（mock／降級狀態） | ✅ |
| `login/` | 舊版登入頁，現為兼容轉址 shell（轉去 `/ai-learning/` 並開頁內 modal） | ✅ |
| `js/` | 共用 JS：目前只有 `auth-state.js`（全站登入殼） | ✅ |
| `css/` | 共用 CSS：`styles.css`、`auth-widget.css` | ✅ |
| `tools/` | 獨立工具：`slp-split-pdf.html`（PDF 分割） | ✅ |
| `projects/` | 子專案：`s3-ch8-trig-elevation/`（三角仰角） | ✅ |
| `images/` | 全站圖像資產（logo 等） | ✅ |
| `infographics/` | 視覺化資訊圖（index + S1Ch11/S1Ch13 infographic） | ❌ 未在 deploy copy 清單 |
| `content/` | `content/admin/status.md` 等管理文字 | ❌ 未部署 |
| `ch11-geometry-flashcard/` `ch11-probability-flashcard/` | 獨立 flashcard 工具 | ❌ 未部署（但內部有絕對 GH Pages 連結，需確認） |
| `gas/` | Google Apps Script 原始碼 | ❌ 未部署（正常，後端碼） |
| `prompts/` | AI prompt 文字 | ❌ 未部署 |
| `tests/` | 測試腳本 | ❌ 未部署 |
| `planning/`（小寫） | 早期 planning（s1 selfstudy、flashcard、rainbow） | ❌ 未部署 |
| `PLANNING/`（大寫） | 正式 planning workflow（login/Firebase、home entry） | ❌ 未部署 |
| `REFERENCE/` | 參考資料、規格、audit、repo map | ❌ 未部署 |
| `scripts/` `gas/` `*.py` `*.js`(root tools) | 製作／OCR／評分腳本，本機執行 | ❌ 未部署 |

> ⚠️ Deploy 清單由 `.github/workflows/pages-deploy.yml` 明確列出（見 §11）。
> 任何不在清單內、但被某頁 `<a href>` 連到的子目錄工具，會在正式網站 404。

---

## 2. 主要入口（學生可由首頁到達）

`index.html` 的 `showSection()` 分頁切換（非真實導航），主要區塊：

- 學習快速入口卡片：中一／中三／中四／中五／中二課題、考試專區、遊戲與挑戰、
  我的學習紀錄、班務工具、數學小故事
- 年級分頁：中一～中六（中六目前無內容）
- 考試專區分頁：校內考試練習 + DSE 練習
- 班務工具分頁（`tools` section）：座位表、PDF 工具、外部工具
- 老師／管理區塊：前端密碼閘（見 §4）

實際 root 課題頁：S1Ch1–S1Ch13、S2Ch10、S3Ch2/4/7/8/9/11、S4Ch3（+ line 子頁）、
S5Tutorial/Ch14/Ch17/Ch18。

---

## 3. 共用檔案（site-wide shared）

| 檔案 | 角色 |
|---|---|
| `css/styles.css` | 首頁主要樣式 |
| `css/auth-widget.css` | 右上角登入 widget + modal 樣式 |
| `js/auth-state.js` | 全站登入殼（widget 自動 render、頁內 modal、跨 tab storage 同步） |
| `images/logo.png` | 站徽 |
| `.nojekyll` | 令 GH Pages 原樣 serve |

接入 `auth-state.js` / `auth-widget.css` 的頁面目前僅部分（首頁、s3 selfstudy index、
student dashboard 等已確認；大量獨立課題／遊戲頁尚未接入 — 見 audit §12）。

---

## 4. 登入與權限相關檔案

| 檔案 | 角色 | 現況 |
|---|---|---|
| `js/auth-state.js` | 登入殼，身份來源 = localStorage legacy keys（`student_token` 等），登入靠 GAS endpoint POST（班別／學號／密碼） | v1.1，**仍是 legacy GAS，未接 Firebase** |
| `login/index.html` | 兼容轉址 shell，帶 `auth=open` 開頁內 modal | 已降級為轉址 |
| `student/dashboard/index.html` | 學生 Dashboard，XP／題數／徽章為示範 mock | 未同步真實資料 |
| `student/change-password.html` | 改密碼頁 | endpoint 佔位／降級 |
| `index.html`（老師登入） | 前端密碼閘 `TEACHER_PASSWORD`（明文，見 audit Critical/High） | 純前端，非真實授權 |

> 共用 Firebase Google 登入（`PLANNING/20260609_..._GOOGLE_V2.md`）**只有 planning，未實作**：
> 全 repo grep `initializeApp|getAuth|firebaseConfig|GoogleAuthProvider` = 0 命中。

---

## 5. Firebase 相關檔案

目前 **repo 內無任何 Firebase SDK、config 或初始化程式**。Firebase 只存在於 planning
文件（V1 比較方案、V2 Google 登入規劃）。詳見 audit §8。

---

## 6. 學生工具（guest 可用）

- 課題頁：root `S1Ch*` / `S2Ch10` / `S3Ch*` / `S4Ch3*` / `S5*`
- 自學練習：`s1/selfstudy/`（含第二／第三學期甲部溫習）、`s3/selfstudy/`、`s3甲部基礎練習.html`
- 遊戲：`games/`（48）、入口 `games-index.html` → `games/index.html`
- 考試練習：`exam/practice.html`、`exam/index.html`
- DSE 練習：`hkdse/dse-practice-p1.html`、`hkdse/dse-practice-p2.html`、`hkdse/guide.html`
- 課題互動／概念：`S4Ch3-line-*.html`、`straight-line.html`、`stories.html`、
  `infographics/`（未部署）、`ch11-*-flashcard/`（未部署）
- 故事：`stories.html`

## 7. 老師／管理工具（前端密碼後顯示）

- DSE OCR 審核：`hkdse/review_p1.html`、`review_p2.html`、`review_p1_answers.html`
- 校內考試 OCR：`exam/review-p1.html`、`review-p2.html`、`review-p3.html`
- 仿題模板：`exam/practice.html`、`hkdse/mimic-generator/template-editor-v3.html`
- 功課／通告編輯：首頁 admin FAB + announcement modal（寫入 GAS，見 §9）
- 成績統計：標示「即將推出」

## 8. 考試與 HKDSE

- `exam/`：學期試卷資料夾（2024-25 / 2025-26、s1 / s3 / s5、term2 / term3）、
  `ocr/`、`mimic/`、`scoring.py`、`pdf-question-splitter.py`
- `hkdse/`：`dse-practice-p1/p2.html`、`dse-topic-map*.js`、OCR python
  (`ocr_p1_minimax.py`、`dualpath_*.py` 等)、`gas-project/Code.gs`、
  `mimic-generator/`、`evidence/`、`planning/`、JSON 題庫（p2_*.json）
- `REFERENCE/exam/`：S5 2025-26 Term2 試卷規格與 method 文件

## 9. 外部整合 / 後端

| 整合 | 位置 | 備註 |
|---|---|---|
| GAS 功課／通告 backend | `index.html`：`WEBAPP_URL` + `API_TOKEN`（明文）+ `mode:'no-cors'` | 寫入路徑，無法驗證成功；token 公開（audit Critical） |
| GAS 學生登入 | `js/auth-state.js`：`GWS_ENDPOINT` | 班別／學號／密碼 POST |
| Google Sheets CSV 功課來源 | `index.html`：`CSV_URL`（公開 export csv） | 讀取功課日曆 |
| MiniMax API（仿題） | `exam/mimic/config.js`、`hkdse/mimic-generator/config.js` | 值為 `YOUR_MINIMAX_API_KEY_HERE` 佔位符 |
| 外部工具連結 | `index.html`：image-upscaler、pdf-splitter（另一 GH Pages 專案） | 外部站 |
| MathJax / KaTeX / Google Fonts | 各頁 CDN | — |

## 10. 資產

- `images/`、`infographics/images`、`infographics/group-images`、`hkdse/images*`、
  `hkdse/answer-images`、`exam/ocr`、`exam/<term>/` 內大量 png/jpg（OCR 試卷掃描）
- `REFERENCE/images/`：q*.svg

## 11. 部署設定

- `.github/workflows/pages-deploy.yml`：push 到 `main` 時觸發，**明確白名單** copy：
  root `index.html` + root `*.html`、`games/`、`student/`、`login/`、`css/`、`images/`、
  `js/`、`projects/`、`hkdse/`、`exam/`、`s1/`、`s3/`、`tools/` → `site/` → upload Pages。
- 不在清單 = 不部署（`infographics/`、`content/`、`ch11-*-flashcard/`、`gas/`、`prompts/`、
  `tests/`、`planning/`、`PLANNING/`、`REFERENCE/`）。
- `.nojekyll` 存在。
- `push.sh`、`scripts/run_year.sh`：本機輔助腳本。

## 12. Planning 與管理文件

| 檔案 | 內容 |
|---|---|
| `PROJECT.md` | 權威產品／工程規格（訪客優先、登入增強、安全底線、測試矩陣、路徑規則） |
| `CLAUDE.md` | Claude 為產品／UX oversight 角色 |
| `CODEX.md` / `AGENTS.md` | Codex planning steward / Ready Review |
| `OPENCLAW.md` / `GEMINI.md` / `.github/copilot-instructions.md` | 各實作／merge agent 指引 |
| `PLANNING/README.md` | Planning workflow、命名、模板 |
| `PLANNING/20260607_HOME_ENTRY_ORGANIZATION_V1.md` | 首頁入口整理（已大致實作） |
| `PLANNING/20260608_GLOBAL_LOGIN_FIREBASE_V1.md` + `_DEBUG_1.md` | 登入殼 v1 + debug（已實作 legacy 版） |
| `PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md` | Firebase Google 登入（**未實作**） |
| `planning/`（小寫） | 早期 planning：s1 selfstudy、ch11 flashcard、rainbow |
| `README.md` | **過時**（2024-04-20 測試結論、`exam/ 404` 等已不符現況） |
| `REFERENCE/` | PROJECT-PLAN、SYSTEM、CSV_URL、exam 規格、本 map、full audit |
