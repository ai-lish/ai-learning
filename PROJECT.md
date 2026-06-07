# PROJECT 系統提示語

> Version: 2026.06.07-v2
> Last updated: 2026-06-07
> 適用於 Gemini、GitHub Copilot Agent、OpenClaw (using MiniMax)，以及其他參與 `ai-lish/ai-learning` 的 AI 開發代理。
>
> 本文件是專案的主要產品與工程規格。開始任何工作前必須先讀取本文件；若子目錄有更具體指引，兩者同時遵守，並以較具體、較安全者為準。

## 1. 專案定位

這是一個與香港中學實際課堂直接掛勾的數學教學網站，由老師按每次真實課堂需要逐件製作教材、練習、遊戲、試卷、班務工具及教學輔助工具。

網站不是由單一完整產品規格一次建成。很多功能是獨立工具，部分仍在試驗、未完成或因課堂方向改變而停止。不要僅因程式風格不一致或功能未完成，就大規模重寫、刪除或合併。首先判斷它是否仍被首頁、課堂流程、老師工具或資料處理流程使用。

正式網站：`https://ai-lish.github.io/ai-learning/`

主要技術：

- GitHub Pages 靜態網站
- HTML、CSS、Vanilla JavaScript
- MathJax / KaTeX
- Google Apps Script 與 Google Sheets
- 少量 Python 製作、OCR、試卷及資料處理工具
- 大量獨立 HTML 教材、練習與遊戲

相關資料夾原則：

- `REFERENCE/`：放參考資料、規格、外部分析或供 AI 閱讀的輔助內容；不得當成已完成網站功能。
- `infographics/`、`images/`：視覺資產與教學圖像；修改時要保留原用途、檔名引用及 GitHub Pages 路徑。
- preschool 或幼兒／小學前置子專案如存在，視為相鄰教學實驗區；不得因中學主流程整理而刪除或混入主學生入口。

## 2. 已確認的產品方向

採用「訪客優先、登入增強」模式：

1. 學生毋須登入，必須可以由首頁直接使用主要教材、練習、遊戲及考試工具。
2. 登入不可成為主要學習內容的使用門檻。
3. 學生登入後，可以獲得額外功能，例如儲存學習進度、答題及成績紀錄、錯題簿、收藏、跨裝置同步、個人化推薦或額外挑戰。
4. 未登入時，工具仍須完整可用；需要紀錄時可先保存在本機，登入後再同步。
5. Dashboard 不取代首頁，應定位為「我的學習紀錄」或登入後個人中心。
6. 首頁是全站統一入口，負責清楚連接各個獨立工具，而不是把所有工具重寫成同一個大型應用程式。

## 3. 現況分析

目前可用內容包括：

- 中一至中五數學課題頁面
- 中一及中三自學／考試溫習練習
- 數學遊戲與挑戰區
- 校內考試、OCR、仿題、評分及相關資料處理工具
- HKDSE 題庫及練習 workflow
- 功課、公告及班務工具
- 學生登入與 Dashboard / learning-record 功能

目前最大問題不是個別半成品，而是各部分缺乏配合：

- 導航、返回方式、路徑及頁面身份不一致
- 各工具自行處理樣式、設定、密碼及資料寫入
- 學習紀錄沒有完全共用格式
- 首頁、登入、Dashboard、練習及考試之間未形成一致流程
- 老師工具、班務工具、學生功能及試驗功能界線不清
- README 或舊文件與實際網站狀態可能不同步
- GitHub Pages 位於 `/ai-learning/` 子路徑，但部分頁面可能錯用網站根路徑 `/`
- 部分密碼、token 或管理邏輯曾直接寫在公開前端，必須視為安全風險

任何 agent 不得假設本節完全最新；實作前必須以 repository、首頁及實際 GitHub Pages 再確認。

## 4. 核心整合策略

不要先重寫全部頁面。採用漸進式整合。

### 4.1 統一入口

首頁按以下用途整理：

- 年級與課題
- 自學與溫習
- 考試與 HKDSE
- 遊戲與挑戰
- 班務工具
- 我的學習紀錄
- 老師工具
- 實驗／測試中工具

分類邊界：

- 「班務工具」是可直接支援班房日常操作的工具，例如座位表、公告、功課、圖片提升或課堂展示輔助。
- 「老師工具」是較高權限或後台性質的工具，例如題目管理、評分、OCR、資料匯入、學生紀錄管理、Google Sheets 寫入或管理介面。
- 同一工具可在 planning file 內暫時歸入其中一類，但必須說明原因，並避免把老師專用或有資料風險的功能放入主要學生入口。

只有實際可用、課堂會使用的項目放在主要學生入口。未完成項目應清楚標示「測試中」，或移到老師／實驗區，但不要擅自刪除。

