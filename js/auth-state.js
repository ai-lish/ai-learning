/**
 * js/auth-state.js — 全站共用 Firebase Auth Google 登入 widget (v3.0, 2026-06-12)
 *
 * 對應規劃：PLANNING/20260611_GLOBAL_LOGIN_FIREBASE_GOOGLE_V3.md
 *
 * 行為摘要（V3 §1, §3, §4, §5, §8）：
 *   - 身份來源：Firebase Auth + Google provider（唯一）。
 *   - 狀態：loading / guest / student / teacher / unavailable。
 *   - Widget：右上角小型「登入」按鈕，點擊直接 signInWithPopup，唔顯示 custom modal。
 *   - 已登入：短名/avatar + 獨立登出按鈕（唔用 dropdown）。
 *   - 錯誤：bottom toast（role="status" aria-live="polite"，單一 DOM node 復用）。
 *   - 初始化時 removeItem 4 個 legacy keys；禁用 localStorage.clear()。
 *   - 登入/登出後留喺原頁，不重置工具狀態。
 *
 * 公開 API：
 *   window.AuthState = {
 *     get(), onChange(handler), whenReady(),
 *     signInWithGoogle(), logout(),
 *     renderWidget(), isWidgetSuppressed(),
 *     PROJECT_BASE
 *   }
 *
 * 為咗向後兼容，仍保留舊有 V1 API stub（isLegacyStudent / loginUrl /
 * openLoginModal / closeLoginModal / AUTH_KEYS），但全部都係 no-op 或 fallback。
 *
 * 使用方式（由 inject_firebase_sdk.sh 注入）：
 *   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
 *   <script src="<rel>/js/firebase-config.js"></script>
 *   <script src="<rel>/js/auth-state.js" defer></script>
 * <body> 加 data-no-auth-widget 可關閉 widget（但仍可手動 call API）。
 */
