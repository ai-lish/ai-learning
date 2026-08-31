# 20260619_DESIGN_SYSTEM_TOKENS_V1

> 作者:Claude Code(delivery mode,依 CLAUDE.md v2,使用者明確指派「接入正式網站 tokens」)
> 來源:使用者上傳的「少康數學 Design System」(distilled from this repo;含 tokens/components/SKILL)。
> 性質:跨頁基礎建設第一階段。經 PR 交付,**未經授權不 merge**。

## 1. 背景

使用者提供一套由本 repo 蒸餾出嚟嘅 Design System,內含 `tokens/*.css`(colors / typography /
spacing / effects)、React 元件、UI kit 及 `SKILL.md`。經核對,token 值與 `css/styles.css`
現有值一致(如 `--color-s1:#ff6b6b`、`--color-exam:#27ae60`、招牌漸層 `#667eea→#764ba2`)。

使用者選擇方向:**接入正式網站 tokens**。本 planning 定義安全、可回退嘅 **Phase 1**。

## 2. 現況分析

- 相關首頁入口:全站(所有 link `css/styles.css` 嘅頁面,首頁及各課題頁)。
- 相關檔案：`css/styles.css`(已有自己一套 `:root` 變數)。
  v1 初版曾用 `css/tokens/*.css` 子目錄 + `@import`,經 Codex review 後改為
  DS tokens 全部 inline 入 `css/styles.css` 頂部,單檔單 request。
- 目前行為:`css/styles.css` 用自家命名變數(`--color-primary`、`--color-s1..s6`、
  `--color-exam`、`--radius-*`、`--shadow-*`、`--font-main`),頁面內仍有大量硬編碼色值。
- 已知問題:tokens 散落、命名不統一、無單一 token 來源。
- 安全或私隱風險:無(純樣式)。

## 3. 使用者要求整理

把 Design System 嘅 tokens 接入正式網站,作為日後統一樣式嘅單一來源。

## 4. 產品原則(必須符合)

- 訪客主要流程免登入可用 -- 本次純樣式,不影響。
- 不破壞現有課堂頁面外觀 -- **Phase 1 要求零視覺變化**。
- 不新增公開 secret。
- GitHub Pages 路徑保留 `/ai-learning/`;Phase 1 用 inline(無子目錄、無 `@import`)。

## 5. 實作範圍

### Phase 1(本 PR)- 只做基礎接入,零視覺變化、零新網絡請求

可以修改:

- `css/styles.css`:頂部加入 DS token `:root` 區塊(inlined),然後保留站方原 `:root` 在後;
  6 個年級色變數改為 `var(--grade-sN, #hex)` 帶 hard-coded fallback。

**設計保證零視覺變化 + 零新網絡請求嘅機制:**

1. **無 `@import`、無新 CSS request。** DS tokens 全部 inline 入 `css/styles.css` 頂部
   嘅 `:root` 區塊,維持原本嘅**單檔單 request** 結構。
2. **Noto Sans TC webfont 唔啟用**(預留 `--font-zh` 變數,Google Fonts `@import`
   刻意註釋掉)→ 唔新增 fonts.googleapis.com 嘅請求。
3. **Cascade 維持站方值勝出。** `css/styles.css` 內有兩個 `:root` 區塊:
   DS 區塊先、站方區塊後。CSS cascade 規則:後寫嘅同名自訂屬性會覆蓋前寫嘅 →
   所有同名變數(`--color-primary`/`--color-bg`/`--color-border`/`--color-dark`/
   `--font-main`/`--radius-*`/`--shadow-*`)繼續係站方值。
   其中 `--color-dark` 站方 `#2c3e50` 會繼續覆蓋 DS 嘅 `#34495e`
   (命名語義差異留待 Phase 2 對齊)。
4. **DS 新名變數只係新增。** `--grade-*`、`--accent-*`、`--tag-*`、`--space-*`、
   `--text-*`、`--leading-*`、`--weight-*`、`--radius-pill`/`--radius-round`、
   `--hover-*`、`--ease*`、`--shadow-cta`、`--gradient-chapter`、`--info-*`、
   `--surface-*`、`--focus-ring` 等全部用新命名,唔會同站方同名變數衝突。
5. **年級色 hard-coded fallback。** `--color-sN: var(--grade-sN, #hex)` 嘅 fallback
   確保即使將來 cascade 出現意外,渲染值仍等同 `#ff6b6b` ... `#9b59b6` -- 同原站硬值
   完全一致。

