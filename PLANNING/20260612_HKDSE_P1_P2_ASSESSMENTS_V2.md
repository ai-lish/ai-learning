# 20260612_HKDSE_P1_P2_ASSESSMENTS_V2

## 1. 背景

本文件取代 `PLANNING/20260612_HKDSE_P1_P2_ONLINE_TOOLS_V1.md` 的 repository 安排。

產品目標不變：建立學生可免登入使用的 HKDSE 數學卷一、卷二線上工具，修正現有篩選、判分、效能、手機操作及資料完整度提示。

新的 repository 決定：

- HKDSE 工具、執行邏輯、學生介面及運行所需題目資產放入 `ai-lish/Assessments`。
- `ai-lish/ai-learning` 不再作為 HKDSE 工具的長期程式來源，只保留網站入口、課堂導航及遷移期相容連結。
- 正式 HKDSE 工具基底為：

```text
https://ai-lish.github.io/Assessments/hkdse/
```

- `ai-learning` GitHub Pages 仍使用 `/ai-learning/`；跨 repository 連結必須使用完整 HTTPS URL，不能錯誤拼成 `/ai-learning/Assessments/...`。
- runtime data 如需直接使用 raw GitHub URL，只可使用：

```text
https://raw.githubusercontent.com/ai-lish/Assessments/main/...
```

- GitHub Pages 與 raw 路徑大小寫敏感。`Assessments` 必須保持大寫 A；
  `/assessments/` 或 `ai-lish/assessments` 會 404，必須加入自動及真實 Pages 測試。

## 2. Repository 分工

### 2.1 `ai-lish/Assessments`

負責：

- HKDSE 學生工具首頁。
- 卷一長答題練習及自評。
- 卷二選擇題練習及可靠判分。
- HKDSE runtime data、必要圖片及答案資產。
- 題目 catalog、資料覆蓋資訊及資料驗證測試。
- 學生本機作答保存。
- GitHub Pages 正式 HKDSE 工具。

### 2.2 `ai-lish/ai-learning`

負責：

- 首頁「考試與 HKDSE」入口。
- 清楚標示此工具會開啟 Assessments。
- 保留現有課堂導航及返回教學網站的完整 URL。
- 遷移完成後為舊 HKDSE 學生 URL 提供相容導向。

不再負責：

- 新增 HKDSE 核心功能。
- 維護兩套互相分歧的卷一／卷二學生工具。
- 在兩個 repository 各自保存一套持續更新的題目資料。

## 3. Assessments 現況

已核對 `ai-lish/Assessments` `main`：

- 正式網址：`https://ai-lish.github.io/Assessments/`
- `question-bank.json`：初中動態題型庫。
- `templates/student.html`：老師工具生成 standalone 學生 HTML 的模板。
- `tool/index.html`：年級、學期、課題、題目分層選擇及匯出工具。
- `test/`：題目庫、preset、老師工具及匯出測試。
- PR #2 已合併老師選題、逐題預覽及匯出閘門。

HKDSE 歷屆卷與現有 `question-bank.json` 有不同資料模型：

- 現有題目庫每個 entry 是可動態生成的「題型」。
- HKDSE 資料每個 entry 是固定年份及題號的歷屆題目。
- 卷一需要長答題草稿、答案查看及學生自評。
- 卷二需要固定 A、B、C、D 選項、答案覆蓋狀態及可靠計分。
- HKDSE 題庫達 693 題，不應變成 693 個 `generate()` 題型。

因此，本任務必須在 Assessments 建立獨立 `hkdse/` 模組，不可把歷屆題目直接塞入現有 `question-bank.json`，也不可令初中老師工具載入約 50 MB HKDSE 資產。

## 4. 現有 HKDSE 來源分析

來源 repository：`ai-lish/ai-learning`

目前 `hkdse/` 實測約 53 MiB／54 MB、1,276 個 tracked 檔案，當中包括學生 runtime、老師 OCR、備份、evidence、GAS、仿題產生腳本及重複資料。

主要 runtime 資產：

- `hkdse/pages/p1_all_scan_results.json`
  - 卷一 198 題。
  - 年份 2012 至 2023。
- `hkdse/pages/p1_answer_ocr_results.json`
  - 現有 198 題中 126 題有非空答案文字。
  - 72 題沒有可顯示答案。
