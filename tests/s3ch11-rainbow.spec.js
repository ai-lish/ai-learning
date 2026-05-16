// @ts-check
/**
 * Playwright smoke tests for games/S3Ch11-RainbowExplained.html
 *
 * Validates the Phase 1-5 refactor:
 *   - AppState initialisation
 *   - SVG elements pre-created by initSVGElements()
 *   - Slider updates live stats via updateApp()
 *   - Step 5 panel switches without MathJax re-typeset
 *   - Color-band buttons toggle / warn correctly
 */
const { test, expect } = require('@playwright/test');

const PAGE = '/games/S3Ch11-RainbowExplained.html';

/**
 * Wait for init() to complete, then ensure the first updateApp() has fired.
 * In CI, MathJax CDN may be slow/unavailable, so we inject a minimal stub
 * and trigger drawGeometry() ourselves if needed.
 */
async function waitForApp(page) {
    // Wait for init() to finish (sets window.isAppInitialized)
    await page.waitForFunction(() => window.isAppInitialized === true, { timeout: 15_000 });

    // If MathJax hasn't fired yet, stub it and trigger the first render manually
    await page.evaluate(() => {
        if (!window.isMathJaxReady) {
            window.isMathJaxReady = true;
            if (!window.MathJax) window.MathJax = {};
            if (!window.MathJax.typesetPromise) window.MathJax.typesetPromise = () => Promise.resolve();
            if (typeof drawGeometry === 'function') drawGeometry();
        }
    });

    // Wait until live stats are actually populated (not the placeholder '--')
    await page.waitForFunction(
        () => {
            const el = document.getElementById('win-area-result');
            return el && !el.textContent.includes('--');
        },
        { timeout: 10_000 }
    );
}

/** Set a range slider to a given value and dispatch the input event. */
async function setSlider(page, value) {
    await page.locator('#range-r').evaluate((el, v) => {
        el.value = String(v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    // Give one RAF frame to settle
    await page.waitForTimeout(80);
}

/** Set the number input to a given value and dispatch the input event. */
async function setNumInput(page, value) {
    await page.locator('#num-r').evaluate((el, v) => {
        el.value = String(v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    await page.waitForTimeout(80);
}

// ─── Basic render ────────────────────────────────────────────────────────────

test('page loads with correct title', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page).toHaveTitle(/靈風大彩虹/);
});

test('AppState is initialised on page load', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    const state = await page.evaluate(() => ({
        hasActiveLayers: typeof AppState !== 'undefined' && AppState.activeLayers.size > 0,
        hasStep5Layer:   typeof AppState !== 'undefined' && AppState.step5ActiveLayer !== null,
        rafPendingFalse: typeof AppState !== 'undefined' && AppState.rafPending === false,
    }));

    expect(state.hasActiveLayers).toBe(true);
    expect(state.hasStep5Layer).toBe(true);
    expect(state.rafPendingFalse).toBe(true);
});

// ─── SVG pre-creation (Phase 2) ──────────────────────────────────────────────

test('analysis-layer SVG elements are pre-created before slider moves', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    const childCount = await page.evaluate(() =>
        document.getElementById('analysis-layer').children.length
    );
    // 4 layers × 5 elements (winZone + sectorUp + [sectorLo] + coin + dot)
    // Blue has no sectorLo, so: 3×5 + 1×4 + 2 (rLine + rText) = 21
    expect(childCount).toBeGreaterThanOrEqual(18);
});

// ─── Slider live update (Phase 1 + 2) ────────────────────────────────────────

test('slider change updates live stats', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    const areaBefore = await page.locator('#win-area-result').textContent();

    await setSlider(page, 2.5);

    const areaAfter = await page.locator('#win-area-result').textContent();
    expect(areaAfter).not.toBe(areaBefore);
    expect(areaAfter).toMatch(/\d+\.\d+ cm²/);
});

test('number input field also updates live stats', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    const areaBefore = await page.locator('#win-area-result').textContent();

    await setNumInput(page, 0.5);

    const areaAfter = await page.locator('#win-area-result').textContent();
    expect(areaAfter).not.toBe(areaBefore);
    expect(areaAfter).toMatch(/\d+\.\d+ cm²/);
});

