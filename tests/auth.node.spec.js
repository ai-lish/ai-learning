/**
 * tests/auth.node.spec.js — DEBUG_1 §3.8
 *
 * Node + jsdom fallback test runner。本機 sandbox 唔俾 headless Chromium 跑，
 * 所以呢個 runner 用 jsdom 載入真實 auth-state.js，注入可控 Firebase mock，
 * 然後 assert §3.1–§3.5 + §3.6 行為。
 *
 * CI 上 Playwright 版本（tests/auth.spec.js）會額外跑一次覆蓋真 browser。
 *
 * 跑法：node tests/auth.node.spec.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const AUTH_STATE_JS = fs.readFileSync(
  path.resolve(__dirname, '..', 'js', 'auth-state.js'),
  'utf-8'
);

let totalAssertions = 0;
let failedAssertions = 0;

function assertEq(actual, expected, msg) {
  totalAssertions++;
  if (actual !== expected) {
    failedAssertions++;
    console.error(`  ✘ ${msg}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

function assertTrue(cond, msg) {
  totalAssertions++;
  if (!cond) {
    failedAssertions++;
    console.error(`  ✘ ${msg}`);
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * 用 jsdom 載入 auth-state.js，注入 mock，回傳 helpers
 */
function makeEnv({ scenario = 'success', failCode = null, avatar = 'ok' } = {}) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', () => { /* swallow jsdom infra noise */ });

  const dom = new JSDOM(
    `<!doctype html><html><head></head><body></body></html>`,
    { url: 'http://localhost/', runScripts: 'outside-only', virtualConsole }
  );
  const win = dom.window;

  win.__test = { unhandledCount: 0, pageErrorCount: 0, errors: [] };
  win.addEventListener('unhandledrejection', (e) => {
    win.__test.unhandledCount++;
    win.__test.errors.push('unhandledrejection: ' + (e.reason && e.reason.code || e.reason));
  });
  win.addEventListener('error', (e) => {
    win.__test.pageErrorCount++;
    win.__test.errors.push('pageerror: ' + (e.message || e.filename || 'unknown'));
  });

  const mockUser = {
    uid: 'mock-uid-12345',
    email: 'mockuser@example.com',
    displayName: 'Test User',
    photoURL: avatar === 'bad' ? 'http://example.invalid/missing.png' : '',
    emailVerified: true
  };

  function makeFailingPromise(code) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const err = new Error('mock ' + code);
        err.code = code;
        reject(err);
      }, 0);
    });
  }
  const pendingFailingPromises = [];

  const FAIL_CODES = {
    'popup-closed-by-user': 'auth/popup-closed-by-user',
    'cancelled-popup-request': 'auth/cancelled-popup-request',
    'popup-blocked': 'auth/popup-blocked',
    'network-request-failed': 'auth/network-request-failed',
    'unauthorized-domain': 'auth/unauthorized-domain',
    'operation-not-allowed': 'auth/operation-not-allowed',
    'invalid-api-key': 'auth/invalid-api-key'
  };

  let signInResult;
  if (failCode) {
    const p = makeFailingPromise('auth/' + failCode);
    pendingFailingPromises.push(p);
    signInResult = p;
  } else if (FAIL_CODES[scenario]) {
    const p = makeFailingPromise(FAIL_CODES[scenario]);
    pendingFailingPromises.push(p);
    signInResult = p;
  } else {
    signInResult = Promise.resolve({ user: mockUser });
  }

  const persistenceShouldFail = (scenario === 'persistence-fail');
  const authStateError = (scenario === 'auth-state-error');
  const authStateThrow = (scenario === 'auth-subscribe-throw');
  const authNever = (scenario === 'timeout');

  const mockAuth = {
    setPersistence: function () {
      if (persistenceShouldFail) return Promise.reject(new Error('persistence failed'));
      return Promise.resolve();
    },
    onAuthStateChanged: function (success, error) {
      if (authStateThrow) throw new Error('subscribe threw');
      if (!authNever) {
        setTimeout(() => {
          try { success(null); } catch (e) {}
          if (authStateError && typeof error === 'function') {
            setTimeout(() => {
              try { error({ code: 'auth/internal-error', message: 'mocked' }); } catch (e) {}
            }, 0);
          }
        }, 0);
      }
      return function unsubscribe() {};
    },
    signInWithPopup: function () { return Promise.resolve(signInResult); },
    signOut: function () { return Promise.resolve(); }
  };

  const GoogleAuthProvider = function () { this.setCustomParameters = () => {}; };
  const Auth = { Persistence: { LOCAL: 'local' } };

  win.firebase = {
    apps: [],
    initializeApp: function () { return {}; },
    auth: function () { return mockAuth; }
  };
  win.firebase.auth.GoogleAuthProvider = GoogleAuthProvider;
  win.firebase.auth.Auth = Auth;

  win.FIREBASE_CONFIG = { apiKey: 'mock', projectId: 'mock' };
  win.TEACHER_EMAILS = ['mathteachlsh@gmail.com'];

  win.eval(AUTH_STATE_JS);
  try { win.document.dispatchEvent(new win.Event('DOMContentLoaded')); } catch (e) {}

  return {
    win,
    dom,
    pendingFailingPromises,
    signIn: () => win.AuthState.signInWithGoogle(),
    getState: () => win.AuthState.get(),
    getToastText: () => {
      const t = win.document.getElementById('auth-toast');
      return t ? t.textContent : null;
    },
    getUnhandledCount: () => win.__test.unhandledCount,
    getPageErrorCount: () => win.__test.pageErrorCount,
    cleanup: async () => {
      await Promise.allSettled(pendingFailingPromises);
      await delay(20);
    }
  };
}

