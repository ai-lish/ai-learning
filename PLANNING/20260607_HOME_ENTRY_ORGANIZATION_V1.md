# 20260607_HOME_ENTRY_ORGANIZATION_V1

## 1. 背景

本網站是與香港中學實際課堂直接掛勾的數學教學網站，已有大量可用的獨立工具：年級課題、自學練習、校內考試、HKDSE 練習、遊戲、班務工具、老師工具、學生登入與 Dashboard。今次目標不是重寫這些工具，而是先規劃首頁入口重整，建立清楚分類、狀態標籤、老師工具與班務工具分界，令學生和老師都能從首頁快速找到合適入口。

本 planning file 只規劃，不直接實作功能。實作 AI 應在後續 PR 中按本文修改首頁及必要的輕量入口資料，不應改動題庫、答案、OCR 原始資料或學習工具核心邏輯。

## 2. 現況分析

已讀取並納入分析的必讀檔案：

- `AGENTS.md`
- `PROJECT.md`
- `CODEX.md`
- `PLANNING/README.md`
- `index.html`
- `login/index.html`
- `student/dashboard/index.html`
- `student/change-password.html`
- `s1/selfstudy/index.html`
- `s3/selfstudy/index.html`
- `games-index.html`
- `exam/README.md`
- `exam/index.html`
- `hkdse/USER_GUIDE.md`
- `hkdse/dse-practice-p1.html`

### 首頁 `index.html` 目前入口

首頁目前同時是功課與學習資訊系統、年級課題入口、考試專區、DSE 入口、班務工具入口及老師版入口。

主要入口包括：

- 頂部導覽：首頁、中一至中六、考試專區、數學小故事、班務工具。
- 漢堡選單：中一至中六、考試專區、挑戰區、SVG 工具庫、數學小故事、外部 S1C 教學網站、班務工具。
- 首頁內容：特別公告、前一週回顧、本週功課、下週預告、稍後截止功課。
- 隱藏或低可見入口：頁底灰色「老師版」。
- 浮動管理入口：右下角新增功課按鈕。

現況問題：

- 學生主要學習入口不在首頁第一屏，首頁第一屏偏向班務／功課資訊。
- 年級、考試、DSE、遊戲、班務、老師工具使用不同位置與呈現方式。
- 「老師版」雖然不顯眼，但仍是公開前端密碼檢查，只能視為視覺遮掩，不是實際保護。
- 新增功課、編輯公告、清除功課等寫入功能出現在首頁流程，且使用公開前端 token 與 `no-cors`，屬安全與假成功風險。
- 學生登入與 Dashboard 沒有清楚首頁入口。

### 年級課題入口如何呈現

年級入口目前以 `showSection()` 切換同一個 `index.html` 內的 section：

- 中一：有中一自學練習、第二／第三學期溫習，以及 `S1Ch1.html` 至 `S1Ch13.html`。
- 中二：目前只見 `S2Ch10.html`，頁面標示只完成第 10 章。
- 中三：有中三自學練習、第三學期甲部基礎練習，以及 `S3Ch2.html`、`S3Ch4.html`、`S3Ch7.html`、`S3Ch8.html`、`S3Ch9.html`、`S3Ch11.html`。
- 中四：目前見 `S4Ch3.html`。
- 中五：有 `S5Tutorial.html`、`S5Ch14.html`、`S5Ch17.html`、`S5Ch18.html`。
- 中六：只顯示即將推出。

現況問題：

- 年級課題與自學／溫習混在同一 section，但未有狀態標籤分辨「課堂可用」「測試中」「舊版保留」。
- 中二、中四、中六明顯不完整，但未用一致 status 表示。
- 手機上需要避免大量章節卡堆疊後難以掃描。

### 自學／溫習／考試／HKDSE／遊戲入口如何呈現

自學與溫習：

