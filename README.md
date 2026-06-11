# ai-learning — 少康老師數學教學網站

> 香港中學數學互動教學網站 ｜ 課題教材 + 自學練習 + 數學遊戲 + 校內考試 + HKDSE 工具
>
> **🌐 正式網站：** <https://ai-lish.github.io/ai-learning/>
> **📦 部署：** GitHub Pages（靜態站，base path `/ai-learning/`）
> **🗂️ 最後核對：** 2026-06-11（依 `REFERENCE/20260611_REPO_FULL_AUDIT.md`）

---

## 這是什麼

圍繞香港中學真實課堂、由老師按每次課堂需要逐件製作的數學教學網站。大量功能是
**獨立 HTML 工具**，各自為某一課堂而做；有些完整、有些試驗中、有些已停用。
不要僅因風格不一致或看似未完成就刪除或重寫 —— 先確認它是否仍被首頁、課堂流程或
老師工具使用。

**產品方向：訪客優先、登入增強。** 學生毋須登入即可使用主要教材、練習、遊戲與考試
工具；登入只用來加進度、紀錄等增強功能。

> ⚠️ 專案內含大量歷史上誤上傳、重複或已棄置的檔案。「存在於 repo」不等於「正在使用」。

---

## 技術架構

- **前端：** 純 HTML + CSS + Vanilla JavaScript，無框架、無 bundler；多數工具為單檔內聯。
- **數學渲染：** MathJax / KaTeX（依頁面）。部分遊戲用 Canvas、Tailwind CDN、GeoGebra。
- **「後端」：** Google Apps Script（GAS）+ Google Sheets，用於功課／通告、學生登入、
  quiz 紀錄匯出。少量 Python 用於 OCR、試卷與評分（本機執行，不部署）。
- **部署：** push 到 `main` → `.github/workflows/pages-deploy.yml` 白名單複製到 GitHub Pages。

---

## 網站結構

| 區域 | 入口 | 內容 |
|---|---|---|
| 首頁 | `index.html` | 統一入口：年級分頁、快速入口卡、考試專區、班務工具、功課日曆與通告、老師區 |
| 中一 | root `S1Ch1`–`S1Ch13.html` + `s1/selfstudy/` | 13 課題頁 + 自學練習（含第二／第三學期甲部溫習）|
| 中二 | `S2Ch10.html` | 畢氏定理（標示「測試中」）|
| 中三 | root `S3Ch2/4/7/8/9/11.html` + `s3/selfstudy/` + `s3甲部基礎練習.html` | 課題頁 + 自學練習 |
| 中四 | `S4Ch3.html` + `S4Ch3-line-*.html`、`straight-line.html` | 直線的方程（概念／練習／挑戰）|
| 中五 | `S5Tutorial/Ch14/Ch17/Ch18.html` | 導修 + 課題頁 |
| 遊戲 | `games-index.html` → `games/index.html` | 課題遊戲（約 48 個，涵蓋質因數、有向數、面積、代數、百分法、坐標、指數、體積、三角等）|
| 校內考試 | `exam/index.html`、`exam/practice.html` | 練習載入器（讀本地 OCR JSON）+ 各學期試卷 |
| HKDSE | `hkdse/dse-practice-p1.html`、`hkdse/dse-practice-p2.html`、`hkdse/guide.html` | DSE 卷一／卷二練習與指南 |
| 班務工具 | `seat.html`、`tools/slp-split-pdf.html`、`stories.html`、`math-svg-tools.html` | 座位表、PDF 分割、數學小故事、SVG 工具庫 |
| 我的學習紀錄 | `student/dashboard/index.html` | 登入後個人區（目前為示範數據，標示「測試中」）|

老師工具（OCR 審核、仿題模板、功課／通告編輯）放在首頁「老師區」，目前以**前端密碼**
作入口遮掩 —— 這只是視覺入口，**不是真正的權限保護**。

---

## 登入現況

- **目前實作：** 共用右上角登入 widget（`js/auth-state.js` + `css/auth-widget.css`），
  頁內 modal 登入，狀態存 localStorage、跨頁／跨分頁同步。身份來源仍是**舊版 GAS
  班別／學號／密碼**流程。