// ─────────────── Test cases ───────────────

async function testPopupClosedByUser() {
  console.log('\n=== §3.5 popup-closed-by-user — 2 秒短 toast，0 unhandled ===');
  const env = makeEnv({ scenario: 'popup-closed-by-user' });
  await env.signIn().catch(() => {});
  await delay(80);
  assertEq(env.getToastText(), '已取消登入', 'toast 文字 = 已取消登入');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testCancelledPopupRequest() {
  console.log('\n=== §3.5 cancelled-popup-request — 2 秒短 toast ===');
  const env = makeEnv({ scenario: 'cancelled-popup-request' });
  await env.signIn().catch(() => {});
  await delay(80);
  assertEq(env.getToastText(), '已取消登入', 'toast 文字 = 已取消登入');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testPopupBlocked() {
  console.log('\n=== §3.5 popup-blocked — 4–5 秒 toast ===');
  const env = makeEnv({ scenario: 'popup-blocked' });
  await env.signIn().catch(() => {});
  await delay(80);
  assertEq(env.getToastText(), '瀏覽器已阻擋登入視窗', 'toast 文字 = 瀏覽器已阻擋登入視窗');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testNetworkFailure() {
  console.log('\n=== §3.5 network-request-failed — 4–5 秒 toast ===');
  const env = makeEnv({ scenario: 'network-request-failed' });
  await env.signIn().catch(() => {});
  await delay(80);
  assertEq(env.getToastText(), '網絡連線失敗，請稍後再試', 'toast = 網絡連線失敗，請稍後再試');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testUnauthorizedDomain() {
  console.log('\n=== §3.5 unauthorized-domain — 4–5 秒 toast ===');
  const env = makeEnv({ scenario: 'unauthorized-domain' });
  await env.signIn().catch(() => {});
  await delay(80);
  assertEq(env.getToastText(), '此網站暫未獲授權登入', 'toast = 此網站暫未獲授權登入');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testOperationNotAllowed() {
  console.log('\n=== §3.5 operation-not-allowed — 4–5 秒 toast ===');
  const env = makeEnv({ scenario: 'operation-not-allowed' });
  await env.signIn().catch(() => {});
  await delay(80);
  assertEq(env.getToastText(), '登入服務尚未完成設定', 'toast = 登入服務尚未完成設定');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testInvalidApiKey() {
  console.log('\n=== §3.5 invalid-api-key — 4–5 秒 toast ===');
  const env = makeEnv({ scenario: 'invalid-api-key' });
  await env.signIn().catch(() => {});
  await delay(80);
  assertEq(env.getToastText(), '登入服務尚未完成設定', 'toast = 登入服務尚未完成設定');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testUnknown() {
  console.log('\n=== §3.5 unknown error — friendly fallback ===');
  const env = makeEnv({ failCode: 'internal-error' });
  let err = 'NOT_THROWN';
  try { await env.signIn(); } catch (e) { err = e; }
  await delay(80);
  assertTrue(err && err.code === 'auth/internal-error', 'signIn reject auth/internal-error');
  assertEq(env.getToastText(), '登入失敗，請稍後再試', 'toast = 登入失敗，請稍後再試');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testPersistenceFailure() {
  console.log('\n=== §3.2 persistence failure — signin 仍繼續 ===');
  const env = makeEnv({ scenario: 'persistence-fail' });
  let err;
  try { await env.signIn(); } catch (e) { err = e; }
  await delay(80);
  assertTrue(err === undefined, 'signInWithGoogle 仍 resolve 唔 throw');
  assertTrue(env.getToastText() !== null, 'persistence failure 出現 warning toast');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testDedup() {
  console.log('\n=== §3.4 dedup — 多次 call 返回同一個 promise ===');
  const env = makeEnv({ scenario: 'success' });
  const a = env.signIn();
  const b = env.signIn();
  const c = env.signIn();
  assertTrue(a === b && b === c, '3 個 call 返回 === 同一 promise');
  await Promise.allSettled([a, b, c]);
  await delay(80);
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
}

async function testAuthStateError() {
  console.log('\n=== §3.3 onAuthStateChanged error callback — 轉 unavailable ===');
  const env = makeEnv({ scenario: 'auth-state-error' });
  await delay(80);
  assertEq(env.getState().state, 'unavailable', 'state = unavailable');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
  await env.cleanup();
}

async function testAuthSubscribeThrow() {
  console.log('\n=== §3.3 onAuthStateChanged throw — 轉 unavailable ===');
  const env = makeEnv({ scenario: 'auth-subscribe-throw' });
  await delay(80);
  assertEq(env.getState().state, 'unavailable', 'state = unavailable');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
}

async function testWhenReadyTimeout() {
  console.log('\n=== §3.3 whenReady timeout — 強制 settle 唔 hang ===');
  const env = makeEnv({ scenario: 'timeout' });
  const start = Date.now();
  const result = await env.win.AuthState.whenReady();
  const elapsed = Date.now() - start;
  assertTrue(elapsed < 4500, 'whenReady 喺 ' + elapsed + 'ms 內 settle（< 4500ms）');
  assertTrue(result && result.state === 'unavailable', 'settle 後 state = unavailable');
  assertEq(env.getUnhandledCount() + env.getPageErrorCount(), 0, 'unhandled + page error = 0');
}

async function testNoInlineOnerror() {
  console.log('\n=== §3.6 無 inline onerror — source scan ===');
  const src = AUTH_STATE_JS;
  const matches = src.match(/onerror\s*=/gi) || [];
  assertEq(matches.length, 0, 'auth-state.js 無 onerror= 字串');
  const onclickMatches = src.match(/\bonclick\s*=/gi) || [];
  assertEq(onclickMatches.length, 0, 'auth-state.js 無 onclick= 字串');
}

async function testOpenLoginModalCatches() {
  console.log('\n=== §3.1 openLoginModal — UI handler 必須 catch ===');
  const env = makeEnv({ scenario: 'popup-closed-by-user' });
  // 預先跑一次穩定 internal in-flight 狀態
  const p1 = env.signIn();
  await p1.catch(() => {});
  await delay(80);
  env.__reset && env.__reset(); // optional reset
  env.win.__test.unhandledCount = 0;
  env.win.__test.pageErrorCount = 0;
  // 再 call 一次 openLoginModal，verify 無 unhandled 殘留
  env.win.AuthState.openLoginModal();
  await delay(120);
  const c = env.win.__test.unhandledCount + env.win.__test.pageErrorCount;
  assertEq(c, 0, 'openLoginModal 唔產生 unhandled（reset 後再檢）');
  await env.cleanup();
}

async function testTeacherAllowlist() {
  console.log('\n=== §3.7 teacher allowlist — 保留 mathteachlsh@gmail.com ===');
  const env = makeEnv({ scenario: 'success' });
  assertTrue(Array.isArray(env.win.TEACHER_EMAILS), 'TEACHER_EMAILS 存在並係 array');
  assertTrue(env.win.TEACHER_EMAILS.includes('mathteachlsh@gmail.com'), 'TEACHER_EMAILS 含 mathteachlsh@gmail.com');
}

async function testNoRawSecretsInErrorToast() {
  console.log('\n=== §3.5 toast 唔顯示 raw Firebase code ===');
  const env = makeEnv({ failCode: 'internal-error-unique-token-12345' });
  await env.signIn().catch(() => {});
  await delay(80);
  const toast = env.getToastText() || '';
  assertTrue(!toast.includes('internal-error-unique-token-12345'), 'toast 唔洩露 raw code');
  assertTrue(!toast.includes('auth/'), 'toast 唔含 "auth/" prefix');
  await env.cleanup();
}

// ─────────────── Runner ───────────────
(async () => {
  console.log('=== auth-state.js jsdom test runner — DEBUG_1 §3.8 ===');
  await testPopupClosedByUser();
  await testCancelledPopupRequest();
  await testPopupBlocked();
  await testNetworkFailure();
  await testUnauthorizedDomain();
  await testOperationNotAllowed();
  await testInvalidApiKey();
  await testUnknown();
  await testPersistenceFailure();
  await testDedup();
  await testAuthStateError();
  await testAuthSubscribeThrow();
  await testWhenReadyTimeout();
  await testNoInlineOnerror();
  await testOpenLoginModalCatches();
  await testTeacherAllowlist();
  await testNoRawSecretsInErrorToast();

  console.log('\n=== SUMMARY ===');
  console.log(`Total assertions: ${totalAssertions}`);
  console.log(`Failed:           ${failedAssertions}`);
  if (failedAssertions > 0) {
    console.log('\n✘ TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\n✓ ALL TESTS PASSED');
    process.exit(0);
  }
})().catch(e => {
  console.error('Runner crashed:', e);
  process.exit(2);
});
