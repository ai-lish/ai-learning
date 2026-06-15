/**
 * playwright.config.js — DEBUG_1 §3.8, §3.9
 *
 * 跑法：
 *   npm run test:browser
 *   （背後會起本地 server 再跑 playwright）
 *
 * 必須覆蓋：
 *   - 14 個 auth failure case + 0 unhandledrejection + 0 pageerror
 *   - 3 個 viewport 尺寸 × 5 個頁面，無水平 overflow、無 widget overlap
 */
const { defineConfig } = require('@playwright/test');

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}/`;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /(auth|viewport)\.spec\.js$/,  // 排除舊式 ad-hoc script
  timeout: 30 * 1000,
  expect: { timeout: 5 * 1000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['github']]
    : [['list']],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    bypassCSP: true
  },
  webServer: {
    command: 'node tests/serve.js ' + PORT,
    url: BASE_URL, // waitUntil default ok
    reuseExistingServer: true,
    timeout: 10 * 1000
  }
});

