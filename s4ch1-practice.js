(function () {
  "use strict";

  const APP = { id: "s4ch1-quadratic-equations", label: "一元二次方程練習" };
  const KEY = APP.id + ".records.v1";
  const BUNDLE = window.AssessmentsS4Ch1QuestionBundle;
  const $ = (id) => document.getElementById(id);
  const MODE_LABEL = {
    expand: "展開及化簡為一般式",
    sqrt: "平方根法求根",
    factor: "因式分解法求根",
    formula: "二次公式法求根",
    calculator: "計算機法實戰",
    mixed: "綜合考核練習"
  };
  const TOPIC_LABEL = {
    expand: "展開為一般式",
    sqrt: "平方根法",
    factor: "因式分解法",
    formula: "二次公式法",
    calculator: "計算機法"
  };
  const state = {
    mode: "expand",
    difficulty: "basic",
    round: 1,
    total: 10,
    score: 0,
    stepCorrect: 0,
    correct: 0,
    wrong: 0,
    attempted: 0,
    question: null,
    step: 0,
    answers: [],
    firstAttempts: [],
    skipped: false,
    answered: false,
    session: null,
    lastTemplate: "",
    lastResult: null
  };
  let memory = null;
  let learner = "";

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function typeset(node) {
    if (window.MathJax && window.MathJax.typesetPromise) {
      if (window.MathJax.typesetClear) {
        try { window.MathJax.typesetClear([node]); } catch (error) { /* MathJax may not have seen this node. */ }
      }
      return window.MathJax.typesetPromise([node]).catch(() => {});
    }
    return Promise.resolve();
  }

  function mathInline(raw) {
    let value = escapeHtml(raw).replace(/−/g, "-").replace(/×/g, "\\times ").replace(/÷/g, "\\div ");
    value = value.replace(/sqrt\(([^()]*)\)/g, "\\sqrt{$1}").replace(/√\s*([0-9]+)/g, "\\sqrt{$1}");
    value = value.replace(/x\^2/g, "x^2").replace(/\^([0-9]+)/g, "^{$1}");
    return "\\(" + value + "\\)";
  }

  function renderMathText(raw) {
    const text = String(raw == null ? "" : raw);
    const token = /\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g;
    let output = "";
    let last = 0;
    let match;
    while ((match = token.exec(text))) {
      output += escapeHtml(text.slice(last, match.index)) + match[0];
      last = match.index + match[0].length;
    }
    return output + escapeHtml(text.slice(last));
  }

  function mathOutput(raw) {
    const text = String(raw == null ? "" : raw);
    const wrapped = /\\\(|\\\[/.test(text) ? text : "\\(" + text + "\\)";
    return renderMathText(wrapped);
  }

  function loadLearner() {
    try { learner = localStorage.getItem(APP.id + ".learner") || ""; } catch (error) { learner = ""; }
    if (!learner) {
      learner = "LOCAL-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      try { localStorage.setItem(APP.id + ".learner", learner); } catch (error) { /* local records are optional. */ }
    }
    try { learner = localStorage.getItem(APP.id + ".student") || learner; } catch (error) { /* use generated local id. */ }
  }

  function generateQuestion() {
    const question = BUNDLE.createQuestion({ mode: state.mode, difficulty: state.difficulty, excludeId: state.lastTemplate });
    state.lastTemplate = question.id;
    return question;
  }

  function makeKeypad() {
    const keys = [
      ["7", ""], ["8", ""], ["9", ""], ["+", "op"], ["-", "op"], ["DEL", "danger"],
      ["4", ""], ["5", ""], ["6", ""], ["x", "special"], ["x^2", "special"], ["=", "op"],
      ["1", ""], ["2", ""], ["3", ""], ["0", ""], ["(", "op"], [")", "op"],
      ["/", "op"], ["+-", "special"], ["sqrt(", "special"], ["i", "special"], ["或", "special"], ["C", "danger"]
    ];
    $("keypad").innerHTML = keys.map((item) => "<button class=\"key " + item[1] + "\" type=\"button\" data-key=\"" + escapeHtml(item[0]) + "\">" + (item[0] === "DEL" ? "⌫" : item[0] === "C" ? "C" : item[0] === "+-" ? "±" : item[0] === "sqrt(" ? "√" : item[0]) + "</button>").join("");
  }

  function setPreview() {
    const value = $("answer-input").value;
    $("preview").innerHTML = value ? "預覽：" + mathInline(value) : "";
    if (value) typeset($("preview"));
  }

  function insertValue(value) {
    const input = $("answer-input");
    const start = input.selectionStart == null ? input.value.length : input.selectionStart;
    const end = input.selectionEnd == null ? input.value.length : input.selectionEnd;
    input.value = input.value.slice(0, start) + value + input.value.slice(end);
    const position = start + value.length;
    input.focus();
    input.setSelectionRange(position, position);
    setPreview();
  }

  function clearInput() {
    const input = $("answer-input");
    input.value = "";
    input.focus();
    setPreview();
  }

  function renderQuestion() {
    const question = state.question;
    if (!question) return;
    $("mode-title").textContent = question.title;
    $("topic-label").textContent = TOPIC_LABEL[question.mode] || question.title;
    $("round-label").textContent = "第 " + state.round + " / " + state.total + " 題";
    $("instruction").innerHTML = question.instruction;
    $("expression").innerHTML = "\\[" + question.expression + "\\]";
    const step = question.steps[state.step];
    $("step-label").textContent = "步驟 " + (state.step + 1) + "/" + question.steps.length;
    $("input-label").textContent = step.label;
    $("hint").textContent = step.hint;
    $("answer-input").value = "";
    $("answer-input").placeholder = step.hint;
    $("answer-input").classList.remove("correct", "error");
    $("preview").textContent = "";
    $("skip-btn").hidden = question.steps.length === 1 || state.answered;
    $("check-btn").hidden = state.answered;
    $("retry-btn").hidden = !state.answered;
    $("next-btn").hidden = !state.answered;
    $("feedback").hidden = true;
    $("feedback").innerHTML = "";
    makeKeypad();
    typeset($("instruction"));
    typeset($("expression"));
  }

  function updateStats() {
    $("score").textContent = String(state.score);
    $("steps-correct").textContent = String(state.stepCorrect);
    $("answer-correct").textContent = String(state.correct);
    $("accuracy").textContent = state.attempted ? Math.round(state.correct / state.attempted * 100) + "%" : "—";
  }

  function startSession() {
    state.session = {
      id: "practice-" + Date.now(),
      kind: "practice",
      tool: APP.label,
      learnerId: learner,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      total: state.total,
      score: 0,
      stepCorrect: 0,
      correct: 0,
      wrong: 0,
      attempted: 0,
      answers: []
    };
  }

  function persist(done) {
    if (!state.session || !state.session.attempted) return;
    if (done) state.session.finishedAt = state.session.finishedAt || new Date().toISOString();
    state.session.total = state.total;
    state.session.score = state.score;
    state.session.stepCorrect = state.stepCorrect;
    state.session.correct = state.correct;
    state.session.wrong = state.wrong;
    saveEntry("sessions", JSON.parse(JSON.stringify(state.session)));
  }

  function newQuestion() {
    state.question = generateQuestion();
    state.step = 0;
    state.answers = [];
    state.firstAttempts = [];
    state.skipped = false;
    state.answered = false;
    state.lastResult = null;
    renderQuestion();
    updateStats();
  }

  function resetSession() {
    persist(true);
    $("completion-dialog").hidden = true;
    state.round = 1;
    state.score = 0;
    state.stepCorrect = 0;
    state.correct = 0;
    state.wrong = 0;
    state.attempted = 0;
    state.lastTemplate = "";
    startSession();
    newQuestion();
  }

  function submit() {
    if (state.answered) return;
    const input = $("answer-input").value.trim();
    if (!input) {
      showFeedback(false, "請先輸入答案。", "點擊下方虛擬鍵盤即可作答。", false);
      return;
    }
    const result = BUNDLE.checkQuestion(state.question, state.step, input);
    state.answers[state.step] = input;
    if (state.firstAttempts[state.step] === undefined) state.firstAttempts[state.step] = result.correct;
    if (state.step < state.question.steps.length - 1 && result.correct) {
      state.step += 1;
      renderQuestion();
      return;
    }
    if (state.step < state.question.steps.length - 1 && !result.correct) {
      $("answer-input").classList.add("error");
      showFeedback(false, "此步驟未通過。", result.reason || "請返回修正此步驟。", false);
      return;
    }
    finishQuestion(result);
  }

  function skipStep() {
    if (state.answered || state.question.steps.length === 1) return;
    state.skipped = true;
    state.step = state.question.steps.length - 1;
    renderQuestion();
  }

  function finishQuestion(result) {
    state.answered = true;
    state.attempted += 1;
    state.session.attempted += 1;
    const answerCorrect = !!result.correct;
    const stepsCorrect = !state.skipped && state.firstAttempts.length === state.question.steps.length && state.firstAttempts.every(Boolean);
    const both = answerCorrect && stepsCorrect;
    if (stepsCorrect) state.stepCorrect += 1;
    if (answerCorrect) state.correct += 1;
    else state.wrong += 1;
    if (both) state.score += 1;
    state.session.answers.push({
      questionId: state.question.id,
      mode: state.question.mode,
      difficulty: state.difficulty,
      input: state.answers[state.answers.length - 1] || $("answer-input").value,
      answer: state.question.answer,
      solution: state.question.solution.slice(),
      correct: answerCorrect,
      stepsCorrect,
      score: both ? 1 : 0,
      at: new Date().toISOString()
    });
    persist(false);
    state.lastResult = { answerCorrect, stepsCorrect, both };
    updateStats();
    showFinishedFeedback();
  }

  function feedbackHead(title) {
    return "<div class=\"feedback-head\"><h3>" + escapeHtml(title) + "</h3><button class=\"feedback-close\" type=\"button\" data-feedback-close>收起</button></div>";
  }

  function closeFeedback() { $("feedback").hidden = true; }

  function showFeedback(ok, title, reason) {
    const box = $("feedback");
    box.hidden = false;
    box.className = "feedback " + (ok ? "good" : "bad");
    box.innerHTML = feedbackHead(title) + "<p>" + renderMathText(reason || "") + "</p>";
    typeset(box);
  }

  function showFinishedFeedback() {
    const question = state.question;
    const result = state.lastResult;
    const title = result.both ? "✓ 步驟與答案完全正確！" : "本題未獲滿分";
    let html = feedbackHead(title) + "<p>" + (result.answerCorrect ? "最終答案正確。" : "最終答案仍需修正。") + (result.stepsCorrect ? " 中間步驟首次作答正確。" : " 中間步驟有錯誤或已跳步。") + "</p>";
    html += "<p class=\"solution\">標準步驟：<br>" + question.solution.map(mathOutput).join("<br>") + "</p><p class=\"answer\">標準答案：" + mathOutput(question.answer) + "</p>";
    const box = $("feedback");
    box.hidden = false;
    box.className = "feedback " + (result.both ? "good" : "bad");
    box.innerHTML = html;
    typeset(box);
  }

  function showCompletion() {
    $("finish-total").textContent = String(state.total);
    $("finish-score").textContent = String(state.score);
    $("finish-steps").textContent = String(state.stepCorrect);
    $("finish-answers").textContent = String(state.correct);
    $("finish-accuracy").textContent = state.attempted ? Math.round(state.correct / state.attempted * 100) + "%" : "0%";
    $("completion-dialog").hidden = false;
  }

  function closeCompletion() { $("completion-dialog").hidden = true; }

  function nextQuestion() {
    if (!state.answered) return;
    if (state.round >= state.total) {
      persist(true);
      showCompletion();
      return;
    }
    state.round += 1;
    newQuestion();
  }

  function retryQuestion() {
    if (!state.answered || !state.lastResult) return;
    state.attempted = Math.max(0, state.attempted - 1);
    state.session.attempted = Math.max(0, state.session.attempted - 1);
    if (state.lastResult.stepsCorrect) state.stepCorrect = Math.max(0, state.stepCorrect - 1);
    if (state.lastResult.answerCorrect) state.correct = Math.max(0, state.correct - 1);
    else state.wrong = Math.max(0, state.wrong - 1);
    if (state.lastResult.both) state.score = Math.max(0, state.score - 1);
    state.session.answers.pop();
    state.answered = false;
    state.step = 0;
    state.answers = [];
    state.firstAttempts = [];
    state.skipped = false;
    state.lastResult = null;
    persist(false);
    renderQuestion();
    updateStats();
  }

  function history() {
    if (memory) return memory;
    try { memory = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (error) { memory = {}; }
    memory = {
      sessions: Array.isArray(memory.sessions) ? memory.sessions : [],
      challenges: Array.isArray(memory.challenges) ? memory.challenges : []
    };
    return memory;
  }

  function saveBook(book) {
    memory = book;
    try { localStorage.setItem(KEY, JSON.stringify(book)); } catch (error) { /* records remain available in memory. */ }
    renderRecords();
    renderBoard();
  }

  function saveEntry(kind, entry) {
    const book = history();
    const list = book[kind] || [];
    const index = list.findIndex((item) => item.id === entry.id);
    if (index >= 0) list[index] = entry;
    else list.unshift(entry);
    book[kind] = list.slice(0, 80);
    saveBook(book);
  }

  function date(value) {
    try { return new Intl.DateTimeFormat("zh-HK", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); } catch (error) { return value || ""; }
  }

  function csvCell(value) { return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"'; }

  function download(name, type, text) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 800);
  }

  function exportData(kind) {
    const book = history();
    if (kind === "json") {
      download(APP.id + "-records.json", "application/json;charset=utf-8", JSON.stringify({ schema: "s4ch1-quadratic-records.v1", tool: APP.label, learnerId: learner, exportedAt: new Date().toISOString(), sessions: book.sessions, challenges: book.challenges }, null, 2));
      return;
    }
    const rows = [["kind", "tool", "learnerId", "sessionId", "startedAt", "finishedAt", "questionId", "mode", "difficulty", "input", "answer", "correct", "stepsCorrect", "score"].map(csvCell).join(",")];
    book.sessions.concat(book.challenges).forEach((entry) => {
      (entry.answers && entry.answers.length ? entry.answers : [{}]).forEach((answer) => {
        rows.push([entry.kind, entry.tool, entry.learnerId, entry.id, entry.startedAt, entry.finishedAt || "", answer.questionId || "", answer.mode || "", answer.difficulty || "", answer.input || answer.selected || "", answer.answer || "", answer.correct == null ? "" : answer.correct, answer.stepsCorrect == null ? "" : answer.stepsCorrect, answer.score == null ? entry.score : answer.score].map(csvCell).join(","));
      });
    });
    download(APP.id + "-records.csv", "text/csv;charset=utf-8", "\ufeff" + rows.join("\n"));
  }

  function activatePrint(html) {
    const target = $("print-sheet");
    const previousStyle = target.getAttribute("style");
    target.innerHTML = html;
    target.classList.add("print-active");
    target.style.display = "block";
    target.style.position = "fixed";
    target.style.left = "-100000px";
    target.style.top = "0";
    target.style.width = "1024px";
    target.style.visibility = "hidden";
    typeset(target).then(() => {
      if (previousStyle === null) target.removeAttribute("style");
      else target.setAttribute("style", previousStyle);
      setTimeout(() => window.print(), 350);
    });
  }

  function printHistory() {
    const book = history();
    const entries = book.sessions.concat(book.challenges).sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt))).slice(0, 12);
    if (!entries.length) {
      showFeedback(false, "目前沒有紀錄。", "先完成至少一題，再列印作答紀錄。", false);
      return;
    }
    let html = "<h1>S4 Ch1｜一元二次方程作答紀錄</h1><div class=\"print-meta\"><span>學習者：" + escapeHtml(learner) + "</span><span>日期：" + new Date().toLocaleDateString("zh-HK") + "</span></div>";
    entries.forEach((entry, index) => {
      html += "<div class=\"print-question\"><strong>" + (index + 1) + ". " + (entry.kind === "challenge" ? "60秒挑戰" : "逐題練習") + "</strong><br><span>開始：" + escapeHtml(date(entry.startedAt)) + "　題數：" + (entry.attempted || 0) + "　答案正確：" + (entry.correct || 0) + "　步驟全對：" + (entry.stepCorrect || 0) + "　得分：" + (entry.score || 0) + "</span>";
      if (entry.answers && entry.answers.length) {
        html += "<div>" + entry.answers.map((answer, answerIndex) => {
          const solution = Array.isArray(answer.solution) && answer.solution.length ? "<div>逐步詳解：<br>" + answer.solution.map(mathOutput).join("<br>") + "</div>" : "";
          return "<div class=\"print-answer\"><strong>第 " + (answerIndex + 1) + " 題</strong><div>你的答案：" + (answer.input ? mathOutput(answer.input) : "—") + "</div><div>標準答案：" + mathOutput(answer.answer || "—") + "</div>" + solution + "</div>";
        }).join("") + "</div>";
      }
      html += "</div>";
    });
    activatePrint(html);
  }

  function printWorksheet() {
    const savedDifficulty = state.difficulty;
    const savedTemplate = state.lastTemplate;
    const questions = [];
    for (let index = 0; index < 10; index += 1) questions.push(generateQuestion());
    state.difficulty = savedDifficulty;
    state.lastTemplate = savedTemplate;
    let html = "<h1>S4 Ch1｜一元二次方程練習工作紙</h1><div class=\"print-meta\"><span>學習者：" + escapeHtml(learner) + "</span><span>難度：" + (savedDifficulty === "basic" ? "基礎" : "進階") + "</span><span>日期：" + new Date().toLocaleDateString("zh-HK") + "</span></div><h2>題目</h2>";
    questions.forEach((question, index) => {
      html += "<div class=\"print-question\"><strong>第 " + (index + 1) + " 題（" + escapeHtml(question.title) + "）</strong><div>" + question.instruction + "</div><div class=\"print-expression\">\\[" + question.expression + "\\]</div><div>作答：________________________________________________</div></div>";
    });
    html += "<div class=\"page-break\"></div><h2>參考答案與步驟</h2>";
    questions.forEach((question, index) => {
      html += "<div class=\"print-answer\"><strong>第 " + (index + 1) + " 題：" + mathOutput(question.answer) + "</strong><div>" + question.solution.map(mathOutput).join("<br>") + "</div></div>";
    });
    activatePrint(html);
  }

  function printComprehensiveWorksheet() {
    const savedDifficulty = state.difficulty;
    const savedTemplate = state.lastTemplate;
    const modes = BUNDLE.modes.map((mode) => ({ mode, generate: () => BUNDLE.createQuestion({ mode, difficulty: state.difficulty }) }));
    let basicQuestions = [];
    let advancedQuestions = [];
    try {
      state.difficulty = "basic";
      basicQuestions = modes.map((item) => item.generate());
      state.difficulty = "advanced";
      advancedQuestions = modes.map((item) => item.generate());
    } finally {
      state.difficulty = savedDifficulty;
      state.lastTemplate = savedTemplate;
    }
    const allQuestions = basicQuestions.concat(advancedQuestions);
    const today = new Date().toLocaleDateString("zh-HK");
    function renderQuestionPage(questions, startNumber, level) {
      let page = "<h1>S4 Ch1｜一元二次方程綜合工作紙（" + level + "）</h1><div class=\"print-meta\"><span>學習者：" + escapeHtml(learner) + "</span><span>日期：" + today + "</span></div><h2>題目</h2>";
      questions.forEach((question, index) => {
        page += "<div class=\"print-question\"><strong>第 " + (startNumber + index) + " 題（" + escapeHtml(question.title) + "）</strong><div>" + question.instruction + "</div><div class=\"print-expression\">\\[" + question.expression + "\\]</div><div>作答：________________________________________________</div></div>";
      });
      return page;
    }
    let html = renderQuestionPage(basicQuestions, 1, "基礎（五個模式各 1 題）") + "<div class=\"page-break\"></div>";
    html += renderQuestionPage(advancedQuestions, 6, "進階（五個模式各 1 題）") + "<div class=\"page-break\"></div>";
    html += "<h1>S4 Ch1｜參考答案與逐步詳解</h1><div class=\"print-meta\"><span>學習者：" + escapeHtml(learner) + "</span><span>共 10 題</span><span>日期：" + today + "</span></div>";
    allQuestions.forEach((question, index) => {
      html += "<div class=\"print-answer\"><strong>第 " + (index + 1) + " 題（" + escapeHtml(question.title) + "）</strong><div>標準答案：" + mathOutput(question.answer) + "</div><div>" + question.solution.map(mathOutput).join("<br>") + "</div></div>";
    });
    activatePrint(html);
  }

  function setFullscreenState(active, fallback) {
    const app = $("app");
    const button = $("fullscreen-btn");
    app.classList.toggle("fullscreen-mode", active);
    app.classList.toggle("fullscreen-fallback", !!fallback && active);
    button.setAttribute("aria-pressed", String(active));
    button.textContent = active ? "⛶ 離開全螢幕" : "⛶ 全螢幕";
    button.title = fallback && active ? "瀏覽器不支援原生全螢幕，現正使用頁面內全螢幕版面" : "切換全螢幕作答版面";
  }

  async function toggleFullscreen() {
    const app = $("app");
    if (document.fullscreenElement === app) {
      if (document.exitFullscreen) await document.exitFullscreen();
      return;
    }
    if (app.classList.contains("fullscreen-fallback")) {
      setFullscreenState(false, false);
      return;
    }
    if (app.requestFullscreen) {
      try {
        await app.requestFullscreen();
        setFullscreenState(true, false);
      } catch (error) {
        setFullscreenState(true, true);
      }
    } else setFullscreenState(true, true);
  }

  function closePrintMenu() {
    $("print-menu").hidden = true;
    $("print-menu-btn").setAttribute("aria-expanded", "false");
  }

  function togglePrintMenu() {
    const menu = $("print-menu");
    const open = menu.hidden;
    menu.hidden = !open;
    $("print-menu-btn").setAttribute("aria-expanded", String(open));
  }

  function recordAnswerDetails(entry) {
    const answers = Array.isArray(entry.answers) ? entry.answers : [];
    if (!answers.length) return "";
    return "<details class=\"record-details\"><summary>查看答案與逐步詳解</summary>" + answers.map((answer, index) => {
      const student = answer.input ? mathOutput(answer.input) : "—";
      const solution = Array.isArray(answer.solution) && answer.solution.length ? "<div class=\"record-solution\">逐步詳解：<br>" + answer.solution.map(mathOutput).join("<br>") + "</div>" : "<div class=\"record-muted\">此舊紀錄沒有保存逐步詳解。</div>";
      return "<div class=\"record-answer\"><strong>第 " + (index + 1) + " 題 · " + (answer.correct ? "答案正確" : "答案需修正") + "</strong><div>你的答案：" + student + "</div><div>標準答案：" + mathOutput(answer.answer || "—") + "</div>" + solution + "</div>";
    }).join("") + "</details>";
  }

  function renderRecords() {
    const book = history();
    const items = book.sessions.concat(book.challenges).sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt))).slice(0, 12);
    $("record-id").textContent = "本機學習者代號：" + learner;
    $("records").innerHTML = items.length ? items.map((entry) => "<div class=\"recordrow\"><div><strong>" + (entry.kind === "challenge" ? "60秒挑戰" : "逐題練習") + "</strong><small>" + date(entry.startedAt) + " · " + (entry.attempted || 0) + " 題 · " + (entry.correct || 0) + " 對 / " + (entry.wrong || 0) + " 錯</small>" + recordAnswerDetails(entry) + "</div><strong>" + (entry.score || 0) + " 分</strong></div>").join("") : "<p class=\"empty\">尚未有完成紀錄；先回答一題，紀錄會自動保存。</p>";
    typeset($("records"));
  }

  function renderBoard() {
    const list = history().challenges.slice().sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 5);
    $("leaderboard").innerHTML = list.length ? list.map((entry, index) => "<li><span>" + (index + 1) + "</span><span>" + escapeHtml(entry.learnerId) + "<small>" + date(entry.finishedAt) + "</small></span><strong>" + (entry.score || 0) + "分</strong></li>").join("") : "<li>完成一次挑戰後，最高分會出現在這裡。</li>";
    $("leaderboard-best").textContent = list.length ? String(Math.max(...list.map((entry) => Number(entry.score) || 0))) : "0";
  }

  function challengeQuestion() {
    const question = BUNDLE.createQuestion({ mode: state.mode, difficulty: state.difficulty });
    const correct = String(question.answer).split("\\(").join("").split("\\)").join("").replace(/\$+/g, "");
    const wrong = [correct + "+1", correct.replace(/-/g, "+"), "0", "無實根"].filter((value, index, array) => array.indexOf(value) === index && value !== correct).slice(0, 3);
    const choices = [correct].concat(wrong).sort(() => Math.random() - 0.5);
    return { q: question, choices, answer: correct };
  }

  let challenge = null;
  let challengeTimer = null;
  let challengeOn = false;
  let challengeAnswered = false;
  let challengeCurrent = null;

  function renderChallenge() {
    challengeCurrent = challengeQuestion();
    challengeAnswered = false;
    $("challenge-topic").textContent = TOPIC_LABEL[challengeCurrent.q.mode];
    $("challenge-prompt").textContent = "選出正確結果：";
    $("challenge-expression").innerHTML = "\\[" + challengeCurrent.q.expression + "\\]";
    $("challenge-choices").innerHTML = challengeCurrent.choices.map((value, index) => {
      const text = escapeHtml(value);
      const isMath = /\\|[xX^√±≈=]|\d\/\d/.test(value);
      return '<button class="choice" type="button" data-choice="' + index + '">' + (isMath ? "\\(" + text + "\\)" : text) + "</button>";
    }).join("");
    typeset($("challenge-expression"));
    typeset($("challenge-choices"));
  }

  function challengeStats() {
    $("challenge-score").textContent = challenge ? challenge.score : "0";
    $("challenge-correct").textContent = challenge ? challenge.correct : "0";
    $("challenge-wrong").textContent = challenge ? challenge.wrong : "0";
    renderBoard();
  }

  function finishChallenge() {
    if (!challenge) return;
    if (challengeTimer) clearInterval(challengeTimer);
    challengeTimer = null;
    const wasActive = challengeOn;
    challengeOn = false;
    if (challenge.attempted) {
      challenge.finishedAt = new Date().toISOString();
      saveEntry("challenges", JSON.parse(JSON.stringify(challenge)));
    }
    $("challenge-choices").querySelectorAll("button").forEach((button) => { button.disabled = true; });
    $("challenge-status").className = "challenge-status " + (challenge.score >= 0 ? "good" : "bad");
    $("challenge-status").textContent = (wasActive ? "時間到！" : "挑戰已結束，") + "本次 " + challenge.score + " 分；已記入本機排行榜。";
    $("challenge-start").textContent = "再挑戰";
    challengeStats();
  }

  function startChallenge() {
    if (challengeOn) return;
    challenge = { id: "challenge-" + Date.now(), kind: "challenge", tool: APP.label, learnerId: learner, startedAt: new Date().toISOString(), finishedAt: null, score: 0, correct: 0, wrong: 0, attempted: 0, answers: [] };
    challengeOn = true;
    $("timer").textContent = "60";
    $("challenge-status").className = "challenge-status";
    $("challenge-status").textContent = "開始！答對 +1，答錯 −1；不顯示逐題解答。";
    $("challenge-start").textContent = "進行中…";
    challengeStats();
    renderChallenge();
    challengeTimer = setInterval(() => {
      const seconds = Number($("timer").textContent) - 1;
      $("timer").textContent = String(Math.max(0, seconds));
      if (seconds <= 0) finishChallenge();
    }, 1000);
  }

  function updateModeButtons() {
    $("basic-btn").classList.toggle("active", state.difficulty === "basic");
    $("advanced-btn").classList.toggle("active", state.difficulty === "advanced");
  }

  if (!BUNDLE || typeof BUNDLE.createQuestion !== "function" || typeof BUNDLE.checkQuestion !== "function") {
    document.body.textContent = "練習題目暫時無法載入，請重新整理頁面。";
    return;
  }

  loadLearner();
  const views = { practice: $("practice-view"), challenge: $("challenge-view"), guide: $("guide-view") };
  document.querySelectorAll("[data-view]").forEach((tab) => tab.addEventListener("click", () => {
    if (tab.dataset.view !== "challenge" && challengeOn) finishChallenge();
    if (tab.dataset.view !== "practice") persist(false);
    Object.keys(views).forEach((key) => { views[key].hidden = key !== tab.dataset.view; });
    document.querySelectorAll("[data-view]").forEach((item) => {
      item.classList.toggle("active", item === tab);
      item.setAttribute("aria-selected", String(item === tab));
    });
    if (tab.dataset.view === "challenge") challengeStats();
  }));
  $("mode-select").addEventListener("change", function () { state.mode = this.value; resetSession(); });
  $("basic-btn").addEventListener("click", () => { state.difficulty = "basic"; updateModeButtons(); resetSession(); });
  $("advanced-btn").addEventListener("click", () => { state.difficulty = "advanced"; updateModeButtons(); resetSession(); });
  $("reset-btn").addEventListener("click", resetSession);
  $("restart-session").addEventListener("click", resetSession);
  $("new-btn").addEventListener("click", newQuestion);
  $("check-btn").addEventListener("click", submit);
  $("skip-btn").addEventListener("click", skipStep);
  $("retry-btn").addEventListener("click", retryQuestion);
  $("next-btn").addEventListener("click", nextQuestion);
  $("clear-btn").addEventListener("click", clearInput);
  $("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button) return;
    const value = button.dataset.key;
    if (value === "DEL") {
      const input = $("answer-input");
      const position = input.selectionStart == null ? input.value.length : input.selectionStart;
      if (position > 0) {
        input.value = input.value.slice(0, position - 1) + input.value.slice(position);
        input.focus();
        input.setSelectionRange(position - 1, position - 1);
        setPreview();
      }
    } else if (value === "C") clearInput();
    else if (value === "或") insertValue(" 或 ");
    else insertValue(value);
  });
  $("feedback").addEventListener("click", (event) => { if (event.target.closest("[data-feedback-close]")) closeFeedback(); });
  $("fullscreen-btn").addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => {
    const app = $("app");
    if (document.fullscreenElement === app) setFullscreenState(true, false);
    else if (!app.classList.contains("fullscreen-fallback")) setFullscreenState(false, false);
  });
  $("print-menu-btn").addEventListener("click", (event) => { event.stopPropagation(); togglePrintMenu(); });
  document.addEventListener("click", (event) => { if (!event.target.closest(".print-menu")) closePrintMenu(); });
  $("top-print-history").addEventListener("click", () => { closePrintMenu(); printHistory(); });
  $("top-print-worksheet").addEventListener("click", () => { closePrintMenu(); printWorksheet(); });
  $("top-print-comprehensive").addEventListener("click", () => { closePrintMenu(); printComprehensiveWorksheet(); });
  $("challenge-start").addEventListener("click", startChallenge);
  $("challenge-stop").addEventListener("click", finishChallenge);
  $("challenge-choices").addEventListener("click", (event) => {
    const button = event.target.closest("[data-choice]");
    if (!button || !challengeOn || challengeAnswered) return;
    challengeAnswered = true;
    const selected = challengeCurrent.choices[Number(button.dataset.choice)];
    const correct = selected === challengeCurrent.answer;
    challenge.attempted += 1;
    challenge.correct += correct ? 1 : 0;
    challenge.wrong += correct ? 0 : 1;
    challenge.score += correct ? 1 : -1;
    challenge.answers.push({ questionId: challengeCurrent.q.id, selected, answer: challengeCurrent.answer, correct, at: new Date().toISOString() });
    $("challenge-choices").querySelectorAll("button").forEach((item, index) => {
      item.disabled = true;
      item.classList.toggle("answer", challengeCurrent.choices[index] === challengeCurrent.answer);
      item.classList.toggle("wrong", item === button && !correct);
    });
    $("challenge-status").className = "challenge-status " + (correct ? "good" : "bad");
    $("challenge-status").textContent = correct ? "✓ +1，繼續！" : "✗ −1，繼續！";
    challengeStats();
    setTimeout(() => { if (challengeOn) renderChallenge(); }, 260);
  });
  $("record-open").addEventListener("click", () => { persist(false); renderRecords(); $("record-dialog").hidden = false; });
  $("record-close").addEventListener("click", () => { $("record-dialog").hidden = true; });
  $("record-dialog").addEventListener("click", (event) => { if (event.target.id === "record-dialog") event.currentTarget.hidden = true; });
  $("export-csv").addEventListener("click", () => exportData("csv"));
  $("export-json").addEventListener("click", () => exportData("json"));
  $("print-history").addEventListener("click", printHistory);
  $("print-worksheet").addEventListener("click", printWorksheet);
  $("print-comprehensive").addEventListener("click", printComprehensiveWorksheet);
  $("student-open").addEventListener("click", () => { $("student-input").value = learner; $("student-dialog").hidden = false; });
  $("student-close").addEventListener("click", () => { $("student-dialog").hidden = true; });
  $("student-cancel").addEventListener("click", () => { $("student-dialog").hidden = true; });
  $("student-save").addEventListener("click", () => {
    const value = $("student-input").value.trim();
    if (value) {
      learner = value;
      try { localStorage.setItem(APP.id + ".student", learner); } catch (error) { /* local identifier is optional. */ }
    }
    $("student-dialog").hidden = true;
    renderRecords();
  });
  $("completion-close").addEventListener("click", closeCompletion);
  $("completion-restart").addEventListener("click", resetSession);
  $("completion-record").addEventListener("click", () => { closeCompletion(); renderRecords(); $("record-dialog").hidden = false; });
  window.addEventListener("afterprint", () => { $("print-sheet").classList.remove("print-active"); });
  window.addEventListener("pagehide", () => { persist(true); if (challengeOn) finishChallenge(); });

  updateModeButtons();
  startSession();
  makeKeypad();
  newQuestion();
  renderRecords();
  renderBoard();
}());
