# 20260611_NAV_DEADLINKS_INFOGRAPHIC_FIX_V1

> 草擬：Claude Code（產品／UX oversight），交由 Codex 採納為正式 planning 並做 Ready Review。
> 來源：`REFERENCE/20260611_REPO_FULL_AUDIT.md`（§10、§12、§14）。
> 性質：兩個**已確認、低風險、高可信**的正式網站缺陷修正（do-now）。不涉登入、不涉題庫答案。

## 1. 背景

`ai-learning` 正式網站（GitHub Pages，base `/ai-learning/`）有兩個已由源碼確認的缺陷：

1. **S1Ch13 視覺學習圖 6 張圖在正式網站 404。** `S1Ch13.html` 是首頁可達的課題頁，
   內含「📊 視覺學習圖」區，6 張 `<img src="infographics/images/ch13_*.jpg">`。圖檔存在於
   repo，但 `infographics/` **不在部署 workflow 的複製白名單**，故正式網站無此目錄 → 圖 404。
2. **老師區「校內卷三 OCR 審核」是死連結。** 首頁老師區連到 `exam/review-p3.html`，
   但 `exam/` 只有 `review-p1.html` 與 `review-p2.html`，並無 p3 → 點擊 404。

兩者均不影響免登入主要流程，但分別令一個課題頁顯示破圖、一個老師入口失效。

## 2. 現況分析

- **相關首頁／頁面入口：**
  - `S1Ch13.html`（首頁 → 中一 → Ch13）
  - 首頁老師區（輸入前端密碼後顯示）
- **相關檔案：**
  - `S1Ch13.html:379-384` — 6 個 `<img src="infographics/images/ch13_sf.jpg">` 等
  - `infographics/images/ch13_*.jpg` — 圖檔存在（已確認 7 個 ch13_*.jpg）
  - `.github/workflows/pages-deploy.yml` — 部署白名單（無 `infographics/`）
  - `index.html:529` — `<a href="exam/review-p3.html" ...>📝 校內卷三 OCR 審核 →</a>`
  - `exam/`：只有 `review-p1.html`、`review-p2.html`（無 p3）
- **目前行為：**
  - S1Ch13 視覺學習圖區在正式網站顯示破圖（本機開檔正常，故易被忽略）。
  - 老師點「校內卷三 OCR 審核」得 404。
- **已知問題：** 見 §1。
- **安全或私隱風險：** 無。`infographics/` 內只有教學圖與 HTML，無 secret。

> 補充：在已部署頁面中，只有 `S1Ch13.html` 引用 `infographics/`；`infographics/*.html`
> 標準頁本身無入口，屬另案清理候選（見本檔 §6 任務 3 與隨附 cleanup brief），本 PR 不處理。

## 3. 使用者要求整理

- S1Ch13 視覺學習圖在正式網站能正常顯示。
- 老師區不再有指向不存在頁面的死連結。

## 4. 產品原則（必須符合）

- 主要學生流程免登入可用 —— 本 PR 不改登入。
- 不破壞現有課堂工具、不改題庫／答案／OCR 資料。
- 不新增公開密碼、token 或私隱風險。
- GitHub Pages 路徑保留 `/ai-learning/`；新增部署目錄須維持相對路徑引用。

## 5. 實作範圍

實作 AI **可以修改**：

- `.github/workflows/pages-deploy.yml`（新增 `infographics/` 到複製步驟）
- `index.html`（移除或停用 `exam/review-p3.html` 死連結）

實作 AI **不應修改**：

- `S1Ch13.html` 的圖片路徑（路徑本身正確，問題在部署，不要改成絕對路徑或搬圖以免擴大範圍）
- 任何題庫、答案、OCR JSON、試卷、遊戲邏輯
- 登入、auth widget、老師密碼機制
- `infographics/` 內的標準 HTML 頁（清理屬另案）

## 6. 具體任務

1. **部署 `infographics/`**：在 `.github/workflows/pages-deploy.yml` 的「Prepare site
   directory」步驟，比照現有目錄加入：
   ```bash
   mkdir -p site/infographics
   cp -Rv infographics/* site/infographics/ || true
   ```
   目的：令 `site/infographics/images/ch13_*.jpg` 存在，修正 S1Ch13 破圖。
   （最小可行；如只想部署圖片，可改為僅複製 `infographics/images/`，但整目錄複製較不易再漏。）

2. **修死連結**：在 `index.html` 老師區（約 `:529`），移除「校內卷三 OCR 審核」連結，
   或改為停用狀態（如 `校內卷三 OCR（未提供）` + 不可點），與同區「成績統計：即將推出」
   一致。**不要**新建 `exam/review-p3.html`（目前無 p3 OCR 流程，建空頁只會製造另一個半成品）。

3. **（可選，建議）** 在 PR 描述列出本次掃描確認：除 `S1Ch13.html` 外，無其他已部署頁面
   引用 `infographics/`；`exam/` 確無 `review-p3.html`。

## 7. 驗收條件

- [ ] 正式網站 `/ai-learning/S1Ch13.html` 的「視覺學習圖」6 張圖全部載入（無 404）。
- [ ] 正式網站 `/ai-learning/infographics/images/ch13_sf.jpg` 等可直接 200。
- [ ] 老師區不再有指向 `exam/review-p3.html` 的可點死連結。
- [ ] 其餘 S1Ch13、首頁、老師區功能不變。
- [ ] 無新增 console error、404（除已移除者）、錯誤根路徑或公開 secret。

## 8. 實作 AI PR 前測試清單

- [ ] 本地預覽 S1Ch13 視覺學習圖正常（本機本來就正常，重點在部署後）
- [ ] 部署後（或 Actions artifact）確認 `site/infographics/images/ch13_*.jpg` 存在
- [ ] 老師區死連結已移除／停用
- [ ] 手機 390×844 與桌面 1280×720：S1Ch13 圖片網格不 overflow
- [ ] 無新增根路徑 `/` 誤用（`infographics/` 引用維持相對路徑）

## 9. PR 指示

PR 描述須包含：

- Planning file：`PLANNING/20260611_NAV_DEADLINKS_INFOGRAPHIC_FIX_V1.md`
- 修改檔案：`.github/workflows/pages-deploy.yml`、`index.html`
- 測試結果：S1Ch13 圖片 200、老師區死連結已除
- 風險與未完成項目：`infographics/*.html` 標準頁清理屬另案；本 PR 不處理登入與題庫
