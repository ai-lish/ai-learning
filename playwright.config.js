// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 60_000,
    retries: process.env.CI ? 1 : 0,
    workers: 1,

    // Start a local HTTP server so CDN resources (MathJax, Google Fonts) load correctly
    webServer: {
        command: 'python3 -m http.server 9527',
        url: 'http://localhost:9527',
        reuseExistingServer: !process.env.CI,
        timeout: 10_000,
    },

    use: {
        baseURL: 'http://localhost:9527',
        headless: true,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ],
});
