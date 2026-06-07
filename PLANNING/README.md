# PLANNING 工作流程

本資料夾保存每次實作前的 planning file。Planning file 是 Codex、GitHub Copilot Agent、OpenClaw 及使用者之間的正式交接文件。

## 角色分工

### Codex / Project Steward

Codex 是預設的規劃、Ready to Review 及整合把關角色。

主要責任：

1. 分析現況：檢查 repository、首頁入口、相關頁面、資料流、已知問題及實際 GitHub Pages 行為。
2. 綜合要求：把使用者的課堂需要整理成可執行、可驗收的任務。
3. 建立 planning file：在 `PLANNING/` 新增 `YYYYMMDD_CONTENT_V1.md`。
4. 守住方向：確保任務符合 `PROJECT.md` 及 `CODEX.md`，特別是「免登入可用、登入後增強」。
5. 交給 Copilot Agent：讓 Copilot 根據指定 planning file 實作並開 PR。
6. Ready to Review：PR 完成後，Codex 根據同一份 planning file 檢查、測試及決定是否可進入 merge。
7. 迭代：如有問題，Codex 建立修正指令或 V2 planning file，再交回實作。

### GitHub Copilot Agent

Copilot Agent 負責根據 planning file 實作並產生 PR。

必須：

1. 先讀 `PROJECT.md`、`CODEX.md`、本文件及指定 planning file。
2. 只做 planning file 指定範圍內的改動。
3. 保持現有課堂功能可用，不做無關重構。
4. PR 描述必須引用 planning file。
5. 在 PR 內列出已完成項目、未完成項目、測試結果及風險。

### MiniMax OpenClaw

OpenClaw 是可被委派的輔助 specialist，不再是預設 planning 或 Ready to Review owner。

適合負責：

- 瀏覽器實測
- OCR、Google Docs、Google Sheets 或外部工具流程
- 額外 PR 驗證
- Codex 或使用者明確要求的 merge 支援

OpenClaw 工作時仍須讀 `PROJECT.md`、`CODEX.md`、`OPENCLAW.md` 及指定 planning file。

### 使用者

使用者是教學產品 owner，負責確認課堂目的、功能是否適合實際教學，以及是否授權 merge。使用者毋須再負責一般 Ready to Review 技術把關，除非使用者主動想親自檢查。

## Planning File 命名規則

格式：

```text
YYYYMMDD_CONTENT_V1.md
```

例子：

```text
20260607_HOME_NAVIGATION_V1.md
20260607_STUDENT_PROGRESS_V1.md
20260607_S1_TERM3_RECORDING_V1.md
```

規則：

- `YYYYMMDD`：建立日期。
- `CONTENT`：英文大寫短描述，用底線分隔。
- `V1`：第一版；如 review 後需要重新規劃，使用 `V2`、`V3`。
- 不覆寫舊 planning file；保留歷史以便追蹤決策。

## Planning File 模板

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

Copilot Agent 可以修改：

- `path/to/file.html`
- `path/to/file.js`

Copilot Agent 不應修改：

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

## 8. Copilot PR 前測試清單

- [ ] 本地或預覽頁可載入
- [ ] 主要入口可由首頁進入
- [ ] 手機尺寸 390 x 844 可用
- [ ] 桌面尺寸 1280 x 720 可用
- [ ] 無新增 console error
- [ ] 無 404 或錯誤根路徑 `/`
- [ ] 未登入仍可完成主要流程
- [ ] 如涉及登入，登入後增強功能正常

## 9. Codex Ready to Review 清單

- [ ] PR 改動符合 planning file
- [ ] PR 沒有超出範圍的大型重構
- [ ] GitHub Pages 或預覽部署可用
- [ ] 從首頁開始測試完整流程
- [ ] 手機與桌面均通過
- [ ] 沒有新增公開秘密或個人資料風險
- [ ] 如有問題，建立修正指令或 V2 planning file

## 10. PR 指示

Copilot Agent PR 描述必須包含：

- Planning file：`PLANNING/YYYYMMDD_CONTENT_V1.md`
- 完成內容
- 測試結果
- 風險與未完成項目
```

## 標準交接流程

```text
使用者提出課堂需要
↓
Codex 分析現況
↓
Codex 新增 PLANNING/YYYYMMDD_CONTENT_V1.md
↓
GitHub Copilot Agent 根據 planning file 實作並開 PR
↓
Codex 執行 Ready to Review 檢查與測試
↓
使用者確認教學意圖或授權 merge（如需要）
↓
若失敗，Codex 更新修正指令或建立 V2 planning file
```

## 完成定義

一次 planning workflow 完成時，必須同時滿足：

- Planning file 已建立並保留在 `PLANNING/`。
- PR 引用了 planning file。
- Copilot Agent 的改動符合 planning file。
- Codex 已按 planning file 完成 Ready to Review 檢查。
- 實際頁面或預覽已測試。
- 使用者的課堂用途得到滿足。
- 沒有新增安全、私隱或路徑問題。
