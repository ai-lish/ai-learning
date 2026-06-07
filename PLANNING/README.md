# PLANNING 工作流程

本資料夾保存每次實作前的 planning file。Planning file 是 Codex、使用者、實作 AI、OpenClaw 及最終 review 之間的正式交接文件。

## 角色分工

### Codex / Project Steward

Codex 是預設的規劃、Ready Review 及出街後確認角色。

主要責任：

1. 分析現況：檢查 repository、首頁入口、相關頁面、資料流、已知問題及實際 GitHub Pages 行為。
2. 綜合要求：把使用者的課堂需要整理成可執行、可驗收的任務。
3. 建立 planning file：在 `PLANNING/` 新增 `YYYYMMDD_CONTENT_V1.md`。
4. 把 planning file 交給使用者，讓使用者可指派 Copilot、OpenClaw、Gemini 或其他 AI 實作。
5. Ready Review：使用者交回 open PR 後，Codex 根據同一份 planning file 檢查是否 ready。
6. 如果 ready，Codex 明確標示 `Ready for OpenClaw check/test/merge`。
7. OpenClaw check/test/merge 後，Codex 與使用者確認正式 GitHub Pages 出街版本。
8. 如果出街版本不正確，Codex 建立 `YYYYMMDD_CONTENT_DEBUG_1.md`，由 planning 重新開始。

### 實作 AI：Copilot / OpenClaw / Gemini / 其他 Agent

實作 AI 負責根據 planning file 修改 repository 並產生 open PR。

必須：

1. 先讀 `PROJECT.md`、`CODEX.md`、本文件及指定 planning file。
2. 只做 planning file 指定範圍內的改動。
3. 保持現有課堂功能可用，不做無關重構。
4. PR 描述必須引用 planning file。
5. 在 PR 內列出已完成項目、未完成項目、測試結果及風險。
6. 不自行改變產品方向；如 planning 不清楚，回報問題而不是擴大範圍。

### MiniMax OpenClaw

OpenClaw 在本流程有兩種可能角色：

- 作為實作 AI：按 planning file 修改並開 PR。
- 作為 final check/test/merge agent：在 Codex 判斷 PR ready 後，由使用者指派 OpenClaw 做最後檢查、測試及 merge。

OpenClaw merge 後，仍需由 Codex 與使用者確認正式出街版本是否正確。

### 使用者

使用者是教學產品 owner，負責確認課堂目的、選擇使用哪個 AI 實作、把 open PR 交回 Codex review，以及在 Codex 判斷 ready 後叫 OpenClaw check/test/merge。

## Planning File 命名規則

一般功能 planning：

```text
YYYYMMDD_CONTENT_V1.md
```

例子：

```text
20260607_HOME_NAVIGATION_V1.md
20260607_STUDENT_PROGRESS_V1.md
20260607_S1_TERM3_RECORDING_V1.md
```

出街後修正 planning：

```text
YYYYMMDD_CONTENT_DEBUG_1.md
```

例子：

```text
20260607_HOME_NAVIGATION_DEBUG_1.md
20260607_STUDENT_PROGRESS_DEBUG_1.md
```

規則：

- `YYYYMMDD`：建立日期。
- `CONTENT`：英文大寫短描述，用底線分隔。
- `V1`：第一版；如實作前需要重新規劃，使用 `V2`、`V3`。
- `DEBUG_1`：正式出街後發現問題時使用；如同一出街問題需要再修，使用 `DEBUG_2`、`DEBUG_3`。
- 不覆寫舊 planning file；保留歷史以便追蹤決策。

## 一般 Planning File 模板

