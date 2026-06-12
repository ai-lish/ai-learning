# 20260612_HKDSE_P1_P2_ONLINE_TOOLS_V1

## 1. 背景

網站已有 HKDSE 數學卷一及卷二練習頁、歷屆題目資料、部分官方答案／解題及卷二仿題功能。今次不是重做題庫，而是把現有內容整理成學生可由首頁清楚進入、手機可用、結果不誤導的兩個線上工具。

本 planning file 以第一階段可安全出街的學生流程為目標：

- 卷一：歷屆長答題瀏覽、作答草稿、官方答案自評。
- 卷二：歷屆選擇題作答、可靠自動核對、錯題重做入口。
- 兩卷均支援年份及課題篩選，毋須登入。
- 題目或答案資料未齊時清楚標示，不把未能核實的答案計作錯誤或正確。

### 1.1 前置規劃定位

本 V1 是遷移前的產品、資料及風險盤點，後續 repository 方案由
`PLANNING/20260612_HKDSE_P1_P2_ASSESSMENTS_V2.md` 落實。

已決定：

- HKDSE 真題 schema 與 Assessments 現有動態題型 schema 不相容。
- HKDSE 真題不可加入 `ai-lish/Assessments/question-bank.json`。
- 正式學生工具須建立為獨立的 `ai-lish/Assessments/hkdse/`。
- `ai-learning/hkdse/` 在遷移完成後只保留入口、舊網址相容導向及短期回退資產。
- 跨 repository URL 的 `Assessments` 大小寫不可改變：

```text
頁面：https://ai-lish.github.io/Assessments/hkdse/
資料：https://raw.githubusercontent.com/ai-lish/Assessments/main/...
```

GitHub Pages 及 raw 路徑大小寫敏感。任何 `/assessments/`、`ai-lish/assessments`
或 `/ai-learning/Assessments/` 均屬錯誤路徑，必須由測試阻止。

## 2. 現況分析

### 已檢查範圍

- `PROJECT.md`
- `CODEX.md`
- `PLANNING/README.md`
- `README.md`
- `PLANNING/20260607_HOME_ENTRY_ORGANIZATION_V1.md`
- `index.html`
- `hkdse/USER_GUIDE.md`
- `hkdse/guide.html`
- `hkdse/dse-practice-p1.html`
- `hkdse/dse-practice-p2.html`
- `hkdse/pages/p1_all_scan_results.json`
- `hkdse/pages/p1_answer_ocr_results.json`
- `hkdse/pages/p2_final_results.json`
- `hkdse/p2_solutions.json`
- `hkdse/mimic-generator/auto_templates_p2.json`
- 正式網站 `https://ai-lish.github.io/ai-learning/`
- 正式卷一、卷二練習頁的桌面及 390 x 844 手機流程

### 現有入口及行為

- 首頁「考試專區」可切換至公開考試 DSE，選擇卷別、年份及課題。
- 首頁以 query string 導向：
  - `hkdse/dse-practice-p1.html`
  - `hkdse/dse-practice-p2.html`
- 兩頁均可免登入載入，並有返回首頁、卷別切換、年份及課題篩選。
- 卷一提供文字輸入、每題數字鍵盤及部分官方答案。
- 卷二提供 MC 選項、自動核對、部分詳細解題及類似題。
- `hkdse/guide.html` 及課題分析頁把 `hkdse/index.html` 當成 HKDSE 首頁，但該檔案目前不存在，會造成錯誤返回路徑。

### 實際資料覆蓋

卷一題目：

- `p1_all_scan_results.json` 共 198 題。
- 年份涵蓋 2012 至 2023，但 2019 至 2022 的題數明顯不是完整每年 18／19 題。
- `p1_answer_ocr_results.json` 對現有 198 題中只有 126 題有非空答案文字，72 題沒有可顯示答案。
- 首頁仍把卷一描述為 2012 至 2022，與實際含 2023 題目不一致。

卷二題目：

- `p2_final_results.json` 共 495 題，即 2012 至 2022 每年 45 題。
- `p2_solutions.json` 只有 437 題有答案／解題資料。
- 現有 495 題中有 58 題沒有可供自動核對的答案，主要為 2021 Q31 之後及大部分 2022 題目。
- 現行核對流程會把沒有答案資料的已作答題目當作錯誤，結果不可信。

### 已確認的學生流程問題