- 中一入口在中一 section 頂部，指向 `s1/selfstudy/index.html`、中一第二學期甲部練習、第三學期甲部練習。
- 中三入口在中三 section 頂部，指向 `s3/selfstudy/index.html`、`s3甲部基礎練習.html`。
- `s1/selfstudy/index.html` 已有 localStorage 進度狀態與章節測驗標示。

考試與 HKDSE：

- 首頁考試專區以 tab 分成校內考試及公開考試 DSE。
- 校內考試透過年份、年級、學期篩選 `availableExams` 中的試卷入口。
- DSE 入口可選卷一／卷二、年份、課題，再導向 `hkdse/dse-practice-p1.html` 或 `hkdse/dse-practice-p2.html`。
- `exam/index.html` 另有一個考試專區頁，混合學生練習、老師 OCR、仿題模板管理、評分工具，較像老師／管理索引，不適合作為主要學生入口。

遊戲與挑戰：

- 漢堡選單有「挑戰區」導向 `games-index.html`。
- `games-index.html` 有計算機大賽入口、位值挑戰、質因數分解、面積計算、正負數運算、代數語言等遊戲。
- repo 另有 `games/index.html` 及大量 `games/*.html`，但首頁目前未以完整遊戲索引呈現。

現況問題：

- 自學、溫習、考試、DSE、遊戲分散在不同入口層級。
- 考試工具中學生練習與老師 OCR／模板管理混合，需在首頁分界。
- `games-index.html` 中有 `calculator-game.html` 入口，但需確認檔案是否存在與是否 404。

### 班務工具目前有哪些

首頁明確列入班務工具 section 的項目：

- `seat.html`：座位表製作器，支援學生名單、座位分配、CSV 匯出。
- 外部圖片像素提升工具：`https://ai-lish.github.io/image-upscaler/`。
- 成績統計工具：目前是 disabled placeholder。
- 課堂日誌：目前是 disabled placeholder。

首頁本身也包含班務功能：

- 功課日曆。
- 特別公告。
- 新增功課／編輯功課／清除功課。
- 編輯公告／新增其他公告。

分類判斷：

- 功課、公告、座位表、圖片提升、課堂展示輔助可歸入「班務工具」。
- 成績統計如涉及成績資料、學生紀錄管理或資料寫入，應歸入「老師工具」或至少標示「老師用」，不應簡單放在班務工具主入口。

### 老師工具或高權限工具目前散落在哪裡

首頁「老師版」入口包含：

- `hkdse/review_p1.html`
- `hkdse/review_p2.html`
- `hkdse/review_p1_answers.html`
- `hkdse/mimic-generator/template-editor-v3.html`
- `exam/review-p1.html`
- `exam/review-p2.html`
- `exam/review-p3.html`
- `exam/practice.html`

其他散落位置：

- `exam/index.html` 直接公開列出 OCR 審核、仿題模板管理、評分工具。
- `exam/README.md` 描述 OCR、仿題、評分、GitHub sync、學生／老師 workflow。
- 部分自學或溫習工具含 Google Sheets 匯出、老師密碼或 `no-cors` 寫入流程。
- `student/dashboard/index.html` 是學生紀錄中心，但目前使用 mock data，且導向路徑使用根路徑。

安全與私隱風險：

- 首頁存在公開前端老師密碼常數、公開前端寫入 token、Google Apps Script 寫入 endpoint，以及 `no-cors` 後顯示成功的流程。planning 及後續 PR 不應重複公開密碼或 token 的值；應要求撤銷、更換並移到受後端驗證的權限層。
- 老師工具入口不應只靠「不顯眼」或前端密碼保護。
- 涉及學生名單、功課、公告、成績、答題紀錄、Google Sheets 寫入的功能不應放入主要學生入口。

### 學生 Dashboard / learning record 入口是否清楚

目前不清楚：

