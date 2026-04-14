// HKDSE P2 Step2 Playwright Test
// Tests: page rendering + check-answer flow
const { chromium } = require('playwright-chromium');
const path = require('path');
const fs = require('fs');

// Seeded random (LCG) for deterministic sampling
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Load JSON data
const DATA_FILE = '/Users/zachli/ai-learning/hkdse/pages/p2_latex_ocr_results.json';
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const allKeys = Object.keys(data);
console.log('Total questions in JSON:', allKeys.length);

// Deterministic sampling: 20 questions, stratified across range
const SEED = 20260412;
const SAMPLE_SIZE = 20;
const rng = seededRandom(SEED);

// Sort keys numerically (by year then qNum) for stratified sampling
const sortedKeys = [...allKeys].sort((a, b) => {
  const qa = data[a], qb = data[b];
  if (qa.year !== qb.year) return qa.year - qb.year;
  return qa.qNum - qb.qNum;
});

// Simple random sampling without replacement using seeded rng
const sampled = [];
const available = [...sortedKeys];
for (let i = 0; i < SAMPLE_SIZE && available.length > 0; i++) {
  const idx = Math.floor(rng() * available.length);
  sampled.push(available.splice(idx, 1)[0]);
}

console.log('Sampled question IDs:', sampled);

// Map question id -> index in filteredQuestions (after page loads)
// Since page loads ALL questions (no filter), the index = position in sortedKeys
const idToIndex = {};
sortedKeys.forEach((k, i) => { idToIndex[k] = i; });