1. 卷一由首頁帶入 `year` 時，頁面初次載入沒有按該年份篩選。
2. 卷二會按 URL 年份／課題篩選，但頁內下拉選單仍顯示「全部年份／全部課題」。
3. 首頁、頁內篩選及資料檔的年份／題數資訊由多處硬編碼，已出現不一致。
4. 卷一 `checkAnswers()` 把所有有輸入的答案當作正確，只顯示已答數卻使用得分語意，屬誤導結果。
5. 卷一長答題只提供單行輸入及主要為數字的鍵盤，不適合多步算式、證明及解釋題。
6. 卷一全部模式一次產生約 198 張題卡及每題一套鍵盤；卷二全部模式一次產生 495 張題卡。手機、低效能裝置及弱網會承受不必要負擔。
7. 題目 OCR 的課題名稱有中英文、近義名稱及不同粒度，卷一課題選單過長且難以使用。
8. 部分卷一 OCR 題幹仍含「這張圖片中的文字如下」等辨識描述。V1 不應聲稱所有題目已人工核對。
9. 兩頁沒有一致的本地作答保存；重載或切換篩選後可能遺失學生輸入。
10. 現有卷二類似題包含大量題型特定生成邏輯，未有足夠證據證明全部模板答案可靠，不能在本任務把它當成已全面驗證功能。

### 路徑、安全及私隱

- 目前主要卷一／卷二頁使用相對路徑，符合 `/ai-learning/` GitHub Pages base path。
- `hkdse/index.html` 缺失令 `guide.html` 及課題分析頁的返回連結失效。
- 主要學生流程不應要求登入。
- V1 只在本機保存非個人化作答狀態，不收集姓名、班別、學號或完整瀏覽器資料。
- 不新增 API token、老師密碼、Google Sheets 寫入或無法驗證的成功訊息。

### 遷移前資產盤點

現有 `ai-learning/hkdse/` 實測約 53 MiB／54 MB：

- `images-p2/`：約 25 MB。
- `images-p1/`：約 13 MiB／14 MB。
- `answer-images/`：約 9.5 MB。
- 其餘為多個 OCR、solution、mimic、evidence、備份及 build 工件。

V1 必須先記錄以下逐檔決策，V2 的 import／cleanup script 必須按此執行：

| 舊路徑 | 決策 | 遷移前引用檢查 |
|---|---|---|
| `hkdse/p2_solutions.json` | 保留一份 canonical 內容並遷入 Assessments runtime data | 與 `hkdse/pages/p2_solutions.json` 做 SHA-256／JSON 等值比較；列出學生頁實際 fetch 路徑 |
| `hkdse/pages/p2_solutions.json` | 若與 canonical 等值則不重複遷移；舊 repo 暫保留至 cleanup planning | 搜尋 HTML／JS 引用；如內容不同必須停止遷移並產生差異報告 |
| `hkdse/p2_latex_ocr_results.json` | 只在新 runtime schema 確實需要時保留 | 與 `hkdse/pages/p2_latex_ocr_results.json` 比較，並檢查學生頁是否直接引用 |
| `hkdse/pages/p2_latex_ocr_results.json` | 若屬重複或非學生 runtime 則不遷移 | 搜尋引用；內容不同時不可自行選擇或合併 |
| `hkdse/pages/backup-20260412T031151Z/` | 不遷入 Assessments runtime；舊 repo 暫保留 | 確認沒有正式學生頁引用 backup 路徑 |
| `hkdse/__pycache__/` | build 工件，不遷移；cleanup 時刪除並加入 ignore | 確認沒有程式把 `.pyc` 當 runtime 資產 |
| `hkdse/evidence/` | 不遷入學生 runtime；保留在舊資料製作 workflow，直至另行決定 ownership | 確認學生頁沒有 fetch evidence |
| `hkdse/mimic-generator/` | V1/V2 不遷入 HKDSE 正式學生主流程 | 搜尋現有「重做類似題」及老師 editor 引用，記錄但不可靜默刪除 |
| `hkdse/ocr_log.txt` | 如確認為空且無引用，cleanup 時刪除；不遷移 | 檢查檔案大小為 0、git history 用途及全 repo 引用 |

不可直接把整個 `hkdse/` 複製到 Assessments。圖片及 JSON 必須由 runtime
引用 allowlist 決定，並產生保留、排除、重複及缺失報告。

## 3. 使用者要求整理

把「HKDSE 卷一、卷二線上工具」落實為以下可驗收行為：

