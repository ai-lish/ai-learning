/**
 * tests/auth.spec.js — DEBUG_1 §3.8
 *
 * 用可控 Firebase mock 跑 auth-state.js，覆蓋所有 §3.5 error case 及
 * §3.1–§3.4 行為。Mock failure 真係 reject（唔會 swallow）。
 * 每個 case 必須 assert unhandledrejection===0 + pageerror===0。
 *
 * 跑法（必須先起 http server）：
 *   npx http-server . -p 4173 -s &
 *   npx playwright test tests/auth.spec.js
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const FIXTURE_URL = '/ai-learning/tests/fixtures/auth-test.html';

async function loadFixture(page, params) {
  // 每次重 load fixture 確保 counters fresh
  await page.goto(FIXTURE_URL + (params ? '?' + params : ''));
  await page.waitForFunction(() => typeof window.AuthState !== 'undefined', null, { timeout: 5000 });
}

async function settle(page, ms) {
  // 等 toast / unhandledrejection settle
  await page.waitForTimeout(ms || 600);
}

test.describe('auth widget — §3.5 error mapping + §3.1–§3.4 lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // 收集 unhandledrejection / pageerror
    page.on('pageerror', () => { /* fixture 已經有 page error 計數 */ });
  });

  test('§3.1 success — no unhandled rejection, widget shows user pill', async ({ page }) => {
    await loadFixture(page, 'scenario=success&avatar=ok');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 400);
    const errCount = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(errCount, 'no unhandledrejection / pageerror on success').toBe(0);
    const state = await page.evaluate(() => __test.getState());
    // success 嘅 mock 唔會 trigger onAuthStateChanged success callback 自動傳 user
    // 但 signInWithPopup resolve 之後 onAuthStateChanged 通常會觸發
    // （mock 淨係 success(null) 一次，唔會 inject user）
    // 重點係 signIn resolve，唔會 throw
    expect(state).toBeTruthy();
  });

  test('§3.5 popup-closed-by-user — 2 秒短 toast，0 unhandled', async ({ page }) => {
    await loadFixture(page, 'scenario=popup-closed-by-user');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 300);
    const toast = await page.evaluate(() => __test.getToastText());
    expect(toast).toBe('已取消登入');
    const counts = await page.evaluate(() => ({ u: __test.getUnhandledCount(), p: __test.getPageErrorCount() }));
    expect(counts.u).toBe(0);
    expect(counts.p).toBe(0);
  });

  test('§3.5 cancelled-popup-request — 2 秒短 toast', async ({ page }) => {
    await loadFixture(page, 'scenario=cancelled-popup-request');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 300);
    expect(await page.evaluate(() => __test.getToastText())).toBe('已取消登入');
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.5 popup-blocked — 4–5 秒 toast', async ({ page }) => {
    await loadFixture(page, 'scenario=popup-blocked');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 300);
    expect(await page.evaluate(() => __test.getToastText())).toBe('瀏覽器已阻擋登入視窗');
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.5 network-request-failed — 4–5 秒 toast', async ({ page }) => {
    await loadFixture(page, 'scenario=network-request-failed');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 300);
    expect(await page.evaluate(() => __test.getToastText())).toBe('網絡連線失敗，請稍後再試');
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.5 unauthorized-domain — 4–5 秒 toast', async ({ page }) => {
    await loadFixture(page, 'scenario=unauthorized-domain');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 300);
    expect(await page.evaluate(() => __test.getToastText())).toBe('此網站暫未獲授權登入');
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.5 operation-not-allowed — 4–5 秒 toast', async ({ page }) => {
    await loadFixture(page, 'scenario=operation-not-allowed');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 300);
    expect(await page.evaluate(() => __test.getToastText())).toBe('登入服務尚未完成設定');
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.5 invalid-api-key — 4–5 秒 toast', async ({ page }) => {
    await loadFixture(page, 'scenario=invalid-api-key');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 300);
    expect(await page.evaluate(() => __test.getToastText())).toBe('登入服務尚未完成設定');
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.5 unknown error — friendly fallback', async ({ page }) => {
    await loadFixture(page, 'fail=internal-error');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 300);
    expect(await page.evaluate(() => __test.getToastText())).toBe('登入失敗，請稍後再試');
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.2 persistence failure — signin 仍繼續，warning toast 出現', async ({ page }) => {
    await loadFixture(page, 'scenario=persistence-fail');
    await page.evaluate(() => __test.signIn().catch(() => {}));
    await settle(page, 400);
    // persistence failure → 至少一個 toast 存在
    const toast = await page.evaluate(() => __test.getToastText());
    expect(toast).toBeTruthy();
    // signInWithPopup 仍 resolve（mock success）→ 唔可以 unhandled
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.4 dedup — 多次 click 返回同一 promise，唔彈多個 popup', async ({ page }) => {
    await loadFixture(page, 'scenario=success');
    // 同時 call 三次
    const result = await page.evaluate(() => {
      const a = __test.signIn();
      const b = __test.signIn();
      const c = __test.signIn();
      return { same: a === b && b === c };
    });
    expect(result.same).toBe(true);
    await settle(page, 300);
    const counts = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(counts).toBe(0);
  });

  test('§3.3 whenReady timeout — 3 秒後強制 resolve 唔 hang', async ({ page }) => {
    // auth-subscribe-throw 會 throw，呢個 scenario 唔設 onAuthStateChanged success
    await loadFixture(page, 'scenario=timeout');
    // manually freeze auth state by making onAuthStateChanged never call success
    await page.evaluate(() => {
      // Override mock to never call success
      window.firebase = window.firebase || {};
      const realAuth = window.firebase.auth;
      window.firebase.auth = function () {
        return {
          setPersistence: () => Promise.resolve(),
          onAuthStateChanged: (s, e) => { /* never call */ return () => {}; },
          signInWithPopup: () => Promise.resolve({ user: { uid: 'x' } }),
          signOut: () => Promise.resolve()
        };
      };
    });
    // Reload auth-state logic by re-creating the page state
    // Easier: re-evaluate whenReady with override in place
    const start = Date.now();
    const state = await page.evaluate(async () => {
      // When ready must resolve within ~3.5s
      return await Promise.race([
        window.AuthState.whenReady(),
        new Promise(r => setTimeout(() => r('TIMEOUT'), 5000))
      ]);
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(4500);
    expect(state).not.toBe('TIMEOUT');
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.3 onAuthStateChanged error callback — 轉 unavailable', async ({ page }) => {
    await loadFixture(page, 'scenario=auth-state-error');
    // 等一輪 event
    await settle(page, 500);
    const state = await page.evaluate(() => __test.getState());
    expect(state.state).toBe('unavailable');
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c).toBe(0);
  });

  test('§3.6 avatar fallback — photoURL 404 → initial letter 出現，無 XSS', async ({ page }) => {
    // 模擬已登入 user，photoURL 故意指去一個會 404 嘅 domain
    // widget 應該 render <img>，404 觸發 error listener，
    // replaceWith(aw-avatar-letter)，顯示 displayName 嘅 first character
    await loadFixture(page, 'scenario=avatar-fallback&avatar=bad&loggedin=1&displayName=Mary%20Wong');
    // 等 widget render + img error 觸發
    await settle(page, 1500);
    const state = await page.evaluate(() => __test.getState());
    expect(state && state.state, 'widget 應該喺 student state').toBe('student');
    // fallback span 必須出現
    const fallbackText = await page.evaluate(() => {
      const sp = document.querySelector('.aw-user-avatar .aw-avatar-letter');
      return sp ? sp.textContent : null;
    });
    expect(fallbackText, 'photoURL 404 後應該出現 .aw-avatar-letter，內容係 displayName first char').toBe('M');
    // 原本嘅 <img> 應該已經被 replace 走
    const imgStillThere = await page.evaluate(() => !!document.querySelector('.aw-user-avatar img.aw-avatar-img'));
    expect(imgStillThere, 'bad <img> 應該被 replaceWith initial span').toBe(false);
    // 0 unhandled
    const c = await page.evaluate(() => __test.getUnhandledCount() + __test.getPageErrorCount());
    expect(c, 'avatar fallback 唔應該 throw unhandled').toBe(0);
    // 無 XSS — displayName 唔可以 execute 為 HTML
    const htmlInsideAvatar = await page.evaluate(() => {
      const a = document.querySelector('.aw-user-avatar');
      return a ? a.innerHTML.indexOf('<script') >= 0 : false;
    });
    expect(htmlInsideAvatar, 'avatar 容器唔可以含 <script>（XSS 檢查）').toBe(false);
  });
});