- `login/index.html` 存在學生登入頁。
- `student/dashboard/index.html` 存在學生 Dashboard，顯示 XP、題目統計、連續登入日、章節、任務、徽章。
- `student/change-password.html` 存在修改密碼頁，但 endpoint 尚為 placeholder。
- 首頁未有明顯「我的學習紀錄」或「登入後紀錄」入口。
- Dashboard 目前包含 mock data，不應被首頁描述成已完整反映真實學習紀錄。

路徑風險：

- `login/index.html` 登入成功後導向 `/student/dashboard/index.html`。
- `student/dashboard/index.html` 未登入導向 `/login`，章節卡導向 `/S1ChX.html`，登出導向 `/login`。
- `student/change-password.html` 未登入導向 `/login`，成功後導向 `/student/dashboard`。
- 以上根路徑在 GitHub Pages `/ai-learning/` base path 下會跳到 `https://ai-lish.github.io/` 根目錄，需改為相對路徑或正確 base path。

### 建議標示狀態

應標示為「課堂可用」：

- 中一主要課題頁及中一自學入口。
- 中三主要課題頁及中三自學入口。
- 中四 `S4Ch3.html`、中五 `S5Ch14.html` / `S5Ch17.html` / `S5Ch18.html`，如實作前快速 smoke test 通過。
- DSE 卷一／卷二練習入口。
- `seat.html`。
- `games-index.html` 中經確認存在且可開啟的遊戲。

應標示為「測試中」：

- 中二、中六不完整年級。
- disabled placeholder：成績統計工具、課堂日誌。
- `student/dashboard/index.html`，除非後續 PR 明確只標示為登入後紀錄原型。
- `student/change-password.html`，因 endpoint placeholder。
- 任何仍含 mock data 或未完成資料同步的工具。

應標示為「老師用」：

- OCR 審核、答案 OCR、仿題模板系統、校內考試仿題模板、評分工具、學生紀錄管理、Google Sheets 寫入管理、功課／公告編輯。

應標示為「舊版保留」：

- 若實作 AI 發現重複索引（例如 `exam/index.html` 與首頁考試 section、`games/index.html` 與 `games-index.html`）或舊版工具仍需保留，應不刪除，只移入「實驗／舊版」或「老師工具」並標示。

應標示為「需要登入增強」：

- 「我的學習紀錄」入口、Dashboard、同步進度、跨裝置紀錄、修改密碼。
- 注意：主學生工具本身不應加上「需要登入」門檻。

應標示為「外部連結」：

- 外部 S1C 教學網站。
- 圖片像素提升工具。
- 任何離開 `/ai-learning/` 的工具。

### `/ai-learning/` GitHub Pages base path 影響

後續 PR 必須掃描並修正會跳出 project base path 的 root path：

```bash
rg 'href="/|src="/|location\.href\s*=\s*["'"'"']/' --glob '*.html' --glob '*.js'
```

本次分析已確認學生登入、Dashboard、修改密碼頁存在 root path 風險。後續實作只要觸及首頁入口或學生紀錄入口，就必須一併處理這些入口導向，避免在 GitHub Pages 出現 404。

## 3. 使用者要求整理

使用者要求建立一份低風險、高收益的首頁入口重整 planning file，具體可驗收要求如下：

- 只建立 planning file，不直接修改 `index.html` 或功能檔案。
- 完整分析現有首頁入口、年級課題、自學、溫習、考試、HKDSE、遊戲、班務工具、老師工具、學生 Dashboard / learning record。
- 規劃首頁分類，使學生、班務、老師工具、實驗工具分界清楚。
- 規劃工具狀態標籤，至少包括 `課堂可用`、`測試中`、`老師用`、`舊版保留`、`需要登入增強`、`外部連結`。
- 不刪除半完成工具；測試中或舊版工具應標示或移入合適區域。
- 不把老師專用、高權限、資料寫入、OCR、評分、學生紀錄管理放進主要學生入口。
- 首頁必須尊重 `/ai-learning/` GitHub Pages base path。
- 手機版首頁要易掃描。

## 4. 產品原則

