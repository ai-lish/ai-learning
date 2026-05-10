const { chromium } = require('./node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  console.log('=== S1Ch9-5 深入測試 ===\n');
  
  await page.goto('https://ai-lish.github.io/ai-learning/games/S1Ch9-5-CostMarkupSellingPrice.html');
  await page.waitForTimeout(1500);
  
  // 1. Check initial state
  const typeLabel = await page.locator('#type-label').textContent();
  console.log('1. Initial type:', typeLabel);
  
  // 2. Click a keypad button and verify input
  await page.locator('button:has-text("7")').first().click();
  await page.waitForTimeout(100);
  const formulaDisplay = await page.locator('#formula-display').textContent();
  console.log('2. After clicking 7, formula display:', formulaDisplay);
  
  // 3. Check hint functionality
  await page.locator('#hint-btn').click();
  await page.waitForTimeout(300);
  const feedback = await page.locator('#feedback').textContent();
  console.log('3. Hint feedback length:', feedback.length, 'chars');
  
  // 4. Check answer and move to next
  await page.locator('#check-btn').click();
  await page.waitForTimeout(300);
  
  // 5. Check score tracking
  const correctCount = await page.locator('#correct-count').textContent();
  const wrongCount = await page.locator('#wrong-count').textContent();
  console.log('4. Score after check - Correct:', correctCount, 'Wrong:', wrongCount);
  
  // 6. Click next question
  await page.locator('#next-btn').click();
  await page.waitForTimeout(500);
  const newTypeLabel = await page.locator('#type-label').textContent();
  console.log('5. New question type:', newTypeLabel);
  
  // 7. Test formula buttons
  const formulaBtns = await page.locator('.formula-btn-row button').count();
  console.log('6. Formula buttons count:', formulaBtns);
  if (formulaBtns > 0) {
    await page.locator('.formula-btn-row button').first().click();
    await page.waitForTimeout(100);
    const newFormula = await page.locator('#formula-display').textContent();
    console.log('   After formula click:', newFormula);
  }
  
  // 8. Check progress info
  const progressInfo = await page.locator('#progress-info').textContent();
  console.log('7. Progress:', progressInfo);
  
  // 9. Test all keypad numbers
  console.log('8. Testing all keypad buttons...');
  const keypadBtns = await page.locator('#keypad button').count();
  console.log('   Total keypad buttons:', keypadBtns);
  
  // 10. Error check
  console.log('\n=== JS Errors ===');
  console.log(errors.length ? errors.join('\n') : 'None');
  
  await browser.close();
  console.log('\n=== 測試完成 ===');
})();