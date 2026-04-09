const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

test('MixOpsPercent smoke (local file)', async ({ page }) => {
  const url = 'file:///Users/zachli/ai-learning/games/S1Ch9-3-MixOpsPercent.html';
  await page.goto(url);
  // wait for script to initialize
  await page.waitForFunction(() => typeof nextQ === 'function');

  for (let i = 0; i < 10; i++) {
    // generate next question via page function to ensure proper state
    await page.evaluate(() => nextQ());
    await page.waitForTimeout(200);

    // get expected answer and mode from page (use page's toSigFigsNoComma)
    const info = await page.evaluate(() => {
      const mode = (typeof cur !== 'undefined' && cur.mode) ? cur.mode : 'percent';
      const val = (typeof cur !== 'undefined') ? cur.value : null;
      if(val === null) return { ok: false };
      if(mode === 'value'){
        const s = toSigFigsNoComma(val, 3);
        return { ok:true, mode, answer: String(s) };
      } else {
        const s = toSigFigsNoComma(val*100, 3);
        return { ok:true, mode, answer: s + '%' };
      }
    });
    if(!info.ok) throw new Error('Could not read cur from page');

    // set inputDisplay to answer (simulate keyboard quickly)
    await page.evaluate(a => document.getElementById('inputDisplay').innerText = a, info.answer);
    // click submit
    await page.click('button:has-text("✓ 檢查答案")');
    await page.waitForTimeout(200);

    // read result message
    const ok = await page.$eval('#msg', el => el.innerText.includes('✓'));
    if(!ok) {
      const q = await page.$eval('#qtext', el => el.innerText);
      const msg = await page.$eval('#msg', el => el.innerText);
      throw new Error(`Fail at round ${i+1}: q="${q}", expected input="${info.answer}", msg="${msg}"`);
    }
  }
});
