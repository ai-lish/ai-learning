const { test, expect } = require('@playwright/test');

test('PieChart MathJax rendering', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('https://ai-lish.github.io/ai-learning/games/S1Ch8-PieChart-Exercise.html');
  await page.waitForTimeout(3000); // wait for MathJax

  // Check formula section
  const mode1Text = await page.locator('.mode-card.active, .section-card.active').first().textContent();
  const hasFormula = mode1Text.includes('百分數');
  const hasTrap = mode1Text.includes('90');

  // Check MathJax rendered
  const mjxCount = await page.evaluate(() => document.querySelectorAll('.mjx-container, mjx-container').length);
  const rawLatexCount = await page.evaluate(() => {
    const body = document.body.innerHTML;
    const matches = body.match(/\$\$/g);
    return matches ? matches.length : 0;
  });

  console.log('Errors:', errors);
  console.log('mjx-containers found:', mjxCount);
  console.log('raw $$ found:', rawLatexCount);
  console.log('Mode1 text snippet:', mode1Text.substring(0, 200));

  expect(errors.length).toBe(0);
  expect(mjxCount).toBeGreaterThan(0);
});
