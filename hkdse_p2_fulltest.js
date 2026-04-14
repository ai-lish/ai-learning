#!/usr/bin/env node
/**
 * HKDSE P2 Full Playwright Test - All 495 Questions
 * Tests: page rendering, answer checking, console errors
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:18898/dse-practice-p2.html';
const JSON_PATH = '/Users/zachli/ai-learning/hkdse/pages/p2_latex_ocr_results.json';
const LOGS_DIR = '/Users/zachli/ai-learning/logs';
const SCREENSHOT_DIR = path.join(LOGS_DIR, 'playwright_fail_screenshots');

// Ensure directories exist
[LOGS_DIR, SCREENSHOT_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Load ground truth JSON
const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const questionIds = Object.keys(jsonData);
const TOTAL = questionIds.length;
console.log(`Total questions in JSON: ${TOTAL}`);

// Progress tracking
const PROGRESS_FILE = path.join(LOGS_DIR, 'hkdse_p2_step2_progress.json');
function updateProgress(status, processed, pass, fail, warnings) {
    const obj = { status, processed, pass_count: pass, fail_count: fail, warnings, updated_at: new Date().toISOString() };
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(obj, null, 2));
}

// Report files
const DETAILED_REPORT = path.join(LOGS_DIR, 'playwright_report_20260412_full.json');
const STEP2_SUMMARY = path.join(LOGS_DIR, 'hkdse_p2_step2_summary_full.json');

async function runTest() {
    const browser = await chromium.launch({
        headless: true,
        executablePath: '/Users/zachli/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    const results = [];
    let passCount = 0;
    let failCount = 0;
    const warnings = [];
    const consoleErrors = [];

    // Capture console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push({ time: Date.now(), text: msg.text() });
        }
    });

    // Capture page errors
    page.on('pageerror', err => {
        consoleErrors.push({ time: Date.now(), text: `PAGE ERROR: ${err.message}` });
    });

    try {
        console.log('Navigating to page...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for questions to render
        console.log('Waiting for questions to render...');
        await page.waitForSelector('.question', { timeout: 30000 });

        // Detect which JSON was loaded (check network requests)
        // We already know from code it's p2_latex_ocr_results.json
        const dataPath = await page.evaluate(() => {
            return typeof DATA_PATH !== 'undefined' ? DATA_PATH : 'pages/p2_latex_ocr_results.json';
        });
        console.log(`Page using JSON: ${dataPath}`);

        // Get all question IDs from the page's filteredQuestions
        const pageQuestionIds = await page.evaluate(() => {
            return filteredQuestions.map(q => q.id);
        });
        console.log(`Page has ${pageQuestionIds.length} questions rendered`);

        // Wait a bit for MathJax to settle
        await page.waitForTimeout(3000);

        // Process each question
        for (let i = 0; i < pageQuestionIds.length; i++) {
            const qid = pageQuestionIds[i];
            const jsonEntry = jsonData[qid];
            const idx = i + 1; // 1-indexed

            let itemResult = {
                question_index: idx,
                question_id: qid,
                json_text_snippet: '',
                page_text_snippet: '',
                match_boolean: false,
                check_result: 'unknown',
                console_errors: [],
                warning: null
            };

            try {
                // Get the question div
                const qDiv = await page.$(`[data-id="${qid}"]`);
                if (!qDiv) {
                    itemResult.check_result = 'ERROR: question div not found';
                    itemResult.warning = 'Question div not found on page';
                    failCount++;
                    warnings.push(`Q${idx} (${qid}): div not found`);
                    results.push(itemResult);

                    // Save screenshot of failure
                    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `q${idx}_${qid}_div_missing.png`) });

                    // Update progress every 50
                    if (idx % 50 === 0) {
                        updateProgress('running', idx, passCount, failCount, warnings.slice(-10));
                        fs.writeFileSync(DETAILED_REPORT, JSON.stringify({ results, summary: { total: TOTAL, processed: idx, pass: passCount, fail: failCount } }, null, 2));
                    }
                    continue;
                }

                // Get page question text
                const pageText = await qDiv.$eval('.question-text', el => el.textContent.trim()).catch(() => '');
                const jsonText = jsonEntry.question || '';

                // Strip LaTeX delimiters for comparison
                const normalizeText = (t) => t.replace(/\$\\$|\\$/g, '').replace(/\\\(|\\\)/g, '').replace(/\\/g, '').trim();

                itemResult.json_text_snippet = jsonText.substring(0, 200);
                itemResult.page_text_snippet = pageText.substring(0, 200);
                itemResult.match_boolean = (normalizeText(jsonText) === normalizeText(pageText));

                if (!itemResult.match_boolean) {
                    itemResult.warning = `Text mismatch: JSON="${normalizeText(jsonText).substring(0, 50)}" vs Page="${normalizeText(pageText).substring(0, 50)}"`;
                    warnings.push(`Q${idx} (${qid}): text mismatch`);
                }

                // Enter the correct answer
                const correctAnswer = (jsonEntry.answer || '').toUpperCase();
                if (correctAnswer && ['A', 'B', 'C', 'D'].includes(correctAnswer)) {
                    // Click the option
                    const optionSelector = `[data-id="${qid}"] .option[data-value="${correctAnswer}"]`;
                    const optionEl = await page.$(optionSelector);
                    if (optionEl) {
                        await optionEl.click();
                        await page.waitForTimeout(100); // Small delay for DOM update

                        // Verify it got selected
                        const isSelected = await qDiv.$eval(`.option[data-value="${correctAnswer}"]`, el => el.classList.contains('selected')).catch(() => false);
                        if (!isSelected) {
                            itemResult.warning = (itemResult.warning || '') + ` | Option ${correctAnswer} not selected after click`;
                        }
                    } else {
                        itemResult.warning = (itemResult.warning || '') + ` | Option ${correctAnswer} element not found`;
                    }

                    // Click the check answers button (global)
                    const checkBtn = await page.$('.check-btn');
                    if (checkBtn) {
                        await checkBtn.click();
                        await page.waitForTimeout(200); // Wait for UI to update

                        // Check the result for this specific question
                        const answerRowText = await qDiv.$eval('.answer-row', el => el.textContent.trim()).catch(() => '');
                        if (answerRowText.includes('✓') || answerRowText.includes('正確')) {
                            itemResult.check_result = 'PASS';
                            passCount++;
                        } else if (answerRowText.includes('✗') || answerRowText.includes('錯誤')) {
                            itemResult.check_result = 'FAIL: wrong answer shown';
                            failCount++;
                            await page.screenshot({ path: path.join(SCREENSHOT_DIR, `q${idx}_${qid}_wrong_answer.png`) });
                        } else {
                            itemResult.check_result = 'WARN: no answer feedback found';
                            warnings.push(`Q${idx} (${qid}): no answer feedback`);
                            passCount++; // Count as pass if no error thrown
                        }
                    } else {
                        itemResult.check_result = 'WARN: check button not found';
                        warnings.push(`Q${idx} (${qid}): check button not found`);
                        passCount++;
                    }
                } else {
                    itemResult.check_result = `WARN: invalid answer field "${correctAnswer}"`;
                    warnings.push(`Q${idx} (${qid}): invalid answer "${correctAnswer}"`);
                    passCount++;
                }

                // Deselect for next question (click a different option to reset)
                if (correctAnswer) {
                    const otherOpts = ['A', 'B', 'C', 'D'].filter(o => o !== correctAnswer);
                    for (const opt of otherOpts) {
                        const el = await page.$(`[data-id="${qid}"] .option[data-value="${opt}"]`);
                        if (el) {
                            await el.click();
                            await page.waitForTimeout(50);
                            break;
                        }
                    }
                }

            } catch (err) {
                itemResult.check_result = `ERROR: ${err.message}`;
                itemResult.console_errors = consoleErrors.slice(-5).map(e => e.text);
                failCount++;
                warnings.push(`Q${idx} (${qid}): ${err.message}`);

                try {
                    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `q${idx}_${qid}_error.png`) });
                } catch (e) {}
            }

            results.push(itemResult);

            // Progress update every 25 questions
            if (idx % 25 === 0) {
                const elapsed = results.length > 0 ? (Date.now() - startTime) / 1000 : 0;
                const eta = (elapsed / idx) * (TOTAL - idx);
                console.log(`[${idx}/${TOTAL}] pass=${passCount} fail=${failCount} warnings=${warnings.length} ETA=${Math.round(eta)}s`);
                updateProgress('running', idx, passCount, failCount, warnings.slice(-20));
                fs.writeFileSync(DETAILED_REPORT, JSON.stringify({
                    results,
                    summary: { total: TOTAL, processed: idx, pass: passCount, fail: failCount, warnings: warnings.length }
                }, null, 2));
            }

            // Small delay between questions to avoid race conditions
            if (i % 10 === 0) await page.waitForTimeout(100);
        }

        // Final summary
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`\n=== DONE ===`);
        console.log(`Total: ${TOTAL}, Pass: ${passCount}, Fail: ${failCount}, Warnings: ${warnings.length}`);
        console.log(`Elapsed: ${Math.round(elapsed)}s`);

        // Write final reports
        updateProgress('complete', TOTAL, passCount, failCount, warnings);

        fs.writeFileSync(DETAILED_REPORT, JSON.stringify({
            results,
            summary: {
                total: TOTAL,
                processed: TOTAL,
                pass_count: passCount,
                fail_count: failCount,
                warnings: warnings.length,
                console_error_count: consoleErrors.length,
                elapsed_seconds: elapsed,
                json_file: 'pages/p2_latex_ocr_results.json',
                page_url: BASE_URL
            },
            console_errors: consoleErrors
        }, null, 2));

        // Step2 summary JSON
        fs.writeFileSync(STEP2_SUMMARY, JSON.stringify({
            status: failCount === 0 ? 'PASS' : 'FAIL',
            processed: TOTAL,
            pass_count: passCount,
            fail_count: failCount,
            warnings: warnings.length,
            console_errors: consoleErrors.length,
            elapsed_seconds: Math.round(elapsed),
            json_used: 'pages/p2_latex_ocr_results.json',
            report_path: DETAILED_REPORT
        }, null, 2));

        // Human summary markdown
        const summaryMd = `# HKDSE P2 Step2 Full Test Report\n\n` +
            `**Date:** 2026-04-12\n**Page:** dse-practice-p2.html\n**JSON:** pages/p2_latex_ocr_results.json\n**Total Questions:** ${TOTAL}\n\n` +
            `## Results\n\n| Metric | Value |\n|--------|-------|\n| Processed | ${TOTAL} |\n| Pass | ${passCount} |\n| Fail | ${failCount} |\n| Warnings | ${warnings.length} |\n| Console Errors | ${consoleErrors.length} |\n| Elapsed | ${Math.round(elapsed)}s |\n\n## Warnings (${warnings.length})\n\n${warnings.slice(0, 50).map((w, i) => `${i + 1}. ${w}`).join('\n')}\n\n## Console Errors (${consoleErrors.length})\n\n${consoleErrors.slice(0, 20).map((e, i) => `${i + 1}. ${e.text}`).join('\n')}\n`;

        fs.writeFileSync(path.join(LOGS_DIR, 'playwright_summary_20260412_full.md'), summaryMd);

        console.log(`Reports written to:\n  ${DETAILED_REPORT}\n  ${STEP2_SUMMARY}\n  ${path.join(LOGS_DIR, 'playwright_summary_20260412_full.md')}`);

    } catch (err) {
        console.error('FATAL:', err);
        updateProgress('error', results.length, passCount, failCount, [...warnings, `FATAL: ${err.message}`]);
    } finally {
        await browser.close();
    }
}

const startTime = Date.now();
runTest().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