- 學生可由首頁或 HKDSE 專頁選擇卷一／卷二。
- 學生可按年份、課題及練習數量開始，不需登入。
- 頁面清楚說明題目及答案資料覆蓋，不把「題目存在」等同「可自動核對」。
- 卷一定位為作答草稿及官方答案自評，不產生虛假自動分數。
- 卷二只為有可靠答案資料的題目計分；沒有答案資料的題目不計入正確率。
- 全部題庫不一次渲染，學生可分頁或逐批完成。
- 手機、桌面及鍵盤操作可完成核心流程。
- 作答在同一裝置重載後仍可恢復，清除紀錄須由學生明確操作。

## 4. 產品原則

- 主要學生流程免登入可用。
- 登入只可在後續任務加入同步或個人紀錄，不是本 V1 的前置條件。
- 保護現有題庫、答案圖片、OCR evidence、老師審核及仿題工具。
- 缺失或未驗證資料必須誠實標示，不能假成功、假分數或錯誤判分。
- GitHub Pages 路徑必須保留 `/ai-learning/`。
- 題目、答案及仿題邏輯屬高風險內容；本 PR 不批量改寫數學內容。
- 繁體中文及香港 HKDSE 用語優先；保留原題必要英文。
- 介面須手機優先，數學公式及圖像不可被裁切。

## 5. 實作範圍

實作 AI 可以修改：

- `index.html`
  - 只限 HKDSE 學生入口、資料範圍文字及導向參數。
- `hkdse/index.html`
  - 新增學生版 HKDSE 卷一／卷二工具首頁。
- `hkdse/guide.html`
  - 修正返回路徑及與新入口重複／過時的資料文字。
- `hkdse/dse-practice-p1.html`
  - 修正篩選、分批顯示、作答草稿、自評語意、本地保存及手機操作。
- `hkdse/dse-practice-p2.html`
  - 修正篩選、分批顯示、答案可用性、可靠計分、本地保存及手機操作。
- `hkdse/catalog.json`
  - 如需要，以輕量 metadata 記錄各卷年份、題數及答案覆蓋，避免首頁載入大型題庫。
- `hkdse/scripts/build-catalog.js`
  - 如採用 catalog，從現有 JSON 產生 metadata；不得修改題庫內容。
- `hkdse/tests/`
  - 可加入無外部依賴的 Node 資料／流程檢查。
- `hkdse/USER_GUIDE.md`
  - 更新實際入口、題數、年份及「自評／自動核對」差異。

## 6. 不應修改範圍

實作 AI 不應修改：

- `hkdse/evidence/`
- `hkdse/answer-images/`
- `hkdse/images-p1/`
- `hkdse/images-p2/`
- `hkdse/pages/p1_all_scan_results.json`
- `hkdse/pages/p1_answer_ocr_results.json`
- `hkdse/pages/p2_final_results.json`
- `hkdse/p2_solutions.json`
- `hkdse/mimic-generator/auto_templates_p2.json`
- `hkdse/mimic-generator/` 內仿題生成核心邏輯
- OCR 審核頁、老師工具、校內考試工具
- 登入、Firebase、Dashboard 或雲端同步
- 與 HKDSE 學生工具無關的首頁、題庫、遊戲及課題頁

若實作期間發現某題答案錯誤、OCR 題幹錯誤或仿題計算錯誤，應在 PR 描述列出題號，不應在本 PR 順手批量修題。

## 7. 具體任務

### 7.1 建立 HKDSE 學生工具首頁

新增 `hkdse/index.html`，提供：

- 卷一及卷二兩張清楚分開的工具卡。
- 每卷的用途、年份、現有題目數、可顯示答案／可自動核對題數。
- 年份、標準化課題及每次題量選擇。
- 建議預設每次 10 題；可選 5、10、20 題，不以「全部 198／495 題」作預設。
- 「順序」及「隨機」模式。
- 連結至使用指南。
- 清楚標示：
  - 卷一是長答題草稿及官方答案自評。
  - 卷二只有答案資料完整的題目才會計分。

首頁 `index.html` 的 DSE 入口可以保留現有快速選擇，但應：

- 連到新的 HKDSE 工具首頁，或使用與新首頁一致的 query contract。
- 不再硬編碼錯誤年份及答案可用題數。
- 不把老師 OCR／模板工具加入學生 HKDSE 主入口。

### 7.2 統一 URL 及篩選狀態

兩個練習頁支援並一致處理：

- `paper=p1|p2`
- `year=YYYY`
- `topic=...`
- `limit=5|10|20`
- `mode=ordered|random`
- `page=N`，如採用分頁

要求：