- 學生主要工具毋須登入即可使用。
- 登入只作進度、紀錄、同步、額外功能增強。
- 不破壞現有課堂工具。
- 不刪除半完成工具，除非 planning 清楚列明原因；本 planning 不建議刪除任何現有工具。
- 測試中或舊版工具應標示或移入合適區域。
- 老師工具與班務工具要分清楚。
- 老師專用、高權限、資料寫入、OCR、評分、學生紀錄管理，不應放入主要學生入口。
- 必須尊重 `/ai-learning/` GitHub Pages 路徑。
- 手機版首頁要易掃描，不可只照顧桌面版。
- 首頁是全站入口，不是重寫所有工具成單一大型 app。
- 狀態標籤是資訊架構，不是權限系統；安全權限必須由後端驗證。
- 不新增公開密碼、token、學生資料或假成功訊息。

## 5. 實作範圍

後續實作 AI 可以修改：

- `index.html`：首頁入口結構、分類區塊、工具卡、狀態標籤、老師／班務／學生紀錄入口位置。
- `css/styles.css`：如需要抽出可重用的工具卡、標籤、手機版掃描樣式。
- `login/index.html`、`student/dashboard/index.html`、`student/change-password.html`：只限修正由首頁或 Dashboard 入口造成的 `/ai-learning/` 路徑問題與返回首頁連結；不得在本 PR 擴展登入功能。
- `games-index.html`：只限在首頁連結前發現 404 或命名不一致時做最小修正或在首頁改用正確入口。
- `exam/index.html`：只限把其定位標示為老師／管理索引或避免它被首頁當成主要學生入口；不得重寫考試系統。

建議實作方式：

- 在首頁建立分類式入口，而非刪除現有 section。
- 可以把工具清單先整理成 `index.html` 內的簡單資料陣列或保留靜態 HTML；優先選擇低風險、易 review 的方案。
- 保留現有年級 section 與考試 section 的核心行為，只改善入口與標籤。

## 6. 不應修改範圍

後續實作 AI 不應修改：

- 題庫 JSON、OCR JSON、DSE evidence、考試圖片、PDF、答案圖。
- 自學練習、遊戲、考試頁面的核心出題、答案、計分、隨機生成邏輯。
- Google Apps Script 後端或外部 Google Sheets 設定，除非另開安全修正 planning。
- 老師密碼、token、endpoint 的值；如發現公開秘密，只應在 PR 描述中提示「已存在公開秘密，需要撤銷更換」，不得重複值。
- 大型共用身份層、完整 learning record schema 同步、真實 Dashboard 數據串接。
- 全站視覺重設或把所有工具改成同一套框架。
- 與首頁入口分類無關的 README 或舊 planning file。

## 7. 具體任務

1. 盤點 `index.html` 現有入口並建立首頁入口架構。
   - 第一層應以使用者任務分組，不以檔案歷史分組。
   - 建議第一屏優先顯示學生學習入口、考試入口、遊戲入口、我的學習紀錄入口。
   - 功課／公告可保留，但不要壓過主要學習入口。

2. 建立工具分類區塊。
   - 年級與課題
   - 自學與溫習
   - 考試與 HKDSE
   - 遊戲與挑戰
   - 班務工具
   - 我的學習紀錄
   - 老師工具
   - 實驗／測試中工具

3. 為每個主要工具卡加入狀態標籤。
   - 同一工具可有多個標籤，例如 `課堂可用` + `需要登入增強`。
   - 標籤文字必須在手機上不擠壓、不換到不可讀。
   - 不用顏色作唯一提示；文字必須可見。

4. 分清班務工具與老師工具。
   - 班務工具：座位表、功課查看、公告查看、圖片提升、課堂展示輔助。
   - 老師工具：功課／公告寫入、OCR 審核、仿題模板管理、評分、學生紀錄管理、Google Sheets 寫入。
   - 目前首頁新增功課、公告編輯、清除功課等寫入功能需視為老師工具或高權限操作，不應在學生主要入口突出。

