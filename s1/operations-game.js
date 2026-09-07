(function () {
  "use strict";

  const STORAGE_KEY = "s1ch1.operations.game.v1";
  const LEARNER_KEY = "s1ch1.learner.v1";
  const CONTENT_VERSION = "s1ch1-operations-game-v1";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function gcd(first, second) {
    let a = first < 0n ? -first : first;
    let b = second < 0n ? -second : second;
    while (b !== 0n) {
      const remainder = a % b;
      a = b;
      b = remainder;
    }
    return a || 1n;
  }

  function fraction(numerator, denominator) {
    let n = BigInt(numerator);
    let d = BigInt(denominator);
    if (d === 0n) throw new Error("分母不可為零");
    if (d < 0n) { n = -n; d = -d; }
    const divisor = gcd(n, d);
    return { n: n / divisor, d: d / divisor };
  }

  function add(first, second) { return fraction(first.n * second.d + second.n * first.d, first.d * second.d); }
  function subtract(first, second) { return fraction(first.n * second.d - second.n * first.d, first.d * second.d); }
  function multiply(first, second) { return fraction(first.n * second.n, first.d * second.d); }
  function divide(first, second) { return fraction(first.n * second.d, first.d * second.n); }
  function sameFraction(first, second) { return first.n === second.n && first.d === second.d; }

  function decimalFraction(value) {
    const match = String(value).trim().match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
    if (!match) return null;
    const sign = match[1] === "-" ? -1n : 1n;
    const whole = match[2];
    const decimal = match[3] || "";
    const denominator = 10n ** BigInt(decimal.length);
    const numerator = BigInt(whole) * denominator + BigInt(decimal || "0");
    return fraction(sign * numerator, denominator);
  }

  function parseAnswer(raw) {
    const value = String(raw || "").trim().replace(/\s+/g, " ");
    if (!value) return null;
    const mixed = value.match(/^([+-]?\d+) (\d+)\/(\d+)$/);
    if (mixed) {
      const whole = BigInt(mixed[1]);
      const numerator = BigInt(mixed[2]);
      const denominator = BigInt(mixed[3]);
      if (denominator === 0n || numerator >= denominator) return null;
      const sign = whole < 0n ? -1n : 1n;
      return fraction(sign * (whole < 0n ? -whole : whole) * denominator + sign * numerator, denominator);
    }
    const simpleFraction = value.match(/^([+-]?\d+)\/(\d+)$/);
    if (simpleFraction && BigInt(simpleFraction[2]) !== 0n) return fraction(simpleFraction[1], simpleFraction[2]);
    return decimalFraction(value);
  }

  function formatFraction(value) {
    return value.d === 1n ? String(value.n) : String(value.n) + "/" + String(value.d);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  }

  function question(id, topic, formula, answer, expected, steps, trap) {
    return { id, topic, formula, answer: fraction(answer[0], answer[1]), expected, steps, trap };
  }

  const STAGES = [
    {
      id: 1,
      name: "四則與括號",
      title: "第一關：四則與括號神殿",
      description: "掌握由左至右、先乘除後加減、括號優先。",
      tipTitle: "括號優先",
      tipText: "括號 → 乘除 → 加減；同一級由左至右。",
      example: "50 − (12 + 9 × 2) = 20",
      questions: [
        question("op-1-1", "運算次序", "48 − 18 + 7 − 5", [32, 1], "32", ["加減同級，由左至右：48 − 18 = 30。", "30 + 7 = 37。", "37 − 5 = 32。"], "不要把加法全部先算；同一級運算要由左至右。"),
        question("op-1-2", "括號與乘法", "50 − (12 + 9 × 2)", [20, 1], "20", ["括號內先做乘法：9 × 2 = 18。", "括號內：12 + 18 = 30。", "最後：50 − 30 = 20。"], "括號內也要先乘除，不能只看見加法就先計。"),
        question("op-1-3", "多重括號", "62 − [26 − (12 + 9)]", [57, 1], "57", ["最內層：12 + 9 = 21。", "方括號內：26 − 21 = 5。", "最後：62 − 5 = 57。"], "由最內層開始；外面的減號不能漏掉。"),
        question("op-1-4", "多重括號與除法", "32 ÷ {8 × [10 − (9 − 1)]}", [2, 1], "2", ["最內層：9 − 1 = 8。", "方括號：10 − 8 = 2；大括號：8 × 2 = 16。", "最後：32 ÷ 16 = 2。"], "括號中的減法先完成，除法不能提早計算。"),
        question("op-1-5", "乘除優先", "5 + 24 ÷ (3 × 2)", [9, 1], "9", ["括號：3 × 2 = 6。", "除法：24 ÷ 6 = 4。", "最後：5 + 4 = 9。"], "加法要留到乘除完成後才計。")
      ]
    },
    {
      id: 2,
      name: "小數分數互化",
      title: "第二關：小數分數轉換站",
      description: "看清小數位值，把小數化成最簡分數，或把分數化成小數。",
      tipTitle: "位值先行",
      tipText: "先看小數有幾位，再用 10、100、1000 作分母，最後約分。",
      example: "0.75 = 75/100 = 3/4",
      questions: [
        question("op-2-1", "小數化分數", "0.75 = ?", [3, 4], "3/4", ["0.75 有兩位小數，所以寫成 75/100。", "75/100 約分（除以 25）得到 3/4。"], "0.75 不是 75/10；小數位數決定分母。"),
        question("op-2-2", "小數化分數", "0.125 = ?", [1, 8], "1/8", ["0.125 有三位小數，所以寫成 125/1000。", "125/1000 約分（除以 125）得到 1/8。"], "記得數清楚三位小數，分母是 1000。"),
        question("op-2-3", "分數化小數", "3/5 = ?", [3, 5], "0.6", ["把分母 5 變成 10：3/5 = 6/10。", "6/10 = 0.6。"], "3/5 不是 0.3；分子和分母要同時乘以 2。"),
        question("op-2-4", "分數化小數", "7/20 = ?", [7, 20], "0.35", ["把分母 20 變成 100：7/20 = 35/100。", "35/100 = 0.35。"], "分母 100 有兩位小數，不要漏掉 0。"),
        question("op-2-5", "小數化分數", "1.25 = ?", [5, 4], "5/4", ["1.25 = 125/100。", "125/100 約分（除以 25）得到 5/4。"], "整數部分也要保留；1.25 不是 1/25。")
      ]
    },
    {
      id: 3,
      name: "通分母加減法",
      title: "第三關：分數通分廣場",
      description: "先找公分母，再把分子相加或相減，答案最後要約分。",
      tipTitle: "先通分",
      tipText: "分母不同不能直接加減；先找最小公倍數，再處理分子。",
      example: "1/3 + 1/4 = 4/12 + 3/12 = 7/12",
      questions: [
        question("op-3-1", "分數加法", "1/3 + 1/4 = ?", [7, 12], "7/12", ["3 和 4 的最小公倍數是 12。", "1/3 = 4/12，1/4 = 3/12。", "4/12 + 3/12 = 7/12。"], "分母不能直接相加；分母保留 12。"),
        question("op-3-2", "分數減法", "5/6 − 1/4 = ?", [7, 12], "7/12", ["6 和 4 的最小公倍數是 12。", "5/6 = 10/12，1/4 = 3/12。", "10/12 − 3/12 = 7/12。"], "減法後不要把分母寫成 2；通分後分母仍是 12。"),
        question("op-3-3", "分數加法", "2/5 + 3/10 = ?", [7, 10], "7/10", ["5 和 10 的最小公倍數是 10。", "2/5 = 4/10。", "4/10 + 3/10 = 7/10。"], "只需把 2/5 乘以 2，不要把 3/10 再改錯。"),
        question("op-3-4", "分數減法", "7/8 − 1/3 = ?", [13, 24], "13/24", ["8 和 3 的最小公倍數是 24。", "7/8 = 21/24，1/3 = 8/24。", "21/24 − 8/24 = 13/24。"], "8 和 3 的公倍數不是 11；要用 24。"),
        question("op-3-5", "帶分數加法", "1 1/2 + 2/3 = ?", [13, 6], "13/6", ["1 1/2 = 3/2。", "2 和 3 的最小公倍數是 6：3/2 = 9/6，2/3 = 4/6。", "9/6 + 4/6 = 13/6。"], "帶分數可先化假分數；不要只把整數部分相加。")
      ]
    },
    {
      id: 4,
      name: "分數乘除混合",
      title: "第四關：分數乘除城堡",
      description: "乘法直接相乘；除以分數就乘它的倒數，並先約分。",
      tipTitle: "除法變乘法",
      tipText: "保留第一個分數，除法變乘法，第二個分數倒轉。",
      example: "5/6 ÷ 10/9 = 5/6 × 9/10 = 3/4",
      questions: [
        question("op-4-1", "分數乘法", "3/4 × 2/5 = ?", [3, 10], "3/10", ["先約分：2 和 4 約成 1 和 2。", "3/2 × 1/5 = 3/10。"], "分子乘分子、分母乘分母；不要把分數上下交叉相加。"),
        question("op-4-2", "分數除法", "5/6 ÷ 10/9 = ?", [3, 4], "3/4", ["除以分數改為乘以倒數：5/6 × 9/10。", "交叉約分後得到 3/4。"], "只倒轉第二個分數；第一個分數不要倒轉。"),
        question("op-4-3", "帶分數乘法", "1 1/2 × 2/3 = ?", [1, 1], "1", ["1 1/2 = 3/2。", "3/2 × 2/3，交叉約分後等於 1。"], "先把帶分數化成假分數，再約分。"),
        question("op-4-4", "分數除法", "7/8 ÷ 7/16 = ?", [2, 1], "2", ["除法變乘法並倒轉：7/8 × 16/7。", "7 約去 7，16/8 = 2。"], "倒轉後才可約分；不要把 7/16 原樣相乘。"),
        question("op-4-5", "分數乘法", "2/5 × 15/4 = ?", [3, 2], "3/2", ["先約分：15/5 = 3，2/4 = 1/2。", "1 × 3/2 = 3/2。"], "約分可以在相乘前做，但分子要和另一個分母約。")
      ]
    },
    {
      id: 5,
      name: "小數分數混合",
      title: "第五關：小數分數終極站",
      description: "先把小數和分數轉成容易運算的形式，再按正確次序完成混合題。",
      tipTitle: "先統一形式",
      tipText: "可把小數化分數，或把分數化小數；選擇最容易計算的一邊。",
      example: "1.5 + 3/4 = 3/2 + 3/4 = 9/4",
      questions: [
        question("op-5-1", "小數與分數加法", "1.5 + 3/4 = ?", [9, 4], "9/4", ["1.5 = 3/2。", "3/2 = 6/4。", "6/4 + 3/4 = 9/4。"], "先統一成分數，分母才可以相加。"),
        question("op-5-2", "小數與分數除法", "2.4 ÷ 3/5 = ?", [4, 1], "4", ["2.4 = 12/5。", "除以 3/5 等於乘以 5/3。", "12/5 × 5/3 = 4。"], "除以分數要乘倒數，不是直接除以分子。"),
        question("op-5-3", "小數與分數減法", "1 1/2 − 0.75 = ?", [3, 4], "3/4", ["1 1/2 = 1.5，0.75 = 3/4。", "1.5 = 6/4。", "6/4 − 3/4 = 3/4。"], "0.75 是 3/4，不是 75/4。"),
        question("op-5-4", "混合運算次序", "4 1/16 − (1 5/9 ÷ 8/15) = ?", [55, 48], "55/48", ["4 1/16 = 65/16；1 5/9 = 14/9。", "括號內：14/9 ÷ 8/15 = 14/9 × 15/8 = 35/12。", "65/16 − 35/12 = 195/48 − 140/48 = 55/48。"], "先計括號內的除法，再做外面的減法。"),
        question("op-5-5", "小數混合運算", "0.36 ÷ 0.09 + 1/2 = ?", [9, 2], "9/2", ["先做除法：0.36 ÷ 0.09 = 4。", "1/2 = 0.5。", "4 + 0.5 = 4.5 = 9/2。"], "先乘除後加減；0.36 ÷ 0.09 不是 0.04。")
      ]
    }
  ];

  const modeNames = { standard: "標準測驗", infinite: "無限特訓", challenge: "60秒挑戰" };
  const modeDescription = { standard: "五題固定測驗，每題 20 分。", infinite: "反覆抽題練習，答對一題得 10 分。", challenge: "60 秒內盡量答對；只顯示即時得分。" };
  let state = loadState();
  let selectedStage = 0;
  let mode = "standard";
  let session = null;
  let timerId = null;
  let challengeEnd = 0;
  let currentQuestion = null;

  const stageList = $("#stage-list");
  const questionArea = $("#question-area");
  const challengeStartPanel = $("#challenge-start-panel");
  const challengeResult = $("#challenge-result");
  const modeLabel = $("#mode-label");
  const stageTitle = $("#stage-title");
  const stageDescription = $("#stage-description");
  const topicBadge = $("#topic-badge");
  const questionProgress = $("#question-progress");
  const formula = $("#question-formula");
  const answerInput = $("#answer-input");
  const submitAnswer = $("#submit-answer");
  const nextQuestion = $("#next-question");
  const finishSessionButton = $("#finish-session");
  const feedback = $("#feedback");
  const challengeTimer = makeChallengeTimer();

  function makeChallengeTimer() {
    const element = document.createElement("span");
    element.id = "challenge-timer";
    element.className = "timer-badge";
    element.hidden = true;
    $(".question-progress").after(element);
    return element;
  }

  function getLearnerId() {
    try {
      let id = localStorage.getItem(LEARNER_KEY);
      if (!id) {
        id = "S1-" + Math.random().toString(36).slice(2, 8).toUpperCase();
        localStorage.setItem(LEARNER_KEY, id);
      }
      return id;
    } catch (error) {
      return "本機未提供儲存空間";
    }
  }

  function defaultState() {
    return { version: CONTENT_VERSION, learnerId: getLearnerId(), stageBest: {}, records: [], leaderboard: [] };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || saved.version !== CONTENT_VERSION) return defaultState();
      return Object.assign(defaultState(), saved);
    } catch (error) {
      return defaultState();
    }
  }

  function persistState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* local storage may be unavailable */ }
  }

  function unlocked(index) {
    return index === 0 || Number(state.stageBest[STAGES[index - 1].id] || 0) >= 80;
  }

  function unlockedCount() {
    let count = 1;
    while (count < STAGES.length && unlocked(count)) count += 1;
    return count;
  }

  function renderStageList() {
    stageList.innerHTML = STAGES.map((stage, index) => {
      const isUnlocked = unlocked(index);
      const active = index === selectedStage;
      const best = state.stageBest[stage.id];
      return `<button class="stage-button${active ? " active" : ""}" type="button" data-stage="${index}" ${isUnlocked ? "" : "disabled"} aria-label="${escapeHTML(stage.name)}${isUnlocked ? "" : "，未解鎖"}">
        <span class="stage-number">${stage.id}</span><span class="stage-name">${escapeHTML(stage.name)}</span><span class="stage-best">${best === undefined ? "—" : String(best) + "分"}</span>
      </button>`;
    }).join("");
    $$(".stage-button").forEach((button) => button.addEventListener("click", () => selectStage(Number(button.dataset.stage))));
    $("#unlocked-count").textContent = String(unlockedCount());
  }

  function updateStageTip() {
    const stage = STAGES[selectedStage];
    $("#tip-title").textContent = stage.tipTitle;
    $("#tip-text").textContent = stage.tipText;
    $("#mini-example").textContent = stage.example;
  }

  function resetTimer() {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    challengeEnd = 0;
    challengeTimer.hidden = true;
  }

  function newSession() {
    return { mode, stageId: STAGES[selectedStage].id, startedAt: Date.now(), index: 0, score: 0, correct: 0, wrong: 0, answers: [], answeredCurrent: false, challengeStarted: false, recentIds: [] };
  }

  function startSession() {
    resetTimer();
    session = newSession();
    const stage = STAGES[selectedStage];
    modeLabel.textContent = modeNames[mode];
    stageTitle.textContent = stage.title;
    stageDescription.textContent = stage.description + " " + modeDescription[mode];
    updateStageTip();
    challengeResult.hidden = true;
    feedback.hidden = true;
    answerInput.value = "";
    challengeStartPanel.hidden = mode !== "challenge";
    questionArea.hidden = mode === "challenge";
    finishSessionButton.textContent = mode === "challenge" ? "結束挑戰" : "完成並記錄";
    nextQuestion.hidden = mode === "challenge";
    if (mode !== "challenge") renderQuestion();
    updateStats();
  }

  function selectStage(index) {
    if (!unlocked(index)) return;
    selectedStage = index;
    renderStageList();
    startSession();
  }

  function setMode(nextMode) {
    mode = nextMode;
    $$(".mode-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === mode);
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    });
    startSession();
  }

  function selectQuestion() {
    const bank = STAGES[selectedStage].questions;
    if (mode === "standard") return bank[session.index];
    let pool = bank.filter((item) => !session.recentIds.includes(item.id));
    if (!pool.length) { session.recentIds = []; pool = bank.slice(); }
    const selected = pool[Math.floor(Math.random() * pool.length)];
    session.recentIds.push(selected.id);
    if (session.recentIds.length > Math.max(2, bank.length - 1)) session.recentIds.shift();
    return selected;
  }

  function renderQuestion() {
    currentQuestion = selectQuestion();
    session.answeredCurrent = false;
    topicBadge.textContent = currentQuestion.topic;
    formula.textContent = currentQuestion.formula;
    if (mode === "standard") questionProgress.textContent = "第 " + (session.index + 1) + "/" + STAGES[selectedStage].questions.length + " 題";
    if (mode === "infinite") questionProgress.textContent = "特訓第 " + (session.index + 1) + " 題";
    if (mode === "challenge") questionProgress.textContent = "挑戰第 " + (session.index + 1) + " 題";
    answerInput.value = "";
    answerInput.disabled = false;
    submitAnswer.disabled = false;
    nextQuestion.disabled = true;
    nextQuestion.textContent = mode === "standard" && session.index === STAGES[selectedStage].questions.length - 1 ? "完成測驗 ✓" : "下一題 →";
    feedback.hidden = true;
    feedback.className = "feedback";
    challengeTimer.hidden = mode !== "challenge";
  }

  function renderFeedback(isCorrect, parsed) {
    const answerText = currentQuestion.expected || formatFraction(currentQuestion.answer);
    const steps = currentQuestion.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("");
    feedback.className = "feedback " + (isCorrect ? "correct" : "incorrect");
    feedback.innerHTML = `<div class="feedback-title"><span>${isCorrect ? "✓ 答對了！" : "✗ 再想一想"}</span><span>${isCorrect ? "+" + (mode === "infinite" ? "10" : "20") : "+0"} 分</span></div>
      <p><strong>正確答案：</strong>${escapeHTML(answerText)}${parsed ? "" : "（請用整數、小數或分數格式輸入）"}</p>
      <p><strong>解題步驟：</strong></p><ol>${steps}</ol>
      <p class="trap"><strong>易錯位：</strong>${escapeHTML(currentQuestion.trap)}</p>`;
    feedback.hidden = false;
  }

  function showChallengeFeedback(isCorrect) {
    feedback.className = "feedback " + (isCorrect ? "correct" : "incorrect");
    feedback.textContent = isCorrect ? "✓ 答對！ +10 分" : "× 未答對，繼續挑戰！";
    feedback.hidden = false;
  }

  function recordAnswer(raw, parsed, isCorrect) {
    session.answers.push({
      questionId: currentQuestion.id,
      submitted: raw,
      expected: currentQuestion.expected,
      correct: isCorrect,
      at: new Date().toISOString()
    });
    if (isCorrect) {
      session.correct += 1;
      session.score += mode === "infinite" || mode === "challenge" ? 10 : 20;
    } else {
      session.wrong += 1;
    }
    session.index += 1;
    updateStats();
  }

  function submitCurrentAnswer() {
    if (!session || session.answeredCurrent || (mode === "challenge" && !session.challengeStarted)) return;
    const raw = answerInput.value.trim();
    const parsed = parseAnswer(raw);
    if (!parsed) {
      feedback.className = "feedback incorrect";
      feedback.innerHTML = "<strong>格式未能辨認。</strong> 請輸入整數、小數、分數（例如 3/4）或帶分數（例如 1 1/2）。";
      feedback.hidden = false;
      answerInput.focus();
      return;
    }
    const isCorrect = sameFraction(parsed, currentQuestion.answer);
    session.answeredCurrent = true;
    recordAnswer(raw, parsed, isCorrect);
    if (mode === "challenge") {
      showChallengeFeedback(isCorrect);
      answerInput.disabled = true;
      submitAnswer.disabled = true;
      window.setTimeout(() => {
        if (session && session.challengeStarted && Date.now() < challengeEnd) renderQuestion();
      }, 450);
      return;
    }
    renderFeedback(isCorrect, parsed);
    answerInput.disabled = true;
    submitAnswer.disabled = true;
    nextQuestion.disabled = false;
  }

  function next() {
    if (!session || !session.answeredCurrent || mode === "challenge") return;
    if (mode === "standard" && session.index >= STAGES[selectedStage].questions.length) {
      finishSession("complete");
      return;
    }
    renderQuestion();
  }

  function updateStats() {
    $("#session-score").textContent = String(session ? session.score : 0);
    $("#session-correct").textContent = String(session ? session.correct : 0);
    $("#session-wrong").textContent = String(session ? session.wrong : 0);
  }

  function recordSession(reason) {
    if (!session || !session.answers.length) return;
    const record = {
      id: "record-" + Date.now(),
      contentVersion: CONTENT_VERSION,
      mode: session.mode,
      stageId: session.stageId,
      stageName: STAGES.find((stage) => stage.id === session.stageId).name,
      score: session.score,
      correct: session.correct,
      wrong: session.wrong,
      attempted: session.answers.length,
      reason,
      durationMs: Date.now() - session.startedAt,
      finishedAt: new Date().toISOString(),
      answers: session.answers
    };
    state.records.unshift(record);
    state.records = state.records.slice(0, 40);
    if (session.mode !== "challenge") {
      state.stageBest[session.stageId] = Math.max(Number(state.stageBest[session.stageId] || 0), session.score);
    } else {
      state.leaderboard.push({ stageId: session.stageId, stageName: record.stageName, score: session.score, correct: session.correct, at: record.finishedAt });
      state.leaderboard.sort((first, second) => second.score - first.score || second.correct - first.correct);
      state.leaderboard = state.leaderboard.slice(0, 10);
    }
    persistState();
    renderStageList();
  }

  function finishSession(reason) {
    if (!session) return;
    resetTimer();
    if (mode === "challenge") session.challengeStarted = false;
    recordSession(reason);
    const stage = STAGES[selectedStage];
    const requirement = mode !== "challenge" && session.score >= 80 ? " 已達到 80 分，下一關已解鎖。" : "";
    challengeResult.innerHTML = `<strong>${modeNames[mode]}完成！</strong><br>第 ${stage.id} 關：${session.score} 分；答對 ${session.correct} 題，答錯 ${session.wrong} 題。${requirement}<br><small>記錄已保存到此瀏覽器。</small>`;
    challengeResult.hidden = false;
    questionArea.hidden = true;
    challengeStartPanel.hidden = true;
    session = null;
  }

  function startChallenge() {
    if (mode !== "challenge") return;
    resetTimer();
    session = newSession();
    session.challengeStarted = true;
    challengeStartPanel.hidden = true;
    questionArea.hidden = false;
    challengeResult.hidden = true;
    finishSessionButton.textContent = "結束挑戰";
    nextQuestion.hidden = true;
    challengeEnd = Date.now() + 60000;
    challengeTimer.hidden = false;
    timerId = window.setInterval(() => {
      const remaining = Math.max(0, challengeEnd - Date.now());
      challengeTimer.textContent = "剩餘 " + Math.ceil(remaining / 1000) + " 秒";
      if (remaining <= 0) finishSession("timeout");
    }, 100);
    renderQuestion();
    updateStats();
  }

  function updateRecords() {
    const recordId = $("#record-id");
    recordId.textContent = "學習者代號：" + (state.learnerId || getLearnerId());
    const list = $("#record-list");
    if (!state.records.length) {
      list.innerHTML = "<p class=\"record-empty\">暫時未有完成的紀錄。完成一次練習後，資料會顯示在這裡。</p>";
      return;
    }
    list.innerHTML = state.records.slice(0, 15).map((record) => {
      const date = new Date(record.finishedAt).toLocaleString("zh-HK", { dateStyle: "short", timeStyle: "short" });
      return `<div class="record-row"><div><strong>${escapeHTML(modeNames[record.mode] || record.mode)} · ${escapeHTML(record.stageName)}</strong><small>${date} · 答對 ${record.correct}／答錯 ${record.wrong} · 共 ${record.attempted} 題</small></div><strong>${record.score} 分</strong></div>`;
    }).join("");
  }

  function openOverlay(element) { element.hidden = false; }
  function closeOverlay(element) { element.hidden = true; }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 0);
  }

  function csvValue(value) { return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"'; }

  function exportCSV() {
    const rows = [["finishedAt", "mode", "stage", "score", "correct", "wrong", "attempted", "questionId", "submitted", "expected", "answerCorrect"]];
    state.records.forEach((record) => record.answers.forEach((answer) => rows.push([record.finishedAt, modeNames[record.mode] || record.mode, record.stageName, record.score, record.correct, record.wrong, record.attempted, answer.questionId, answer.submitted, answer.expected, answer.correct ? "true" : "false"])));
    downloadFile("s1ch1-operations-records.csv", rows.map((row) => row.map(csvValue).join(",")).join("\n"), "text/csv;charset=utf-8");
  }

  function exportJSON() {
    downloadFile("s1ch1-operations-records.json", JSON.stringify({ contentVersion: CONTENT_VERSION, learnerId: state.learnerId, records: state.records, leaderboard: state.leaderboard }, null, 2), "application/json;charset=utf-8");
  }

  function setupScratchpad() {
    const dialog = $("#scratchpad-dialog");
    const canvas = $("#scratchpad-canvas");
    const context = canvas.getContext("2d");
    let drawing = false;
    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
    }
    function point(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    canvas.addEventListener("pointerdown", (event) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const position = point(event);
      context.beginPath();
      context.moveTo(position.x, position.y);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const position = point(event);
      context.strokeStyle = $("#pen-color").value;
      context.lineWidth = Number($("#pen-size").value);
      context.lineTo(position.x, position.y);
      context.stroke();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => canvas.addEventListener(eventName, () => { drawing = false; }));
    $("#scratchpad-open").addEventListener("click", () => { openOverlay(dialog); window.requestAnimationFrame(resizeCanvas); });
    $("#scratchpad-close").addEventListener("click", () => closeOverlay(dialog));
    $("#scratchpad-clear").addEventListener("click", () => { context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, canvas.width, canvas.height); context.restore(); });
    window.addEventListener("resize", () => { if (!dialog.hidden) resizeCanvas(); });
  }

  function setupInput() {
    submitAnswer.addEventListener("click", submitCurrentAnswer);
    nextQuestion.addEventListener("click", next);
    answerInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); submitCurrentAnswer(); }
    });
    $$("[data-key]").forEach((button) => button.addEventListener("click", () => {
      const key = button.dataset.key;
      if (key === "clear") answerInput.value = "";
      else if (key === "backspace") answerInput.value = answerInput.value.slice(0, -1);
      else answerInput.value += key === "space" ? " " : key;
      answerInput.focus();
    }));
    finishSessionButton.addEventListener("click", () => finishSession(mode === "challenge" ? "manual" : "partial"));
    $("#challenge-start").addEventListener("click", startChallenge);
  }

  function setupRecords() {
    const dialog = $("#record-dialog");
    const open = () => { updateRecords(); openOverlay(dialog); };
    $("#record-open").addEventListener("click", open);
    $("#record-open-secondary").addEventListener("click", open);
    $("#record-close").addEventListener("click", () => closeOverlay(dialog));
    $("#export-csv").addEventListener("click", exportCSV);
    $("#export-json").addEventListener("click", exportJSON);
    $$(".overlay").forEach((overlay) => overlay.addEventListener("click", (event) => { if (event.target === overlay) closeOverlay(overlay); }));
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      $$(".overlay").forEach((overlay) => closeOverlay(overlay));
    });
  }

  $$(".mode-button").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  setupInput();
  setupRecords();
  setupScratchpad();
  renderStageList();
  startSession();
})();
