# PLANNING 工作流程

本資料夾用於保存每次實作前的 planning file。這是 OpenClaw、GitHub Copilot Agent 及使用者之間的正式交接文件。

## 角色分工

### Project Steward / Integration Planner

此角色負責把使用者的課堂需要轉成可執行、可驗收的 planning file。

主要責任：

1. 分析現況：檢查 repository、首頁入口、相關頁面、資料流、已知問題及實際 GitHub Pages 行為。
2. 綜合要求：整理使用者真正想達成的課堂用途，分辨正式功能、試驗功能、老師工具及整合基建。
3. 制定任務：寫出清晰的 Copilot Agent 實作要求，包括改動範圍、不可改範圍、驗收條件及測試清單。
4. 守住方向：確保所有任務遵守 `PROJECT.md`，特別是「免登入可用、登入後增強」、保護現有課堂工具、避免公開秘密及尊重 `/ai-learning/` 路徑。
5. 支援 review：在 PR 後協助比對 implementation 是否符合 planning file。

### MiniMax OpenClaw

OpenClaw 主要負責 planning、外部檢查、瀏覽器測試及 merge 前驗證。

建議流程：

1. 根據使用者需求，在 `PLANNING/` 新增 planning file。
2. 使用命名格式：`YYYYMMDD_CONTENT_V1.md`。
3. 將 planning file 交給 GitHub Copilot Agent 實作。
4. 使用者標示 Ready to Review 後，OpenClaw 根據同一份 planning file 執行 check、test、merge。
5. 如測試失敗，更新 planning file 或建立 V2，交回 Copilot Agent 修正。

### GitHub Copilot Agent

Copilot Agent 主要負責根據 planning file 實作並產生 PR。

必須：

1. 先讀 `PROJECT.md`、本文件及指定 planning file。
2. 只做 planning file 指定範圍內的改動。
3. 保持現有課堂功能可用，不做無關重構。
4. 產生 PR，PR 描述必須引用 planning file。
5. 在 PR 內列出已完成項目、未完成項目、測試結果及風險。

### 使用者

使用者負責確認課堂需求、判斷功能是否符合教學用途，並在合適時標示 Ready to Review。

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

## 8. 測試清單

GitHub Copilot Agent PR 前至少確認：

- [ ] 本地或預覽頁可載入
- [ ] 主要入口可由首頁進入
- [ ] 手機尺寸 390 x 844 可用
- [ ] 桌面尺寸 1280 x 720 可用
- [ ] 無新增 console error
- [ ] 無 404 或錯誤根路徑 `/`
- [ ] 未登入仍可完成主要流程
- [ ] 如涉及登入，登入後增強功能正常

OpenClaw Ready to Review 後至少確認：

- [ ] PR 改動符合 planning file
- [ ] GitHub Pages 實際部署後可用
- [ ] 從首頁開始測試完整流程
- [ ] 手機與桌面均通過
- [ ] 沒有新增公開秘密或個人資料風險
- [ ] 如有問題，建立修正指令或 V2 planning file

## 9. PR 指示

Copilot Agent PR 描述必須包含：

- Planning file：`PLANNING/YYYYMMDD_CONTENT_V1.md`
- 完成內容
- 測試結果
- 風險與未完成項目

## 10. OpenClaw Merge 前檢查

OpenClaw 不應只看 PR 描述，必須實際開 GitHub Pages 測試。若部署尚未完成，需要等待或重試。
```

## 標準交接流程

```text
使用者提出需求
↓
Project Steward / OpenClaw 分析現況
↓
新增 PLANNING/YYYYMMDD_CONTENT_V1.md
↓
GitHub Copilot Agent 根據 planning file 實作並開 PR
↓
使用者確認 Ready to Review
↓
OpenClaw 根據 planning file check / test / merge
↓
若失敗，回到 planning file 更新或建立 V2
```

## 完成定義

一次 planning workflow 完成時，必須同時滿足：

- Planning file 已建立並保留在 `PLANNING/`。
- PR 引用了 planning file。
- Copilot Agent 的改動符合 planning file。
- OpenClaw 已在 GitHub Pages 實測。
- 使用者的課堂用途得到滿足。
- 沒有新增安全、私隱或路徑問題。