- `hkdse/pages/p2_final_results.json`
  - 卷二 495 題。
  - 2012 至 2022 每年 45 題。
- `hkdse/p2_solutions.json`
  - 437 題有答案／解題資料。
  - 58 題沒有可供自動核對的答案。
- `hkdse/images-p1/`
  - 約 13 MiB／14 MB，220 個檔案。
- `hkdse/images-p2/`
  - 約 25 MB，495 個檔案。
- `hkdse/answer-images/`
  - 約 9.5 MB，229 個檔案。

現有學生工具問題：

1. 卷一由首頁帶入年份時沒有按年份初次篩選。
2. 卷二按 URL 篩選後，頁內 control 仍顯示「全部」。
3. 首頁與資料年份／題數硬編碼不一致。
4. 卷一把每個非空答案當作正確，產生誤導得分。
5. 卷二把沒有答案資料的題目判錯。
6. 卷一一次渲染 198 題及每題一套鍵盤；卷二一次渲染 495 題。
7. 卷一課題名稱有大量中英文、近義及不同粒度值。
8. 部分 OCR 題幹仍含辨識描述，不可聲稱全部人工核對。
9. `hkdse/index.html` 不存在，部分指南及課題分析返回連結 404。
10. 本機作答保存及 reload 恢復不一致。

## 5. 目標架構

Assessments 新增：

```text
hkdse/
├── index.html
├── guide.html
├── assets/
│   ├── hkdse.css
│   ├── common.js
│   ├── p1.js
│   └── p2.js
├── p1/
│   └── index.html
├── p2/
│   └── index.html
├── data/
│   ├── catalog.json
│   ├── p1-questions.json
│   ├── p1-answers.json
│   ├── p2-questions.json
│   └── p2-solutions.json
├── images/
│   ├── p1/
│   ├── p1-answers/
│   └── p2/
├── scripts/
│   ├── import-from-ai-learning.mjs
│   └── build-catalog.mjs
└── test/
    ├── validate-data.mjs
    ├── validate-routes.mjs
    └── validate-grading.mjs
```

實作可以按 Assessments 現有風格調整檔名，但必須維持以下邊界：

- HKDSE 學生 app 與初中 `question-bank.json` 分開。
- HKDSE runtime data 與老師 OCR／evidence／備份分開。
- 共用 CSS／JS 不可反過來破壞現有 `tool/index.html` 或 `templates/student.html`。
- P1 與 P2 共用 URL parsing、localStorage、分頁及導航 helper，但保留不同作答與結果模型。

## 6. 遷移資產範圍

### 6.1 必須遷移至 Assessments

- 兩卷學生練習所需的精簡題目 JSON。
- 卷一官方答案文字及必要答案圖引用。
- 卷二可靠答案及解題資料。
- 學生實際會開啟的題目圖片。
- 顯示用標準課題 mapping。
- 資料來源、版本及覆蓋 metadata。

### 6.2 不遷移至 HKDSE 學生 runtime

- `hkdse/evidence/`
- `hkdse/pages/backup-*`
- `hkdse/__pycache__/`
- `hkdse/gas-project/`
- OCR review 頁。
- 老師審批狀態及管理資料。
- 下載、OCR、dual-path verify 等 Python 工作檔。
- 與學生 V1 不直接相關的仿題模板 editor。
- 重複 JSON 或只供歷史除錯的資料。

### 6.3 圖片去重及大小規則

- 遷移 script 必須按 runtime JSON 真實引用建立圖片 allowlist。
- 不可直接複製整個舊 `hkdse/` 目錄。
- 完全相同的圖片以 hash 檢查；可安全共用時只保留一份。
- 不因壓縮而令題目文字、坐標、角標、圖形標記或答案看不清。
- 所有被 runtime JSON 引用的圖片必須存在。
- 所有未被 runtime 引用的圖片應由測試列出，避免無意加入大量孤兒資產。

### 6.4 逐檔保留／刪除／引用檢查

「刪除」在 PR A 的意思是「不複製到 Assessments runtime」；除非另有 cleanup
planning，PR A／PR B 不可從 `ai-learning` 歷史來源直接刪除資料。