- URL 參數必須同時反映在頁內 control 的 selected state。
- 頁內改變篩選後，標題、題數、URL 及顯示題目保持一致。
- 無效參數回到安全預設，不造成空白頁或 JavaScript error。
- 切換卷別時保留可共用的年份／題量設定；不適用課題應清除。
- 頁面需顯示「目前第幾題至第幾題／符合條件共幾題」。

### 7.3 卷一長答題流程

- 把「得分」「正確」語意改為「已作答」「待自評」。
- 不可因輸入非空就當作答對。
- 每題使用可輸入多行內容的答題區，支援鍵盤及手機原生輸入。
- 現有數學快捷鍵盤可改成單一可展開共用工具，不可為每題渲染一整套鍵盤。
- 學生可：
  1. 輸入草稿。
  2. 提交／標記完成。
  3. 顯示官方答案或答案原圖。
  4. 自評為「掌握」「部分掌握」「需重做」。
- 沒有官方答案的題目須顯示「答案資料整理中」，不可顯示空白成功狀態。
- 結果摘要只統計已作答數及自評分類，不產生自動正確率。

### 7.4 卷二選擇題流程

- 學生選 A、B、C、D 後可逐題核對或整批核對。
- 只有找到非空、格式有效的正確答案時才可判分。
- 沒有答案資料的題目：
  - 清楚標示「暫未能自動核對」。
  - 不標紅為錯誤。
  - 不納入分母或正確率。
- 結果摘要至少分開：
  - 已作答
  - 可核對
  - 正確
  - 錯誤
  - 未有答案資料
- 核對後仍可修改答案及重新核對，結果不能保留舊狀態。
- 詳細解題不存在時顯示中性狀態，不把空解題當成功。
- 「重做類似題」只在該模板被標示可用時出現；V1 不擴大或批量修正仿題演算法。

### 7.5 題量、分頁及效能

- 初次載入最多渲染 20 題。
- 下一批／上一批不應遺失已輸入答案。
- 圖片延遲載入；原始掃描圖預設收起。
- MathJax 只處理當前顯示題目。
- 不重複為每題建立大型控制組件。
- 在 390 x 844 及 320 x 568：
  - 頂部操作不遮蓋題目。
  - 無水平捲動。
  - 選項、答題區、上一批／下一批及核對按鈕可觸控。
- 頂部列可在手機改為兩行、精簡按鈕或底部固定操作列。

### 7.6 本地作答保存

- 使用 versioned localStorage key，例如：
  - `hkdse:p1:practice:v1`
  - `hkdse:p2:practice:v1`
- 最少保存題號、答案、自評／核對狀態、篩選、模式及更新時間。
- 重載或返回同一練習時可恢復。
- 篩選或翻頁不刪除其他題目的本地作答。
- 提供明確「清除此卷本機紀錄」操作及確認。
- localStorage 不可保存姓名、班別、學號、完整 user agent 或其他個人資料。
- localStorage 不可用時，工具仍可完成當次練習。

### 7.7 課題及資料 metadata

- 不在 UI 直接列出卷一百多個 OCR 原始課題名稱。
- 建立一層顯示用標準課題分類；原始 topic 保留作資料來源，不覆寫題庫。
- 無法可靠歸類的題目放入「其他／待整理」。
- 題數、年份及答案覆蓋應由現有資料產生或由可驗證 metadata 提供。
- 測試應防止 catalog 題數與來源 JSON 靜默不一致。
- UI 不可把部分資料描述成完整歷屆試題。

### 7.8 導航及可用性

- `hkdse/index.html`、`guide.html`、課題分析及兩個練習頁互相返回時不可 404。
- 練習頁須有：
  - 返回 HKDSE 工具首頁
  - 返回網站首頁
  - 切換卷一／卷二
- 互動元素使用 button、label 及可理解的 accessible name。
- 不以顏色作唯一正誤提示。
- 鍵盤可完成篩選、作答、核對、顯示答案及翻頁。

## 8. 驗收條件

