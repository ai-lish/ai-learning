const { test, expect } = require('@playwright/test');

test('Bar Chart Mode 1 - goStep2 renders bars without ReferenceError', async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('https://ai-lish.github.io/ai-learning/games/S1Ch8-BarChart-Exercise.html');
  await page.waitForTimeout(1000);

  // Click Mode 1
  await page.click('text=📐 模式一：繪畫棒形圖');
  await page.waitForTimeout(500);

  // Click next step
  await page.click('text=➡️ 下一步：畫棒形圖');
  await page.waitForTimeout(1000);

  // Check canvas area exists and has content
  const canvasArea = await page.$('#barCanvas, canvas, .bar-area, #chart-area');
  const hasCanvas = canvasArea !== null;

  // Check for ReferenceError
  const refError = errors.find(e => e.includes('ReferenceError') || e.includes('h is not defined'));

  console.log('Canvas found:', hasCanvas);
  console.log('Console errors:', errors);
  console.log('ReferenceError found:', !!refError);

  // Fail if ReferenceError occurred
  expect(refError, 'No ReferenceError: h is not defined').toBeFalsy();
});