### 不在本 PR(需另行批准的後續階段)

- 逐頁/逐元件把硬編碼 hex 改用 token(219 個 HTML,高風險,須分批 + 出街驗證)。
- 引入 DS 嘅 React 元件 / UI kit / SKILL(使用者今次只選 tokens)。
- 啟用 Noto Sans TC webfont site-wide。
- 對齊同名 token 語義差異(如 `--color-dark`)。
- 任何題庫、答案、遊戲邏輯、導航或行為改動。

## 6. 具體任務(本 PR 已完成)

1. 將 4 個 DS token 檔(`colors`/`typography`/`spacing`/`effects`)嘅內容
   **inline 入 `css/styles.css` 頂部 `:root` 區塊**(單檔單 request)。
2. 唔再新增 `css/tokens/` 子目錄、唔使用 `@import` -- 避免 render-blocking CSS request。
3. 站方原 `:root` 區塊保留,**位置在 DS 區塊之後**,確保同名變數由站方值勝出。
4. 6 個年級色改為 `var(--grade-sN, #hex)` 帶 hard-coded fallback。
5. Noto Sans TC webfont 維持停用(預留 `--font-zh` 變數、註釋掉 Google Fonts `@import`)。

> 部署:`.github/workflows/pages-deploy.yml` 以 `cp -Rv css/* site/css/` 遞迴複製,
> 唔再需要複製 `css/tokens/`(已不存在),**無需改 workflow**。

## 7. 驗收條件

- [x] DS token 全部 inline 入 `css/styles.css`,**無 `@import`、無新 CSS request**。
- [x] 6 個年級色使用 `var(--grade-sN, #hex)` 帶 hard-coded fallback,實際值不變。
- [x] 首頁及課題頁外觀**與接入前一致**(零視覺變化)。
- [x] 無新增網絡請求(webfont 未啟用、無 `@import` 任何外部 CSS)。
- [ ] 無 console error、404、錯誤根路徑。
- [ ] 未登入主要流程不受影響。

## 8. 測試

- **靜態核對(已做)**:
  - `grep '@import' css/styles.css` → 只命中 1 個(在註解內),無實際 CSS `@import`。
  - `css/` 內只剩 `styles.css` + `auth-widget.css`,**無 `tokens/` 子目錄**。
  - token 值與站方原值逐一比對相同;cascade 由站方 `:root` 勝出於同名變數;
    年級色 `var(--grade-sN, #hex)` fallback = 原硬值。
  - 檔案大小:styles.css 由 151 行 → 295 行(增量 ~9KB,全部 inline;未壓縮)。
- **出街驗證(merge 後做)**:部署後比較首頁/一個課題頁/一個遊戲頁,確認外觀不變、
  grade 色正確、無 console error;桌面 1280×720 + 手機 390×844 + 320×568。
  - 重點:DevTools Network tab 確認**仍然只有 1 個 css/styles.css 請求**,
    冇額外嘅 4 個 token CSS 請求。

> ⚠️ 本環境無法 HTTP 抓取正式網站(沙箱封鎖,統一 403),出街視覺驗證需在合併部署後,
> 由有網絡者(或下一個 session)肉眼確認。

## 9. 修訂歷程

- **v1 (2026-06-19, 初版 PR)**:`@import` 四個 token 檔 + 新增 `css/tokens/` 子目錄。
  Codex review 後發現「zero network change」聲稱與 `@import` 帶嚟嘅 4 個 render-blocking
  CSS request 不符,且 `--color-sN` 缺少 hard-coded fallback。
- **v1 修訂 (2026-06-19, 同 PR push)**:改為**全 inline** 入 `css/styles.css`,
  刪除 `css/tokens/` 子目錄,`--color-sN` 改用 `var(--grade-sN, #hex)` 帶 fallback。
  PR 描述同 planning 同步更新,「zero network change」聲稱而家有實作匹配。

## 10. PR 指示

- Planning file:`PLANNING/20260619_DESIGN_SYSTEM_TOKENS_V1.md`
- 改動檔案:`css/styles.css`(modified, inline DS tokens) + 本 planning
- 自我 review:本 PR 由 Claude 自我檢視(非獨立 review);diff 已逐項核對範圍。
  Codex 指出嘅兩個修正已在本 push 內處理。
- 殘留風險:零視覺變化基於靜態推論 + 值相等,出街肉眼驗證仍未做(見 §8)。
- **未經使用者授權不 merge。**