- [ ] 從網站首頁可進入 HKDSE 學生工具首頁。
- [ ] HKDSE 首頁清楚分開卷一長答題自評及卷二 MC 自動核對。
- [ ] 未登入可完成兩卷主要流程。
- [ ] 卷一可選到 2023；年份及題數文字與實際資料一致。
- [ ] 卷一 URL 年份／課題／題量會正確套用並顯示在 controls。
- [ ] 卷一不再把所有非空答案當作正確或顯示虛假得分。
- [ ] 卷一沒有官方答案的題目有清楚中性提示。
- [ ] 卷二 URL 年份／課題／題量會正確套用並顯示在 controls。
- [ ] 卷二沒有答案資料的題目不會被判錯，也不納入正確率。
- [ ] 卷二結果摘要分開顯示可核對與未能核對題目。
- [ ] 初次顯示不超過 20 題，翻頁／下一批後作答仍保留。
- [ ] 重載頁面後，本機作答及狀態可恢復。
- [ ] 清除本機紀錄需要明確確認。
- [ ] 390 x 844 及 320 x 568 無水平捲動，核心按鈕不遮蓋內容。
- [ ] 1280 x 720 可完成篩選、作答、核對、答案查看及翻頁。
- [ ] MathJax、題目圖及選項正常顯示。
- [ ] `hkdse/guide.html` 及課題分析返回 HKDSE 首頁不再 404。
- [ ] 無新增 console error、404、錯誤根路徑或公開秘密。
- [ ] 題庫、答案 JSON、OCR evidence 及仿題核心沒有被本 PR 改寫。

## 9. 實作 AI PR 前測試清單

### 自動檢查

- [ ] HTML 內嵌 JavaScript 可解析。
- [ ] catalog 題數與來源 JSON 一致。
- [ ] 卷一題目數、答案可用數及年份分佈測試通過。
- [ ] 卷二題目數、答案可用數及年份分佈測試通過。
- [ ] 有答案及無答案的卷二題目分別測試正確判分及排除計分。
- [ ] URL 參數解析、無效參數 fallback、分頁邊界測試通過。
- [ ] 掃描可疑根路徑：

```bash
rg 'href="/|src="/|location\.href\s*=\s*["'"'"']/' hkdse index.html --glob '*.html' --glob '*.js'
```

### 瀏覽器測試

- [ ] 從首頁進入 HKDSE 工具首頁，再分別進入卷一及卷二。
- [ ] 卷一測試一題有官方答案及一題沒有官方答案。
- [ ] 卷一輸入多行答案、提交、自評、翻頁及重載恢復。
- [ ] 卷二測試一題有答案及一題沒有答案。
- [ ] 卷二測試答對、答錯、修改後重新核對及未作答。
- [ ] 測試順序及隨機模式；隨機模式在同一 session 重載後題目次序穩定。
- [ ] 測試 5、10、20 題及最後一頁。
- [ ] 390 x 844、320 x 568、1280 x 720 通過。
- [ ] 鍵盤 Tab、Enter、Space 可操作主要 controls。
- [ ] 無新增 console error、404 或 MathJax error。
- [ ] localStorage 被封鎖時仍可完成當次作答。

### GitHub Pages

- [ ] PR 只包含 planning 範圍內檔案。
- [ ] 從 GitHub 重新讀取提交內容核對。
- [ ] 部署完成後由正式首頁重走兩卷流程。
- [ ] 正式 URL 保留 `/ai-learning/`。
- [ ] 手機及桌面正式頁均完成 smoke test。

### 跨 repository 遷移閘門

- [ ] PR A 在 `ai-lish/Assessments` 建立及部署獨立 `hkdse/`，沒有修改 `question-bank.json`。
- [ ] 真實 `https://ai-lish.github.io/Assessments/hkdse/` 可由首頁進入 P1 及 P2，所有點擊無 404。
- [ ] raw data URL 使用 `https://raw.githubusercontent.com/ai-lish/Assessments/main/...`，大寫完全正確。
- [ ] PR A 已完成圖片引用完整性、P1 自評、P2 `checkType` 正／負樣本及 localStorage 測試。
- [ ] Assessments 的 `tool/`、`question-bank.json`、`s1_term3_part_a` 及全部 `test/validate_*` 零回歸。
- [ ] 只有 PR A merge、Pages 部署完成並在真實 URL 通過後，PR B 才可 merge。
- [ ] PR B 已測試舊 `ai-learning/hkdse/` P1／P2 URL 導向、query string 保留及無 redirect loop。
- [ ] 未登入可完成主要流程；localStorage 不含姓名、班別、學號或其他學生私隱。

## 10. PR 指示

PR 描述必須包含：

- Planning file：`PLANNING/20260612_HKDSE_P1_P2_ONLINE_TOOLS_V1.md`
- 已完成的卷一功能
- 已完成的卷二功能
- 實際題目及答案覆蓋數
- 自動及瀏覽器測試結果
- 已知未完成 OCR 題幹、答案及仿題題號
- 確認沒有修改題庫、答案 JSON、OCR evidence 或仿題核心
- 風險與後續建議

實作 AI 應開 open PR，不應自行 merge。PR 完成後交回 Codex 按本 planning file 做 Ready Review。