```markdown
# YYYYMMDD_CONTENT_V1

## 1. 背景

說明今次需求來自哪個課堂／工具／網站整合問題。

## 2. 現況分析

- 相關首頁入口：
- 相關檔案：
- 目前行為：
- 已知問題：
- 安全或私隱風險：

## 3. 使用者要求整理

用清楚、可驗收的語句重寫使用者要求。

## 4. 產品原則

必須符合：

- 主要學生流程免登入可用。
- 登入只作進度、紀錄或額外功能增強。
- 不破壞現有課堂工具。
- 不新增公開密碼、token 或學生私隱風險。
- GitHub Pages 路徑必須保留 `/ai-learning/`。

## 5. 實作範圍

實作 AI 可以修改：

- `path/to/file.html`
- `path/to/file.js`

實作 AI 不應修改：

- 與本任務無關的題庫、答案、PDF、OCR 原始資料
- 未在本 planning file 列出的主要頁面

## 6. 具體任務

1. 任務一
2. 任務二
3. 任務三

## 7. 驗收條件

- [ ] 條件一
- [ ] 條件二
- [ ] 條件三

## 8. 實作 AI PR 前測試清單

- [ ] 本地或預覽頁可載入
- [ ] 主要入口可由首頁進入
- [ ] 手機尺寸 390 x 844 可用
- [ ] 桌面尺寸 1280 x 720 可用
- [ ] 無新增 console error
- [ ] 無 404 或錯誤根路徑 `/`
- [ ] 未登入仍可完成主要流程
- [ ] 如涉及登入，登入後增強功能正常

## 9. PR 指示

PR 描述必須包含：

- Planning file：`PLANNING/YYYYMMDD_CONTENT_V1.md`
- 完成內容
- 測試結果
- 風險與未完成項目
```

## Debug Planning File 模板

```markdown
# YYYYMMDD_CONTENT_DEBUG_1

## 1. 原始工作

- 原始 planning file：`PLANNING/YYYYMMDD_CONTENT_V1.md`
- 原始 PR：
- Merge commit（如已知）：

## 2. 出街後問題

- 預期行為：
- 實際出街行為：
- 由首頁重現路徑：
- 受影響頁面或工具：

## 3. 初步原因分析

- 可能相關檔案：
- 可能相關資料流：
- 安全、私隱或路徑風險：

## 4. 修正範圍

實作 AI 可以修改：

- `path/to/file.html`
- `path/to/file.js`

實作 AI 不應修改：

- 與 debug 無關的頁面或題庫
- 已正常運作的課堂工具

## 5. 修正任務

1. 任務一
2. 任務二
3. 任務三

## 6. 驗收條件

- [ ] 問題可重現後已修正
- [ ] 原本正常流程未被破壞
- [ ] GitHub Pages 出街版本通過

## 7. PR 指示

PR 描述必須包含：

- Debug planning file：`PLANNING/YYYYMMDD_CONTENT_DEBUG_1.md`
- 原始 PR 或原始 planning file
- 修正內容
- 測試結果
- 剩餘風險
```

## 標準交接流程

```text
使用者提出課堂需要
↓
Codex 分析現況並建立 PLANNING/YYYYMMDD_CONTENT_V1.md
↓
使用者指派 Copilot / OpenClaw / Gemini / 其他 AI 實作
↓
實作 AI 開 open PR
↓
使用者把 open PR 交回 Codex
↓
Codex 根據 planning file 判斷是否 ready
↓
若 ready，使用者叫 OpenClaw check / test / merge
↓
Codex 與使用者確認正式 GitHub Pages 出街版本
↓
若出街版本錯誤，Codex 建立 PLANNING/YYYYMMDD_CONTENT_DEBUG_1.md 並重新開始
```

## 完成定義

一次 planning workflow 完成時，必須同時滿足：

- Planning file 已建立並保留在 `PLANNING/`。
- PR 引用了 planning file。
- 實作 AI 的改動符合 planning file。
- Codex 已判斷 PR ready 或清楚指出 not ready。
- OpenClaw 已按使用者要求完成 check/test/merge。
- Codex 與使用者已確認正式出街版本正確。
- 沒有新增安全、私隱或路徑問題。
