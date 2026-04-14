const { chromium } = require('playwright-chromium');
(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = 'file:///Users/zachli/ai-learning/games/S1Ch9-3-MixOpsPercent.html';
  try{
    await page.goto(url);
    await page.waitForFunction(()=>typeof nextQ === 'function', {timeout: 60000});
    for(let i=0;i<10;i++){
      await page.evaluate(()=> nextQ());
      await page.waitForTimeout(200);
      const info = await page.evaluate(()=>{
        const mode = (typeof cur !== 'undefined' && cur.mode) ? cur.mode : 'percent';
        const val = (typeof cur !== 'undefined') ? cur.value : null;
        if(val===null) return {ok:false};
        if(mode==='value'){
          const s = toSigFigsNoComma(val,3);
          return {ok:true,mode,answer:String(s)}
        } else {
          const s = toSigFigsNoComma(val*100,3);
          return {ok:true,mode,answer: s + '%'}
        }
      });
      if(!info.ok) throw new Error('Could not read cur from page');
      await page.evaluate(a=> document.getElementById('inputDisplay').innerText = a, info.answer);
      await page.click('button:has-text("✓ 檢查答案")');
      await page.waitForTimeout(200);
      const ok = await page.$eval('#msg', el=> el.innerText.includes('✓'));
      if(!ok){
        const q = await page.$eval('#qtext', el=> el.innerText);
        const msg = await page.$eval('#msg', el=> el.innerText);
        throw new Error(`Fail at round ${i+1}: q="${q}", expected input="${info.answer}", msg="${msg}"`);
      }
    }
    console.log('PASS: MixOpsPercent smoke (10 rounds)');
    await browser.close();
    process.exit(0);
  }catch(e){
    console.error('TEST FAILED:', e.message);
    await browser.close();
    process.exit(2);
  }
})();
