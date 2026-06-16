/**
 * js/auth-state.js — 全站共用登入狀態 (V2: Firebase Auth + Google provider)
 *
 * V2 planning: PLANNING/20260609_GLOBAL_LOGIN_FIREBASE_GOOGLE_V2.md
 *
 * 功能：
 *   1. 右上角登入狀態 widget（自動 render）
 *   2. 頁內 modal Google 登入（取代舊班別/學號/密碼）
 *   3. onAuthStateChanged 為唯一登入狀態來源
 *   4. 跨 browser tab 同步（依賴 Firebase Auth 自身 persistence）
 *   5. teacher / student / guest / loading / unavailable 五個 state
 *   6. 登入成功後保留捲動位置 + 工具狀態
 *
 * 身份來源：Firebase Auth (project `math-rpg-1eebc`) + Google provider
 *   - teacher allowlist: js/teacher-allowlist.js
 *   - Firebase web config: js/firebase-config.js
 *
 * 公開介面 (window.AuthState)：
 *   get(), getUser(), getRole(), isLegacyStudent() (kept for compat),
 *   loginUrl(rel, returnTo), logout(redirectPath?),
 *   signInWithGoogle(), openLoginModal(), closeLoginModal(),
 *   renderWidget(), onChange(handler),
 *   whenReady(): Promise<state>,
 *   AUTH_KEYS, PROJECT_BASE
 *
 * 使用方式：頁面 head 加（順序重要）
 *   <!-- Firebase compat SDK (與 math-rpg 對齊) -->
 *   <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js"></script>
 *   <link rel="stylesheet" href="<rel>/css/auth-widget.css">
 *   <script src="<rel>/js/firebase-config.js"></script>
 *   <script src="<rel>/js/teacher-allowlist.js"></script>
 *   <script src="<rel>/js/auth-state.js" defer></script>
 *
 * <body> 加 data-no-auth-widget 可關閉 widget（仍可手動 call API）
 */