5. 加入「我的學習紀錄」入口。
   - 指向 `login/index.html` 或登入後 Dashboard 的清楚入口。
   - 文案必須說明登入是紀錄增強，不是使用學習工具的必要條件。
   - 若 Dashboard 仍是 mock data，必須標示 `測試中` 或「需要登入增強」，不可聲稱真實完整同步。

6. 修正或規劃路徑一致性。
   - 所有首頁新增連結優先使用相對路徑。
   - 如實作觸及 login / dashboard，需修正 `/login`、`/student/...`、`/S1ChX.html` 類 root path。
   - PR 必須列出 root path 掃描結果。

7. 處理外部連結。
   - 外部 S1C 教學網站、圖片像素提升工具須標示 `外部連結`。
   - 外部連結應保留 `target="_blank"` 並加上 `rel="noopener noreferrer"`。

8. 保留測試中與舊版工具。
   - 不刪除 disabled placeholder，可移至實驗／測試中區。
   - 重複或舊版索引不應刪除；先標示 `舊版保留`。

9. 手機版首頁可掃描。
   - 390 x 844 和 320 x 568 下，分類標題、工具卡、狀態標籤不可重疊。
   - 第一屏應看得出網站有學習入口，而不只功課日曆。

10. 安全風險只做資訊架構降風險，不在本 PR 實作安全重構。
    - 不新增任何公開秘密。
    - 不在 PR 描述或 code comments 重複現有秘密值。
    - 將高權限功能移出主要學生入口，並標示 `老師用`。

## 8. 工具分類建議

### 年級與課題

- 中一：`S1Ch1.html` 至 `S1Ch13.html`，狀態建議 `課堂可用`。
- 中二：`S2Ch10.html`，狀態建議 `測試中` 或「部分完成」。
- 中三：`S3Ch2.html`、`S3Ch4.html`、`S3Ch7.html`、`S3Ch8.html`、`S3Ch9.html`、`S3Ch11.html`，狀態建議 `課堂可用`。
- 中四：`S4Ch3.html`，狀態建議 `課堂可用` 或 `測試中`，需 smoke test 後決定。
- 中五：`S5Tutorial.html`、`S5Ch14.html`、`S5Ch17.html`、`S5Ch18.html`，狀態建議 `課堂可用`。
- 中六：目前即將推出，狀態建議 `測試中`。

### 自學與溫習

- `s1/selfstudy/index.html`：`課堂可用`，可另標示本機進度。
- `s1/selfstudy/practice-s2甲部.html`：`課堂可用` 或 `測試中`，實作前需開頁確認。
- `s1/selfstudy/2025-26-中一-第三學期-甲部.html`：`課堂可用`，但含老師密碼／Google Sheets 匯出流程，匯出功能應標示 `老師用` 或另行安全檢查。
- `s3/selfstudy/index.html`：`課堂可用`。
- `s3甲部基礎練習.html`：`課堂可用`，但含輸入學生身份與資料提交流程，需標示資料風險或避免放入主要學生入口時鼓勵提交。

### 考試與 HKDSE

- 首頁校內考試 tab：`課堂可用`。
- `exam/2025-26-*`、`exam/2024-25-*` 試卷入口：按現有 `availableExams` 進入，狀態由 smoke test 決定。
- DSE 卷一／卷二：`課堂可用`。
- `exam/index.html`：建議歸入 `老師工具` 或 `舊版保留`，不作主要學生入口。

### 遊戲與挑戰

- `games-index.html`：`課堂可用`，但需確認當中每個連結是否存在。
- `games/*.html`：可逐步由遊戲索引收納，不必一次補齊全部。
- 若 `calculator-game.html` 不存在，該卡應移入 `測試中` 或改正連結。

### 班務工具

