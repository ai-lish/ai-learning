/**
 * js/auth-state.js — 全站共用登入狀態殼 (v1.1, 2026-06-08)
 *
 * 功能（DEBUG_1 規劃）：
 *   1. 右上角登入狀態 widget（自動 render）
 *   2. 頁內 modal 登入，唔跳到獨立頁面
 *   3. 登入成功後保留捲動位置 + 工具狀態
 *   4. 跨 browser tab 同步（storage event）
 *   5. 同 tab 自定義事件 broadcast（auth-state-changed）
 *
 * 身份來源：localStorage legacy keys (student_token / student_name / student_class / student_number)
 * Firebase 仍未接入，介面已預留 firebase-user / firebase-anon state。
 *
 * 介面：
 *   window.AuthState = {
 *     get(), isLegacyStudent(), loginUrl(rel, returnTo), logout(redirectPath?),
 *     openLoginModal(), closeLoginModal(), renderWidget(),
 *     onChange(handler), AUTH_KEYS, PROJECT_BASE
 *   }
 *
 * 使用方式：頁面 head 加
 *   <link rel="stylesheet" href="<rel>/css/auth-widget.css">
 *   <script src="<rel>/js/auth-state.js" defer></script>
 * <body> 加 data-no-auth-widget 可關閉 widget（但仍可手動 call API）
 */
