(function () {
  'use strict';

  const symbols = {
    add: '+',
    subtract: '−',
    multiply: '×',
    divide: '÷'
  };

  const modeProgress = {
    1: { solved: 0, question: 1, state: null },
    2: { solved: 0, question: 1, state: null }
  };

  let activeMode = 1;
  let dragJustEnded = false;
  const stampTimers = { practice: null, hint: null };

  const elements = {
    hintToggle: document.getElementById('hint-toggle'),
    hintPanel: document.getElementById('balance-hint'),
    modeTabs: [document.getElementById('mode-tab-1'), document.getElementById('mode-tab-2')],
    stepKicker: document.getElementById('step-kicker'),
    progressPill: document.getElementById('progress-pill'),
    equation: document.getElementById('equation-display'),
    instruction: document.getElementById('instruction'),
    methodRow: document.getElementById('method-row'),
    methodBalance: document.getElementById('method-balance'),
    methodTranspose: document.getElementById('method-transpose'),
    methodDescription: document.getElementById('method-description'),
    dropZone: document.getElementById('balance-drop-zone'),
    balanceSvg: document.getElementById('balance-svg'),
    leftEquation: document.getElementById('scale-left-equation'),
    rightEquation: document.getElementById('scale-right-equation'),
    leftStamp: document.getElementById('scale-left-stamp'),
    rightStamp: document.getElementById('scale-right-stamp'),
    dropStatus: document.getElementById('drop-status'),
    workPlaceholder: document.getElementById('work-placeholder'),
    workSteps: document.getElementById('work-steps'),
    operationTitle: document.getElementById('operation-title'),
    operationSubtitle: document.getElementById('operation-subtitle'),
    operationTray: document.getElementById('operation-tray'),
    feedback: document.getElementById('feedback'),
    nextQuestion: document.getElementById('next-question'),
    resetMode: document.getElementById('reset-mode'),
    hintExampleTabs: [document.getElementById('hint-example-add'), document.getElementById('hint-example-multiply')],
    hintSvg: document.getElementById('hint-balance-svg'),
    hintLeftEquation: document.getElementById('hint-left-equation'),
    hintRightEquation: document.getElementById('hint-right-equation'),
    hintLeftStamp: document.getElementById('hint-left-stamp'),
    hintRightStamp: document.getElementById('hint-right-stamp'),
    hintEquation: document.getElementById('hint-demo-equation'),
    hintOperationTray: document.getElementById('hint-operation-tray'),
    hintDrop: document.getElementById('hint-balance-board'),
    hintFeedback: document.getElementById('hint-demo-feedback'),
    hintReset: document.getElementById('hint-demo-reset')
  };

  const hintExamples = {
    add: {
      left: 'x + 3',
      right: '11',
      operation: 'subtract',
      value: 3,
      stepLeft: 'x + 3 − 3',
      stepRight: '11 − 3',
      finalLeft: 'x',
      finalRight: '8',
      answer: 'x = 8'
    },
    multiply: {
      left: '2x',
      right: '8',
      operation: 'divide',
      value: 2,
      stepLeft: '2x ÷ 2',
      stepRight: '8 ÷ 2',
      finalLeft: 'x',
      finalRight: '4',
      answer: 'x = 4'
    }
  };

  let activeHintExample = 'add';
  let hintDemoStatus = 'ready';

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeQuestion(mode) {
    if (mode === 1) {
      const type = randomInt(0, 3);
      const value = randomInt(2, 6);
      const solution = type === 1 ? randomInt(value + 1, 12) : randomInt(3, 12);
      let answer = solution;
      let left;
      let right;
      let inverse;

      if (type === 0) {
        left = 'x + ' + value;
        right = String(solution + value);
        inverse = 'subtract';
      } else if (type === 1) {
        left = 'x − ' + value;
        right = String(solution - value);
        inverse = 'add';
      } else if (type === 2) {
        left = value + 'x';
        right = String(value * solution);
        inverse = 'divide';
      } else {
        left = 'x ÷ ' + value;
        right = String(solution);
        inverse = 'multiply';
        answer = solution * value;
      }

      return {
        mode: 1,
        originalLeft: left,
        originalRight: right,
        left: left,
        right: right,
        solution: answer,
        operand: value,
        inverse: inverse,
        stage: 0,
        method: 'balance',
        completed: false,
        history: []
      };
    }

    const coefficient = randomInt(2, 5);
    const solution = randomInt(2, 9);
    const plus = Math.random() < 0.5;
    let constant = randomInt(2, 8);
    if (!plus && constant >= coefficient * solution) {
      constant = randomInt(2, Math.max(2, coefficient * solution - 1));
    }
    const right = plus ? coefficient * solution + constant : coefficient * solution - constant;
    const left = coefficient + 'x ' + (plus ? '+ ' : '− ') + constant;

    return {
      mode: 2,
      originalLeft: left,
      originalRight: String(right),
      left: left,
      right: String(right),
      coefficient: coefficient,
      constant: constant,
      constantSign: plus ? '+' : '−',
      solution: solution,
      reducedRight: coefficient * solution,
      firstInverse: plus ? 'subtract' : 'add',
      stage: 0,
      method: 'balance',
      completed: false,
      history: []
    };
  }

  function currentState() {
    if (!modeProgress[activeMode].state) {
      modeProgress[activeMode].state = makeQuestion(activeMode);
    }
    return modeProgress[activeMode].state;
  }

  function formatOperation(operation, value) {
    return symbols[operation] + ' ' + value;
  }

  function updateFeedback(message, kind) {
    elements.feedback.textContent = message;
    elements.feedback.dataset.kind = kind || 'neutral';
    elements.dropStatus.textContent = message;
  }

  function renderScaleEquation(node, equation) {
    const words = String(equation).trim().split(/\s+/);
    const lines = [];
    words.forEach(function (word) {
      const current = lines.length - 1;
      if (current < 0 || (lines[current] + ' ' + word).trim().length > 8) {
        lines.push(word);
      } else {
        lines[current] += ' ' + word;
      }
    });

    node.replaceChildren();
    node.setAttribute('y', lines.length === 1 ? '112' : '100');
    lines.forEach(function (line, index) {
      const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      span.setAttribute('x', node.getAttribute('x'));
      if (index > 0) span.setAttribute('dy', '22');
      span.textContent = line;
      node.appendChild(span);
    });
  }

  function setBalance(left, right, announce) {
    renderScaleEquation(elements.leftEquation, left);
    renderScaleEquation(elements.rightEquation, right);
    elements.equation.textContent = left + ' = ' + right;
    elements.balanceSvg.setAttribute('aria-label', '天平左邊是 ' + left + '，右邊是 ' + right + '；兩邊相等。');
    if (announce) elements.dropStatus.textContent = announce;
  }

  function setHintBalance(left, right) {
    renderScaleEquation(elements.hintLeftEquation, left);
    renderScaleEquation(elements.hintRightEquation, right);
    elements.hintSvg.setAttribute('aria-label', '提示天平左邊是 ' + left + '，右邊是 ' + right + '；兩邊相等。');
  }

  function addWorkLine(text, current) {
    currentState().history.push({ text: text, current: Boolean(current) });
  }

  function renderWorkHistory() {
    const history = currentState().history;
    elements.workSteps.replaceChildren();
    elements.workPlaceholder.hidden = history.length > 0;
    history.forEach(function (entry) {
      const line = document.createElement('p');
      line.className = 'equation-step' + (entry.current ? ' is-current' : '');
      line.textContent = entry.text;
      elements.workSteps.appendChild(line);
    });
  }

  function showOperationOnBothSides(text) {
    elements.leftStamp.textContent = text;
    elements.rightStamp.textContent = text;
    animateBalance();
  }

  function showTransposition(leftText, rightText) {
    elements.leftStamp.textContent = leftText;
    elements.rightStamp.textContent = rightText;
    animateBalance();
  }

  function animateScale(svg, dropZone, leftStamp, rightStamp, scope) {
    leftStamp.classList.add('is-visible');
    rightStamp.classList.add('is-visible');
    svg.classList.remove('is-moving');
    void svg.getBoundingClientRect();
    svg.classList.add('is-moving');
    dropZone.classList.add('is-operating');
    if (stampTimers[scope]) window.clearTimeout(stampTimers[scope]);
    stampTimers[scope] = window.setTimeout(function () {
      leftStamp.classList.remove('is-visible');
      rightStamp.classList.remove('is-visible');
      dropZone.classList.remove('is-operating');
    }, 1100);
  }

  function animateBalance() {
    animateScale(elements.balanceSvg, elements.dropZone, elements.leftStamp, elements.rightStamp, 'practice');
  }

  function animateHintBalance() {
    animateScale(elements.hintSvg, elements.hintDrop, elements.hintLeftStamp, elements.hintRightStamp, 'hint');
  }

  function createOperationCard(operation, source, onActivate) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'operation-card' + (operation.id === 'transpose' ? ' is-move' : '');
    button.draggable = true;
    button.dataset.operation = operation.id;
    button.setAttribute('aria-label', operation.ariaLabel || (operation.id === 'transpose'
      ? '把 ' + operation.value + ' 移到右邊並改變符號'
      : '在兩邊同時' + formatOperation(operation.id, operation.value)));
    button.innerHTML = '<span class="operator-symbol"></span><span class="operator-value"></span>';
    button.querySelector('.operator-symbol').textContent = operation.symbol;
    button.querySelector('.operator-value').textContent = operation.value;
    button.addEventListener('click', function () {
      if (dragJustEnded) {
        dragJustEnded = false;
        return;
      }
      onActivate();
    });
    button.addEventListener('dragstart', function (event) {
      event.dataTransfer.setData('text/plain', JSON.stringify({ source: source, operation: operation.id }));
      event.dataTransfer.effectAllowed = 'move';
    });
    button.addEventListener('dragend', function () {
      dragJustEnded = true;
      window.setTimeout(function () { dragJustEnded = false; }, 0);
    });
    return button;
  }

  function readDraggedOperation(event, source) {
    const raw = event.dataTransfer && event.dataTransfer.getData('text/plain');
    if (!raw) return null;
    try {
      const payload = JSON.parse(raw);
      return payload.source === source && typeof payload.operation === 'string' ? payload.operation : null;
    } catch (error) {
      return null;
    }
  }

  function renderOperations() {
    const state = currentState();
    elements.operationTray.replaceChildren();
    if (state.completed) {
      elements.operationTitle.textContent = '本題已完成';
      elements.operationSubtitle.textContent = '按「下一題」繼續練習。';
      return;
    }
    let operations;

    if (state.mode === 1) {
      operations = ['add', 'subtract', 'multiply', 'divide'].map(function (operation) {
        return { id: operation, symbol: symbols[operation], value: state.operand };
      });
      elements.operationTitle.textContent = '選擇要在兩邊做的運算';
      elements.operationSubtitle.textContent = '點選或拖曳加、減、乘、除卡到天平。';
    } else if (state.stage === 0 && state.method === 'transpose') {
      const changedSign = state.constantSign === '+' ? '−' : '+';
      operations = [{ id: 'transpose', symbol: '移項', value: state.constantSign + state.constant + ' → ' + changedSign + state.constant }];
      elements.operationTitle.textContent = '把常數項移到等號右邊';
      elements.operationSubtitle.textContent = '拖曳「移項」卡到天平，或點選卡片。移過等號時，正負號會改變。';
    } else {
      const value = state.mode === 2 && state.stage === 0 ? state.constant : state.coefficient;
      operations = ['add', 'subtract', 'multiply', 'divide'].map(function (operation) {
        return { id: operation, symbol: symbols[operation], value: value };
      });
      elements.operationTitle.textContent = state.stage === 0 ? '先消去左邊的常數項' : '再把未知數的係數變成 1';
      elements.operationSubtitle.textContent = '點選或拖曳運算卡到天平；左右要做相同運算。';
    }

    operations.forEach(function (operation) {
      if (operation.id === 'transpose') operation.symbol = '移項 ↗';
      elements.operationTray.appendChild(createOperationCard(operation, 'practice', function () {
        submitOperation(operation.id);
      }));
    });
  }

  function renderHintOperations(example) {
    elements.hintOperationTray.replaceChildren();
    ['add', 'subtract', 'multiply', 'divide'].forEach(function (operation) {
      const card = createOperationCard({
        id: operation,
        symbol: symbols[operation],
        value: example.value,
        ariaLabel: '提示示範：兩邊同時' + formatOperation(operation, example.value)
      }, 'hint', function () {
        applyHintOperation(operation);
      });
      card.disabled = hintDemoStatus !== 'ready';
      elements.hintOperationTray.appendChild(card);
    });
  }

  function renderHintDemo() {
    const example = hintExamples[activeHintExample];
    elements.hintExampleTabs.forEach(function (button, index) {
      const selected = (index === 0 && activeHintExample === 'add') || (index === 1 && activeHintExample === 'multiply');
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    elements.hintLeftStamp.classList.remove('is-visible');
    elements.hintRightStamp.classList.remove('is-visible');
    elements.hintSvg.classList.remove('is-moving');
    elements.hintDrop.classList.remove('drag-over', 'is-operating');
    if (stampTimers.hint) window.clearTimeout(stampTimers.hint);
    stampTimers.hint = null;

    if (hintDemoStatus === 'complete') {
      setHintBalance(example.finalLeft, example.finalRight);
      elements.hintEquation.textContent = example.stepLeft + ' = ' + example.stepRight + ' → ' + example.answer;
      elements.hintFeedback.textContent = '兩邊同時 ' + formatOperation(example.operation, example.value) + '，天平保持水平，得到 ' + example.answer + '。';
      elements.hintFeedback.dataset.kind = 'correct';
    } else {
      setHintBalance(example.left, example.right);
      elements.hintEquation.textContent = example.left + ' = ' + example.right;
      elements.hintFeedback.textContent = hintDemoStatus === 'wrong'
        ? '兩邊同時做相同運算，天平仍然平衡，但未能令 x 單獨留下。按「重來」再試。'
        : '選擇一種運算，觀察兩邊同時改變。';
      elements.hintFeedback.dataset.kind = hintDemoStatus === 'wrong' ? 'try' : 'neutral';
    }
    renderHintOperations(example);
  }

  function applyHintOperation(operation) {
    if (hintDemoStatus !== 'ready') return;
    const example = hintExamples[activeHintExample];
    const operationText = formatOperation(operation, example.value);
    elements.hintLeftStamp.textContent = operationText;
    elements.hintRightStamp.textContent = operationText;
    animateHintBalance();

    if (operation !== example.operation) {
      hintDemoStatus = 'wrong';
      elements.hintFeedback.textContent = '兩邊同時做相同運算，天平仍然平衡，但未能令 x 單獨留下。按「重來」再試。';
      elements.hintFeedback.dataset.kind = 'try';
      renderHintOperations(example);
      return;
    }

    hintDemoStatus = 'complete';
    setHintBalance(example.finalLeft, example.finalRight);
    elements.hintEquation.textContent = example.stepLeft + ' = ' + example.stepRight + ' → ' + example.answer;
    elements.hintFeedback.textContent = '兩邊同時 ' + operationText + '，天平保持水平，得到 ' + example.answer + '。';
    elements.hintFeedback.dataset.kind = 'correct';
    renderHintOperations(example);
  }

  function resetHintDemo(exampleName) {
    if (exampleName) activeHintExample = exampleName;
    hintDemoStatus = 'ready';
    renderHintDemo();
  }

  function attachDropTarget(zone, source, callback) {
    zone.addEventListener('dragover', function (event) {
      event.preventDefault();
      zone.classList.add('drag-over');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    });
    zone.addEventListener('dragleave', function (event) {
      if (!zone.contains(event.relatedTarget)) zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function (event) {
      event.preventDefault();
      zone.classList.remove('drag-over');
      const operation = readDraggedOperation(event, source);
      if (operation) callback(operation);
    });
  }

  function render() {
    const state = currentState();
    const progress = modeProgress[activeMode];
    elements.modeTabs.forEach(function (button, index) {
      const selected = activeMode === index + 1;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    elements.stepKicker.textContent = activeMode === 1 ? '一步方程' : '兩步方程';
    elements.progressPill.textContent = '第 ' + progress.question + ' 題 · 已完成 ' + progress.solved + ' 題';
    elements.methodRow.hidden = activeMode !== 2;
    elements.methodBalance.classList.toggle('is-selected', state.method === 'balance');
    elements.methodTranspose.classList.toggle('is-selected', state.method === 'transpose');
    elements.methodBalance.setAttribute('aria-pressed', String(state.method === 'balance'));
    elements.methodTranspose.setAttribute('aria-pressed', String(state.method === 'transpose'));
    elements.methodBalance.disabled = state.stage > 0 || state.completed;
    elements.methodTranspose.disabled = state.stage > 0 || state.completed;

    if (activeMode === 1) {
      elements.instruction.textContent = '選擇能消去左邊非 x 部分的運算，並同時作用在兩邊。';
      elements.methodDescription.textContent = '一步方程：兩邊同做相反運算，讓 x 單獨留下。';
    } else if (state.stage === 0 && state.method === 'transpose') {
      elements.instruction.textContent = '把左邊的常數項移到右邊，並改變正負號。';
      elements.methodDescription.textContent = '跳過「兩邊同加／減」的書寫，移項時記得改變符號。';
    } else if (state.stage === 0) {
      elements.instruction.textContent = '先在兩邊做相同運算，消去左邊的常數項。';
      elements.methodDescription.textContent = '先保持天平平衡，再除以未知數的係數。';
    } else if (!state.completed) {
      elements.instruction.textContent = '常數項已消去；現在要讓 x 前面的係數變成 1。';
      elements.methodDescription.textContent = '兩邊同除以未知數的係數。';
    } else {
      elements.instruction.textContent = '完成兩步運算，x 已單獨留下。';
      elements.methodDescription.textContent = '逐步寫法和移項跳步都會得到相同答案。';
    }

    setBalance(state.left, state.right);
    renderWorkHistory();
    elements.nextQuestion.disabled = !state.completed;
    elements.nextQuestion.textContent = state.completed ? '下一題' : '完成這題後可繼續';
    renderOperations();
  }

  function solveCurrentQuestion() {
    const state = currentState();
    state.completed = true;
    state.left = 'x';
    state.right = String(state.solution);
    addWorkLine('答案：x = ' + state.solution, true);
    setBalance(state.left, state.right, '天平保持平衡，未知數已單獨留下。');
    modeProgress[activeMode].solved += 1;
    updateFeedback('完成！兩邊保持平衡，答案是 x = ' + state.solution + '。', 'complete');
    render();
  }

  function submitOperation(operation) {
    const state = currentState();
    if (state.completed) return;

    const stageOne = state.mode === 1 || state.stage === 0;
    if (state.mode === 2 && state.stage === 0 && state.method === 'transpose') {
      if (operation !== 'transpose') return;
      const changedSign = state.constantSign === '+' ? '−' : '+';
      const movedRight = state.constantSign === '+'
        ? state.originalRight + ' − ' + state.constant
        : state.originalRight + ' + ' + state.constant;
      addWorkLine(state.originalLeft + ' = ' + state.originalRight + ' → ' + state.coefficient + 'x = ' + movedRight + '　（移項時變號）', false);
      state.left = state.coefficient + 'x';
      state.right = String(state.reducedRight);
      state.stage = 1;
      addWorkLine(state.left + ' = ' + state.right, true);
      showTransposition('移出 ' + state.constantSign + state.constant, '改成 ' + changedSign + state.constant);
      setBalance(state.left, state.right, '移項後常數項變號：' + state.left + ' = ' + state.right + '。');
      updateFeedback('移項跳步：把 ' + state.constantSign + state.constant + ' 移到右邊，變成 ' + changedSign + state.constant + '。', 'correct');
      render();
      return;
    }

    const expected = stageOne
      ? (state.mode === 1 ? state.inverse : state.firstInverse)
      : 'divide';
    const value = state.mode === 1 ? state.operand : (stageOne ? state.constant : state.coefficient);
    if (operation !== expected) {
      state.attempts = (state.attempts || 0) + 1;
      const selectedLabel = formatOperation(operation, value);
      showOperationOnBothSides(selectedLabel);
      const targetText = state.mode === 1
        ? '讓左邊只剩下 x'
        : (stageOne ? '讓左邊只剩下含 x 的項' : '讓 x 前面的係數變成 1');
      updateFeedback('左右同做 ' + selectedLabel + ' 仍可保持平衡，但這一步未能' + targetText + '。再試一次。', 'try');
      return;
    }

    showOperationOnBothSides(formatOperation(operation, value));
    if (state.mode === 1) {
      const transformedLeft = state.originalLeft + ' ' + symbols[operation] + ' ' + value;
      const transformedRight = state.originalRight + ' ' + symbols[operation] + ' ' + value;
      addWorkLine('兩邊同時 ' + formatOperation(operation, value) + '：', false);
      addWorkLine(transformedLeft + ' = ' + transformedRight, false);
      solveCurrentQuestion();
      return;
    }

    if (state.stage === 0) {
      addWorkLine('兩邊同時 ' + formatOperation(operation, value) + '：', false);
      addWorkLine(state.originalLeft + ' ' + symbols[operation] + ' ' + value + ' = ' + state.originalRight + ' ' + symbols[operation] + ' ' + value, false);
      state.left = state.coefficient + 'x';
      state.right = String(state.reducedRight);
      state.stage = 1;
      addWorkLine(state.left + ' = ' + state.right, true);
      setBalance(state.left, state.right, '左右同時做相同運算，天平仍然平衡。');
      updateFeedback('正確！常數項已消去。下一步把 ' + state.coefficient + 'x 變成 x。', 'correct');
      render();
      return;
    }

    const transformedLeft = state.coefficient + 'x ÷ ' + state.coefficient;
    const transformedRight = state.right + ' ÷ ' + state.coefficient;
    addWorkLine('兩邊同時 ' + formatOperation(operation, value) + '：', false);
    addWorkLine(transformedLeft + ' = ' + transformedRight, false);
    solveCurrentQuestion();
  }

  function switchMode(mode) {
    activeMode = mode;
    if (!modeProgress[mode].state) modeProgress[mode].state = makeQuestion(mode);
    render();
    const state = modeProgress[mode].state;
    if (state.history.length === 0) {
      updateFeedback(mode === 1 ? '先選一個相反運算，並在等號兩邊同時操作。' : '先選擇「天平逐步」或「移項跳步」。', 'neutral');
    } else if (state.completed) {
      updateFeedback('本題已完成，答案是 x = ' + state.solution + '。', 'complete');
    } else {
      updateFeedback('你已完成一步，繼續用相同原則讓 x 單獨留下。', 'correct');
    }
  }

  function nextQuestion() {
    const progress = modeProgress[activeMode];
    if (!progress.state || !progress.state.completed) return;
    progress.question += 1;
    progress.state = makeQuestion(activeMode);
    updateFeedback('新一題開始。保持等號兩邊平衡。', 'neutral');
    render();
  }

  function resetMode() {
    modeProgress[activeMode].solved = 0;
    modeProgress[activeMode].question = 1;
    modeProgress[activeMode].state = makeQuestion(activeMode);
    updateFeedback('已重新開始本模式。', 'neutral');
    render();
  }

  elements.hintToggle.addEventListener('click', function () {
    const open = elements.hintPanel.hidden;
    elements.hintPanel.hidden = !open;
    elements.hintToggle.setAttribute('aria-expanded', String(open));
    elements.hintToggle.textContent = open ? '收起提示' : '打開提示';
  });

  elements.modeTabs[0].addEventListener('click', function () { switchMode(1); });
  elements.modeTabs[1].addEventListener('click', function () { switchMode(2); });
  elements.methodBalance.addEventListener('click', function () {
    const state = currentState();
    if (state.stage > 0 || state.completed) return;
    state.method = 'balance';
    updateFeedback('天平逐步：左右同時做相同運算，保持平衡。', 'neutral');
    render();
  });
  elements.methodTranspose.addEventListener('click', function () {
    const state = currentState();
    if (state.stage > 0 || state.completed) return;
    state.method = 'transpose';
    updateFeedback('移項跳步：把常數項移到右邊，符號要改變。', 'neutral');
    render();
  });
  elements.nextQuestion.addEventListener('click', nextQuestion);
  elements.resetMode.addEventListener('click', resetMode);
  elements.hintExampleTabs[0].addEventListener('click', function () { resetHintDemo('add'); });
  elements.hintExampleTabs[1].addEventListener('click', function () { resetHintDemo('multiply'); });
  elements.hintReset.addEventListener('click', function () { resetHintDemo(); });
  attachDropTarget(elements.dropZone, 'practice', submitOperation);
  attachDropTarget(elements.hintDrop, 'hint', applyHintOperation);

  modeProgress[1].state = makeQuestion(1);
  renderHintDemo();
  render();
  updateFeedback('先選一個相反運算，並在等號兩邊同時操作。', 'neutral');
}());