- 功課查看、公告查看：`課堂可用`。
- `seat.html`：`課堂可用`，但涉及學生名單，提醒只在本機處理或避免長期保存。
- 圖片像素提升工具：`外部連結`。
- 成績統計工具：目前 disabled，若涉及成績資料，應移至 `老師工具` + `測試中`。
- 課堂日誌：目前 disabled，`測試中`。

### 我的學習紀錄

- `login/index.html`：`需要登入增強`。
- `student/dashboard/index.html`：`需要登入增強` + `測試中`，直到真實資料串接與路徑問題修正。
- `student/change-password.html`：`測試中`，endpoint placeholder 不應作正式入口。

### 老師工具

- DSE OCR 審核：`hkdse/review_p1.html`、`hkdse/review_p2.html`、`hkdse/review_p1_answers.html`。
- DSE 仿題模板：`hkdse/mimic-generator/template-editor-v3.html`。
- 校內考試 OCR 審核：`exam/review-p1.html`、`exam/review-p2.html`、`exam/review-p3.html`。
- 校內考試仿題模板：`exam/practice.html`。
- 評分工具或 scripts：`exam/index.html` 中的 scoring 相關入口。
- 功課／公告寫入與 Google Sheets 寫入：首頁內相關管理流程。

### 實驗／測試中工具

- 中六 section。
- 成績統計工具、課堂日誌。
- `student/change-password.html`。
- 重複或未確認的 `games/index.html`、`exam/index.html`。
- 任何實作前 smoke test 失敗、404、依賴外部權限或 mock data 的頁面。

## 9. 工具狀態標籤設計

狀態標籤建議：

- `課堂可用`：已能由學生或老師在課堂中直接使用；不代表無 bug，但入口可放在主要分類。
- `測試中`：功能未完整、資料未接駁、路徑未確認、mock data、placeholder 或需老師先試用。
- `老師用`：只供老師或高權限流程使用，包括 OCR、評分、題目管理、學生紀錄管理、資料寫入。
- `舊版保留`：舊入口、舊版索引或暫時不主推但仍需保留的工具。
- `需要登入增強`：登入後才有紀錄、同步、Dashboard、個人化等增強；不得用於阻擋主要學習工具。
- `外部連結`：離開 `/ai-learning/` GitHub Pages project 的連結。

設計要求：

- 標籤應是短文字 chip，手機版仍清楚可讀。
- 同一工具可多標籤，例如 `老師用` + `測試中`。
- 以文字為主，顏色只作輔助，不可只用顏色表示狀態。
- `老師用` 標籤不得被理解為真正權限保護。
- `測試中` 工具仍可點擊時，文案應避免「正式」或「已完成」語氣。
- `外部連結` 應配合新分頁與安全屬性。

## 10. 驗收條件

- [ ] 已新增或重整首頁入口分類：年級與課題、自學與溫習、考試與 HKDSE、遊戲與挑戰、班務工具、我的學習紀錄、老師工具、實驗／測試中工具。
- [ ] 主要學生工具仍可免登入由首頁找到並使用。
- [ ] 登入入口定位為「我的學習紀錄」或增強功能，不取代首頁。
- [ ] 老師工具與班務工具清楚分開。
- [ ] OCR、評分、題目管理、學生紀錄管理、Google Sheets 寫入、功課／公告寫入不在主要學生入口突出。
- [ ] 每個首頁主要工具卡至少有一個狀態標籤。
- [ ] `測試中`、`老師用`、`舊版保留`、`需要登入增強`、`外部連結` 使用語義一致。
- [ ] 不刪除任何半完成工具；如移位，仍可在合適分類找到。
- [ ] 所有新增首頁連結在 GitHub Pages `/ai-learning/` 下不跳到 domain root。
- [ ] 已掃描 root path，並處理或列出未處理原因。
- [ ] 手機 390 x 844 及 320 x 568 下，首頁分類和標籤不重疊、不截斷主要文字。
- [ ] 桌面 1280 x 720 下，第一屏能看出主要學習入口。
- [ ] 沒有新增公開密碼、token、學生私隱資料或假成功訊息。
- [ ] 不修改題目、答案、OCR 原始資料、遊戲核心邏輯或考試計分邏輯。

