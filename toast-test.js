const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://ai-lish.github.io/virtual-office/public/pages/minimax-workshop.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Directly trigger showToast with a long error message
  await page.evaluate(() => {
    const longMsg = 'Authentication failed: voice id not exist - this is a very long error message that should be truncated at 80 characters to test the new toast layout with copy button visibility';
    showToast(longMsg, 'error');
  });

  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const container = document.getElementById('toastContainer');
    const toasts = [...container.children];
    return toasts.map(t => {
      const copyBtn = t.querySelector('button[id^="copy-err-"]');
      const msgSpan = t.querySelector('span');
      return {
        outerHTML: t.outerHTML.slice(0, 600),
        hasRedBg: t.className.includes('red-950'),
        hasCopyBtn: !!copyBtn,
        copyBtnVisible: copyBtn ? getComputedStyle(copyBtn).display !== 'none' : false,
        copyBtnText: copyBtn ? copyBtn.textContent.trim() : null,
        displayedMsg: msgSpan ? msgSpan.textContent.trim() : t.textContent.trim(),
        msgLength: (msgSpan ? msgSpan.textContent.trim() : t.textContent.trim()).length,
      };
    });
  });

  console.log('Toasts found:', result.length);
  result.forEach((t, i) => {
    console.log(`\n=== Toast ${i+1} ===`);
    console.log('Red bg:', t.hasRedBg);
    console.log('Has copy btn:', t.hasCopyBtn);
    console.log('Copy btn visible:', t.copyBtnVisible);
    console.log('Copy btn text:', t.copyBtnText);
    console.log('Displayed msg length:', t.msgLength, 'chars');
    console.log('Displayed msg:', t.displayedMsg.slice(0, 120));
  });

  if (result.length > 0) {
    // Screenshot just the toast area (top-right)
    const vp = page.viewportSize() || { width: 1280, height: 800 };
    await page.screenshot({
      path: '/Users/zachli/ai-learning/toast-test.png',
      clip: { x: vp.width - 380, y: 10, width: 370, height: 200 }
    });
    console.log('\n✅ Screenshot saved: /Users/zachli/ai-learning/toast-test.png');
  } else {
    console.log('\n❌ No toasts visible - taking full screenshot');
    await page.screenshot({ path: '/Users/zachli/ai-learning/toast-test.png' });
  }

  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
