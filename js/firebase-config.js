/**
 * js/firebase-config.js — Firebase project `math-rpg-1eebc` 公開 web config
 *
 * V2 planning: PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md §6
 *
 * 公開 web config 包括 apiKey / authDomain / projectId / appId — 呢啲係
 * Firebase 公開 client identification，唔係 secret。Web API key 設計上係
 * client-facing，配合 Firebase Console 嘅 Authorized domains 限制使用。
 *
 * Source: 從 [ai-lish/math-rpg](https://github.com/ai-lish/math-rpg) 嘅
 *         `shared/shared-main.js` 同步過嚟 — 同一個 Firebase project `math-rpg-1eebc`
 *         嘅 web app config。
 *
 * 不可放入此 file：
 *   - service account JSON
 *   - private key
 *   - Admin SDK credential
 *   - OAuth client secret
 *   - refresh token
 *
 * 留意：ai-learning 唔用 Realtime Database，所以 databaseURL / storageBucket /
 * messagingSenderId / measurementId 都唔需要，唔加入以減少攻擊面。
 */
window.FIREBASE_WEB_CONFIG = {
  apiKey: "AIzaSyA7PM_NoN67kUAzyzssXpppMh924PEWOGU",
  authDomain: "math-rpg-1eebc.firebaseapp.com",
  projectId: "math-rpg-1eebc",
  appId: "1:838577745797:web:1a04cd3c51715f16285eec"
};