## 11. 實作 AI PR 前測試清單

- [ ] 先讀 `AGENTS.md`、`PROJECT.md`、`CODEX.md`、`PLANNING/README.md`、本 planning file。
- [ ] `git diff --stat` 只包含 planning 指定範圍內的檔案。
- [ ] 本地或預覽環境可載入 `index.html`。
- [ ] 從首頁進入：中一課題、中三課題、中一自學、中三自學、校內考試、DSE 卷一或卷二、遊戲索引、座位表。
- [ ] 從首頁進入「我的學習紀錄」入口，確認文案不要求登入才能使用主要學習工具。
- [ ] 如觸及 login / dashboard，確認登入、未登入 redirect、登出、返回首頁路徑不使用錯誤 root path。
- [ ] 執行 root path 掃描：`rg 'href="/|src="/|location\.href\s*=\s*["'"'"']/' --glob '*.html' --glob '*.js'`。
- [ ] 確認所有外部連結標示 `外部連結`，並使用 `rel="noopener noreferrer"`。
- [ ] 手機 390 x 844 測試首頁第一屏與分類掃描。
- [ ] 窄手機 320 x 568 測試標籤不擠壓或重疊。
- [ ] 桌面 1280 x 720 測試分類布局與主要入口。
- [ ] 檢查 browser console 無因首頁改動新增 error。
- [ ] 檢查 network 無新增 404。
- [ ] 未登入仍可進入主要學習、考試、遊戲工具。
- [ ] 不在 PR、commit、註解或說明中公開現有密碼或 token 值。

## 12. PR 描述要求

PR 描述必須包含：

- Planning file：`PLANNING/20260607_HOME_ENTRY_ORGANIZATION_V1.md`
- 改動摘要：哪些首頁分類、狀態標籤、入口位置被更新。
- 明確聲明未改動：題庫、答案、OCR 原始資料、遊戲核心邏輯、考試計分邏輯。
- 測試結果：桌面、手機、窄手機、GitHub Pages base path、主要入口 smoke test。
- Root path 掃描結果：列出修正項與任何保留原因。
- 安全說明：沒有新增公開密碼／token；若發現既有公開秘密，只說明「已存在，需要撤銷及後續安全修正」，不得重複秘密值。
- 剩餘風險：例如 Dashboard mock data、老師工具仍需後端權限、外部連結依賴等。
- 截圖或簡短錄影：首頁桌面與手機至少各一張。

## 13. Codex Ready Review 時要檢查的項目

Codex review 後續 PR 時必須檢查：

- PR 是否引用本 planning file。
- 改動是否限於首頁入口、狀態標籤、必要路徑修正與輕量樣式。
- 是否保持學生主要工具免登入可用。
- 是否把登入定位為「我的學習紀錄／增強功能」。
- 是否清楚分開班務工具與老師工具。
- 是否沒有把 OCR、評分、資料寫入、學生紀錄管理放進主要學生入口。
- 是否保留測試中、舊版或半完成工具，而不是刪除。
- 是否為主要入口加上合適狀態標籤。
- 是否修正或至少不新增 `/ai-learning/` base path 問題。
- 是否避免新增公開秘密、學生私隱資料或假成功訊息。
- 是否沒有改動題庫、答案、OCR 原始資料、遊戲核心邏輯或考試計分邏輯。
- 是否通過 390 x 844、320 x 568、1280 x 720 的可用性檢查。
- 是否能從正式或預覽 GitHub Pages URL 載入首頁，並進入代表性入口。
- PR 描述的測試清單是否可信、有具體路徑與結果。

如以上任一核心項目不符合，Ready Review 應回覆 `Not ready`，並提供聚焦修正提示。全部符合才可回覆 `Ready for OpenClaw check/test/merge`。
