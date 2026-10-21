(function () {
    'use strict';

    function makeSeed() {
        if (window.crypto && window.crypto.getRandomValues) {
            const value = new Uint32Array(1);
            window.crypto.getRandomValues(value);
            return value[0].toString(16).padStart(8, '0');
        }
        return Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
    }

    function normalizeSeed(seed) {
        return String(seed || '').replace(/[^a-z0-9]/gi, '').slice(0, 8) || makeSeed();
    }

    function seededRandom(seed) {
        let state = 2166136261;
        for (let i = 0; i < seed.length; i += 1) {
            state ^= seed.charCodeAt(i);
            state = Math.imul(state, 16777619);
        }
        if (state === 0) state = 0x6d2b79f5;
        return function () {
            state += 0x6d2b79f5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }

    function getSeedFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return normalizeSeed(params.get('seed'));
    }

    function saveSeedToUrl(seed) {
        const url = new URL(window.location.href);
        url.searchParams.set('seed', seed);
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
        });
    }

    function createQr(container, label, url) {
        const code = qrcode(0, 'M');
        code.addData(url, 'Byte');
        code.make();
        const svg = code.createSvgTag({ cellSize: 3, margin: 4, scalable: true, title: label });
        container.innerHTML = '<a class="qr-link" href="' + escapeHtml(url) + '" aria-label="' + escapeHtml(label) + '">' + svg + '</a>';
    }

    function waitForMathJax() {
        return new Promise(function (resolve, reject) {
            const deadline = Date.now() + 15000;
            function check() {
                if (window.MathJax && window.MathJax.typesetPromise && window.MathJax.startup) {
                    Promise.resolve(window.MathJax.startup.promise).then(resolve, reject);
                    return;
                }
                if (Date.now() >= deadline) {
                    reject(new Error('MathJax 未能載入'));
                    return;
                }
                window.setTimeout(check, 100);
            }
            check();
        });
    }

    function questionPageMarkup(title, seed, questions, firstPage, startNumber) {
        let markup = '<section class="sheet-page question-page">';
        markup += '<header class="sheet-header"><div><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(window.WORKSHEET_CONFIG.instruction) + '</p></div>';
        markup += '<div class="seed-chip">短代碼 <strong>' + escapeHtml(seed) + '</strong></div></header>';
        markup += '<div class="student-fields"><span>班別：________________</span><span>姓名：________________</span><span>日期：________________</span></div>';
        if (firstPage) {
            markup += '<div class="qr-pair"><div class="qr-box"><div><strong>課題套件</strong><small>掃描重溫例題與重點</small></div><div class="qr-image" data-qr-kind="suite"></div></div>';
            markup += '<div class="qr-box"><div><strong>線上練習</strong><small>掃描開啟互動練習</small></div><div class="qr-image" data-qr-kind="practice"></div></div></div>';
        } else {
            markup += '<p class="continuation">工作紙（續）</p>';
        }
        markup += '<div class="question-list">';
        questions.forEach(function (question, index) {
            markup += '<article class="question-item"><div class="question-line"><span class="question-number">' + (startNumber + index) + '.</span><div class="question-content"><div class="question-math">\\(' + question.questionLatex + '\\)</div>';
            if (question.targetLatex) markup += '<div class="question-target">把主項變換為 \\(' + escapeHtml(question.targetLatex) + '\\)</div>';
            markup += '</div></div><div class="work-lines" aria-hidden="true"><span></span><span></span></div></article>';
        });
        markup += '</div><footer class="sheet-footer">中四基礎課題溫習 · ' + escapeHtml(title) + '</footer></section>';
        return markup;
    }

    function answerPageMarkup(title, seed, questions) {
        let markup = '<section class="sheet-page answer-page"><header class="sheet-header"><div><h1>' + escapeHtml(title) + ' · 答案</h1><p>只列最終答案</p></div>';
        markup += '<div class="seed-chip">短代碼 <strong>' + escapeHtml(seed) + '</strong></div></header><ol class="answer-list">';
        questions.forEach(function (question) {
            markup += '<li><span class="answer-number">' + question.number + '.</span><div class="answer-math">\\(' + question.answerLatex + '\\)</div></li>';
        });
        markup += '</ol><footer class="sheet-footer">中四基礎課題溫習 · ' + escapeHtml(title) + '</footer></section>';
        return markup;
    }

    function renderWorksheet(seed) {
        const config = window.WORKSHEET_CONFIG;
        const logic = window.WORKSHEET_LOGIC;
        const questions = logic.generateWorksheet(seed);
        questions.forEach(function (question, index) { question.number = index + 1; });
        const firstFive = questions.slice(0, 5);
        const secondFive = questions.slice(5, 10);
        const pages = document.getElementById('worksheet-pages');
        const answers = document.getElementById('answer-page');
        pages.innerHTML = questionPageMarkup(config.title, seed, firstFive, true, 1) + questionPageMarkup(config.title, seed, secondFive, false, 6);
        answers.innerHTML = answerPageMarkup(config.title, seed, questions);
        document.querySelectorAll('[data-qr-kind="suite"]').forEach(function (node) { createQr(node, '課題套件 QR code', config.suiteUrl); });
        document.querySelectorAll('[data-qr-kind="practice"]').forEach(function (node) { createQr(node, '線上練習 QR code', config.practiceUrl); });
        saveSeedToUrl(seed);
        document.getElementById('seed-display').textContent = seed;
        document.getElementById('status').textContent = '';
        return waitForMathJax()
            .then(function () {
                window.MathJax.typesetClear([pages, answers]);
                return window.MathJax.typesetPromise([pages, answers]);
            })
            .then(function () {
                document.getElementById('print-button').disabled = false;
                document.getElementById('status').textContent = '數式排版完成。';
                return questions;
            })
            .catch(function (error) {
                document.getElementById('print-button').disabled = true;
                document.getElementById('status').textContent = '數式排版未完成，請確認網絡連線後重新整理。';
                console.error(error);
                throw error;
            });
    }

    function start() {
        const seed = getSeedFromUrl();
        document.getElementById('include-answers').addEventListener('change', function (event) {
            document.getElementById('answer-page').classList.toggle('answers-hidden', !event.target.checked);
        });
        document.getElementById('new-questions').addEventListener('click', function () {
            let nextSeed = makeSeed();
            if (nextSeed === seed) nextSeed = (parseInt(nextSeed, 16) + 1).toString(16).padStart(8, '0');
            window.location.search = '?seed=' + encodeURIComponent(nextSeed);
        });
        document.getElementById('print-button').addEventListener('click', function () {
            const button = this;
            button.disabled = true;
            const mathPages = [document.getElementById('worksheet-pages'), document.getElementById('answer-page')];
            waitForMathJax()
                .then(function () {
                    window.MathJax.typesetClear(mathPages);
                    return window.MathJax.typesetPromise(mathPages);
                })
                .then(function () { return document.fonts ? document.fonts.ready : Promise.resolve(); })
                .then(function () {
                    const containers = document.querySelectorAll('#worksheet-pages mjx-container, #answer-page mjx-container');
                    if (!containers.length || Array.from(containers).some(function (container) { return !container.querySelector('svg'); })) {
                        throw new Error('MathJax SVG 未能完成排版');
                    }
                })
                .then(function () { window.print(); })
                .catch(function (error) {
                    document.getElementById('status').textContent = '數式或字型尚未就緒，未能列印；請確認連線後重新整理。';
                    console.error(error);
                })
                .finally(function () { button.disabled = false; });
        });
        document.getElementById('answer-page').classList.toggle('answers-hidden', !document.getElementById('include-answers').checked);
        renderWorksheet(seed);
    }

    window.WorksheetTools = { makeSeed: makeSeed, normalizeSeed: normalizeSeed, seededRandom: seededRandom };
    window.addEventListener('DOMContentLoaded', start);
}());
