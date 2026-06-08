/**
 * js/auth-state.js
 * 全站共用身份狀態輔助工具 — 最小可用殼 (v1, 2026-06-08)
 *
 * 目前狀態：Firebase 尚未接入。
 * 身份來源：localStorage legacy keys (student_token / student_name / student_class / student_number)
 * 這些 key 由 login/index.html 的 Google Apps Script 登入流程寫入。
 * 這是本機 local state，不代表已通過 Firebase 或任何後端驗證。
 *
 * 狀態說明：
 *   'guest'          — 無任何登入紀錄，或 Firebase 未設定時降級
 *   'legacy-student' — localStorage 有 student_token，視為本機學生狀態
 *
 * 使用方式：
 *   在 HTML 以 <script src="js/auth-state.js"> 載入（路徑視頁面位置調整）
 *   然後使用 window.AuthState.get() 等方法
 */
(function (global) {
  'use strict';

  /** 只有這些 key 在登出時被清除；其他本機進度（如 practice_progress）保留 */
  var AUTH_KEYS = [
    'student_token',
    'student_name',
    'student_class',
    'student_number'
  ];

  /**
   * 取得目前身份狀態
   * @returns {{ state: string, name: string|null, studentClass: string|null, number: string|null, hasToken: boolean }}
   */
  function get() {
    var token = localStorage.getItem('student_token');
    if (token) {
      return {
        state: 'legacy-student',
        name: localStorage.getItem('student_name'),
        studentClass: localStorage.getItem('student_class'),
        number: localStorage.getItem('student_number'),
        hasToken: true
      };
    }
    return { state: 'guest', name: null, studentClass: null, number: null, hasToken: false };
  }

  /** 是否有 legacy 本機學生狀態 */
  function isLegacyStudent() {
    return !!localStorage.getItem('student_token');
  }

  /**
   * 取得登入頁 URL（含可選 returnTo 參數）
   * @param {string} loginPageRelPath - 相對於目前頁面的 login 路徑，例如 'login/index.html' 或 '../login/index.html'
   * @param {string} [returnTo] - 登入後返回的相對路徑（可空）
   * @returns {string}
   */
  function loginUrl(loginPageRelPath, returnTo) {
    if (returnTo) {
      return loginPageRelPath + '?returnTo=' + encodeURIComponent(returnTo);
    }
    return loginPageRelPath;
  }

  /**
   * 登出：只清除 auth 相關 key，保留本機練習進度
   * @param {string} [redirectPath] - 登出後跳轉路徑；不傳則不跳轉
   */
  function logout(redirectPath) {
    AUTH_KEYS.forEach(function (k) {
      localStorage.removeItem(k);
    });
    if (typeof redirectPath === 'string') {
      window.location.href = redirectPath;
    }
  }

  global.AuthState = {
    get: get,
    isLegacyStudent: isLegacyStudent,
    loginUrl: loginUrl,
    logout: logout,
    AUTH_KEYS: AUTH_KEYS
  };

})(window);