(function (global) {
  'use strict';

  // ─────────────── Config ───────────────
  var AUTH_KEYS = ['student_token', 'student_name', 'student_class', 'student_number'];
  // 沿用 V1 §6.1 — 同一個 GAS endpoint。絕對 https URL 唔需要 GH Pages base
  var GWS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw-g1j2jvyuXoVbUdCMuR6Ch_UF5nynQKb0W4cNAN9RZeuoCLwpfn78kYyOgPf8CtQJlA/exec';
  var CLASSES = ['1A', '1B', '1C', 'T'];

  // ─────────────── Project base detection ───────────────
  // 自動偵測 script 自身 URL → 推導 PROJECT_BASE（如 /ai-learning/）
  // 支援 root-level 及 subdir-level 載入
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
        // e.g., /ai-learning/js/auth-state.js → /ai-learning/
        PROJECT_BASE = u.pathname.replace(/\/js\/[^/?#]+(\?.*)?$/, '/');
        if (!/\/$/.test(PROJECT_BASE)) PROJECT_BASE += '/';
      }
    } catch (e) { /* fallback to /ai-learning/ */ }
  })();

  // ─────────────── State accessors ───────────────
  function get() {
    var token = safeGet('student_token');
    if (token) {
      return {
        state: 'legacy-student',
        name: safeGet('student_name'),
        studentClass: safeGet('student_class'),
        number: safeGet('student_number'),
        hasToken: true
      };
    }
    return { state: 'guest', name: null, studentClass: null, number: null, hasToken: false };
  }

  function isLegacyStudent() {
    return !!safeGet('student_token');
  }

  function safeGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function safeSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { return false; }
  }
  function safeRemove(k) {
    try { localStorage.removeItem(k); } catch (e) { /* noop */ }
  }

  // ─────────────── loginUrl helper (V1 公開介面) ───────────────
  function loginUrl(loginPageRelPath, returnTo) {
    if (returnTo) {
      return loginPageRelPath + '?returnTo=' + encodeURIComponent(returnTo);
    }
    return loginPageRelPath;
  }

  // ─────────────── Cross-tab storage sync ───────────────
  // 將 _setKey / _removeKey 包裝：localStorage 改動 + 手動派發 storage event（同 tab 收唔到原生 storage event）
  function _setKey(key, value) {
    var oldValue = safeGet(key);
    if (value === null || value === undefined || value === '') {
      safeRemove(key);
    } else {
      safeSet(key, value);
    }
    _broadcastStorage(key, value, oldValue);
    _broadcastAuthStateChanged(key, value);
  }

  function _broadcastStorage(key, newValue, oldValue) {
    try {
      var ev = new StorageEvent('storage', {
        key: key,
        newValue: newValue,
        oldValue: oldValue,
        storageArea: localStorage,
        url: window.location.href
      });
      window.dispatchEvent(ev);
    } catch (e) { /* old browsers — StorageEvent constructor may fail */ }
  }

  function _broadcastAuthStateChanged(key, value) {
    try {
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { key: key, value: value, state: get() }
      }));
    } catch (e) { /* noop */ }
  }

  function logout(redirectPath) {
    AUTH_KEYS.forEach(function (k) { _setKey(k, null); });
    if (typeof redirectPath === 'string' && redirectPath) {
      window.location.replace(redirectPath);
    }
  }

  // ─────────────── Cross-tab listener ───────────────
  // 監聽 storage event：當其他 tab 改 AUTH_KEYS → re-render widget + 關 modal
  window.addEventListener('storage', function (e) {
    if (!e.key) return;
    if (AUTH_KEYS.indexOf(e.key) !== -1) {
      // Re-render widget (which lives on this page)
      if (typeof renderWidget === 'function') {
        try { renderWidget(); } catch (err) { /* noop */ }
      }
      // Close modal if logged out from another tab
      var s = get();
      if (s.state !== 'legacy-student') {
        try { closeLoginModal(); } catch (err) { /* noop */ }
      }
    }
  });

  // Close dropdown menus on click outside
  document.addEventListener('click', function (e) {
    var root = document.getElementById('auth-widget-root');
    if (root && !root.contains(e.target)) {
      closeAllMenus();
    }
  });

  // Close modal on Escape (register once)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('auth-modal-root');
      if (modal && !modal.hidden) {
        closeLoginModal();
      }
    }
  });

  // ─────────────── Widget rendering ───────────────
  function renderWidget() {
    var s = get();
    var root = ensureWidgetRoot();

    if (s.state === 'legacy-student') {
      var name = s.name || '學生';
      var cls = s.studentClass || '';
      var dashHref = projectUrl('student/dashboard/index.html');
      root.innerHTML =
        '<button class="aw-toggle aw-loggedin" type="button" aria-haspopup="true" aria-expanded="false" aria-label="登入狀態選單">' +
          '<span class="aw-icon">👤</span>' +
          '<span class="aw-name">' + esc(name) + '</span>' +
          (cls ? '<span class="aw-class">(' + esc(cls) + ')</span>' : '') +
          '<span class="aw-caret">▾</span>' +
        '</button>' +
        '<div class="aw-menu" hidden role="menu">' +
          '<a class="aw-menu-item" href="' + esc(dashHref) + '" role="menuitem">📊 我的學習紀錄</a>' +
          '<button class="aw-menu-item aw-logout-btn" type="button" role="menuitem">🚪 登出</button>' +
        '</div>';
    } else {
      root.innerHTML =
        '<button class="aw-toggle aw-guest" type="button" aria-label="登入">' +
          '<span class="aw-icon">🔓</span>' +
          '<span class="aw-name">訪客</span>' +
          '<span class="aw-action">登入 →</span>' +
        '</button>';
    }
    bindWidgetEvents(root);
  }

  function ensureWidgetRoot() {
    var root = document.getElementById('auth-widget-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'auth-widget-root';
      // Insert as first body child so it sits below modals z-index
      if (document.body.firstChild) {
        document.body.insertBefore(root, document.body.firstChild);
      } else {
        document.body.appendChild(root);
      }
    }
    return root;
  }

  function bindWidgetEvents(root) {
    var toggle = root.querySelector('.aw-toggle');
    if (!toggle) return;
    var menu = root.querySelector('.aw-menu');

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu) {
        var willOpen = menu.hidden;
        closeAllMenus();
        if (willOpen) {
          menu.hidden = false;
          toggle.setAttribute('aria-expanded', 'true');
        }
      } else {
        // Guest — open modal
        openLoginModal();
      }
    });

    var logoutBtn = root.querySelector('.aw-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('確定要登出嗎？')) {
          logout();
        }
        closeAllMenus();
      });
    }
  }

  function closeAllMenus() {
    var menus = document.querySelectorAll('.aw-menu');
    for (var i = 0; i < menus.length; i++) {
      menus[i].hidden = true;
    }
    var toggles = document.querySelectorAll('.aw-toggle[aria-expanded="true"]');
    for (var j = 0; j < toggles.length; j++) {
      toggles[j].setAttribute('aria-expanded', 'false');
    }
  }

  // ─────────────── Modal ───────────────
  function openLoginModal() {
    if (isLegacyStudent()) {
      // 已登入 — 切換 menu 顯示
      var toggle = document.querySelector('#auth-widget-root .aw-toggle');
      if (toggle) toggle.click();
      return;
    }
    var root = ensureModalRoot();
    root.hidden = false;
    document.body.classList.add('aw-modal-open');
    // Focus first input after a tick (so animation doesn't fight focus)
    setTimeout(function () {
      var numInput = root.querySelector('#aw-modal-number');
      if (numInput) numInput.focus();
    }, 80);
  }

  function closeLoginModal() {
    var root = document.getElementById('auth-modal-root');
    if (!root) return;
    root.hidden = true;
    document.body.classList.remove('aw-modal-open');
    // Reset form
    var form = root.querySelector('#aw-modal-form');
    if (form) form.reset();
    var status = root.querySelector('#aw-modal-status');
    if (status) status.innerHTML = '';
  }

  function ensureModalRoot() {
    var root = document.getElementById('auth-modal-root');
    if (root) return root;

    root = document.createElement('div');
    root.id = 'auth-modal-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-labelledby', 'aw-modal-title');
    root.setAttribute('aria-modal', 'true');
    root.hidden = true;
    root.innerHTML =
      '<div class="aw-modal-overlay" data-close="1"></div>' +
      '<div class="aw-modal-content" role="document">' +
        '<button class="aw-modal-close" type="button" aria-label="關閉登入對話框">×</button>' +
        '<h2 class="aw-modal-title" id="aw-modal-title">🔑 學生登入</h2>' +
        '<div class="aw-modal-status" id="aw-modal-status" aria-live="polite"></div>' +
        '<form class="aw-modal-form" id="aw-modal-form" autocomplete="on">' +
          '<label class="aw-modal-label" for="aw-modal-class">班別' +
            '<select class="aw-modal-input" id="aw-modal-class" name="class" required>' +
              CLASSES.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') +
            '</select>' +
          '</label>' +
          '<label class="aw-modal-label" for="aw-modal-number">學號' +
            '<input class="aw-modal-input" id="aw-modal-number" name="number" type="text" inputmode="numeric" autocomplete="username" required placeholder="例：01">' +
          '</label>' +
          '<label class="aw-modal-label" for="aw-modal-password">密碼' +
            '<input class="aw-modal-input" id="aw-modal-password" name="password" type="password" autocomplete="current-password" required>' +
          '</label>' +
          '<button class="aw-modal-submit" type="submit">登入</button>' +
        '</form>' +
        '<p class="aw-modal-note">ℹ️ 登入後可使用學習紀錄。未登入仍可使用所有教材、練習及考試工具。</p>' +
        '<a class="aw-modal-legacy" href="' + esc(projectUrl('login/index.html?returnTo=' + encodeURIComponent(currentPageRel()))) + '">用舊版登入頁 →</a>' +
      '</div>';
    document.body.appendChild(root);
    bindModalEvents(root);
    return root;
  }

  function bindModalEvents(root) {
    var form = root.querySelector('#aw-modal-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitLogin();
    });
    var closeBtn = root.querySelector('.aw-modal-close');
    closeBtn.addEventListener('click', closeLoginModal);
    var overlay = root.querySelector('.aw-modal-overlay');
    overlay.addEventListener('click', closeLoginModal);
  }

  function submitLogin() {
    var root = document.getElementById('auth-modal-root');
    if (!root) return;
    var status = root.querySelector('#aw-modal-status');
    var submitBtn = root.querySelector('.aw-modal-submit');
    var cls = root.querySelector('#aw-modal-class').value;
    var number = root.querySelector('#aw-modal-number').value.trim();
    var pwd = root.querySelector('#aw-modal-password').value;

    if (!number || !pwd) {
      status.innerHTML = '<div class="aw-status-error">請輸入學號與密碼</div>';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '登入中…';
    status.innerHTML = '<div class="aw-status-info">連線中…</div>';

    fetch(GWS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ action: 'login', class: cls, number: number, password: pwd }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(function (resp) { return resp.json(); })
      .then(function (j) {
        if (j && j.success) {
          _setKey('student_token', j.token);
          _setKey('student_name', j.name);
          _setKey('student_class', cls);
          _setKey('student_number', number);
          status.innerHTML = '<div class="aw-status-success">✓ 登入成功</div>';
          setTimeout(function () { closeLoginModal(); }, 500);
        } else {
          status.innerHTML = '<div class="aw-status-error">登入失敗：' + esc((j && j.error) || '請確認學號與密碼') + '</div>';
          submitBtn.disabled = false;
          submitBtn.textContent = '登入';
        }
      })
      .catch(function (err) {
        status.innerHTML = '<div class="aw-status-error">網絡錯誤：' + esc((err && err.message) || '無法連線，請稍後再試') + '</div>';
        submitBtn.disabled = false;
        submitBtn.textContent = '登入';
      });
  }

  // ─────────────── onChange subscription (V1 公開介面延伸) ───────────────
  var _changeHandlers = [];
  function onChange(handler) {
    if (typeof handler !== 'function') return function () {};
    _changeHandlers.push(handler);
    return function off() {
      var i = _changeHandlers.indexOf(handler);
      if (i !== -1) _changeHandlers.splice(i, 1);
    };
  }
  window.addEventListener('auth-state-changed', function (e) {
    for (var i = 0; i < _changeHandlers.length; i++) {
      try { _changeHandlers[i](e.detail); } catch (err) { /* swallow */ }
    }
  });

  // ─────────────── Helpers ───────────────
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function projectUrl(rel) {
    if (!rel) return PROJECT_BASE;
    if (rel.charAt(0) === '/') {
      return PROJECT_BASE + rel.replace(/^\/+/, '');
    }
    return PROJECT_BASE + rel;
  }

  function currentPageRel() {
    var path = window.location.pathname;
    if (path.indexOf(PROJECT_BASE) === 0) {
      return path.substring(PROJECT_BASE.length);
    }
    return path.replace(/^\/+/, '');
  }

  // ─────────────── Init ───────────────
  function init() {
    // opt-out: <body data-no-auth-widget>
    if (document.body && document.body.hasAttribute && document.body.hasAttribute('data-no-auth-widget')) {
      return;
    }
    try {
      renderWidget();
    } catch (e) {
      // Silently fail — page should still work
      if (global.console && console.warn) console.warn('[auth-state] widget init failed', e);
    }
  }

  // ─────────────── auth=open URL hint ───────────────
  // 頁面被 visit 帶 ?auth=open 時（例如 login/index.html redirect 過來），
  // 自動打開 login modal。僅限未登入狀態下生效。
  // 避免同學「点 login link 點了接返去原頁卻見不到 modal」嘅問題。
  function checkAuthOpenHint() {
    try {
      var sp = new URLSearchParams(window.location.search);
      if (sp.get('auth') !== 'open') return;
      if (isLegacyStudent()) return;  // 已登入 → 唔需要 modal
      // 等 widget 渲染完成再開 modal
      setTimeout(function () {
        try { openLoginModal(); } catch (e) { /* noop */ }
      }, 100);
    } catch (e) { /* noop */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); checkAuthOpenHint(); });
  } else {
    // DOM already ready (script loaded with defer or at end of body)
    init();
    checkAuthOpenHint();
  }

  // ─────────────── auth-state-ready event ───────────────
  // 頁面若需在本 script 完成初始化後才能讀 AuthState，可訂閱此 event。
  // 解決 defer race：即使有 inline script 原本會太早讀 AuthState，
  // 也可以用 `window.addEventListener('auth-state-ready', cb, { once: true })` 等待。
  // 唔在 init() 內 dispatch 係為了保證已訂閱嘅 listener 都收到（同步 dispatch）
  function dispatchReady() {
    try {
      window.dispatchEvent(new CustomEvent('auth-state-ready', {
        detail: { state: get(), PROJECT_BASE: PROJECT_BASE }
      }));
    } catch (e) { /* noop */ }
  }
  // 同步 dispatch：所有現有 addEventListener 都會收到
  dispatchReady();

  // ─────────────── Public API ───────────────
  global.AuthState = {
    get: get,
    isLegacyStudent: isLegacyStudent,
    loginUrl: loginUrl,
    logout: logout,
    openLoginModal: openLoginModal,
    closeLoginModal: closeLoginModal,
    renderWidget: renderWidget,
    onChange: onChange,
    AUTH_KEYS: AUTH_KEYS,
    PROJECT_BASE: PROJECT_BASE
  };
})(window);