async function runTest() {
  const results = [];
  const consoleErrors = [];
  const warnings = [];

  // Start local HTTP server
  const httpServer = require('http');
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
  };

  const server = httpServer.createServer((req, res) => {
    let filePath = '/Users/zachli/ai-learning/hkdse' + req.url.split('?')[0];
    if (filePath.endsWith('/')) filePath += 'index.html';
    const ext = path.extname(filePath);
    const ct = mimeTypes[ext] || 'text/plain';
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found: ' + req.url);
      } else {
        res.writeHead(200, { 'Content-Type': ct });
        res.end(content);
      }
    });
  });

  await new Promise(resolve => server.listen(18898, resolve));
  console.log('Server started on http://localhost:18898');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push({ text: 'PAGE ERROR: ' + err.message, stack: err.stack });
  });

  try {
    // Load the page
    await page.goto('http://localhost:18898/dse-practice-p2.html', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for questions to render (loading spinner gone)
    await page.waitForSelector('.question', { timeout: 30000 });
    await page.waitForFunction(() => {
      const container = document.getElementById('questionsContainer');
      return container && !container.querySelector('.loading');
    }, { timeout: 30000 });

    // Wait for MathJax to finish typesetting
    try {
      await page.waitForFunction(() => {
        return window.MathJax && window.MathJax.typesetPromise && !document.querySelector('.loading-spinner');
      }, { timeout: 20000 });
      // Give MathJax extra time
      await page.waitForTimeout(3000);
    } catch(e) {
      warnings.push('MathJax did not finish typesetting in time: ' + e.message);
    }

    console.log('Page loaded successfully, questions rendered');

    // Verify filteredQuestions is populated
    const totalQuestions = await page.evaluate(() => {
      return typeof filteredQuestions !== 'undefined' ? filteredQuestions.length : -1;
    });
    console.log('filteredQuestions length on page:', totalQuestions);

    // Process each sampled question
    for (const qid of sampled) {
      const jsonQ = data[qid];
      const idx = idToIndex[qid];
      const result = {
        question_id: qid,
        index: idx,
        json_text_snippet: (jsonQ.question || '').substring(0, 120),
        page_text_snippet: '',
        match_boolean: false,
        console_errors: [],
        check_answer_result: 'untested'
      };

      try {
        // Navigate to the question by scrolling to it
        const questionSelector = `.question[data-id="${qid}"]`;
        const el = await page.$(questionSelector);
        if (!el) {
          result.check_answer_result = 'FAIL: question div not found on page';
          results.push(result);
          continue;
        }
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Capture page question text
        const pageQText = await page.$eval(questionSelector + ' .question-text', el => el.innerText).catch(() => '');
        result.page_text_snippet = pageQText.substring(0, 120);

        // Normalize for comparison (remove whitespace differences)
        const jsonNorm = (jsonQ.question || '').replace(/\s+/g, ' ').trim();
        const pageNorm = pageQText.replace(/\s+/g, ' ').trim();
        result.match_boolean = jsonNorm === pageNorm || pageNorm.includes(jsonNorm.substring(0, 30));

        // Check answer is present
        const answer = jsonQ.answer;
        if (!answer) {
          result.check_answer_result = 'WARN: no answer in JSON for this question';
          result.console_errors = consoleErrors.slice(-5);
          results.push(result);
          continue;
        }

        // Click the correct option
        const optionSelector = `${questionSelector} .option[data-value="${answer}"]`;
        const optEl = await page.$(optionSelector);
        if (!optEl) {
          result.check_answer_result = `FAIL: option ${answer} not found`;
          result.console_errors = consoleErrors.slice(-5);
          results.push(result);
          continue;
        }
        await optEl.click();
        await page.waitForTimeout(300);

        // Click checkAnswers button
        await page.click('.check-btn');
        await page.waitForTimeout(500);

        // Verify the option is marked correct
        const isCorrect = await page.$eval(optionSelector, el => el.classList.contains('correct')).catch(() => false);

        // Verify the score display updated
        const scoreText = await page.$eval('#scoreDisplay', el => el.innerText).catch(() => '');

        if (isCorrect) {
          result.check_answer_result = 'PASS: correct answer highlighted';
        } else {
          result.check_answer_result = 'FAIL: correct answer not highlighted after check';
        }

        // Deselect for next question (click another option to reset)
        const otherOption = answer === 'A' ? 'B' : 'A';
        const otherEl = await page.$(`${questionSelector} .option[data-value="${otherOption}"]`);
        if (otherEl) {
          await otherEl.click();
          await page.waitForTimeout(200);
          // Re-click check to reset display
          await page.click('.check-btn');
          await page.waitForTimeout(300);
        }

      } catch(e) {
        result.check_answer_result = 'ERROR: ' + e.message;
      }

      result.console_errors = consoleErrors.slice(-5);
      results.push(result);
    }

  } finally {
    await browser.close();
    server.close();
    console.log('Server stopped');
  }

  // Write outputs
  const report = {
    test_date: new Date().toISOString(),
    json_file: DATA_FILE,
    page_file: '/Users/zachli/ai-learning/hkdse/dse-practice-p2.html',
    seed: SEED,
    sample_size: SAMPLE_SIZE,
    total_questions: allKeys.length,
    sampled_ids: sampled,
    results: results,
    console_errors: consoleErrors
  };

  const reportPath = '/Users/zachli/ai-learning/logs/playwright_report_20260412.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('Report written to', reportPath);

  // Summary
  const failures = results.filter(r => r.check_answer_result.startsWith('FAIL') || r.check_answer_result.startsWith('ERROR'));
  const passes = results.filter(r => r.check_answer_result.startsWith('PASS'));
  const warns = results.filter(r => r.check_answer_result.startsWith('WARN'));

  const summaryMd = `# HKDSE P2 Playwright Test Summary\n\n**Date:** ${new Date().toLocaleString('zh-HK')}\n**Page:** dse-practice-p2.html\n**JSON:** p2_latex_ocr_results.json\n**Seed:** ${SEED}\n**Sample:** ${SAMPLE_SIZE} questions\n\n## Results\n\n| Status | Count |\n|--------|-------|\n| PASS   | ${passes.length} |\n| WARN   | ${warns.length} |\n| FAIL   | ${failures.length} |\n\n## Console Errors (${consoleErrors.length})\n\n${consoleErrors.length > 0 ? consoleErrors.map(e => `- ${e.text}`).join('\n') : '_None_'}\n\n## Per-Question Results\n\n| # | Question ID | Index | Text Match | Check Result |\n|---|-------------|-------|------------|-------------|\n${results.map((r, i) => {
  const match = r.match_boolean ? '✅' : '❌';
  const status = r.check_answer_result.startsWith('PASS') ? '✅ PASS' : r.check_answer_result.startsWith('WARN') ? '⚠️ WARN' : '❌ FAIL';
  return `| ${i+1} | ${r.question_id} | ${r.index} | ${match} | ${status} |`;
}).join('\n')}\n\n## Warnings\n\n${warnings.length > 0 ? warnings.map(w => `- ${w}`).join('\n') : '_None_'}\n`;

  const summaryMdPath = '/Users/zachli/ai-learning/logs/playwright_summary_20260412.md';
  fs.writeFileSync(summaryMdPath, summaryMd);
  console.log('Summary written to', summaryMdPath);

  const step2Summary = {
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    processed: SAMPLE_SIZE,
    failures: failures.length,
    warnings: warns.length + warnings.length,
    report_file: reportPath,
    summary_file: summaryMdPath
  };

  const step2Path = '/Users/zachli/ai-learning/logs/hkdse_p2_step2_summary.json';
  fs.writeFileSync(step2Path, JSON.stringify(step2Summary, null, 2));
  console.log('Step2 summary written to', step2Path);

  console.log('\n=== FINAL STATUS ===');
  console.log('Failures:', failures.length, '/', SAMPLE_SIZE);
  if (failures.length > 0) {
    failures.forEach(f => console.log('  FAIL:', f.question_id, f.check_answer_result));
  }
}

runTest().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