### 4.2 共用導航

逐步為現有頁面加入輕量共用導航：

- 返回首頁
- 所屬年級
- 所屬課題／工具類別
- 登入狀態或「我的紀錄」入口

不得為了統一外觀而破壞原有題目、遊戲或課堂操作。

### 4.3 共用身份層

所有工具都應支援：

- `guest`：免登入使用
- `student`：登入後同步紀錄
- `teacher`：受保護的管理功能

學生身份層應是可選增強。工具不得因身份服務暫時失效而完全不能使用。

### 4.4 共用學習紀錄格式

新功能或被整合的舊工具，優先使用一致事件格式。Schema 可按任務擴展，但不得刪除核心語義：

```json
{
  "version": 1,
  "eventId": "uuid-or-unique-id",
  "studentId": null,
  "sessionId": "local-session-id",
  "toolId": "s1-term3-short-answer",
  "grade": "s1",
  "topic": "algebra",
  "activityType": "practice",
  "score": 12,
  "total": 16,
  "errorCount": 4,
  "timeSpentMs": 420000,
  "answers": [
    {
      "questionId": "q001",
      "userAnswer": "x = 3",
      "correctAnswer": "x = 3",
      "isCorrect": true,
      "timeMs": 35000,
      "attempts": 1,
      "tags": ["linear-equations"]
    }
  ],
  "wrongQuestions": [
    {
      "questionId": "q004",
      "topic": "algebra",
      "reason": "sign-error"
    }
  ],
  "startedAt": "ISO-8601",
  "completedAt": "ISO-8601",
  "sourcePath": "/ai-learning/s1/selfstudy/example.html",
  "appVersion": "2026.06.07-v1",
  "deviceInfo": {
    "viewport": "390x844",
    "inputType": "touch",
    "userAgentSummary": "browser-family-only"
  }
}
```

未登入時先以 localStorage 或 IndexedDB 保存；登入後才同步。同步失敗不得令本地紀錄消失。不得把完整 user agent、IP、精確位置或不必要個人資料加入紀錄。

### 4.5 路徑規則

GitHub Pages 專案基底是 `/ai-learning/`。

- 優先使用相對路徑。
- 不可使用會跳到 `https://ai-lish.github.io/` 根目錄的 `/login`、`/student/...`、`/S1Ch1.html` 等路徑。
- 修改導航後必須在實際 GitHub Pages URL 測試。
- PR 前應掃描 HTML / JS 內可疑根路徑。建議使用：

```bash
rg 'href="/|src="/|location\.href\s*=\s*["'"'']/' --glob '*.html' --glob '*.js'
```

發現根路徑不代表一定錯，但必須逐一解釋或修正。

## 5. 安全與私隱底線

1. 不可把老師密碼、學生密碼、API token、GitHub token 或可寫入資料的秘密放在公開 HTML、JavaScript 或 repository。
2. 前端密碼比較只屬視覺遮掩，不是權限保護。
3. 學生密碼不可用純文字保存；應使用合適的雜湊或受管理身份服務。
4. Session token 必須不可預測、可過期、可撤銷。
5. 管理及資料寫入權限必須由後端驗證。
6. 學生姓名、班別、學號、成績及答題紀錄屬個人資料，只收集教學所需資料。
7. 使用 `no-cors` 時不可假定請求已成功；介面不得在無法驗證結果時顯示確定成功。
8. 發現公開秘密時，不要在報告、commit 或對話重複秘密值；應建議立即撤銷及更換。

## 6. 開發原則

- 保護現有課堂功能，改動範圍要小而可回退。
- 先理解現有頁面及其課堂用途，再修改。
- 不以「架構較漂亮」為理由重寫正常運作的獨立工具。
- 共用元件應可漸進加入；舊頁面未接入時仍可獨立運作。
- 保留繁體中文及香港課堂語境。
- 手機優先，觸控目標清楚，數學公式不能被裁切。
- 題目、答案、隨機生成邏輯及計分屬高風險內容；修改後必須逐類型驗證。
- 不把 mock／示範數據當成真實學生紀錄顯示。
- 文件必須反映實際狀態；不要沿用已過時的 README 結論。
- 不處理與當前任務無關的大型重構。

## 7. 每次任務的強制工作循環

代理必須自行完成以下循環，不可只提出建議後停止，除非使用者只要求 planning 或 review：

### Step 1：分析現況

- 讀取本文件、`CODEX.md`、`PLANNING/README.md`、README、相關頁面、資料及最近 commit。
- 從首頁追蹤真實使用路徑。
- 分辨正式使用、老師專用、測試中及已停用內容。
- 記錄現有行為、依賴、資料流及風險。

### Step 2：綜合使用者要求

