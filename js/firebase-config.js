/**
 * js/firebase-config.js — Firebase Web Config (公開 client identification)
 *
 * 與 Math RPG 共用同一個 Firebase project `math-rpg-1eebc`，
 * 用戶喺 ai-learning 登入後，可以同步到 Math RPG。
 *
 * 重要：呢啲 config 屬 Firebase client identification，唔係 secret。
 * OAuth client secret、service account、Admin SDK 全部唔可以放喺前端。
 *
 * 故意唔包含 `databaseURL`（V3 §1 — 唔用 Realtime Database）。
 *
 * SDK 10.7.1 載入順序（由 inject_firebase_sdk.sh 注入）：
 *   1. firebase-app-compat.js
 *   2. firebase-auth-compat.js
 *   3. firebase-config.js（本檔）
 *   4. auth-state.js
 *
 * 修改 config 必須同步 Math RPG；唔好每頁重複初始化。
 */
(function (global) {
  'use strict';
  if (typeof global === 'undefined') return;

  // 公開 config — 與 Math RPG 嘅 shared/shared-main.js 保持一致
  global.FIREBASE_CONFIG = Object.freeze({
    apiKey:            "AIzaSyAVnUmboknAoqTfZSLPVM-jtOAG8LcWOGU",
    authDomain:        "math-rpg-1eebc.firebaseapp.com",
    projectId:         "math-rpg-1eebc",
    storageBucket:     "math-rpg-1eebc.firebasestorage.app",
    messagingSenderId: "838577745797",
    appId:             "1:838577745797:web:1a04cd3c51715f16285eec",
    measurementId:     "G-0KE6H18XGQ"
    // databaseURL 故意省略 — V3 §1 唔用 RTDB
  });

  // Teacher UI role allowlist（V3 §4.4）
  // 只係前端 UI 分類，唔係保安邊界。留空時所有已登入用戶預設 student。
  // 用法：填入允許顯示老師工具嘅完整 Google email（小寫）。
  global.TEACHER_EMAILS = Object.freeze([
    'mathteachlsh@gmail.com',
  ]);
})(typeof window !== 'undefined' ? window : this);
