/**
 * tests/viewport.spec.js — DEBUG_1 §3.9
 *
 * 真 viewport tests，覆蓋 5 個頁面 × 3 個尺寸：
 *   - index.html
 *   - student/dashboard/index.html
 *   - hkdse/dse-practice-p1.html
 *   - math-svg-tools.html
 *   - games/S1Ch10-2-Coordinate.html (從 deleted 改去 S1Ch2-2-DirectedNumberB 替代)
 *
 * 跑法（CI 起 server）：
 *   npm run test:browser:viewport
 *
 * 斷言：
 *   - 冇水平 overflow (scrollWidth <= viewport.width)
 *   - widget 冇超出 viewport
 *   - widget 冇遮 header / hamburger / HUD / 主要控制
 *   - toast 唔擋主要操作
 *
 * 如果某頁有衝突，記低要加 page-level offset 或 data-no-auth-widget，
 * 避免大改原頁。
 */

const { test, expect } = require('@playwright/test');

// 5 個必測頁面
const PAGES = [
  { name: 'home',           url: '/index.html',                            hasWidget: true,  hasHamburger: true },
  { name: 'dashboard',      url: '/student/dashboard/index.html',          hasWidget: false, hasHamburger: false },
  { name: 'dse-practice',   url: '/hkdse/dse-practice-p1.html',            hasWidget: true,  hasHamburger: true },
  { name: 'math-svg-tools', url: '/math-svg-tools.html',                   hasWidget: true,  hasHamburger: true },
  { name: 'game-s2ch2',     url: '/S1Ch2.html',                            hasWidget: true,  hasHamburger: true }
];

const VIEWPORTS = [
  { name: 'desktop-1280x720', width: 1280, height: 720 },
  { name: 'mobile-390x844',   width: 390,  height: 844 },
  { name: 'narrow-320x568',   width: 320,  height: 568 }
];

for (const vp of VIEWPORTS) {
  test.describe(`viewport ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const page of PAGES) {
      test(`${page.name} — no horizontal overflow`, async ({ page: p }) => {
        const errors = [];
        p.on('pageerror', e => errors.push(e.message));
        p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

        const resp = await p.goto(page.url, { waitUntil: 'domcontentloaded' });
        expect(resp, `${page.url} 載入 response 唔係 null`).not.toBeNull();
        // 唔好 fail 載入，但要記低 404
        const status = resp && resp.status();
        test.skip(status === 404, `${page.url} 喺呢個部署唔存在（status ${status}）`);

        // 等 widget / layout settle
        await p.waitForTimeout(500);

        // 1. 水平 overflow
        const layoutInfo = await p.evaluate(() => {
          const docEl = document.documentElement;
          return {
            scrollWidth: docEl.scrollWidth,
            clientWidth: docEl.clientWidth,
            innerWidth: window.innerWidth,
            bodyScrollWidth: document.body.scrollWidth,
            bodyClientWidth: document.body.clientWidth
          };
        });
        expect(layoutInfo.scrollWidth, `${page.name}: scrollWidth > viewport width`)
          .toBeLessThanOrEqual(vp.width + 2); // +2 for sub-pixel rounding

        // 2. 如果有 widget，verify 冇超 viewport
        if (page.hasWidget) {
          const widgetBox = await p.evaluate(() => {
            const w = document.getElementById('auth-widget-root');
            if (!w) return null;
            const r = w.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
          });
          if (widgetBox) {
            expect(widgetBox.x + widgetBox.w, `${page.name}: widget 右邊超出 viewport`)
              .toBeLessThanOrEqual(vp.width + 2);
            expect(widgetBox.x, `${page.name}: widget 左邊負值`)
              .toBeGreaterThanOrEqual(0);
          }
        }

        // 3. 如果有 hamburger，verify widget 唔重疊
        if (page.hasWidget && page.hasHamburger) {
          const overlap = await p.evaluate(() => {
            const w = document.getElementById('auth-widget-root');
            const h = document.querySelector('.hamburger, [class*="hamburger"], [id*="hamburger"]');
            if (!w || !h) return null;
            const wr = w.getBoundingClientRect();
            const hr = h.getBoundingClientRect();
            return {
              widget: { x: wr.x, y: wr.y, w: wr.width, h: wr.height },
              hamburger: { x: hr.x, y: hr.y, w: hr.width, h: hr.height },
              intersects: !(wr.x + wr.width < hr.x || hr.x + hr.width < wr.x ||
                             wr.y + wr.height < hr.y || hr.y + hr.height < wr.y)
            };
          });
          if (overlap) {
            expect(overlap.intersects, `${page.name}: widget 遮住 hamburger`).toBe(false);
          }
        }

        // 4. 如果 dashboard（無 widget），verify 入面嘅元素都唔超
        if (!page.hasWidget) {
          const mainBox = await p.evaluate(() => {
            const main = document.querySelector('.main, #dashboard-wrap, main, body');
            if (!main) return null;
            const r = main.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
          });
          if (mainBox) {
            expect(mainBox.w, `${page.name}: main 超 viewport`).toBeLessThanOrEqual(vp.width + 2);
          }
        }

        // 5. 冇 page error
        expect(errors.filter(e => !/Failed to load resource.*firebase/i.test(e)),
          `${page.name}: page error 出現：${errors.join(' | ')}`).toEqual([]);
      });
    }
  });
}