(function (global) {
  'use strict';

  // ─────────────── Config ───────────────
  // Legacy keys 保留以便登出時 cleanup (V2 §4.5)
  var AUTH_KEYS = ['student_token', 'student_name', 'student_class', 'student_number'];

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

  // ─────────────── Internal state ───────────────
  var _firebase = null;
  var _initialized = false;
  var _initError = null;
  var _user = null;
  var _role = 'guest';
  // states: 'loading' | 'guest' | 'student' | 'teacher' | 'unavailable'
  var _state = 'loading';
  var _handlers = [];
  var _readyDeferred = null;

  // ─────────────── State accessors ───────────────
  function get() {
    var source = (_state === 'loading' || _state === 'unavailable') ? 'none' : 'firebase';
    return {
      state: _state,
      user: _user,
      role: _role,
      source: source,
      error: _initError ? String(_initError.message || _initError) : null
    };
  }
  function getUser() { return _user; }
  function getRole() { return _role; }

  // V2 §8.5: legacy keys 不再造成登入狀態
  // 保留 API for compat — 永遠 return false（Firebase user 為唯一真相）
  function isLegacyStudent() { return false; }

  function loginUrl(loginPageRelPath, returnTo) {
    if (returnTo) {
      return loginPageRelPath + '?returnTo=' + encodeURIComponent(returnTo);
    }
    return loginPageRelPath;
  }

  // ─────────────── whenReady ───────────────
  // 解決 defer race：等 Firebase onAuthStateChanged 第一次 callback 後 resolve
  // 即使 listener 收到 'loading' 都會 resolve（V2 §8.2 首次 callback 前已顯示 loading）
  function whenReady() {
    if (_readyDeferred) return _readyDeferred.promise;
    _readyDeferred = (function () {
      var resolve, reject;
      var p = new Promise(function (res, rej) { resolve = res; reject = rej; });
      return { promise: p, resolve: resolve, reject: reject };
    })();
    if (_state !== 'loading') {
      _readyDeferred.resolve(get());
    } else {
      onChange(function (s) {
        if (s.state !== 'loading') {
          try { _readyDeferred.resolve(s); } catch (e) { /* noop */ }
        }
      });
    }
    // 20s timeout
    setTimeout(function () {
      if (_state === 'loading') {
        try { _readyDeferred.resolve(get()); } catch (e) { /* noop */ }
      }
    }, 20000);
    return _readyDeferred.promise;
  }

  // ─────────────── Firebase init ───────────────
  function _initFirebase() {
    if (_initialized) return;
    _initialized = true;

    if (typeof firebase === 'undefined') {
      _initError = new Error('Firebase SDK not loaded');
      _setState('unavailable');
      return;
    }
    var cfg = global.FIREBASE_WEB_CONFIG;
    if (!cfg || !cfg.apiKey) {
      _initError = new Error('Firebase web config missing');
      _setState('unavailable');
      return;
    }
    try {
      var app = firebase.apps.length ? firebase.apps[0] : firebase.initializeApp(cfg);
      _firebase = firebase.auth(app);
      // V2 §8.4: 明確設定 LOCAL persistence
      // 唔 await Promise：Firebase 本身預設 LOCAL，setPersistence 叫出嚟
      // 為保證。Promise rejection 要 catch（例：環境不支援時）
      var _persistencePromise;
      try {
        _persistencePromise = _firebase.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        if (_persistencePromise && typeof _persistencePromise.catch === 'function') {
          _persistencePromise.catch(function (err) {
            // 唔 throw，記低喺 console
            if (global.console && console.warn) {
              console.warn('[auth-state] setPersistence rejected; using default', err);
            }
          });
        }
      } catch (e) {
        if (global.console && console.warn) console.warn('[auth-state] setPersistence threw', e);
      }
      _firebase.onAuthStateChanged(_onAuthStateChanged);
    } catch (e) {
      _initError = e;
      _setState('unavailable');
    }
  }

  function _onAuthStateChanged(fbUser) {
    if (fbUser) {
      _user = _sanitizeUser(fbUser);
      _role = _computeRole(fbUser);
      _setState(_role === 'teacher' ? 'teacher' : 'student');
      // V2 §8.5: Firebase user 上線後清除 legacy keys
      _purgeLegacyKeys();
    } else {
      _user = null;
      _role = 'guest';
      _setState('guest');
    }
  }

  function _sanitizeUser(u) {
    return {
      uid: u.uid,
      email: u.email || null,
      displayName: u.displayName || null,
      photoURL: u.photoURL || null,
      emailVerified: !!u.emailVerified
    };
  }

  function _computeRole(u) {
    if (!u || !u.email) return 'student';
    var email = String(u.email).trim().toLowerCase();
    var list = global.TEACHER_EMAILS;
    if (Array.isArray(list) && list.length > 0) {
      for (var i = 0; i < list.length; i++) {
        if (String(list[i] || '').trim().toLowerCase() === email) return 'teacher';
      }
    }
    return 'student';
  }

  function _purgeLegacyKeys() {
    AUTH_KEYS.forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) { /* noop */ }
    });
  }

  function _setState(s) {
    _state = s;
    _notifyChange();
  }

  function _notifyChange() {
    var snap = get();
    try {
      global.dispatchEvent(new CustomEvent('auth-state-changed', { detail: snap }));
    } catch (e) { /* noop */ }
    for (var i = 0; i < _handlers.length; i++) {
      try { _handlers[i](snap); } catch (e) { /* swallow */ }
    }
  }

  // ─────────────── Google Sign-in / Sign-out ───────────────
  // V2 §8.4: 等 setPersistence 設定完成先 signIn，避免誤用 SESSION persistence
  // 設定失敗時仍可 signIn（fallback default）
  function signInWithGoogle() {
    if (!_firebase) _initFirebase();
    if (!_firebase || _state === 'unavailable') {
      return Promise.reject(_initError || new Error('Firebase Auth unavailable'));
    }
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'lsc.edu.hk',
      prompt: 'select_account'
    });
    var persistPromise;
    try {
      persistPromise = _firebase.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (e) {
      persistPromise = Promise.resolve();
    }
    return (persistPromise && typeof persistPromise.then === 'function'
      ? persistPromise.catch(function () { return null; })
      : Promise.resolve()
    ).then(function () {
      return _firebase.signInWithPopup(provider);
    });
  }

  function logout(redirectPath) {
    var doRedirect = function () {
      if (typeof redirectPath === 'string' && redirectPath) {
        try { window.location.replace(redirectPath); } catch (e) { /* noop */ }
      }
    };
    // V2 §4.5: 清除 legacy keys（不影響其他 localStorage）
    _purgeLegacyKeys();
    if (!_firebase) {
      doRedirect();
      return Promise.resolve();
    }
    return _firebase.signOut().then(doRedirect).catch(function (err) {
      // 即使 signOut 失敗，仍可 redirect；UI 仍會下次 onAuthStateChanged 修正
      console.warn('[auth-state] signOut error', err);
      doRedirect();
    });
  }

  // ─────────────── onChange ───────────────
  function onChange(handler) {
    if (typeof handler !== 'function') return function () {};
    _handlers.push(handler);
    return function off() {
      var i = _handlers.indexOf(handler);
      if (i !== -1) _handlers.splice(i, 1);
    };
  }

  // ─────────────── Cross-tab storage listener (kept for legacy key cleanup) ───────────────
  // 監聽 storage event：如其他 tab 寫入 legacy AUTH_KEYS，本 tab 唔為之視為登入
  // （因為 source: 'firebase' 為唯一真相），但會即時 re-render widget
  global.addEventListener('storage', function (e) {
    if (!e.key) return;
    if (AUTH_KEYS.indexOf(e.key) !== -1) {
      // 其他 tab 修改了 legacy keys → 強制 re-evaluate local state
      if (_state === 'guest' || _state === 'student' || _state === 'teacher') {
        _purgeLegacyKeys();
      }
      // Re-render widget
      try { renderWidget(); } catch (err) { /* noop */ }
      // 如果有 modal 開住，唔主動關（用戶可能想等自己 tab 登入）
    }
  });

  // Close dropdown menus on click outside
  document.addEventListener('click', function (e) {
    var root = document.getElementById('auth-widget-root');
    if (root && !root.contains(e.target)) {
      closeAllMenus();
    }
  });

  // Close modal on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('auth-modal-root');
      if (modal && !modal.hidden) {
        closeLoginModal();
      }
    }
  });

  // ─────────────── Widget rendering ───────────────
  // V2 Codex fix #2: data-no-auth-widget opt-out
  // 頁面 (<body data-no-auth-widget>) 仍可讀 AuthState API
  // 但 renderWidget() / ensureWidgetRoot() / 全域 onChange re-render 都必須不創建 widget DOM
  // 為咗令一但 _init() 跳過 renderWidget() 後，Firebase onAuthStateChanged callback
  // 仲可能會 reopen — 都要保證 opt-out 生效
  function _isWidgetSuppressed() {
    try {
      return !!(document.body && document.body.hasAttribute
        && document.body.hasAttribute('data-no-auth-widget'));
    } catch (e) { return false; }
  }

  function renderWidget() {
    if (_isWidgetSuppressed()) {
      // 頁面表示不渲染 widget。刪除任何之前创建嘅 root（如 hot-reload / SPA）
      var existing = document.getElementById('auth-widget-root');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }
    var root = ensureWidgetRoot();
    var s = get();
    var isMobile = window.matchMedia && window.matchMedia('(max-width: 480px)').matches;

    if (s.state === 'loading') {
      root.innerHTML =
        '<button class="aw-toggle aw-loading" type="button" disabled aria-label="載入登入狀態中">' +
          '<span class="aw-icon" aria-hidden="true">⏳</span>' +
          '<span class="aw-name">登入狀態載入中…</span>' +
        '</button>';
      bindWidgetEvents(root);
      return;
    }

    if (s.state === 'unavailable') {
      root.innerHTML =
        '<button class="aw-toggle aw-unavailable" type="button" disabled aria-label="登入暫時不可用">' +
          '<span class="aw-icon" aria-hidden="true">🔒</span>' +
          '<span class="aw-name">登入暫時不可用</span>' +
        '</button>';
      bindWidgetEvents(root);
      return;
    }

    if (s.state === 'student' || s.state === 'teacher') {
      var u = s.user || {};
      var name = u.displayName || (u.email ? u.email.split('@')[0] : '學生');
      var shortName = isMobile && name.length > 6 ? name.substring(0, 6) + '…' : name;
      var photo = u.photoURL;
      var teacherTag = s.state === 'teacher' ? '<span class="aw-teacher-tag" title="老師">🛠</span>' : '';
      var dashHref = projectUrl('student/dashboard/index.html');
      // V2 §7: 「老師工具」未連去任何地方 — 不連結到學生 Dashboard
      // 待未來提供穩定嘅老師入口後，先加 menu item
      var photoHtml = photo
        ? '<span class="aw-photo" data-photo-url="' + esc(photo) + '"></span>'
        : '<span class="aw-icon">👤</span>';

      root.innerHTML =
        '<button class="aw-toggle aw-loggedin' + (s.state === 'teacher' ? ' aw-is-teacher' : '') + '" type="button" aria-haspopup="true" aria-expanded="false" aria-label="登入狀態選單">' +
          photoHtml +
          '<span class="aw-name">' + esc(shortName) + '</span>' +
          teacherTag +
          '<span class="aw-caret">▾</span>' +
        '</button>' +
        '<div class="aw-menu" hidden role="menu">' +
          '<div class="aw-menu-email" title="' + esc(u.email || '') + '">' + esc(u.email || '') + '</div>' +
          '<a class="aw-menu-item" href="' + esc(dashHref) + '" role="menuitem">📊 我的學習紀錄</a>' +
          '<button class="aw-menu-item aw-logout-btn" type="button" role="menuitem">🚪 登出</button>' +
        '</div>';
    } else {
      // guest
      root.innerHTML =
        '<button class="aw-toggle aw-guest" type="button" aria-label="登入">' +
          '<span class="aw-icon" aria-hidden="true">🔓</span>' +
          '<span class="aw-name">登入</span>' +
          '<span class="aw-action">→</span>' +
        '</button>';
    }
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
    var toggle = root.querySelector('.aw-toggle');
    if (!toggle) return;
    var menu = root.querySelector('.aw-menu');

    // V2: 用 createElement / addEventListener 取代 inline onerror
    // 避免將 Firebase photoURL 嵌進 HTML 屬性
    var photoSlot = root.querySelector('.aw-photo');
    if (photoSlot) {
      var photoUrl = photoSlot.getAttribute('data-photo-url');
      if (photoUrl) {
        var img = document.createElement('img');
        img.className = 'aw-photo';
        img.alt = '';
        img.addEventListener('error', function () {
          // 載入失敗 → 取代為 user icon
          var icon = document.createElement('span');
          icon.className = 'aw-icon';
          icon.textContent = '👤';
          if (img.parentNode) img.parentNode.replaceChild(icon, img);
        });
        img.src = photoUrl;
        photoSlot.parentNode.replaceChild(img, photoSlot);
      }
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (toggle.disabled) return;
      if (menu) {
        var willOpen = menu.hidden;
        closeAllMenus();
        if (willOpen) {
          menu.hidden = false;
          toggle.setAttribute('aria-expanded', 'true');
        }
      } else {
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

  // ─────────────── Modal (V2: Google Sign-in) ───────────────
  function openLoginModal() {
    // 已登入 → 切換 menu
    if (_state === 'student' || _state === 'teacher') {
      var toggle = document.querySelector('#auth-widget-root .aw-toggle');
      if (toggle) toggle.click();
      return;
    }
    if (_state === 'unavailable') {
      // 直接顯示錯誤
      var r = ensureModalRoot();
      r.hidden = false;
      document.body.classList.add('aw-modal-open');
      var st = r.querySelector('#aw-modal-status');
      if (st) st.innerHTML = '<div class="aw-status-error">登入服務暫時不可用，請稍後再試或聯絡老師。</div>';
      return;
    }
    var root = ensureModalRoot();
    root.hidden = false;
    document.body.classList.add('aw-modal-open');
    // Focus Google button after tick
    setTimeout(function () {
      var btn = root.querySelector('.aw-google-btn');
      if (btn) btn.focus();
    }, 80);
  }

  function closeLoginModal() {
    var root = document.getElementById('auth-modal-root');
    if (!root) return;
    root.hidden = true;
    document.body.classList.remove('aw-modal-open');
    var status = root.querySelector('#aw-modal-status');
    if (status) status.innerHTML = '';
    // 只重設 .aw-google-btn-label 文字，唔 touch 整個 button 嘅 SVG / DOM 結構
    var submitBtn = root.querySelector('.aw-google-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      var labelSpan = submitBtn.querySelector('.aw-google-btn-label');
      if (labelSpan) {
        labelSpan.textContent = '使用 Google 帳戶登入';
      }
    }
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
        '<h2 class="aw-modal-title" id="aw-modal-title">🔑 登入</h2>' +
        '<div class="aw-modal-status" id="aw-modal-status" aria-live="polite"></div>' +
        '<button class="aw-google-btn" type="button">' +
          '<svg class="aw-google-icon" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>' +
            '<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
            '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>' +
            '<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>' +
          '</svg>' +
          '<span class="aw-google-btn-label">使用 Google 帳戶登入</span>' +
        '</button>' +
        '<p class="aw-modal-note">ℹ️ 建議使用 <strong>@lsc.edu.hk</strong> 學校帳戶。<br>未登入仍可使用所有教材、練習及考試工具。</p>' +
        '<a class="aw-modal-legacy" href="' + esc(projectUrl('login/index.html?returnTo=' + encodeURIComponent(currentPageRel()))) + '">使用舊版登入連結 →</a>' +
      '</div>';
    document.body.appendChild(root);
    bindModalEvents(root);
    return root;
  }

  function bindModalEvents(root) {
    var btn = root.querySelector('.aw-google-btn');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        submitGoogleLogin();
      });
    }
    var closeBtn = root.querySelector('.aw-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);
    var overlay = root.querySelector('.aw-modal-overlay');
    if (overlay) overlay.addEventListener('click', closeLoginModal);
  }

  function submitGoogleLogin() {
    var root = document.getElementById('auth-modal-root');
    if (!root) return;
    var status = root.querySelector('#aw-modal-status');
    var submitBtn = root.querySelector('.aw-google-btn');
    if (!submitBtn || submitBtn.disabled) return;

    submitBtn.disabled = true;
    var labelSpan = submitBtn.querySelector('.aw-google-btn-label');
    var origLabel = labelSpan ? labelSpan.textContent : '使用 Google 帳戶登入';
    if (labelSpan) labelSpan.textContent = '連線 Google 中…';
    if (status) status.innerHTML = '<div class="aw-status-info">正在開啟 Google 登入視窗…</div>';

    signInWithGoogle()
      .then(function (cred) {
        if (status) status.innerHTML = '<div class="aw-status-success">✓ 登入成功</div>';
        // V2 §4.2: 留在原頁 — 唔 reload
        // 唔 reset 工具狀態 / 答案 / 遊戲
        setTimeout(function () { closeLoginModal(); }, 400);
        return cred;
      })
      .catch(function (err) {
        var msg = _friendlyAuthError(err);
        if (status) status.innerHTML = '<div class="aw-status-error">' + esc(msg) + '</div>';
        submitBtn.disabled = false;
        if (labelSpan) labelSpan.textContent = origLabel;
      });
  }

  function _friendlyAuthError(err) {
    if (!err) return '登入失敗，請再試一次。';
    var code = err.code || '';
    switch (code) {
      case 'auth/popup-closed-by-user':
        return '已取消登入。';
      case 'auth/popup-blocked':
        return '瀏覽器阻擋了登入視窗，請允許本站開啟 popup。';
      case 'auth/network-request-failed':
        return '網絡錯誤，請檢查連線後再試。';
      case 'auth/unauthorized-domain':
        return '此網域未獲授權使用 Google 登入，請聯絡老師處理。';
      case 'auth/cancelled-popup-request':
        return '已取消登入。';
      case 'auth/operation-not-allowed':
        return 'Google 登入尚未啟用，請聯絡老師處理。';
      case 'auth/configuration-not-found':
      case 'auth/invalid-api-key':
        return 'Firebase 設定尚未完成，請聯絡老師處理。';
      default:
        return '登入失敗：' + (err.message || code || '請稍後再試');
    }
  }

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
  // V2 §8 + Codex fix #2: data-no-auth-widget 只代表不渲染 widget，
  // 仍要初始化 Firebase，咁 page (例如 login shim) 可以讀 AuthState。
  // opt-out 本身會喺 renderWidget() 內部檢查 —
  // _init() 只要 renderWidget() 一次，後續 Firebase callback 會自動誒
  function _init() {
    // Render widget for 'loading' state first; will re-render after Firebase init
    // renderWidget() 內部 check data-no-auth-widget — 不需喺這裡重複
    try { renderWidget(); } catch (e) {
      if (global.console && console.warn) console.warn('[auth-state] widget init failed', e);
    }
    // 永遠 init Firebase (login shim 等 page 需要讀 AuthState)
    _initFirebase();
  }

  // ─────────────── auth=open URL hint ───────────────
  // 頁面被 visit 帶 ?auth=open 時（例如 login/index.html redirect 過來），
  // 自動打開 login modal。僅限未登入 / loading 狀態下生效。
  function _checkAuthOpenHint() {
    try {
      var sp = new URLSearchParams(window.location.search);
      if (sp.get('auth') !== 'open') return;
      // 等 widget render + 第一次 Firebase callback 後先決定
      whenReady().then(function (s) {
        if (s.state === 'guest') {
          try { openLoginModal(); } catch (e) { /* noop */ }
        }
      }).catch(function () { /* noop */ });
    } catch (e) { /* noop */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { _init(); _checkAuthOpenHint(); });
  } else {
    _init();
    _checkAuthOpenHint();
  }

  // ─────────────── auth-state-ready event ───────────────
  // V2: dispatch after Firebase onAuthStateChanged first callback (or timeout / unavailable)
  // Contract：listener 收到 event 時 window.AuthState.get() 保證可用（可能仍係 loading，
  // 但已 attach listener 到將來 changes）。
  function _dispatchReady() {
    try {
      global.dispatchEvent(new CustomEvent('auth-state-ready', {
        detail: { state: get(), PROJECT_BASE: PROJECT_BASE }
      }));
    } catch (e) { /* noop */ }
  }

  // ─────────────── Public API ───────────────
  // 設定 window.AuthState 後 dispatch auth-state-ready（保留 DEBUG_1 contract）
  global.AuthState = {
    get: get,
    getUser: getUser,
    getRole: getRole,
    isLegacyStudent: isLegacyStudent,
    loginUrl: loginUrl,
    logout: logout,
    signInWithGoogle: signInWithGoogle,
    openLoginModal: openLoginModal,
    closeLoginModal: closeLoginModal,
    renderWidget: renderWidget,
    onChange: onChange,
    whenReady: whenReady,
    isWidgetSuppressed: _isWidgetSuppressed,
    AUTH_KEYS: AUTH_KEYS,
    PROJECT_BASE: PROJECT_BASE
  };
  _dispatchReady();

  // 同步通知（保留 V1 公開 API 行為）：attach onChange handler 自動 re-render widget
  // renderWidget() 內部 check data-no-auth-widget — 連 opt-out 頁面 callback 都不會創建 widget
  onChange(function (s) {
    try { renderWidget(); } catch (e) { /* noop */ }
  });
})(window);