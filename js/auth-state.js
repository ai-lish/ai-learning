/**
 * js/auth-state.js — 全站共用 Firebase Auth Google 登入 widget (v3.1, 2026-06-15)
 *
 * 對應規劃：
 *   - PLANNING/20260611_GLOBAL_LOGIN_FIREBASE_GOOGLE_V3.md
 *   - PLANNING/20260615_GLOBAL_LOGIN_FIREBASE_GOOGLE_DEBUG_1.md
 *
 * 行為摘要（V3 §1, §3, §4, §5, §8 + DEBUG_1 §3.1–§3.6）：
 *   - 身份來源：Firebase Auth + Google provider（唯一）。
 *   - 狀態：loading / guest / student / teacher / unavailable。
 *   - Widget：右上角小型「登入」按鈕，點擊直接 signInWithPopup，唔顯示 custom modal。
 *   - 已登入：短名/avatar + 獨立登出按鈕（唔用 dropdown）。
 *   - 錯誤：bottom toast（role="status" aria-live="polite"，單一 DOM node 復用）。
 *   - 初始化時 removeItem 4 個 legacy keys；禁用 localStorage.clear()。
 *   - 登入/登出後留喺原頁，不重置工具狀態。
 *   - 共用 setPersistence(LOCAL) promise；signInWithGoogle 等 persist settle 先 popup。
 *   - 取消／popup closed 顯示 2 秒短 toast；其他錯誤 4–5 秒。
 *
 * 公開 API：
 *   window.AuthState = {
 *     get(), onChange(handler), whenReady(),
 *     signInWithGoogle(), logout(),
 *     renderWidget(), isWidgetSuppressed(),
 *     PROJECT_BASE
 *   }
 *
 * 使用方式（由 inject_firebase_sdk.sh 注入）：
 *   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
 *   <script src="<rel>/js/firebase-config.js"></script>
 *   <link rel="stylesheet" href="<rel>/css/auth-widget.css">
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

  // 共用 persistence promise — signInWithGoogle 必須 await 呢個先開 popup
  // （DEBUG_1 §3.2）
  var _persistenceReady = null;
  function ensurePersistence() {
    if (_persistenceReady) return _persistenceReady;
    _persistenceReady = new Promise(function (resolve) {
      if (!_auth) { resolve(false); return; }
      try {
        var p = _auth.setPersistence(global.firebase.auth.Auth.Persistence.LOCAL);
        if (!p || typeof p.then !== 'function') {
          // Defensive: 唔係 promise 都當 done
          resolve(true);
          return;
        }
        p.then(function () { resolve(true); })
         .catch(function (err) {
           // Persistence failure → warning toast 但仍繼續（DEBUG_1 §3.5）
           try { showToast('登入偏好設定失敗，將使用預設值', 4500, 'warning'); } catch (e) {}
           if (global.console && console.warn) {
             console.warn('[auth-state] setPersistence failed, continuing with default', err);
           }
           resolve(false);
         });
      } catch (e) {
        // Sync throw（e.g. 冇 Auth.Persistence）— 都當 done，唔好 block popup
        try { showToast('登入偏好設定失敗，將使用預設值', 4500, 'warning'); } catch (e2) {}
        if (global.console && console.warn) console.warn('[auth-state] setPersistence threw', e);
        resolve(false);
      }
    });
    return _persistenceReady;
  }

  function initFirebase() {
    try {
      if (!global.firebase) throw new Error('Firebase SDK not loaded');
      if (!global.FIREBASE_CONFIG) throw new Error('FIREBASE_CONFIG missing');

      // 避免重複初始化（即使 script 重複加載）
      if (!global.firebase.apps || global.firebase.apps.length === 0) {
        global.firebase.initializeApp(global.FIREBASE_CONFIG);
      }
      _auth = global.firebase.auth();

      // 立即觸發 persistence — 唔等 pop 都要 settle，咁 signInWithGoogle 唔使 race
      ensurePersistence();

      // 單一身份真相
      // DEBUG_1 §3.3：onAuthStateChanged 必須有 error callback，
      // 否則 hang 喺 loading 永不 settle
      var _authSub;
      try {
        _authSub = _auth.onAuthStateChanged(
          function (user) {
            if (user) {
              var role = resolveRole(user);
              updateState({
                state: role,
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
          },
          function (err) {
            // Firebase 內部 error（如 network 永久 fail / config 損毀）
            _initState = 'failed';
            _initError = err;
            updateState({
              state: 'unavailable',
              user: null,
              role: 'guest',
              source: 'none',
              error: { code: (err && err.code) || 'unknown', message: (err && err.message) || 'auth state error' }
            });
            if (global.console && console.warn) {
              console.warn('[auth-state] onAuthStateChanged error; switching to unavailable', err);
            }
          }
        );
      } catch (e) {
        // Subscribe 失敗（極少見）— 同樣轉 unavailable
        _initState = 'failed';
        _initError = e;
        updateState({
          state: 'unavailable',
          user: null,
          role: 'guest',
          source: 'none',
          error: { message: (e && e.message) || 'auth subscribe failed' }
        });
        if (global.console && console.warn) {
          console.warn('[auth-state] subscribe failed; running in unavailable state', e);
        }
      }

      _initState = 'ok';
    } catch (err) {
      _initState = 'failed';
      _initError = err;
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
    // DEBUG_1 §3.7：teacher allowlist 只作前端 UI 分類，唔係保安邊界
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
  // DEBUG_1 §3.1：UI handler 必須 catch signInWithGoogle() 避免 unhandledrejection
  function openLoginModal() {
    if (_state.state === 'loading') {
      showToast('登入系統準備中，請稍候…', 2000, 'info');
      return;
    }
    if (_state.state === 'unavailable') {
      showToast('登入系統暫時不可用', 4500, 'error');
      return;
    }
    if (_state.state === 'guest') {
      // 直接呼叫 Google popup，唔顯示 modal
      // 呢度係 UI handler，必須 catch
      var p = signInWithGoogle();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { /* 已被 signInWithGoogle 處理 */ });
      }
    }
  }
  function closeLoginModal() { /* no-op in V3 */ }

  // V3 公開介面
  function isWidgetSuppressed() {
    return !!(document.body && document.body.hasAttribute && document.body.hasAttribute('data-no-auth-widget'));
  }

  // DEBUG_1 §3.3：whenReady() 必須真正 settle，settle 後清 timer 同 listener，
  // callback / role derivation 失敗都唔可以永久 hang
  function whenReady() {
    return new Promise(function (resolve) {
      var settled = false;
      function settle(s) {
        if (settled) return;
        settled = true;
        try { if (timer) clearTimeout(timer); } catch (e) {}
        try { global.removeEventListener('auth-state-changed', handler); } catch (e) {}
        resolve(s || get());
      }
      // 已就緒（非 loading）— 立即 resolve
      if (_state.state !== 'loading') { settle(get()); return; }
      var handler = function () {
        if (_state.state !== 'loading') settle(get());
      };
      global.addEventListener('auth-state-changed', handler);
      // 安全網：即使 Firebase 永久 hang 住，3 秒後 resolve 一次避免卡住
      var timer = setTimeout(function () {
        if (_state.state === 'loading') {
          // 強制轉 unavailable（callback／role derivation 失敗嘅情況）
          if (global.console && console.warn) {
            console.warn('[auth-state] whenReady timeout; forcing unavailable');
          }
          updateState({
            state: 'unavailable',
            user: null,
            role: 'guest',
            source: 'none',
            error: { message: 'auth state timeout' }
          });
        }
        settle(get());
      }, 3000);
    });
  }

  // ─────────────── Login / Logout ───────────────
  // V3 §4.2 + §4.5 + DEBUG_1 §3.1, §3.2, §3.4
  var _signInInFlight = null;
  function signInWithGoogle() {
    if (!_auth) {
      showToast('登入系統尚未就緒', 2000, 'info');
      return Promise.reject(new Error('auth not ready'));
    }
    // 契約 A：重複 call 返回同一個 in-flight promise（DEBUG_1 §3.4）
    if (_signInInFlight) return _signInInFlight;

    var inFlight;
    try {
      var provider = new global.firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      inFlight = Promise.resolve()
        .then(function () { return ensurePersistence(); })
        .then(function () { return _auth.signInWithPopup(provider); })
        .then(function (cred) {
          hideToast();
          return cred && cred.user ? cred.user : null;
        })
        .catch(function (err) {
          // DEBUG_1 §3.5：取消／closed 顯示 2 秒短 toast；其餘 4–5 秒
          var code = err && err.code;
          var mapped = errorMessage(code);
          var dur = errorDuration(code);
          if (mapped) showToast(mapped, dur, errorKind(code));
          throw err; // 公開 API 仍可 reject，UI handler 自行 catch
        });
    } catch (syncErr) {
      // 同步 throw（e.g. GoogleAuthProvider ctor 失敗）— 用 finally 清空再 reject
      var mappedSync = errorMessage(syncErr && syncErr.code);
      if (mappedSync) showToast(mappedSync, 4500, 'error');
      return Promise.reject(syncErr);
    }

    // finally 確保 _signInInFlight 一定清空
    _signInInFlight = Promise.resolve(inFlight).then(
      function (u) { _signInInFlight = null; return u; },
      function (e) { _signInInFlight = null; throw e; }
    );
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

  // ─────────────── Error mapping (V3 §8.3 + DEBUG_1 §3.5) ───────────────
  var _errorMap = {
    'auth/popup-closed-by-user':   '已取消登入',
    'auth/cancelled-popup-request':'已取消登入',
    'auth/popup-blocked':          '瀏覽器已阻擋登入視窗',
    'auth/network-request-failed': '網絡連線失敗，請稍後再試',
    'auth/unauthorized-domain':    '此網站暫未獲授權登入',
    'auth/operation-not-allowed':  '登入服務尚未完成設定',
    'auth/invalid-api-key':        '登入服務尚未完成設定',
    'auth/invalid-app-credential': '登入服務尚未完成設定',
    'auth/configuration-not-found': '登入服務尚未完成設定'
  };
  function errorMessage(code) {
    if (code && _errorMap[code]) return _errorMap[code];
    return '登入失敗，請稍後再試';
  }
  function errorDuration(code) {
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 2000; // 取消類短提示
    }
    return 4500; // 其他 4–5 秒
  }
  function errorKind(code) {
    // 'info' for cancel, 'error' for the rest
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'info';
    }
    return 'error';
  }

  // ─────────────── Toast (bottom, single DOM node) ───────────────
  var _toastNode = null;
  var _toastTimer = null;
  function showToast(msg, duration, kind) {
    if (!msg) return;
    duration = duration || 4500;
    kind = kind || 'info';
    if (!_toastNode) {
      _toastNode = document.createElement('div');
      _toastNode.id = 'auth-toast';
      _toastNode.setAttribute('role', 'status');
      _toastNode.setAttribute('aria-live', 'polite');
      _toastNode.setAttribute('aria-atomic', 'true');
      _toastNode.className = 'aw-toast aw-toast-' + kind;
      document.body.appendChild(_toastNode);
    }
    // 強制用 textContent，唔再用 innerHTML — 避免 XSS
    _toastNode.textContent = String(msg);
    _toastNode.className = 'aw-toast aw-toast-' + kind + ' aw-toast-show';
    if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
    _toastTimer = setTimeout(function () { hideToast(); }, duration);
  }
  function hideToast() {
    if (!_toastNode) return;
    _toastNode.className = 'aw-toast aw-toast-info aw-toast-hide';
    if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
  }

  // ─────────────── Widget rendering ───────────────
  function renderWidget() {
    if (isWidgetSuppressed()) return;
    var root = ensureWidgetRoot();
    var s = _state;

    // 清空舊 node — 用 textContent 唔可以清 <img> listener，
    // 所以用 replaceChildren() 或者 innerHTML = ''
    root.textContent = '';

    if (s.state === 'loading') {
      var loadingBtn = document.createElement('button');
      loadingBtn.className = 'aw-toggle aw-loading';
      loadingBtn.type = 'button';
      loadingBtn.disabled = true;
      loadingBtn.setAttribute('aria-label', '登入狀態載入中');
      var sp = document.createElement('span');
      sp.className = 'aw-spinner';
      sp.setAttribute('aria-hidden', 'true');
      var lbl = document.createElement('span');
      lbl.className = 'aw-name';
      lbl.textContent = '登入…';
      loadingBtn.appendChild(sp);
      loadingBtn.appendChild(lbl);
      root.appendChild(loadingBtn);
      bindWidgetEvents(root);
      return;
    }

    if (s.state === 'unavailable') {
      var unBtn = document.createElement('button');
      unBtn.className = 'aw-toggle aw-unavailable';
      unBtn.type = 'button';
      unBtn.disabled = true;
      unBtn.setAttribute('aria-label', '登入系統暫時不可用');
      var ic = document.createElement('span');
      ic.className = 'aw-icon';
      ic.textContent = '⚠️';
      var unLbl = document.createElement('span');
      unLbl.className = 'aw-name';
      unLbl.textContent = '登入暫停';
      unBtn.appendChild(ic);
      unBtn.appendChild(unLbl);
      root.appendChild(unBtn);
      bindWidgetEvents(root);
      return;
    }

    if (s.state === 'student' || s.state === 'teacher') {
      var name = (s.user && s.user.displayName) ? s.user.displayName : '用戶';
      var shortName = truncate(name, 16);
      var initial = (name && name.trim().charAt(0)) || '?';
      var photo = s.user && s.user.photoURL;
      var dashHref = projectUrl('student/dashboard/index.html');

      var pill = document.createElement('div');
      pill.className = 'aw-user-pill';
      pill.setAttribute('role', 'group');
      pill.setAttribute('aria-label', '已登入用戶');

      var avatarLink = document.createElement('a');
      avatarLink.className = 'aw-user-avatar';
      avatarLink.href = dashHref;
      avatarLink.title = '前往 Dashboard';
      avatarLink.setAttribute('aria-label', '前往 Dashboard');

      if (photo) {
        var img = document.createElement('img');
        img.className = 'aw-avatar-img';
        img.alt = '';
        img.src = photo;
        // DEBUG_1 §3.6：用 addEventListener，唔再用 inline onerror
        // displayName / photoURL 唔再拼入 HTML event handler
        img.addEventListener('error', function () {
          try { img.replaceWith(makeInitialSpan(initial)); } catch (e) {}
        });
        avatarLink.appendChild(img);
      } else {
        avatarLink.appendChild(makeInitialSpan(initial));
      }

      var nameLink = document.createElement('a');
      nameLink.className = 'aw-user-name';
      nameLink.href = dashHref;
      nameLink.title = name;
      nameLink.textContent = shortName;
      if (s.role === 'teacher') {
        var tag = document.createElement('span');
        tag.className = 'aw-role-tag aw-role-teacher';
        tag.setAttribute('aria-label', '老師');
        tag.textContent = '老師';
        nameLink.appendChild(tag);
      }

      var logoutBtn = document.createElement('button');
      logoutBtn.className = 'aw-logout';
      logoutBtn.type = 'button';
      logoutBtn.setAttribute('aria-label', '登出');
      logoutBtn.setAttribute('data-action', 'logout');
      logoutBtn.textContent = '登出';

      pill.appendChild(avatarLink);
      pill.appendChild(nameLink);
      pill.appendChild(logoutBtn);
      root.appendChild(pill);
      bindWidgetEvents(root);
      return;
    }

    // guest
    var guestBtn = document.createElement('button');
    guestBtn.className = 'aw-toggle aw-guest';
    guestBtn.type = 'button';
    guestBtn.setAttribute('data-action', 'signin');
    guestBtn.setAttribute('aria-label', '使用 Google 登入');
    var gIcon = document.createElement('span');
    gIcon.className = 'aw-g-icon';
    gIcon.setAttribute('aria-hidden', 'true');
    gIcon.innerHTML = '' +
      '<svg viewBox="0 0 18 18" width="14" height="14" xmlns="http://www.w3.org/2000/svg">' +
        '<path fill="#FFC107" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"/>' +
        '<path fill="#FF3D00" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"/>' +
        '<path fill="#4CAF50" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.82.95 4.03l3-2.33z"/>' +
        '<path fill="#1976D2" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.97 8.97 0 0 0 9 0 9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>' +
      '</svg>';
    var gName = document.createElement('span');
    gName.className = 'aw-name';
    gName.textContent = '登入';
    guestBtn.appendChild(gIcon);
    guestBtn.appendChild(gName);
    root.appendChild(guestBtn);
    bindWidgetEvents(root);
  }

  function makeInitialSpan(initial) {
    var sp = document.createElement('span');
    sp.className = 'aw-avatar-letter';
    sp.textContent = initial || '?';
    return sp;
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
        // DEBUG_1 §3.1：UI handler 必須 catch 避免 unhandledrejection
        var p = signInWithGoogle();
        if (p && typeof p.catch === 'function') {
          p.catch(function () { /* 已被 signInWithGoogle 處理 */ });
        }
      });
    }
    var logoutBtn = root.querySelector('[data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        // logout 內部已經 swallow，唔會有 unhandledrejection
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
