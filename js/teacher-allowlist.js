/**
 * js/teacher-allowlist.js — Teacher email allowlist (V2)
 *
 * Teacher role 只作 UI 分類，**唔作安全授權** (V2 planning §4.4)。
 * Frontend allowlist 可被繞過；不保護學生資料、成績、寫入 secret、
 * GitHub token、Google Sheets 或管理 API。
 *
 * 規則：
 *   - 完整 email allowlist
 *   - 比較前 trim + toLowerCase
 *   - 不使用 display name 猜測身份
 *   - 不放 secret / token
 *
 * ⚠️ 此 file 為 PLACEHOLDER — 正式老師電郵由 Zach 確認後填入。
 * 暫時空 array → 所有已登入 user 預設為 student (V2 §4.4 fallback rule)。
 *
 * 填寫方式（Zach）：
 *   window.TEACHER_EMAILS = [
 *     'teacher1@lsc.edu.hk',
 *     'teacher2@lsc.edu.hk',
 *     // ... 由少康老師提供
 *   ];
 *
 * 比較時自動 .trim().toLowerCase()。
 */
window.TEACHER_EMAILS = [
  // ──────────── PLACEHOLDER — 由 Zach 填入真實老師電郵（小寫） ────────────
  // 例：'siuhong@gmail.com',
  // ─────────────────────────────────────────────────────────────────────────
];