(function (global) {
  'use strict';

  // ─────────────── Config ───────────────
  // V3 §8.5：初始化時安全移除舊 auth keys，唔做 migration；唔用 localStorage.clear()。
  var LEGACY_KEYS = ['student_token', 'student_name', 'student_class', 'student_number'];

  // V3 §8.2：onAuthStateChanged 係唯一身份真相；
  // 首次 callback 前用 'loading'，唔好先假定 guest。
  var _state = {
    state: 'loading',
    user: null,
    role: 'guest',
    source: 'none',
    error: null
  };

  // 兼容用：V1 仍將 AUTH_KEYS 公開
  var AUTH_KEYS = LEGACY_KEYS;

  // V3 §5.1：唔寫 Firestore / RTDB / Storage。
  // 寫讀一律用 onAuthStateChanged 提供嘅 user object。

  // ─────────────── Project base detection ───────────────
  var PROJECT_BASE = '/ai-learning/';
  (function detectBase() {
    try {
      var s = document.currentScript || (function () {
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
          if (scripts[i].src && /auth-state\.js(\?|#|$)/.test(scripts[i].src)) return scripts[i];
        }
        return null;
      })();
      if (s && s.src) {
        var u = new URL(s.src, window.location.href);
        PROJECT_BASE = u.pathname.replace(/\/js\/[^/?#]+(\?.*)?$/, '/');
        if (!/\/$/.test(PROJECT_BASE)) PROJECT_BASE += '/';
      }
    } catch (e) { /* fallback to /ai-learning/ */ }
  })();

  // ─────────────── Firebase init ───────────────
  var _auth = null;
  var _initState = 'pending'; // pending | ok | failed
  var _initError = null;

  function initFirebase() {
    try {
      if (!global.firebase) throw new Error('Firebase SDK not loaded');
      if (!global.FIREBASE_CONFIG) throw new Error('FIREBASE_CONFIG missing');

      // 避免重複初始化（即使 script 重複加載）
      if (!global.firebase.apps || global.firebase.apps.length === 0) {
        global.firebase.initializeApp(global.FIREBASE_CONFIG);
      }
      _auth = global.firebase.auth();

      // 設定 LOCAL persistence；若失敗降級為 NONE，避免拋錯
      try {
        _auth.setPersistence(global.firebase.auth.Auth.Persistence.LOCAL)
          .catch(function (err) {
            if (global.console && console.warn) {
              console.warn('[auth-state] setPersistence failed, continuing with default', err);
            }
          });
      } catch (e) { /* noop */ }

      // 單一身份真相
      _auth.onAuthStateChanged(function (user) {
        if (user) {
          var role = resolveRole(user);
          updateState({
            state: role, // 'student' | 'teacher'
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified
            },
            role: role,
            source: 'firebase',
            error: null
          });
        } else {
          updateState({
            state: 'guest',
            user: null,
            role: 'guest',
            source: 'firebase',
            error: null
          });
        }
      });

      _initState = 'ok';
    } catch (err) {
      _initState = 'failed';
      _initError = err;
      // V3 §9.2：狀態改為 unavailable，唔假裝登入
      updateState({
        state: 'unavailable',
        user: null,
        role: 'guest',
        source: 'none',
        error: { message: (err && err.message) || 'firebase init failed' }
      });
      if (global.console && console.warn) {
        console.warn('[auth-state] firebase init failed; running in unavailable state', err);
      }
    }
  }

  function resolveRole(user) {
    if (!user) return 'guest';
    var allowlist = (global.TEACHER_EMAILS && Array.isArray(global.TEACHER_EMAILS))
      ? global.TEACHER_EMAILS
      : [];
    if (allowlist.length === 0) return 'student';
    var email = (user.email || '').trim().toLowerCase();
    if (!email) return 'student';
    for (var i = 0; i < allowlist.length; i++) {
      if (String(allowlist[i]).trim().toLowerCase() === email) return 'teacher';
    }
    return 'student';
  }

  function updateState(next) {
    _state = next;
    // 派發同 tab event
    try {
      global.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { state: _state } }));
    } catch (e) { /* noop */ }
    // 觸發訂閱
    for (var i = 0; i < _changeHandlers.length; i++) {
      try { _changeHandlers[i](_state); } catch (e) { /* swallow */ }
    }
    // 重新 render widget
    try { renderWidget(); } catch (e) { /* swallow */ }
  }

  // ─────────────── State accessors ───────────────
  function get() {
    // 深拷貝避免外部改到內部狀態
    return {
      state: _state.state,
      user: _state.user ? Object.assign({}, _state.user) : null,
      role: _state.role,
      source: _state.source,
      error: _state.error
    };
  }

  // V1 公開介面 stub：V3 唔再以 legacy token 判斷登入
  function isLegacyStudent() { return false; }

  // V1 公開介面 stub：V3 唔再有獨立 login page
  function loginUrl(loginPageRelPath /*, returnTo */) {
    return loginPageRelPath || (PROJECT_BASE + 'index.html');
  }

  // V1 公開介面 stub：V3 唔再有 custom modal，按鈕直接 popup
  function openLoginModal() {
    if (_state.state === 'loading') {
      showToast('登入系統準備中，請稍候…');
      return;
    }
    if (_state.state === 'unavailable') {
      showToast('登入系統暫時不可用');
      return;
    }
    if (_state.state === 'guest') {
      // 直接呼叫 Google popup，唔顯示 modal
      signInWithGoogle();
    }
  }
  function closeLoginModal() { /* no-op in V3 */ }

  // V3 公開介面
  function isWidgetSuppressed() {
    return !!(document.body && document.body.hasAttribute && document.body.hasAttribute('data-no-auth-widget'));
  }

  function whenReady() {
    return new Promise(function (resolve) {
      // 已就緒
      if (_state.state !== 'loading') { resolve(get()); return; }
      var handler = function () {
        if (_state.state !== 'loading') {
          global.removeEventListener('auth-state-changed', handler);
          resolve(get());
        }
      };
      global.addEventListener('auth-state-changed', handler);
      // 安全網：即使 Firebase 永久 hang 住，3 秒後 resolve 一次避免卡住
      setTimeout(function () { handler(); }, 3000);
    });
  }

  // ─────────────── Login / Logout ───────────────
  // V3 §4.2 + §4.5：直接 signInWithPopup；冇 in-flight 重複；登出只 signOut + 清 legacy keys。
  var _signInInFlight = null;
  function signInWithGoogle() {
    if (!_auth) {
      showToast('登入系統尚未就緒');
      return Promise.reject(new Error('auth not ready'));
    }
    if (_signInInFlight) {
      // 重複 click 唔彈兩個 popup — 沿用上一個 in-flight promise
      return _signInInFlight;
    }
    var provider = new global.firebase.auth.GoogleAuthProvider();
    // V3 §4.3：唔用 hd 限制（V2 嘅 lsc.edu.hk 提示已取消）
    provider.setCustomParameters({ prompt: 'select_account' });

    _signInInFlight = _auth.signInWithPopup(provider)
      .then(function (cred) {
        // 成功：onAuthStateChanged 會自動 update state
        hideToast();
        return cred.user;
      })
      .catch(function (err) {
        // V3 §9.3：取消或失敗後留喺原頁；唔清除本機進度
        var code = err && err.code;
        var msg = errorMessage(code);
        if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
          showToast(msg);
        }
        throw err;
      })
      .then(function (u) { _signInInFlight = null; return u; },
            function (e) { _signInInFlight = null; throw e; });
    return _signInInFlight;
  }

  function logout() {
    // V3 §4.5：signOut 後只清 4 個 legacy keys；唔 clear()。
    if (_auth) {
      _auth.signOut().catch(function (err) {
        if (global.console && console.warn) console.warn('[auth-state] signOut failed', err);
      });
    }
    LEGACY_KEYS.forEach(function (k) { safeRemove(k); });
  }

  // ─────────────── Error messages (V3 §8.3) ───────────────
  function errorMessage(code) {
    var map = {
      'auth/popup-blocked':       '瀏覽器阻擋咗登入視窗，請允許 popup 後再試。',
      'auth/popup-closed-by-user':'已取消登入。',
      'auth/cancelled-popup-request': '已取消登入。',
      'auth/network-request-failed': '網絡錯誤，請檢查連線後再試。',
      'auth/unauthorized-domain': '此網域未獲授權登入。請聯絡老師。',
      'auth/operation-not-allowed': 'Google 登入未啟用，請聯絡老師。',
      'auth/invalid-api-key':     'Firebase 設定錯誤，請聯絡老師。'
    };
    return map[code] || ('登入失敗：' + (code || '未知錯誤'));
  }

  // ─────────────── Toast (bottom, single DOM node) ───────────────
  var _toastNode = null;
  var _toastTimer = null;
  function showToast(msg) {
    if (!msg) return;
    if (!_toastNode) {
      _toastNode = document.createElement('div');
      _toastNode.id = 'auth-toast';
      _toastNode.setAttribute('role', 'status');
      _toastNode.setAttribute('aria-live', 'polite');
      _toastNode.setAttribute('aria-atomic', 'true');
      _toastNode.className = 'aw-toast aw-toast-error';
      document.body.appendChild(_toastNode);
    }
    _toastNode.textContent = msg;
    _toastNode.classList.remove('aw-toast-hide');
    _toastNode.classList.add('aw-toast-show');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { hideToast(); }, 4500);
  }
  function hideToast() {
    if (!_toastNode) return;
    _toastNode.classList.remove('aw-toast-show');
    _toastNode.classList.add('aw-toast-hide');
    if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
  }

  // ─────────────── Widget rendering ───────────────
  function renderWidget() {
    if (isWidgetSuppressed()) return;
    var root = ensureWidgetRoot();
    var s = _state;

    if (s.state === 'loading') {
      root.innerHTML =
        '<button class="aw-toggle aw-loading" type="button" disabled aria-label="登入狀態載入中">' +
          '<span class="aw-spinner" aria-hidden="true"></span>' +
          '<span class="aw-name">登入…</span>' +
        '</button>';
      bindWidgetEvents(root);
      return;
    }

    if (s.state === 'unavailable') {
      root.innerHTML =
        '<button class="aw-toggle aw-unavailable" type="button" disabled aria-label="登入系統暫時不可用">' +
          '<span class="aw-icon">⚠️</span>' +
          '<span class="aw-name">登入暫停</span>' +
        '</button>';
      bindWidgetEvents(root);
      return;
    }

    if (s.state === 'student' || s.state === 'teacher') {
      var name = (s.user && s.user.displayName) ? s.user.displayName : '用戶';
      var shortName = truncate(name, 16);
      var initial = (name && name.trim().charAt(0)) || '?';
      var photo = s.user && s.user.photoURL;
      var dashHref = projectUrl('student/dashboard/index.html');
      var avatarHTML = photo
        ? '<img class="aw-avatar-img" src="' + esc(photo) + '" alt="" onerror="this.replaceWith(document.createTextNode(\'' + esc(initial) + '\'))" />'
        : '<span class="aw-avatar-letter">' + esc(initial) + '</span>';
      var roleTag = s.role === 'teacher'
        ? '<span class="aw-role-tag aw-role-teacher" aria-label="老師">老師</span>'
        : '';
      root.innerHTML =
        '<div class="aw-user-pill" role="group" aria-label="已登入用戶">' +
          '<a class="aw-user-avatar" href="' + esc(dashHref) + '" title="前往 Dashboard" aria-label="前往 Dashboard">' + avatarHTML + '</a>' +
          '<a class="aw-user-name" href="' + esc(dashHref) + '" title="' + esc(name) + '">' + esc(shortName) + roleTag + '</a>' +
          '<button class="aw-logout" type="button" aria-label="登出" data-action="logout">登出</button>' +
        '</div>';
      bindWidgetEvents(root);
      return;
    }

    // guest
    root.innerHTML =
      '<button class="aw-toggle aw-guest" type="button" data-action="signin" aria-label="使用 Google 登入">' +
        '<span class="aw-g-icon" aria-hidden="true">' +
          '<svg viewBox="0 0 18 18" width="14" height="14" xmlns="http://www.w3.org/2000/svg">' +
            '<path fill="#FFC107" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"/>' +
            '<path fill="#FF3D00" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"/>' +
            '<path fill="#4CAF50" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.82.95 4.03l3-2.33z"/>' +
            '<path fill="#1976D2" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.97 8.97 0 0 0 9 0 9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>' +
          '</svg>' +
        '</span>' +
        '<span class="aw-name">登入</span>' +
      '</button>';
    bindWidgetEvents(root);
  }

  function ensureWidgetRoot() {
    var root = document.getElementById('auth-widget-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'auth-widget-root';
      if (document.body.firstChild) {
        document.body.insertBefore(root, document.body.firstChild);
      } else {
        document.body.appendChild(root);
      }
    }
    return root;
  }

  function bindWidgetEvents(root) {
    var signinBtn = root.querySelector('[data-action="signin"]');
    if (signinBtn) {
      signinBtn.addEventListener('click', function (e) {
        e.preventDefault();
        signInWithGoogle();
      });
    }
    var logoutBtn = root.querySelector('[data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    }
  }

  // ─────────────── onChange subscription (V3 公開介面) ───────────────
  var _changeHandlers = [];
  function onChange(handler) {
    if (typeof handler !== 'function') return function () {};
    _changeHandlers.push(handler);
    // 即時派發一次現時 state，方便 caller 同步
    try { handler(get()); } catch (e) { /* swallow */ }
    return function off() {
      var i = _changeHandlers.indexOf(handler);
      if (i !== -1) _changeHandlers.splice(i, 1);
    };
  }

  // ─────────────── Helpers ───────────────
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function truncate(s, n) {
    if (!s) return '';
    s = String(s);
    return s.length > n ? (s.slice(0, n - 1) + '…') : s;
  }
  function safeRemove(k) {
    try { localStorage.removeItem(k); } catch (e) { /* noop */ }
  }
  function projectUrl(rel) {
    if (!rel) return PROJECT_BASE;
    if (rel.charAt(0) === '/') {
      return PROJECT_BASE + rel.replace(/^\/+/, '');
    }
    return PROJECT_BASE + rel;
  }

  // ─────────────── Legacy cleanup (V3 §5 / §8.5) ───────────────
  function cleanupLegacy() {
    if (isWidgetSuppressed()) {
      // 即使 widget 關閉都照清，確保下頁 / 下一個 component 唔再見到舊 key
      LEGACY_KEYS.forEach(function (k) { safeRemove(k); });
      return;
    }
    LEGACY_KEYS.forEach(function (k) { safeRemove(k); });
  }

  // ─────────────── Init ───────────────
  function init() {
    // 1. 清 legacy keys
    cleanupLegacy();
    // 2. Init Firebase
    initFirebase();
    // 3. Render widget（loading 狀態佔位，避免空白）
    try { renderWidget(); } catch (e) {
      if (global.console && console.warn) console.warn('[auth-state] widget init failed', e);
    }
    // 4. auth-state-ready event
    try {
      global.dispatchEvent(new CustomEvent('auth-state-ready', {
        detail: { state: get(), PROJECT_BASE: PROJECT_BASE }
      }));
    } catch (e) { /* noop */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─────────────── Public API ───────────────
  global.AuthState = {
    get: get,
    onChange: onChange,
    whenReady: whenReady,
    signInWithGoogle: signInWithGoogle,
    logout: logout,
    renderWidget: renderWidget,
    isWidgetSuppressed: isWidgetSuppressed,
    // V1 兼容 stub
    isLegacyStudent: isLegacyStudent,
    loginUrl: loginUrl,
    openLoginModal: openLoginModal,
    closeLoginModal: closeLoginModal,
    AUTH_KEYS: AUTH_KEYS,
    PROJECT_BASE: PROJECT_BASE
  };
})(typeof window !== 'undefined' ? window : this);