| `ai-learning` 舊路徑 | Assessments 遷移決策 | 必須完成的引用／重複檢查 |
|---|---|---|
| `hkdse/p2_solutions.json` | 保留為 P2 solution 候選 canonical source，轉換後放入 `hkdse/data/p2-solutions.json` | 與 `hkdse/pages/p2_solutions.json` 做 SHA-256、JSON key 數及逐題內容比較；記錄學生頁實際 fetch 路徑 |
| `hkdse/pages/p2_solutions.json` | 若與 canonical 等值則不重複遷移；不等值則阻擋 PR | `rg` 全 repo 引用；產生 duplicate／difference report，禁止靜默覆蓋 |
| `hkdse/p2_latex_ocr_results.json` | 只有新 P2 runtime schema 仍需 OCR 原始欄位時才保留 | 與 `hkdse/pages/p2_latex_ocr_results.json` 做 SHA-256、key 及內容比較；確認 P2 正式頁是否 fetch |
| `hkdse/pages/p2_latex_ocr_results.json` | 重複或非 runtime 時不遷移 | `rg` 引用；不同版本必須列入 blocking report |
| `hkdse/pages/backup-20260412T031151Z/` | 不遷移 | 確認 HTML、JS、JSON catalog 沒有引用 backup；列出內含檔案及對應 canonical |
| `hkdse/__pycache__/` | build 工件，不遷移；Assessments `.gitignore` 阻止加入 | 確認沒有 runtime 引用 `.pyc`；記錄檔案數及大小 |
| `hkdse/evidence/` | 不遷入學生 runtime；暫留舊資料製作 workflow | 確認 P1/P2 學生頁不 fetch evidence；如未來要遷移須另開老師資料 workflow planning |
| `hkdse/mimic-generator/` | 不遷入 V2 正式學生主流程 | 搜尋 `auto_templates_p2.json`、`practice_p*.json`、template editor 及「重做類似題」引用；保留引用報告，不可令學生頁留下 404 按鈕 |
| `hkdse/ocr_log.txt` | 確認為 0 bytes 且無引用後不遷移；日後 cleanup 可刪除 | 檢查 size、git history 及 `rg` 引用，任一不符合則列為需人工決定 |
| `hkdse/images-p1/` | 按 P1 runtime 題號 allowlist 保留 | 每個 JSON image reference 必須存在；hash 去重；孤兒圖片報告 |
| `hkdse/images-p2/` | 按 P2 runtime 題號 allowlist 保留 | 495 題引用完整性；hash 去重；孤兒圖片報告 |
| `hkdse/answer-images/` | 只保留被 P1 answer runtime 引用的圖片 | 比對 P1 答案 JSON、`images-p1/` hash 及顯示用途；不可因檔名相同便假設可共用 |

PR A 描述必須附上 machine-readable 或 Markdown manifest，最少包含：

- source path
- disposition：`keep`、`exclude`、`deduplicate`、`manual-review`
- source size／file count
- destination path
- reference count
- content hash 或 duplicate group
- unresolved difference

## 7. 資料匯入及 ownership

### 7.1 一次性匯入

`import-from-ai-learning.mjs` 從一個明確指定的本機來源路徑讀取舊資料，輸出 Assessments runtime schema。

要求：

- 不以字串拼接修改 JSON。
- 保留穩定題號，例如 `2012Q01`。
- 正規化相對圖片路徑。
- 記錄來源檔、來源 commit SHA、匯入時間及 schema version。
- 匯入後自動執行資料驗證。
- 不在匯入時猜測或製造缺失答案。
- 不在匯入時把 OCR 未核對內容標示成已驗證。

### 7.2 遷移後 ownership

Assessments PR 合併及正式網站驗收後：

- HKDSE 學生 runtime data 的唯一正式來源是 `ai-lish/Assessments/hkdse/data/`。
- `ai-learning/hkdse/` 舊資料只作遷移期回退，不再接受新學生功能更新。
- 後續題目、答案或年份更新必須在 Assessments 建 planning 及 PR。
- 老師 OCR／資料製作 workflow 如仍留在 `ai-learning`，必須輸出可匯入 Assessments 的資料，不得直接形成第二套正式學生資料。

## 8. HKDSE 工具首頁

`https://ai-lish.github.io/Assessments/hkdse/` 提供：

- 卷一及卷二兩張清楚分開的工具卡。
- 每卷用途、年份、現有題目數及答案覆蓋數。
- 年份、標準化課題、每次題量及順序／隨機模式。
- 預設每次 10 題；可選 5、10、20 題。
- 使用指南。
- 返回少康老師教學網站：