test('live probability is a valid percentage', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    const prob = await page.locator('#win-prob-result').textContent();
    const val  = parseFloat(prob);
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThan(100);
});

// ─── Step 5 panel switching (Phase 3) ────────────────────────────────────────

test('Step 5 shows first panel (藍色) by default', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    await expect(page.locator('#step5-panel-0')).toBeVisible();
    await expect(page.locator('#step5-panel-1')).toBeHidden();
    await expect(page.locator('#step5-panel-2')).toBeHidden();
    await expect(page.locator('#step5-panel-3')).toBeHidden();
});

test('clicking 綠色 in Step 5 shows panel 1 and hides others', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    await page.locator('#step5-btn-container').locator('button', { hasText: '綠色' }).click();
    await page.waitForTimeout(100);

    await expect(page.locator('#step5-panel-0')).toBeHidden();
    await expect(page.locator('#step5-panel-1')).toBeVisible();
});

test('Step 5 panel numbers update when slider changes', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    // Panel 0 (藍色) is showing by default
    const finalBefore = await page.locator('#s5-b-final').textContent();

    await setSlider(page, 0.8);

    const finalAfter = await page.locator('#s5-b-final').textContent();
    expect(finalAfter).not.toBe(finalBefore);
    expect(parseFloat(finalAfter)).toBeGreaterThan(0);
});

test('Step 5 summary total area updates with slider', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    const totalBefore = await page.locator('#step5-total-area').textContent();

    await setSlider(page, 3.0);

    const totalAfter = await page.locator('#step5-total-area').textContent();
    expect(totalAfter).not.toBe(totalBefore);
});

// ─── Color button toggle (simulator) ─────────────────────────────────────────

test('deactivating a color band reduces total area', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    const areaBefore = parseFloat((await page.locator('#win-area-result').textContent()).replace(/[^0-9.]/g, ''));

    await page.locator('#btn-container').locator('button', { hasText: '紅色' }).click();
    await page.waitForTimeout(150);

    const areaAfter = parseFloat((await page.locator('#win-area-result').textContent()).replace(/[^0-9.]/g, ''));
    expect(areaAfter).toBeLessThan(areaBefore);
});

test('last active color cannot be deactivated (shake, no change)', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    const btnContainer = page.locator('#btn-container');
    await btnContainer.locator('button', { hasText: '綠色' }).click();
    await btnContainer.locator('button', { hasText: '黃色' }).click();
    await btnContainer.locator('button', { hasText: '紅色' }).click();
    await page.waitForTimeout(150);

    const areaBefore = await page.locator('#win-area-result').textContent();

    // Try to deactivate the last remaining band — should be blocked
    await btnContainer.locator('button', { hasText: '藍色' }).click();
    await page.waitForTimeout(150);

    const areaAfter = await page.locator('#win-area-result').textContent();
    expect(areaAfter).toBe(areaBefore);

    const size = await page.evaluate(() => AppState.activeLayers.size);
    expect(size).toBe(1);
});

// ─── Warning message ──────────────────────────────────────────────────────────

test('warning appears when coin is too large for selected zone', async ({ page }) => {
    await page.goto(PAGE);
    await waitForApp(page);

    // Keep only 藍色 (upper = 3.4 − r), then push r past 3.4 to make it invalid
    const btnContainer = page.locator('#btn-container');
    await btnContainer.locator('button', { hasText: '綠色' }).click();
    await btnContainer.locator('button', { hasText: '黃色' }).click();
    await btnContainer.locator('button', { hasText: '紅色' }).click();

    await setSlider(page, 3.4);

    await expect(page.locator('#warning-msg')).toBeVisible();
});
