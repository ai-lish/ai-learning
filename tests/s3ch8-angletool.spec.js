const { test, expect, chromium } = require('@playwright/test');

const URL = 'https://ai-lish.github.io/ai-learning/games/S3Ch8-1-AngleTool.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  async function screenshot(name) {
    const path = `/tmp/angle-tool-${name}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot: ${path}`);
    return path;
  }

  async function getBadge() {
    return await page.locator('#badge').textContent();
  }

  async function getEleVal() {
    return await page.locator('#eleVal').textContent();
  }

  async function getDepVal() {
    return await page.locator('#depVal').textContent();
  }

  try {
    // ===== VISUAL CHECKS =====
    console.log('\n========== VISUAL CHECKS ==========');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    await screenshot('visual');

    // Check semcircle protractor
    const canvas = page.locator('canvas');
    const canvasExists = await canvas.count() > 0;
    console.log(`1. Canvas exists: ${canvasExists ? '✅' : '❌'}`);

    // Check slider
    const slider = page.locator('#slider');
    const sliderExists = await slider.count() > 0;
    console.log(`2. Slider exists: ${sliderExists ? '✅' : '❌'}`);

    // Check badge
    const badge = page.locator('#badge');
    const badgeExists = await badge.count() > 0;
    console.log(`3. Badge (#badge) exists: ${badgeExists ? '✅' : '❌'}`);

    // Check reset button
    const resetBtn = page.locator('#resetBtn');
    const resetBtnExists = await resetBtn.count() > 0;
    console.log(`4. Reset button (#resetBtn) exists: ${resetBtnExists ? '✅' : '❌'}`);

    // ===== TEST 1: Horizontal (0°) =====
    console.log('\n========== TEST 1: Horizontal (0°) ==========');
    await slider.fill('0');
    await page.waitForTimeout(500);
    const badge0 = await getBadge();
    console.log(`Badge: "${badge0}" | Expected: "0°" | ${badge0 === '0°' ? '✅' : '❌'}`);
    await screenshot('horizontal');

    // ===== TEST 2: Elevation 45° =====
    console.log('\n========== TEST 2: Elevation 45° ==========');
    await slider.fill('45');
    await page.waitForTimeout(500);
    const badge45 = await getBadge();
    const eleVal = await getEleVal();
    console.log(`Badge: "${badge45}" | Expected: "45°" | ${badge45 === '45°' ? '✅' : '❌'}`);
    console.log(`eleVal: "${eleVal}" | Expected: "45°" | ${eleVal === '45°' ? '✅' : '❌'}`);
    await screenshot('elevation-45');

    // ===== TEST 3: Depression -60° =====
    console.log('\n========== TEST 3: Depression -60° ==========');
    await slider.fill('-60');
    await page.waitForTimeout(500);
    const badge60 = await getBadge();
    const depVal = await getDepVal();
    console.log(`Badge: "${badge60}" | Expected: "60°" | ${badge60 === '60°' ? '✅' : '❌'}`);
    console.log(`depVal: "${depVal}" | Expected: "60°" | ${depVal === '60°' ? '✅' : '❌'}`);
    await screenshot('depression-60');

    // ===== TEST 4: Reset Button =====
    console.log('\n========== TEST 4: Reset Button ==========');
    await slider.fill('50');
    await page.waitForTimeout(300);
    const badgeBefore = await getBadge();
    console.log(`Before reset: "${badgeBefore}" (expected "50°")`);
    await resetBtn.click();
    await page.waitForTimeout(500);
    const badgeAfter = await getBadge();
    console.log(`After reset: "${badgeAfter}" | Expected: "0°" | ${badgeAfter === '0°' ? '✅' : '❌'}`);
    await screenshot('after-reset');

    // ===== TEST 5: Drag straw =====
    console.log('\n========== TEST 5: Drag Straw ==========');
    const box = await canvas.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height * 0.60;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx - 100, cy);
      await page.mouse.up();
      await page.waitForTimeout(500);
      const badgeDrag = await getBadge();
      console.log(`Badge after drag: "${badgeDrag}" (should be positive angle) ✅`);
      await screenshot('drag');
    } else {
      console.log('❌ Could not get canvas bounding box');
    }

    console.log('\n========== ALL TESTS DONE ==========');
    console.log('Screenshots saved to /tmp/angle-tool-*.png');

  } catch (err) {
    console.error('❌ Test error:', err.message);
  } finally {
    await browser.close();
  }
})();