```text
https://ai-lish.github.io/ai-learning/
```

必須清楚標示：

- 卷一是長答題草稿及官方答案自評。
- 卷二只有答案資料完整的題目才會計分。
- 部分 OCR 內容及答案仍在整理。
- 主要練習毋須登入。

## 9. URL contract

兩卷支援：

- `year=YYYY`
- `topic=...`
- `limit=5|10|20`
- `mode=ordered|random`
- `page=N`
- `seed=...`，隨機模式需要穩定重載時使用

正式路徑：

```text
/Assessments/hkdse/
/Assessments/hkdse/p1/
/Assessments/hkdse/p2/
```

要求：

- URL 參數與 control selected state 一致。
- 改變篩選後更新 URL、題數及顯示題目。
- 無效參數回到安全預設。
- 切換卷別時保留可共用的年份／題量；不適用課題清除。
- 顯示目前題目範圍及符合條件總數。
- 所有 Assessments 內部連結使用相對路徑。
- 返回 `ai-learning` 使用完整 HTTPS URL。

## 10. 卷一學生流程

- 不使用「得分／正確」描述非空輸入。
- 每題提供多行草稿輸入。
- 可以使用共用、可展開數學快捷輸入；不可每題渲染一整套鍵盤。
- 學生可：
  1. 輸入草稿。
  2. 標記完成。
  3. 顯示官方答案文字或答案原圖。
  4. 自評「掌握」「部分掌握」「需重做」。
- 沒有官方答案時顯示「答案資料整理中」。
- 結果只統計已作答及自評分類，不產生自動正確率。
- OCR 未核對題目顯示資料狀態，不聲稱是完整人工校對文字。

## 11. 卷二學生流程

- 學生選 A、B、C、D 後可逐題或整批核對。
- 只有正確答案為 `A|B|C|D` 時才可判分。
- 沒有答案資料的題目：
  - 標示「暫未能自動核對」。
  - 不標示為錯誤。
  - 不納入正確率分母。
- 結果分開顯示：
  - 已作答
  - 可核對
  - 正確
  - 錯誤
  - 未有答案資料
- 修改答案後可重新核對，不保留舊顏色或結果。
- 詳細解題不存在時使用中性提示。
- V2 不把舊仿題演算法搬入正式學生主流程；如日後加入，必須另開 planning 並逐模板驗證。

P2 判分 contract 定義為 HKDSE 專用 `checkType: "choiceKey"`：

- 正確答案只能是 `A`、`B`、`C`、`D`。
- 正樣本：選擇與 verified answer 相同，計入 `correct`。
- 負樣本：選擇另一個有效 option，計入 `wrong`。
- 缺失樣本：沒有 verified answer，不判錯、不判對、不進入正確率分母。
- 非法答案樣本：空字串、`E`、長句或非字串，一律視為資料錯誤並排除計分。
- 更改答案後重核，舊 `correct`／`wrong` class 及統計必須先清除。

## 12. 效能、手機及本地紀錄

### 12.1 效能

- 初次最多渲染 20 題。
- 圖片使用 lazy loading。
- 原始掃描圖預設收起。
- MathJax 只處理當前顯示題目。
- P1／P2 只載入該卷所需資料，不在 HKDSE 首頁同時載入全部題庫圖片。

### 12.2 手機

測試：

- 320 x 568
- 390 x 844
- 1280 x 720

要求：

- 無水平捲動。
- 頂部或底部操作列不遮蓋題目。
- 觸控目標清楚。
- 數學公式及圖片不被裁切。
- 鍵盤可完成所有主要操作。

### 12.3 localStorage

使用 Assessments namespace：

```text
assessments:hkdse:p1:v1
assessments:hkdse:p2:v1
```

保存：

- schema version
- 題號及學生答案
- 自評／核對狀態
- 篩選、模式、seed、page
- 更新時間

規則：

- reload、翻頁及篩選不遺失已作答內容。
- 提供明確清除此卷本機紀錄操作。
- 不保存姓名、班別、學號、完整 user agent 或其他個人資料。
- localStorage 不可用時仍可完成當次練習。

## 13. Assessments 實作範圍

主要 repository：`ai-lish/Assessments`

可以新增或修改：