- 將要求轉為可驗收行為。
- 優先保持「免登入可用、登入後增強」。
- 若資料不足，先從 repository 與實際網站尋找答案；只有會影響課堂用途或造成資料風險時才詢問使用者。

### Step 3：實作或規劃

- 若任務是 planning，建立 `PLANNING/YYYYMMDD_CONTENT_V1.md`。
- 若任務是 implementation，必須跟隨指定 planning file。
- 按現有技術及頁面風格完成修改。
- 優先修正整合點，而不是重寫獨立內容。
- 不加入公開秘密或假成功訊息。

### Step 4：GitHub 與實際網站測試

完成後必須直接在 GitHub 及 GitHub Pages 驗證：

- 確認 commit / PR 中只有預期檔案。
- 重新從 GitHub 讀取已提交內容，不以本機版本代替。
- 等待 GitHub Pages 部署完成。
- 從首頁實際進入修改後頁面。
- 測試桌面及手機尺寸。
- 檢查 console error、404、錯誤路徑、MathJax、按鈕、返回首頁及核心答題流程。
- 若涉及紀錄，分別測試未登入與登入狀態。
- 若涉及資料寫入，驗證後端真實回應；不得只確認按鈕已按下。

### Step 5：失敗後迭代

若發現任何問題，必須重新執行 Step 1 至 Step 4，直到驗收行為全部通過，或出現無法由代理自行解除的外部阻礙。

## 8. 最低測試矩陣

每次相關改動至少測試：

| 項目 | 必須確認 |
|---|---|
| 首頁 | 正常載入、主要入口可見 |
| 導航 | 首頁進入及返回路徑正確 |
| GitHub Pages | URL 保留 `/ai-learning/` |
| 手機 | 390 x 844 無主要內容重疊或被裁切 |
| 窄手機 | 320 x 568 或相近尺寸仍可完成核心流程 |
| 桌面 | 1280 x 720 核心介面可操作 |
| 鍵盤 | 主要按鈕、輸入、返回可用鍵盤操作 |
| Accessibility | 表單有可理解 label，互動元素有可辨識名稱，顏色不是唯一提示 |
| Performance | 首頁及受改頁面不應加入明顯拖慢載入的大型資產；新增圖片需壓縮或合理尺寸 |
| 弱網／離線 | 同步失敗、網絡慢或離線時不遺失本地學習紀錄 |
| 數學 | MathJax／KaTeX 正常顯示 |
| 練習 | 開始、輸入、核對、下一題、結果頁 |
| 訪客 | 未登入仍可完成主要活動 |
| 登入 | 登入後才啟用同步或個人功能 |
| 錯誤處理 | 網絡／同步失敗不遺失本地紀錄 |
| 安全 | 公開源碼沒有密碼及秘密 token |

## 9. 代理分工提示

### Codex

負責 planning、Ready Review、最終出街版本確認，以及在出街後錯誤時建立 debug planning。Codex 不一定直接實作所有改動。

### Gemini

適合分析大量內容、數學／視覺方案及提出整合設計；如作為實作 AI，必須跟隨 planning file，產生 PR，並把 Ready Review 交回 Codex / 使用者。

### GitHub Copilot Agent

以 repository 內實作、測試、commit 及 PR 為主。必須先讀 `PROJECT.md`、`CODEX.md` 及指定 planning file，保持改動集中，並從 GitHub Pages 驗證部署結果。

### OpenClaw (using MiniMax)

OpenClaw 可作為實作 AI，也可作為使用者指定的 final check/test/merge agent。適合瀏覽器操作、OCR、Google Docs／Sheets 工作流及跨工具整合。讀取外部資料時不得公開敏感資料；完成後仍須回到 GitHub PR 與網站測試循環。

## 10. 完成定義

一項工作只有在以下條件全部成立時才算完成：

- 符合真實課堂用途。
- 訪客主要流程不要求登入。
- 登入增強功能不破壞訪客流程。
- 與首頁及其他相關部分有清晰連接。
- 沒有新增公開秘密或明顯私隱風險。
- GitHub 已提交正確版本，PR 引用正確 planning file。
- GitHub Pages 實際測試通過。
- 文件與實際狀態一致。
- 發現的問題已修正並完成重測。
- 若 merge 後出街版本仍錯，已建立 `PLANNING/YYYYMMDD_CONTENT_DEBUG_1.md` 或後續 debug planning 重新開始。

## Changelog

- 2026-06-07 v2：標準化 OpenClaw 命名；補充 metadata、REFERENCE / asset / preschool 原則；更新現況描述；釐清班務工具與老師工具；擴充 learning-record schema；加入路徑掃描建議；補 accessibility、performance、窄手機及弱網測試。
- 2026-06-07 v1：建立主系統提示語，確認「訪客優先、登入增強」及漸進式整合方向。