- **重要：** 本站**未為學生建立帳號／密碼**。預期方向是 **訪客 + Google 登入**。
- **規劃中（尚未實作）：** Firebase Authentication + Google provider
  （`PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md`）。舊版 GAS 登入屬過渡，
  未來會由 Google 登入取代；在加入任何真實學生紀錄／成績寫入之前，需先有可信身份。
- 未登入仍可完整使用主要學習工具。

---

## 功課與通告（社群共享，非官方頻道）

首頁的功課日曆與通告**刻意開放給同學自由上傳／修改／刪除**，方便互相分享資訊，
不追求絕對準確。資料經 GAS 寫入 Google Sheet，並由公開 CSV 讀回顯示。
> 改進方向（非必要）：限制只有已登入同學可修改，以減少誤改。

---

## 資料儲存

- **本機（localStorage）：** 練習進度（`practice_progress`、`chapter_quiz_progress`）、
  HKDSE 審核狀態（`hkdse_p1/p2_*`）、仿題模板（`hkdse_templates*`）、登入狀態（`student_*`）。
  各工具 schema 尚未統一。
- **雲端（Google Sheets via GAS）：** 功課／通告、學生登入資料、quiz 匯出紀錄。
- **題庫／試卷：** `exam/`、`hkdse/` 內的本地 JSON 與 OCR 圖像。

---

## 部署

```bash
# 編輯後
git add .
git commit -m "說明"
git push origin main          # push 到 main 會觸發 Pages 部署（約 1–2 分鐘）
```

`.github/workflows/pages-deploy.yml` 以**白名單**方式複製到正式網站：
root `*.html`、`games/`、`student/`、`login/`、`css/`、`images/`、`js/`、`projects/`、
`hkdse/`、`exam/`、`s1/`、`s3/`、`tools/`。

> 不在清單內的目錄（如 `infographics/`、`content/`、`ch11-*-flashcard/`、`gas/`、
> `prompts/`、`tests/`、`PLANNING/`、`REFERENCE/`）**不會**出現在正式網站。

---

## 已知狀況（2026-06-11）

- **登入身份不可信（過渡期）：** 舊版 GAS 登入的 token 可預測、不過期、前端不驗證；
  因目前**無受保護資料**，影響有限。加入真實紀錄前須改用可信身份（Google 登入）。
- **前端老師密碼非保安：** 老師區密碼僅作入口遮掩，不保護任何資料或寫入權限。
- **孤立／重複檔案：** repo 內有已部署但無入口、或歷史誤上傳的頁面，多屬測試殘留或棄置，
  應視為清理候選（不代表缺少入口的 bug）。
- **部分死連結：** 例如老師區「校內卷三 OCR」指向尚未建立的頁面。
- **部署體積偏大：** `hkdse/`、`exam/`、`images/` 含大量試卷圖與 PDF，對手機載入不利。

詳細審核與優先次序見 **`REFERENCE/20260611_REPO_FULL_AUDIT.md`**；
目錄與入口地圖見 **`REFERENCE/REPO_MAP.md`**。

---

## 開發協作

本專案以多 AI 代理協作，正式規格與工作流程定義於：

- `PROJECT.md` — 權威產品／工程規格、安全底線、測試矩陣、路徑規則。
- `CLAUDE.md` / `CODEX.md` / `AGENTS.md` / `OPENCLAW.md` / `GEMINI.md` /
  `.github/copilot-instructions.md` — 各代理角色。
- `PLANNING/README.md` 與 `PLANNING/` — 正式 planning 工作流程與歷史。

安全底線（摘要）：不在公開前端放老師／學生密碼、寫入 token 或學生個資；前端角色檢查不等於
授權；`no-cors` 不可假定成功；GitHub Pages 路徑須保留 `/ai-learning/`。

---

## 聯絡

- **作者：** Zach Li（少康老師）
- **用途：** 香港中學數學課堂教學與自學

*本 README 反映 2026-06-11 經核對的實際狀態，取代先前過時版本。*