- `hkdse/**`
- repository 根 `index.html` 的 HKDSE 工具入口，如該頁存在。
- `README.md` 的工具清單、網址及資料 ownership。
- `.gitignore`
- 與 HKDSE 資料匯入及驗證直接相關的 test／script。
- `PLANNING/20260612_HKDSE_P1_P2_ASSESSMENTS_V2.md`
  - 建議在 Assessments PR 內加入本文件的相同版本，讓 target repo 保留實作依據。

不應修改：

- `question-bank.json`
- `test/parts/`
- 現有初中題型 generate 邏輯
- `tool/index.html` 老師選題流程
- `templates/student.html`
- 現有 `s1_term3_part_a` preset
- 與 HKDSE 無關的測試

如發現必須修改上述現有核心，實作 AI 應停止並回報，不可把 HKDSE 遷移變成 Assessments 架構重寫。

## 14. `ai-learning` 後續入口 PR

Assessments HKDSE PR 合併、部署及正式測試通過後，才在 `ai-learning` 開第二個 PR。

可以修改：

- `index.html`
  - HKDSE 學生入口改為 `https://ai-lish.github.io/Assessments/hkdse/`。
- `hkdse/dse-practice-p1.html`
- `hkdse/dse-practice-p2.html`
- `hkdse/guide.html`
  - 只限加入清楚相容導向或「工具已搬遷」頁。
- `README.md`／`hkdse/USER_GUIDE.md`
  - 更新正式 ownership 及網址。

第一階段不應刪除：

- 舊題目 JSON。
- 舊圖片。
- 答案資產。
- OCR／老師 workflow。

相容導向要求：

- 保留舊 query string。
- P1 舊 URL 導向 `/Assessments/hkdse/p1/`。
- P2 舊 URL 導向 `/Assessments/hkdse/p2/`。
- 不進行即時 redirect loop。
- 無 JavaScript 時仍提供可點擊的新網址。
- 清楚提供返回 `ai-learning` 首頁。

刪除舊 runtime 資產必須另開 cleanup planning，並先確認至少一個完整教學週期沒有回退需要。

## 15. 分階段 PR

### PR A：Assessments HKDSE app

目標 repository：`ai-lish/Assessments`

內容：

- 新增 `hkdse/` 獨立 app。
- 匯入精簡 runtime data 及必要圖片。
- 完成 P1／P2 學生流程。
- 加入資料、判分、路徑及瀏覽器測試。
- 更新 Assessments README。
- 不修改 `ai-learning`。

Ready Review 必須先確認：

```text
https://ai-lish.github.io/Assessments/hkdse/
```

PR A 不可只以 localhost、raw file 或 PR preview 作部署證據。必須在 merge 前或
可供 review 的部署 branch／Pages 環境，以真實 GitHub Pages URL 完成：

- HKDSE 首頁至 P1／P2 的實際點擊。
- data、CSS、JS、題目圖及答案圖 network request 無 404。
- 大小寫 `Assessments` 正確。
- 手機及桌面核心流程。

### PR B：ai-learning entry switch

目標 repository：`ai-lish/ai-learning`

前置條件：

- PR A 已 merge。
- Assessments GitHub Pages 已部署。
- 桌面及手機正式流程通過。

內容：

- 首頁入口改到 Assessments。
- 舊學生 URL 加相容導向。
- 更新使用指南。
- 保留舊 runtime 資產作回退。

不可把兩個 repository 的修改放在同一個 PR 或假設會同時部署。

## 16. 驗收條件

### Assessments

- [ ] `https://ai-lish.github.io/Assessments/hkdse/` 可載入。
- [ ] HKDSE app 與現有老師工具及初中題目庫分開。
- [ ] 未登入可完成 P1、P2 主要流程。
- [ ] 卷一顯示實際 2012 至 2023 資料，不聲稱缺失年份題目完整。
- [ ] 卷一不產生虛假正確率。
- [ ] 卷一有／沒有官方答案兩種狀態正確。
- [ ] 卷二 58 題缺答案時不被判錯或納入正確率。
- [ ] URL 篩選及 control selected state 一致。
- [ ] 每次最多顯示 20 題。
- [ ] reload、翻頁及篩選不遺失本機作答。
- [ ] 圖片引用全部存在，沒有 orphan runtime 路徑。
- [ ] 真實 Pages HKDSE 首頁、P1、P2、CSS、JS、JSON、題目圖及答案圖請求無 404。
- [ ] 320 x 568、390 x 844、1280 x 720 通過。
- [ ] 無新增 console error、404 或錯誤 `/ai-learning/` 路徑。
- [ ] 現有 Assessments tests 全部通過。
- [ ] 現有 `tool/index.html`、`templates/student.html` 及 `question-bank.json` 行為沒有改變。
- [ ] `s1_term3_part_a` 仍可由老師工具選取、預覽、確認及匯出。
- [ ] 現有 `test/validate_*` 及 `node test/test_tool_logic.cjs` 全部通過。

