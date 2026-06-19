# 20260619_DESIGN_SYSTEM_TOKENS_V1

> 作者：Claude Code（delivery mode，依 CLAUDE.md v2，使用者明確指派「接入正式網站 tokens」）
> 來源：使用者上傳的「少康數學 Design System」(distilled from this repo；含 tokens/components/SKILL)。
> 性質：跨頁基礎建設第一階段。經 PR 交付,**未經授權不 merge**。

## 1. 背景

使用者提供一套由本 repo 蒸餾出嚟嘅 Design System,內含 `tokens/*.css`(colors / typography /
spacing / effects)、React 元件、UI kit 及 `SKILL.md`。經核對,token 值與 `css/styles.css`
現有值一致(如 `--color-s1:#ff6b6b`、`--color-exam:#27ae60`、招牌漸層 `#667eea→#764ba2`)。

使用者選擇方向：**接入正式網站 tokens**。本 planning 定義安全、可回退嘅 **Phase 1**。

## 2. 現況分析

- 相關首頁入口：全站(所有 link `css/styles.css` 嘅頁面,首頁及各課題頁)。
- 相關檔案：`css/styles.css`(已有自己一套 `:root` 變數)；新增 `css/tokens/*.css`。
- 目前行為：`css/styles.css` 用自家命名變數(`--color-primary`、`--color-s1..s6`、
  `--color-exam`、`--radius-*`、`--shadow-*`、`--font-main`),頁面內仍有大量硬編碼色值。
- 已知問題：tokens 散落、命名不統一、無單一 token 來源。
- 安全或私隱風險：無(純樣式)。

## 3. 使用者要求整理

把 Design System 嘅 tokens 接入正式網站,作為日後統一樣式嘅單一來源。

## 4. 產品原則（必須符合）

- 訪客主要流程免登入可用 —— 本次純樣式,不影響。
- 不破壞現有課堂頁面外觀 —— **Phase 1 要求零視覺變化**。
- 不新增公開 secret。
- GitHub Pages 路徑保留 `/ai-learning/`;token 用相對路徑 `@import`。

## 5. 實作範圍

### Phase 1（本 PR）— 只做基礎接入,零視覺變化

可以修改：

- 新增 `css/tokens/colors.css`、`typography.css`、`spacing.css`、`effects.css`
- `css/styles.css`：頂部 `@import` 四個 token 檔；將 6 個年級色變數改為引用 DS token

**設計保證零視覺變化的機制：**

1. `@import` 放喺 `css/styles.css` 最頂(CSS 規定 @import 須先於其他規則）。
2. DS tokens 多數用**不同命名**(`--grade-*`、`--accent-*`、`--tag-*`、`--space-*`、
   `--text-*`、`--leading-*`、`--radius-pill`…)→ 只係**新增**變數,唔覆蓋現有。
3. 少數同名變數(`--color-primary`/`--color-bg`/`--color-border`/`--color-dark`/
   `--font-main`/`--radius-*`/`--shadow-*`)：因 import 在前、`css/styles.css` 自家 `:root`
   在後,**cascade 由站方值勝出** → 維持現狀。其中 `--color-dark` 站方 `#2c3e50` 會繼續
   覆蓋 DS 嘅 `#34495e`(命名語義差異留待 Phase 2 對齊)。
4. 6 個年級色改為 `var(--grade-sN)`,而 `--grade-sN` 值與原硬值**完全相同** → 渲染不變。
5. **Noto Sans TC 的 Google Fonts `@import` 在 `css/tokens/typography.css` 內刻意停用**,
   確保唔新增網絡請求、唔改字體渲染。

### 不在本 PR（需另行批准的後續階段）

- 逐頁／逐元件把硬編碼 hex 改用 token(219 個 HTML,高風險,須分批 + 出街驗證)。
- 引入 DS 嘅 React 元件 / UI kit / SKILL(使用者今次只選 tokens)。
- 啟用 Noto Sans TC webfont site-wide。
- 對齊同名 token 語義差異(如 `--color-dark`)。
- 任何題庫、答案、遊戲邏輯、導航或行為改動。

## 6. 具體任務（本 PR 已完成）

1. 新增 `css/tokens/{colors,typography,spacing,effects}.css`。
2. `css/styles.css` 頂部 `@import` 四個 token 檔。
3. `css/styles.css` 6 個年級色改引用 `var(--grade-sN)`(同值)。
4. `css/tokens/typography.css` 停用 webfont `@import`(保留變數)。

> 部署：`.github/workflows/pages-deploy.yml` 以 `cp -Rv css/* site/css/` 遞迴複製,
> `css/tokens/` 會自動部署,**無需改 workflow**。

## 7. 驗收條件

- [ ] 新增 4 個 `css/tokens/*.css`,`css/styles.css` 正確 `@import`。
- [ ] 6 個年級色經 `var(--grade-sN)` 解析,值不變。
- [ ] 首頁及課題頁外觀**與接入前一致**(零視覺變化)。
- [ ] 無新增網絡請求(webfont 未啟用)。
- [ ] 無 console error、404、錯誤根路徑。
- [ ] 未登入主要流程不受影響。

## 8. 測試

- **靜態核對(已做)**：token 值與站方原值逐一比對相同；@import 置頂;cascade 由站方
  `:root` 勝出於同名變數;年級色 `var(--grade-sN)` 同值。
- **出街驗證(merge 後做)**：部署後比較首頁／一個課題頁／一個遊戲頁,確認外觀不變、
  grade 色正確、無 console error;桌面 1280×720 + 手機 390×844 + 320×568。

> ⚠️ 本環境無法 HTTP 抓取正式網站(沙箱封鎖,統一 403),出街視覺驗證需在合併部署後,
> 由有網絡者(或下一個 session)肉眼確認。

## 9. PR 指示

- Planning file：`PLANNING/20260619_DESIGN_SYSTEM_TOKENS_V1.md`
- 改動檔案：`css/styles.css` + `css/tokens/*.css`(4 new) + 本 planning
- 自我 review：本 PR 由 Claude 自我檢視(非獨立 review);diff 已逐項核對範圍。
- 殘留風險：零視覺變化基於靜態推論 + 值相等,出街肉眼驗證仍未做(見 §8)。
- **未經使用者授權不 merge。**