### ai-learning

- [ ] 首頁 HKDSE 入口開啟 Assessments 正式工具。
- [ ] 舊 P1、P2 URL 保留 query string 並導向正確卷別。
- [ ] 無 redirect loop。
- [ ] 返回教學網站連結正確。
- [ ] 舊 runtime 資產尚未刪除。
- [ ] `/ai-learning/` 其他課堂工具不受影響。

## 17. 測試清單

### 資料測試

- [ ] P1 198 題可解析，題號唯一。
- [ ] P1 答案覆蓋數由資料計算，不硬編碼。
- [ ] P2 495 題可解析，題號唯一。
- [ ] P2 可判分答案只接受 `A|B|C|D`。
- [ ] 缺答案題目測試不判錯。
- [ ] catalog 年份、題數、課題及 coverage 與來源 JSON 一致。
- [ ] 每個 runtime 圖片路徑存在。
- [ ] 未引用圖片及重複 hash 有報告。

### 行為測試

- [ ] P1 有答案題及無答案題。
- [ ] P1 多行輸入、標記完成、自評及重載恢復。
- [ ] P1 自評的「掌握／部分掌握／需重做」正樣本、切換樣本及未自評樣本。
- [ ] P2 `choiceKey` 答對正樣本、答錯負樣本、未作答、無答案、非法答案及修改後重核。
- [ ] ordered／random 模式。
- [ ] 相同 seed reload 後次序一致。
- [ ] 5、10、20 題及最後一頁。
- [ ] localStorage unavailable fallback。
- [ ] 鍵盤及觸控。

### 路徑測試

- [ ] Assessments 內部相對路徑正確。
- [ ] 返回 `https://ai-lish.github.io/ai-learning/` 正確。
- [ ] 所有 Pages URL 使用大寫 `/Assessments/`，所有 raw URL 使用 `ai-lish/Assessments`。
- [ ] 真實 Pages 由 HKDSE 首頁點擊至 P1／P2 及載入所有 runtime 資產無 404。
- [ ] 舊 ai-learning P1／P2 URL 導向正確。
- [ ] query string 保留。
- [ ] GitHub Pages 大小寫 `/Assessments/` 正確。

### 回歸測試

- [ ] `python3 test/validate_bank.py`
- [ ] `python3 test/validate_preset.py`
- [ ] `python3 test/validate_tool.py`
- [ ] `node test/test_tool_logic.cjs`
- [ ] Assessments 首頁及 `tool/` 正常。
- [ ] `question-bank.json` hash 或預期 diff 證明未被 HKDSE migration 修改。
- [ ] `s1_term3_part_a` 生成題數、順序及既有驗證結果不變。
- [ ] 未登入可完成 HKDSE 核心流程。
- [ ] localStorage 不可用時 fallback 通過；可用時只保存作答狀態，不含姓名、班別、學號或裝置私隱。

## 18. PR 指示

### Assessments PR

PR 描述必須包含：

- Planning file：`PLANNING/20260612_HKDSE_P1_P2_ASSESSMENTS_V2.md`
- 原始來源 repository 及 commit SHA。
- 實際遷移檔案及未遷移檔案。
- 匯入前後題數、答案覆蓋及圖片數。
- runtime 資產總大小。
- P1／P2 測試結果。
- 現有 Assessments 回歸測試結果。
- 已知 OCR／答案缺失。
- 明確確認未修改初中題目庫及老師工具核心。

### ai-learning PR

PR 描述必須包含：

- 同一 planning file。
- 已部署 Assessments HKDSE URL。
- 首頁入口及舊 URL 導向清單。
- query string 保留測試。
- 手機／桌面正式網站測試。
- 明確確認未刪除舊 runtime 資產。

兩個 PR 均應保持 open，交回 Codex 依本 planning file 做 Ready Review。Assessments PR 應先 review、check、test、merge 及部署；其後才開始 ai-learning 入口 PR。
