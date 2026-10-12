(function () {
  'use strict';

  const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  const scoreStorageKey = 's1ch4ex1_scores';
  const pageEntryTime = new Date();
  const keyDefinitions = [
    { value: '7', label: '7' }, { value: '8', label: '8' }, { value: '9', label: '9' },
    { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' },
    { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
    { value: 'NEG', label: '−', ariaLabel: '負號' }, { value: '0', label: '0' },
    { value: 'DEL', label: '⌫', ariaLabel: '刪除最後一位' },
    { value: 'SUBMIT', label: '確定', ariaLabel: '確定答案', submit: true }
  ];

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
    board: document.getElementById('balance-drop-zone'),
    balanceSvg: document.getElementById('balance-svg'),
    leftEquation: document.getElementById('scale-left-equation'),
    rightEquation: document.getElementById('scale-right-equation'),
    leftStamp: document.getElementById('scale-left-stamp'),
    rightStamp: document.getElementById('scale-right-stamp'),
    practiceTargets: {
      left: document.getElementById('practice-left-target'),
      right: document.getElementById('practice-right-target')
    },
    dropStatus: document.getElementById('drop-status'),
    workSteps: document.getElementById('work-steps'),
    practiceAnswerDisplay: document.getElementById('practice-answer-display'),
    practiceAnswerArea: document.getElementById('practice-answer-area'),
    practiceAnswerPrompt: document.getElementById('practice-answer-prompt'),
    practiceKeypad: document.getElementById('practice-keypad'),
    operationTitle: document.getElementById('operation-title'),
    operationSubtitle: document.getElementById('operation-subtitle'),
    operationTray: document.getElementById('operation-tray'),
    feedback: document.getElementById('feedback'),
    nextQuestion: document.getElementById('next-question'),
    resetMode: document.getElementById('reset-mode'),
    hintExampleTabs: [document.getElementById('hint-example-add'), document.getElementById('hint-example-multiply')],
    hintBoard: document.getElementById('hint-balance-board'),
    hintSvg: document.getElementById('hint-balance-svg'),
    hintLeftEquation: document.getElementById('hint-left-equation'),
    hintRightEquation: document.getElementById('hint-right-equation'),
    hintLeftStamp: document.getElementById('hint-left-stamp'),
    hintRightStamp: document.getElementById('hint-right-stamp'),
    hintTargets: {
      left: document.getElementById('hint-left-target'),
      right: document.getElementById('hint-right-target')
    },
    hintDropStatus: document.getElementById('hint-drop-status'),
    hintWorkSteps: document.getElementById('hint-work-steps'),
    hintAnswerDisplay: document.getElementById('hint-answer-display'),
    hintAnswerArea: document.getElementById('hint-answer-area'),
    hintAnswerPrompt: document.getElementById('hint-answer-prompt'),
    hintKeypad: document.getElementById('hint-keypad'),
    hintOperationTray: document.getElementById('hint-operation-tray'),
    hintFeedback: document.getElementById('hint-demo-feedback'),
    hintReset: document.getElementById('hint-demo-reset'),
    scoreModal: document.getElementById('score-modal'),
    openScore: document.getElementById('open-score-card'),
    closeScoreIcon: document.getElementById('close-score-icon'),
    closeScoreButton: document.getElementById('close-score-button'),
    resetScores: document.getElementById('reset-scores'),
    printWorksheet: document.getElementById('print-worksheet'),
    scoreStartTime: document.getElementById('score-card-start-time'),
    studentClass: document.getElementById('student-class'),
    studentName: document.getElementById('student-name'),
    studentNumber: document.getElementById('student-number'),
    printArea: document.getElementById('print-worksheet-container')
  };

  const hintExamples = {
    add: {
      type: 0, left: 'x + 3', right: '11', operand: 3, inverse: 'subtract', solution: 8
    },
    multiply: {
      type: 2, left: '2x', right: '8', operand: 2, inverse: 'divide', solution: 4
    }
  };

  let activeMode = 1;
  let activeHintExample = 'add';
  let hintState = null;
  let activeKeyboardContext = null;
  let dragJustEnded = false;
  let printInProgress = false;
  let scores = readScores();

  function emptyScores() {
    return { 1: { correct: 0, wrong: 0 }, 2: { correct: 0, wrong: 0 } };
  }

  function readScores() {
    const empty = emptyScores();
    try {
      const parsed = JSON.parse(window.localStorage.getItem(scoreStorageKey) || 'null');
      [1, 2].forEach(function (mode) {
        const saved = parsed && parsed[mode];
        empty[mode] = {
          correct: Number.isInteger(saved && saved.correct) && saved.correct >= 0 ? saved.correct : 0,
          wrong: Number.isInteger(saved && saved.wrong) && saved.wrong >= 0 ? saved.wrong : 0
        };
      });
    } catch (error) {
      console.warn('無法讀取本機分數。');
    }
    return empty;
  }

  const modeProgress = {
    1: { solved: scores[1].correct + scores[1].wrong, state: null },
    2: { solved: scores[2].correct + scores[2].wrong, state: null }
  };

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatInt(value) {
    const integer = Number(value);
    return integer < 0 ? '−' + Math.abs(integer) : String(integer);
  }

  function signedMagnitude(magnitude, negative) {
    return negative ? -Math.abs(magnitude) : Math.abs(magnitude);
  }

  function generateQuestionData(mode) {
    if (mode === 1) {
      const type = randomInt(0, 3);
      const operand = randomInt(2, 6);
      const magnitudeRoll = Math.random();
      const negative = Math.random() < 0.5;
      const minMagnitude = type === 1 && !negative ? operand + 1 : 3;
      const magnitude = minMagnitude + Math.floor(magnitudeRoll * (12 - minMagnitude + 1));
      let solution;
      let left;
      let right;

      if (type === 0) {
        solution = signedMagnitude(magnitude, negative);
        left = 'x + ' + operand;
        right = solution + operand;
      } else if (type === 1) {
        solution = signedMagnitude(magnitude, negative);
        left = 'x − ' + operand;
        right = solution - operand;
      } else if (type === 2) {
        solution = signedMagnitude(magnitude, negative);
        left = operand + 'x';
        right = operand * solution;
      } else {
        const rightValue = signedMagnitude(magnitude, negative);
        solution = rightValue * operand;
        left = 'x ÷ ' + operand;
        right = rightValue;
      }

      return {
        mode: 1,
        type: type,
        originalLeft: left,
        originalRight: String(right),
        answer: solution,
        operand: operand,
        inverse: type === 0 ? 'subtract' : (type === 1 ? 'add' : (type === 2 ? 'divide' : 'multiply'))
      };
    }

    const coefficient = randomInt(2, 5);
    const magnitude = randomInt(2, 9);
    const negative = Math.random() < 0.5;
    const solution = signedMagnitude(magnitude, negative);
    const constant = randomInt(2, 8);
    const plus = Math.random() < 0.5;
    const constantSign = plus ? '+' : '−';
    const reducedRight = coefficient * solution;
    const right = plus ? reducedRight + constant : reducedRight - constant;

    return {
      mode: 2,
      type: 'two-step',
      originalLeft: coefficient + 'x ' + constantSign + ' ' + constant,
      originalRight: String(right),
      answer: solution,
      coefficient: coefficient,
      constant: constant,
      constantSign: constantSign,
      reducedRight: reducedRight,
      firstInverse: plus ? 'subtract' : 'add'
    };
  }

  function makeQuestionState(mode) {
    const data = generateQuestionData(mode);
    return {
      mode: mode,
      type: data.type,
      originalLeft: data.originalLeft,
      originalRight: data.originalRight,
      left: data.originalLeft,
      right: data.originalRight,
      solution: data.answer,
      operand: data.operand,
      inverse: data.inverse,
      coefficient: data.coefficient,
      constant: data.constant,
      constantSign: data.constantSign,
      reducedRight: data.reducedRight,
      firstInverse: data.firstInverse,
      stage: 0,
      method: 'balance',
      phase: 'operations',
      history: [{ left: data.originalLeft, right: formatInt(data.originalRight), current: true }],
      sideOperations: { left: null, right: null },
      selectedOperation: null,
      answerSpec: null,
      inputValue: '',
      attempts: 0,
      hadMistake: false,
      transientFeedback: null,
      completed: false,
      scrollToLatest: false,
      errorTimer: null
    };
  }

  function currentState() {
    if (!modeProgress[activeMode].state) modeProgress[activeMode].state = makeQuestionState(activeMode);
    return modeProgress[activeMode].state;
  }

  function contextState(context) {
    return context === 'hint' ? hintState : currentState();
  }

  function formatOperation(operation, value) {
    return symbols[operation] + ' ' + value;
  }

  function formatRightOperation(right, operation, value) {
    return formatInt(right) + ' ' + symbols[operation] + ' ' + value;
  }

  function getStageSpec(state) {
    if (state.mode === 1) {
      return {
        expected: state.inverse,
        value: state.operand,
        leftBefore: state.originalLeft,
        rightBefore: state.originalRight,
        afterLeft: 'x',
        afterRight: formatRightOperation(state.originalRight, state.inverse, state.operand),
        answerLeft: 'x',
        answer: state.solution,
      targetText: '令左邊只剩下 x',
        cancelParts: cancellationParts(state, 0)
      };
    }

    if (state.stage === 0) {
      return {
        expected: state.firstInverse,
        value: state.constant,
        leftBefore: state.originalLeft,
        rightBefore: state.originalRight,
        afterLeft: state.coefficient + 'x',
        afterRight: formatRightOperation(state.originalRight, state.firstInverse, state.constant),
        answerLeft: state.coefficient + 'x',
        answer: state.reducedRight,
        nextStage: true,
      targetText: '令左邊只剩下含 x 的項',
        cancelParts: cancellationParts(state, 0)
      };
    }

    return {
      expected: 'divide',
      value: state.coefficient,
      leftBefore: state.coefficient + 'x',
      rightBefore: String(state.reducedRight),
      afterLeft: 'x',
      afterRight: formatRightOperation(state.reducedRight, 'divide', state.coefficient),
      answerLeft: 'x',
      answer: state.solution,
      targetText: '令 x 前面的係數變成 1',
      cancelParts: cancellationParts(state, 1)
    };
  }

  function cancellationParts(state, stage) {
    const number = String(stage === 0 && state.mode === 1 ? state.operand : (stage === 0 ? state.constant : state.coefficient));
    const coefficientX = state.mode === 2 ? state.coefficient + 'x' : 'x';
    if (state.mode === 1 && state.type === 0) {
      return [{ text: 'x' }, { text: ' + ' + number + ' − ' + number, cancelled: true }];
    }
    if (state.mode === 1 && state.type === 1) {
      return [{ text: 'x' }, { text: ' − ' + number + ' + ' + number, cancelled: true }];
    }
    if (state.mode === 1 && state.type === 2) {
      return [{ text: String(state.operand), cancelled: true }, { text: 'x' }, { text: ' ÷ ' + state.operand, cancelled: true }];
    }
    if (state.mode === 1 && state.type === 3) {
      return [{ text: 'x' }, { text: ' ÷ ' + number + ' × ' + number, cancelled: true }];
    }
    if (state.mode === 2 && stage === 0 && state.constantSign === '+') {
      return [{ text: coefficientX }, { text: ' + ' + number + ' − ' + number, cancelled: true }];
    }
    if (state.mode === 2 && stage === 0) {
      return [{ text: coefficientX }, { text: ' − ' + number + ' + ' + number, cancelled: true }];
    }
    return [{ text: String(state.coefficient), cancelled: true }, { text: 'x' }, { text: ' ÷ ' + state.coefficient, cancelled: true }];
  }

  function stageQuestion(state) {
    return state.mode === 2 && state.stage === 0 ? '第一步先留下含 x 的項' : '令 x 單獨留下';
  }

  function appendHistoryRow(state, row) {
    state.history.forEach(function (entry) { entry.current = false; });
    row.current = true;
    state.history.push(row);
    state.scrollToLatest = true;
  }

  function renderHistory(container, state, context) {
    container.replaceChildren();
    state.history.forEach(function (entry, index) {
      const wrap = document.createElement('div');
      wrap.className = 'equation-step-wrap' + (entry.current ? ' is-current' : '');
      wrap.dataset.stepIndex = String(index);

      const grid = document.createElement('div');
      grid.className = 'equation-grid' + (entry.current ? ' is-current' : '');
      grid.setAttribute('aria-label', entry.left + ' = ' + entry.right);

      const left = document.createElement('span');
      left.className = 'step-left';
      if (entry.cancelled && entry.cancelParts) {
        entry.cancelParts.forEach(function (part) {
          const segment = document.createElement(part.cancelled ? 'del' : 'span');
          segment.textContent = part.text;
          if (part.cancelled) segment.className = 'cancelled-term';
          left.appendChild(segment);
        });
      } else {
        left.textContent = entry.left;
      }

      const equals = document.createElement('span');
      equals.className = 'step-equals';
      equals.textContent = '=';

      const right = document.createElement('span');
      right.className = 'step-right';
      right.textContent = entry.right;
      grid.append(left, equals, right);
      wrap.appendChild(grid);

      if (entry.canCancel && state.phase === 'cancel' && state.cancelRowIndex === index) {
        const action = document.createElement('div');
        action.className = 'step-cancel-action';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cancel-button';
        button.dataset.cancelContext = context;
        button.textContent = '抵消';
        action.appendChild(button);
        wrap.appendChild(action);
      }
      container.appendChild(wrap);
    });

    if (state.scrollToLatest && container.lastElementChild && typeof container.lastElementChild.scrollIntoView === 'function') {
      container.lastElementChild.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      state.scrollToLatest = false;
    }
  }

  function renderScaleEquation(node, equation) {
    const words = String(equation).replace(/-/g, '−').trim().split(/\s+/);
    const lines = [];
    words.forEach(function (word) {
      const current = lines.length - 1;
      if (current < 0 || (lines[current] + ' ' + word).trim().length > 8) lines.push(word);
      else lines[current] += ' ' + word;
    });
    node.replaceChildren();
    node.setAttribute('y', lines.length === 1 ? '106' : '94');
    lines.forEach(function (line, index) {
      const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      span.setAttribute('x', node.getAttribute('x'));
      if (index > 0) span.setAttribute('dy', '20');
      span.textContent = line;
      node.appendChild(span);
    });
  }

  function setFeedback(context, message, kind) {
    const feedback = context === 'hint' ? elements.hintFeedback : elements.feedback;
    const liveStatus = context === 'hint' ? elements.hintDropStatus : elements.dropStatus;
    feedback.textContent = message;
    feedback.dataset.kind = kind || 'neutral';
    liveStatus.textContent = message;
  }

  function setTransientFeedback(state, context, message, kind) {
    state.transientFeedback = { message: message, kind: kind || 'neutral' };
    setFeedback(context, message, kind);
  }

  function operationWeight(operation) {
    return operation === 'add' ? 1 : (operation === 'subtract' ? -1 : (operation === 'multiply' ? 2 : (operation === 'divide' ? -2 : 0)));
  }

  function updateBalanceBoard(state, context) {
    const board = context === 'hint' ? elements.hintBoard : elements.board;
    const svg = context === 'hint' ? elements.hintSvg : elements.balanceSvg;
    const leftEquation = context === 'hint' ? elements.hintLeftEquation : elements.leftEquation;
    const rightEquation = context === 'hint' ? elements.hintRightEquation : elements.rightEquation;
    const leftStamp = context === 'hint' ? elements.hintLeftStamp : elements.leftStamp;
    const rightStamp = context === 'hint' ? elements.hintRightStamp : elements.rightStamp;
    const targets = context === 'hint' ? elements.hintTargets : elements.practiceTargets;
    const leftOperation = state.sideOperations.left;
    const rightOperation = state.sideOperations.right;
    const isBalanced = Boolean(leftOperation && rightOperation && leftOperation === rightOperation);

    renderScaleEquation(leftEquation, state.left);
    renderScaleEquation(rightEquation, state.right);
    leftStamp.textContent = leftOperation ? formatOperation(leftOperation, stageOperationValue(state)) : '';
    rightStamp.textContent = rightOperation ? formatOperation(rightOperation, stageOperationValue(state)) : '';
    leftStamp.classList.toggle('is-visible', Boolean(leftOperation));
    rightStamp.classList.toggle('is-visible', Boolean(rightOperation));

    board.classList.remove('is-tilted-left', 'is-tilted-right', 'is-balanced');
    if (isBalanced) {
      board.classList.add('is-balanced');
    } else if (leftOperation || rightOperation) {
      let tilt;
      if (leftOperation && !rightOperation) tilt = operationWeight(leftOperation) >= 0 ? 'left' : 'right';
      else if (rightOperation && !leftOperation) tilt = operationWeight(rightOperation) >= 0 ? 'right' : 'left';
      else {
        const weightDifference = operationWeight(leftOperation) - operationWeight(rightOperation);
        tilt = weightDifference === 0 || weightDifference > 0 ? 'left' : 'right';
      }
      board.classList.add('is-tilted-' + tilt);
    }

    const phaseAllowsPlacement = state.phase === 'operations';
    ['left', 'right'].forEach(function (side) {
      const target = targets[side];
      const operation = state.sideOperations[side];
      target.disabled = !phaseAllowsPlacement;
      target.classList.toggle('has-operation', Boolean(operation));
      target.classList.toggle('is-correct', Boolean(isBalanced && operation));
      target.textContent = operation ? formatOperation(operation, stageOperationValue(state)) : '放卡';
      target.setAttribute('aria-label', context === 'hint' ? '提示天平' + sideLabel(side) + (operation ? '已放 ' + formatOperation(operation, stageOperationValue(state)) : '放置區') : '天平' + sideLabel(side) + (operation ? '已放 ' + formatOperation(operation, stageOperationValue(state)) : '放置區'));
    });

    const boardStatus = isBalanced ? '天平平衡。' : (leftOperation || rightOperation ? tiltText(board) : '天平兩邊保持平衡。');
    svg.setAttribute('aria-label', '天平左邊是 ' + state.left + '，右邊是 ' + state.right + '；' + boardStatus);
    if (context === 'practice') elements.dropStatus.textContent = boardStatus;
    else elements.hintDropStatus.textContent = boardStatus;
  }

  function tiltText(board) {
    return board.classList.contains('is-tilted-left') ? '天平左邊下沉。' : '天平右邊下沉。';
  }

  function sideLabel(side) {
    return side === 'left' ? '左盤' : '右盤';
  }

  function stageOperationValue(state) {
    if (state.mode === 1) return state.operand;
    return state.stage === 0 ? state.constant : state.coefficient;
  }

  function cardOperations(state) {
    if (state.mode === 2 && state.stage === 0 && state.method === 'transpose') {
      const changedSign = state.constantSign === '+' ? '−' : '+';
      return [{ id: 'transpose', symbol: '移項', value: state.constantSign + state.constant + ' → ' + changedSign + state.constant }];
    }
    const value = stageOperationValue(state);
    return ['add', 'subtract', 'multiply', 'divide'].map(function (operation) {
      return { id: operation, symbol: symbols[operation], value: value };
    });
  }

  function createOperationCard(operation, context, selected) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'operation-card' + (operation.id === 'transpose' ? ' is-move' : '');
    button.draggable = true;
    button.dataset.operation = operation.id;
    button.dataset.context = context;
    button.setAttribute('aria-pressed', String(selected === operation.id));
    button.setAttribute('aria-label', operation.id === 'transpose'
      ? '移項卡：把 ' + operation.value + ' 移到右邊'
      : '運算卡 ' + formatOperation(operation.id, operation.value));
    const symbol = document.createElement('span');
    symbol.className = 'operator-symbol';
    symbol.textContent = operation.symbol;
    const value = document.createElement('span');
    value.className = 'operator-value';
    value.textContent = operation.value;
    button.append(symbol, value);
    button.addEventListener('click', function () {
      if (dragJustEnded) {
        dragJustEnded = false;
        return;
      }
      selectOperation(context, operation.id);
    });
    button.addEventListener('dragstart', function (event) {
      if (!event.dataTransfer) return;
      event.dataTransfer.setData('text/plain', JSON.stringify({ context: context, operation: operation.id }));
      event.dataTransfer.effectAllowed = 'move';
    });
    button.addEventListener('dragend', function () {
      dragJustEnded = true;
      window.setTimeout(function () { dragJustEnded = false; }, 0);
    });
    return button;
  }

  function renderOperationCards(state, context, tray, title, subtitle) {
    tray.replaceChildren();
    if (state.completed || (state.phase !== 'operations')) {
      if (context === 'practice') {
        title.textContent = state.completed ? '本題已完成' : (state.phase === 'cancel' ? '兩邊相同，按「抵消」' : (state.phase === 'answer' ? '計算右邊的結果' : '正在更新天平'));
        subtitle.textContent = state.completed ? '按「下一題」繼續。' : '完成目前步驟後，繼續下一步。';
      }
      return;
    }

    const operations = cardOperations(state);
    if (context === 'practice') {
      const spec = state.mode === 2 && state.stage === 0 && state.method === 'transpose';
      title.textContent = spec ? '把常數項移到等號右邊' : (state.mode === 1 ? '選擇相反運算' : (state.stage === 0 ? '先消去常數項' : '再令 x 的係數變成 1'));
      subtitle.textContent = spec ? '選取移項卡，再放到右盤；右邊先保留未運算式子。' : '選卡後放到左盤或右盤；再在另一邊放相同運算。';
    }

    operations.forEach(function (operation) {
      tray.appendChild(createOperationCard(operation, context, state.selectedOperation));
    });
  }

  function renderAnswerArea(state, context) {
    const area = context === 'hint' ? elements.hintAnswerArea : elements.practiceAnswerArea;
    const display = context === 'hint' ? elements.hintAnswerDisplay : elements.practiceAnswerDisplay;
    const prompt = context === 'hint' ? elements.hintAnswerPrompt : elements.practiceAnswerPrompt;
    const visible = state.phase === 'answer' && Boolean(state.answerSpec);
    area.hidden = !visible;
    if (!visible) return;
    display.textContent = state.inputValue || '—';
    prompt.textContent = state.answerSpec.isIntermediate
      ? '計算右邊未運算式子的結果，再輸入數值。'
      : '輸入右邊計算結果；書寫時可以跳過抵消這一行。';
  }

  function renderHistoryAndAnswer(state, context) {
    const steps = context === 'hint' ? elements.hintWorkSteps : elements.workSteps;
    renderHistory(steps, state, context);
    renderAnswerArea(state, context);
  }

  function renderPractice() {
    const state = currentState();
    const progress = modeProgress[activeMode];
    elements.modeTabs.forEach(function (button, index) {
      const selected = activeMode === index + 1;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    elements.stepKicker.textContent = activeMode === 1 ? '一步方程' : '兩步方程';
    const questionNumber = progress.solved + (state.completed ? 0 : 1);
    elements.progressPill.textContent = '第 ' + questionNumber + ' 題 · 已完成 ' + progress.solved + ' 題';
    elements.equation.textContent = state.originalLeft + ' = ' + formatInt(state.originalRight);
    elements.methodRow.hidden = activeMode !== 2;
    elements.methodBalance.classList.toggle('is-selected', state.method === 'balance');
    elements.methodTranspose.classList.toggle('is-selected', state.method === 'transpose');
    elements.methodBalance.setAttribute('aria-pressed', String(state.method === 'balance'));
    elements.methodTranspose.setAttribute('aria-pressed', String(state.method === 'transpose'));
    const methodCanChange = state.mode === 2 && state.stage === 0 && !state.completed;
    elements.methodBalance.disabled = !methodCanChange;
    elements.methodTranspose.disabled = !methodCanChange;

    if (activeMode === 1) {
      elements.instruction.textContent = '先把相反運算放到一邊，再在另一邊放相同運算。';
      elements.methodDescription.textContent = '兩邊都做相反運算，讓左邊只剩下 x。';
    } else if (state.stage === 0 && state.method === 'transpose') {
      elements.instruction.textContent = '移項跳步：把常數項移到右邊，正負號改變。';
      elements.methodDescription.textContent = '直接寫出未運算的右邊，再用數字鍵盤計算。';
    } else if (state.stage === 0) {
      elements.instruction.textContent = '先在兩邊做相同運算，讓左邊只剩下含 x 的項。';
      elements.methodDescription.textContent = '天平先保持平衡；抵消步驟可以在書寫時略過。';
    } else if (!state.completed) {
      elements.instruction.textContent = '常數項已消去；現在令 x 前面的係數變成 1。';
      elements.methodDescription.textContent = '兩邊同除以未知數的係數。';
    } else {
      elements.instruction.textContent = '完成兩步運算，x 已單獨留下。';
      elements.methodDescription.textContent = '逐步寫法和移項跳步都會得到相同答案。';
    }

    renderHistoryAndAnswer(state, 'practice');
    updateBalanceBoard(state, 'practice');
    renderOperationCards(state, 'practice', elements.operationTray, elements.operationTitle, elements.operationSubtitle);
    elements.nextQuestion.disabled = !state.completed;
    elements.nextQuestion.textContent = state.completed ? '下一題' : '完成這題後可繼續';
    refreshKeyboardContext();
  }

  function renderHint() {
    const state = hintState;
    elements.hintExampleTabs.forEach(function (button, index) {
      const selected = (index === 0 && activeHintExample === 'add') || (index === 1 && activeHintExample === 'multiply');
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderHistoryAndAnswer(state, 'hint');
    updateBalanceBoard(state, 'hint');
    renderOperationCards(state, 'hint', elements.hintOperationTray, null, null);
    if (state.transientFeedback) {
      setFeedback('hint', state.transientFeedback.message, state.transientFeedback.kind);
    } else if (state.phase === 'complete') {
      setFeedback('hint', '示範完成：' + state.left + ' = ' + formatInt(state.solution) + '。', 'correct');
      elements.hintReset.hidden = false;
    } else if (state.phase === 'cancel') {
      setFeedback('hint', '天平已平衡。按「抵消」，再計算右邊。', 'neutral');
    } else if (state.phase === 'answer') {
      setFeedback('hint', '右邊仍是未運算式子。用鍵盤輸入計算結果。', 'neutral');
    } else if (state.phase === 'error') {
      setFeedback('hint', state.feedbackMessage || '這一步不正確，再試一次。', 'try');
    } else if (state.sideOperations.left || state.sideOperations.right) {
      setFeedback('hint', '天平傾斜；另一邊也要做相同運算。', 'neutral');
    } else if (state.completed) {
      setFeedback('hint', '示範完成。按「重來」再試。', 'correct');
    } else {
      setFeedback('hint', '選一張運算卡，再分別放到左右盤。', 'neutral');
    }
    elements.hintReset.hidden = false;
    refreshKeyboardContext('hint');
  }

  function keyboardContextAvailable(context) {
    if (context !== 'practice' && context !== 'hint') return false;
    if (context === 'hint' && elements.hintPanel.hidden) return false;
    const state = contextState(context);
    return Boolean(state && state.phase === 'answer' && state.answerSpec);
  }

  function refreshKeyboardContext(preferredContext) {
    if (keyboardContextAvailable(preferredContext)) {
      activeKeyboardContext = preferredContext;
      return;
    }
    if (keyboardContextAvailable(activeKeyboardContext)) return;
    if (keyboardContextAvailable('hint')) activeKeyboardContext = 'hint';
    else if (keyboardContextAvailable('practice')) activeKeyboardContext = 'practice';
    else activeKeyboardContext = null;
  }

  function selectOperation(context, operation) {
    const state = contextState(context);
    if (state.phase !== 'operations') return;
    state.transientFeedback = null;
    state.selectedOperation = state.selectedOperation === operation ? null : operation;
    if (state.selectedOperation) {
      setFeedback(context, '已選 ' + operationCardText(state, operation) + '。請點左盤或右盤。', 'neutral');
    } else {
      setFeedback(context, '已取消選取。', 'neutral');
    }
    if (context === 'hint') renderHint();
    else renderPractice();
  }

  function operationCardText(state, operation) {
    if (operation === 'transpose') {
      const changedSign = state.constantSign === '+' ? '−' : '+';
      return '移項 ' + state.constantSign + state.constant + ' → ' + changedSign + state.constant;
    }
    return formatOperation(operation, stageOperationValue(state));
  }

  function handlePlace(context, side, operation) {
    const state = contextState(context);
    if (!state || state.phase !== 'operations') return;
    state.transientFeedback = null;

    if (operation === 'transpose') {
      if (side !== 'right') {
        setFeedback(context, '移項卡要放到右盤，表示把常數項移到等號右邊。', 'try');
        return;
      }
      startTransposition(state, context);
      return;
    }

    state.sideOperations[side] = operation;
    state.selectedOperation = null;
    if (operation !== getStageSpec(state).expected) {
      state.hadMistake = true;
    }

    updateBalanceBoard(state, context);
    const leftOperation = state.sideOperations.left;
    const rightOperation = state.sideOperations.right;
    if (!leftOperation || !rightOperation) {
      setFeedback(context, '天平傾斜；另一邊也要做相同運算。', 'neutral');
      if (context === 'hint') renderHint();
      else renderPractice();
      return;
    }

    if (leftOperation !== rightOperation) {
      setTransientFeedback(state, context, '兩邊要做相同運算。可以再放一次取代其中一邊。', 'try');
      if (context === 'hint') renderHint();
      else renderPractice();
      return;
    }

    const spec = getStageSpec(state);
    if (leftOperation !== spec.expected) {
      state.hadMistake = true;
      state.attempts += 1;
      state.phase = 'error';
      state.feedbackMessage = '天平仍然平衡，但這一步未能' + spec.targetText + '。戳印清除後再試。';
      setFeedback(context, state.feedbackMessage, 'try');
      if (context === 'hint') renderHint();
      else renderPractice();
      if (state.errorTimer) window.clearTimeout(state.errorTimer);
      state.errorTimer = window.setTimeout(function () {
        if (state.phase !== 'error') return;
        state.sideOperations = { left: null, right: null };
        state.selectedOperation = null;
        state.phase = 'operations';
        state.errorTimer = null;
        if (context === 'hint') renderHint();
        else renderPractice();
      }, 700);
      return;
    }

    state.phase = 'cancel';
    state.answerSpec = spec;
    state.sideOperations = { left: leftOperation, right: rightOperation };
    state.cancelRowIndex = state.history.length;
    appendHistoryRow(state, {
      left: spec.leftBefore + ' ' + symbols[spec.expected] + ' ' + spec.value,
      right: formatRightOperation(spec.rightBefore, spec.expected, spec.value),
      current: true,
      canCancel: true,
      cancelled: false,
      cancelParts: spec.cancelParts
    });
    setFeedback(context, '兩邊做相同運算，天平回復平衡。按「抵消」後，右邊仍會保留未運算式子。', 'correct');
    if (context === 'hint') renderHint();
    else renderPractice();
  }

  function startTransposition(state, context) {
    const operation = state.constantSign === '+' ? 'subtract' : 'add';
    const movedRight = formatRightOperation(state.originalRight, operation, state.constant);
    const left = state.coefficient + 'x';
    state.selectedOperation = null;
    state.left = left;
    state.right = movedRight;
    state.answerSpec = {
      answerLeft: left,
      answer: state.reducedRight,
      isIntermediate: true,
      nextStage: true
    };
    state.phase = 'answer';
    state.inputValue = '';
    appendHistoryRow(state, { left: left, right: movedRight, current: true });
    activeKeyboardContext = context;
    setFeedback(context, '移項跳步：直接寫出右邊未運算式子 ' + left + ' = ' + movedRight + '，再用鍵盤計算。', 'correct');
    if (context === 'hint') renderHint();
    else renderPractice();
  }

  function cancelOperation(context) {
    const state = contextState(context);
    if (!state || state.phase !== 'cancel' || !state.answerSpec) return;
    state.transientFeedback = null;
    const row = state.history[state.cancelRowIndex];
    if (!row || !row.canCancel) return;

    row.canCancel = false;
    row.cancelled = true;
    state.left = state.answerSpec.afterLeft;
    state.right = state.answerSpec.afterRight;
    appendHistoryRow(state, { left: state.left, right: state.right, current: true });
    state.phase = 'answer';
    state.inputValue = '';
    state.sideOperations = { left: null, right: null };
    activeKeyboardContext = context;
    setFeedback(context, '左邊已抵消；右邊保持未運算。書寫時可以跳過抵消這一行，請輸入右邊結果。', 'neutral');
    if (context === 'hint') renderHint();
    else renderPractice();
  }

  function parseInputValue(value) {
    if (!value || value === '−') return null;
    const parsed = Number(String(value).replace('−', '-'));
    return Number.isInteger(parsed) ? parsed : null;
  }

  function inputKey(context, key) {
    const state = contextState(context);
    if (!state || state.phase !== 'answer') return;
    state.transientFeedback = null;
    activeKeyboardContext = context;

    if (key === 'SUBMIT') {
      submitAnswer(context, state);
      return;
    }
    if (key === 'DEL') {
      state.inputValue = state.inputValue.slice(0, -1);
    } else if (key === 'NEG') {
      if (!state.inputValue) state.inputValue = '−';
      else if (state.inputValue === '−') state.inputValue = '';
    } else if (/^\d$/.test(key)) {
      if (state.inputValue === '−') state.inputValue += key;
      else if (state.inputValue === '0') state.inputValue = key;
      else if (state.inputValue === '−0') state.inputValue = '−' + key;
      else state.inputValue += key;
    }

    if (context === 'hint') renderHint();
    else renderPractice();
  }

  function submitAnswer(context, state) {
    const answer = parseInputValue(state.inputValue);
    if (answer === null) {
      setTransientFeedback(state, context, '請輸入整數答案。', 'try');
      return;
    }
    if (answer !== state.answerSpec.answer) {
      state.hadMistake = true;
      state.attempts += 1;
      state.inputValue = '';
      setTransientFeedback(state, context, '答案不正確，請再計算一次右邊的式子。', 'try');
      if (context === 'hint') renderHint();
      else renderPractice();
      return;
    }

    const answerSpec = state.answerSpec;
    state.transientFeedback = null;
    appendHistoryRow(state, { left: answerSpec.answerLeft, right: formatInt(answer), current: true });
    state.inputValue = '';
    state.answerSpec = null;
    state.sideOperations = { left: null, right: null };

    if (answerSpec.nextStage && state.mode === 2) {
      state.left = state.coefficient + 'x';
      state.right = formatInt(state.reducedRight);
      state.stage = 1;
      state.phase = 'operations';
      setFeedback(context, '正確！現在進行第二步：兩邊除以 ' + state.coefficient + '，令 x 前面的係數變成 1。', 'correct');
      if (context === 'hint') renderHint();
      else renderPractice();
      return;
    }

    state.left = answerSpec.answerLeft;
    state.right = formatInt(answer);
    state.phase = 'complete';
    state.completed = true;
    if (context === 'hint') {
      setFeedback('hint', '示範完成：' + answerSpec.answerLeft + ' = ' + formatInt(answer) + '。', 'correct');
      renderHint();
      return;
    }

    recordScore(state);
    setFeedback('practice', '完成！答案是 x = ' + formatInt(state.solution) + '。', 'complete');
    renderPractice();
  }

  function recordScore(state) {
    if (state.scoreRecorded) return;
    state.scoreRecorded = true;
    if (state.hadMistake) scores[state.mode].wrong += 1;
    else scores[state.mode].correct += 1;
    modeProgress[state.mode].solved = scores[state.mode].correct + scores[state.mode].wrong;
    saveScores();
  }

  function saveScores() {
    try {
      window.localStorage.setItem(scoreStorageKey, JSON.stringify(scores));
    } catch (error) {
      console.warn('無法儲存本機分數。');
    }
    updateScoreUI();
  }

  function updateScoreUI() {
    [1, 2].forEach(function (mode) {
      const correct = document.getElementById('score-correct-' + mode);
      const wrong = document.getElementById('score-wrong-' + mode);
      correct.textContent = String(scores[mode].correct);
      wrong.textContent = String(scores[mode].wrong);
    });
  }

  function resetScores() {
    scores = emptyScores();
    [1, 2].forEach(function (mode) {
      const progress = modeProgress[mode];
      if (progress.state && progress.state.errorTimer) window.clearTimeout(progress.state.errorTimer);
      progress.solved = 0;
      progress.state = makeQuestionState(mode);
    });
    activeKeyboardContext = null;
    saveScores();
    closeScoreModal();
    setFeedback('practice', '分數及兩個模式的進度已重設。', 'neutral');
    renderPractice();
  }

  function openScoreModal() {
    updateScoreUI();
    elements.scoreModal.hidden = false;
    elements.scoreModal.querySelector('[role="dialog"]').focus();
  }

  function closeScoreModal() {
    elements.scoreModal.hidden = true;
    elements.openScore.focus();
  }

  function startNextQuestion() {
    const progress = modeProgress[activeMode];
    if (!progress.state || !progress.state.completed) return;
    if (progress.state.errorTimer) window.clearTimeout(progress.state.errorTimer);
    progress.state = makeQuestionState(activeMode);
    setFeedback('practice', '新一題開始。先在一邊放卡，再在另一邊放相同運算。', 'neutral');
    renderPractice();
  }

  function restartMode() {
    const progress = modeProgress[activeMode];
    if (progress.state && progress.state.errorTimer) window.clearTimeout(progress.state.errorTimer);
    progress.state = makeQuestionState(activeMode);
    setFeedback('practice', '已重新開始本模式；累計分數保留。', 'neutral');
    renderPractice();
  }

  function setMode(mode) {
    activeMode = mode;
    const state = currentState();
    if (state.completed) setFeedback('practice', '本題已完成，答案是 x = ' + formatInt(state.solution) + '。', 'complete');
    else if (state.phase === 'answer') setFeedback('practice', '繼續輸入右邊的計算結果。', 'neutral');
    else if (state.phase === 'cancel') setFeedback('practice', '兩邊相同，天平已平衡；按「抵消」繼續。', 'neutral');
    else setFeedback('practice', '選擇運算卡，依次放到左盤和右盤。', 'neutral');
    renderPractice();
  }

  function setMethod(method) {
    const state = currentState();
    if (state.mode !== 2 || state.stage > 0 || state.completed) return;
    if (state.errorTimer) window.clearTimeout(state.errorTimer);
    if (state.phase !== 'operations' || state.sideOperations.left || state.sideOperations.right) {
      state.phase = 'operations';
      state.history = [{ left: state.originalLeft, right: state.originalRight, current: true }];
      state.left = state.originalLeft;
      state.right = state.originalRight;
      state.answerSpec = null;
      state.inputValue = '';
      state.sideOperations = { left: null, right: null };
      state.cancelRowIndex = null;
    }
    state.method = method;
    state.selectedOperation = null;
    state.errorTimer = null;
    activeKeyboardContext = null;
    setFeedback('practice', method === 'balance' ? '天平逐步：左右各放一次相同運算卡。' : '移項跳步：把常數項移到右邊，正負號改變。', 'neutral');
    renderPractice();
  }

  function selectHintExample(exampleName) {
    activeHintExample = exampleName;
    hintState = makeHintState(exampleName);
    renderHint();
  }

  function makeHintState(exampleName) {
    const example = hintExamples[exampleName];
    const data = {
      mode: 1,
      type: example.type,
      originalLeft: example.left,
      originalRight: example.right,
      answer: example.solution,
      operand: example.operand,
      inverse: example.inverse
    };
    const state = makeStateFromData(data);
    return state;
  }

  function makeStateFromData(data) {
    return {
      mode: data.mode,
      type: data.type,
      originalLeft: data.originalLeft,
      originalRight: data.originalRight,
      left: data.originalLeft,
      right: data.originalRight,
      solution: data.answer,
      operand: data.operand,
      inverse: data.inverse,
      coefficient: data.coefficient,
      constant: data.constant,
      constantSign: data.constantSign,
      reducedRight: data.reducedRight,
      firstInverse: data.firstInverse,
      stage: 0,
      method: 'balance',
      phase: 'operations',
      history: [{ left: data.originalLeft, right: formatInt(data.originalRight), current: true }],
      sideOperations: { left: null, right: null },
      selectedOperation: null,
      answerSpec: null,
      inputValue: '',
      attempts: 0,
      hadMistake: false,
      transientFeedback: null,
      completed: false,
      scrollToLatest: false,
      errorTimer: null
    };
  }

  function targetFor(context, side) {
    return context === 'hint' ? elements.hintTargets[side] : elements.practiceTargets[side];
  }

  function attachSideTarget(context, side) {
    const target = targetFor(context, side);
    target.addEventListener('click', function () {
      const state = contextState(context);
      if (state.phase !== 'operations') return;
      if (!state.selectedOperation) {
        setFeedback(context, '先點選一張運算卡，再選擇' + sideLabel(side) + '。', 'neutral');
        return;
      }
      handlePlace(context, side, state.selectedOperation);
    });
    target.addEventListener('dragover', function (event) {
      event.preventDefault();
      target.classList.add('drag-over');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    });
    target.addEventListener('dragleave', function (event) {
      if (!target.contains(event.relatedTarget)) target.classList.remove('drag-over');
    });
    target.addEventListener('drop', function (event) {
      event.preventDefault();
      target.classList.remove('drag-over');
      const raw = event.dataTransfer && event.dataTransfer.getData('text/plain');
      if (!raw) return;
      try {
        const payload = JSON.parse(raw);
        if (payload.context === context && typeof payload.operation === 'string') handlePlace(context, side, payload.operation);
      } catch (error) {
        return;
      }
    });
  }

  function buildKeypads() {
    [[elements.practiceKeypad, 'practice'], [elements.hintKeypad, 'hint']].forEach(function (entry) {
      const container = entry[0];
      const context = entry[1];
      container.addEventListener('focusin', function () {
        if (keyboardContextAvailable(context)) activeKeyboardContext = context;
      });
      container.replaceChildren();
      keyDefinitions.forEach(function (definition) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'keypad-key' + (definition.submit ? ' keypad-key--submit' : (definition.value === 'DEL' ? ' keypad-key--delete' : ''));
        button.dataset.key = definition.value;
        button.dataset.context = context;
        button.textContent = definition.label;
        button.setAttribute('aria-label', definition.ariaLabel || definition.label);
        container.appendChild(button);
      });
    });
  }

  function generateAndPrint() {
    if (printInProgress) return;
    printInProgress = true;
    const mode1Questions = Array.from({ length: 6 }, function () { return generateQuestionData(1); });
    const mode2Questions = Array.from({ length: 6 }, function () { return generateQuestionData(2); });

    const student = {
      className: elements.studentClass.value.trim(),
      name: elements.studentName.value.trim(),
      number: elements.studentNumber.value.trim()
    };
    const date = formatDate(new Date());
    const pageOne = renderWorksheetMode1(mode1Questions, student, date);
    const pageTwo = renderWorksheetMode2(mode2Questions, student, date);
    const answerPage = renderWorksheetAnswers(mode1Questions, mode2Questions, student, date);
    elements.printArea.innerHTML = pageOne + pageTwo + answerPage;
    window.setTimeout(function () {
      try {
        window.print();
      } finally {
        printInProgress = false;
      }
    }, 80);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function formatDate(date) {
    const pad = function (number) { return String(number).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function formatDateTime(date) {
    const pad = function (number) { return String(number).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function worksheetStudentLine(student, date) {
    const className = student.className ? escapeHtml(student.className) : '________';
    const name = student.name ? escapeHtml(student.name) : '____________';
    const number = student.number ? escapeHtml(student.number) : '____';
    return '<p class="worksheet-student-line">班別：' + className + '　姓名：' + name + '　學號：' + number + '　日期：' + date + '</p>';
  }

  function worksheetHeader(title, student, date) {
    return '<header class="worksheet-header"><h1 class="worksheet-title">' + title + '</h1>' + worksheetStudentLine(student, date) + '</header>';
  }

  function printGrid(left, right) {
    return '<div class="print-equation-grid"><span class="step-left">' + escapeHtml(left) + '</span><span class="step-equals">=</span><span class="step-right">' + escapeHtml(right) + '</span></div>';
  }

  function renderWorksheetExample() {
    return '<section class="worksheet-example"><p class="worksheet-example-title">已完成示範（抵消一行可在書寫時略過）</p>' +
      printGrid('x + 3', '−4') +
      printGrid('x + 3 − 3', '−4 − 3') +
      printGrid('x', '−4 − 3') +
      printGrid('x', '−7') +
      '</section>';
  }

  function renderBlankRows(count) {
    let rows = '';
    for (let index = 0; index < count; index += 1) rows += '<div class="worksheet-blank-line"></div>';
    return '<div class="worksheet-writing-lines">' + rows + '</div>';
  }

  function renderMode1WorksheetQuestion(question, index) {
    const equation = question.originalLeft + ' = ' + formatInt(question.originalRight);
    return '<article class="worksheet-question" data-mode="1" data-original-left="' + escapeHtml(question.originalLeft) +
      '" data-original-right="' + escapeHtml(formatInt(question.originalRight)) + '" data-answer="' + escapeHtml(formatInt(question.answer)) + '">' +
      '<p class="worksheet-question-title">' + (index + 1) + '. ' + escapeHtml(equation) + '</p>' + renderBlankRows(4) + '</article>';
  }

  function renderMode2WorksheetQuestion(question, index) {
    const equation = question.originalLeft + ' = ' + formatInt(question.originalRight);
    return '<article class="worksheet-question worksheet-mode2" data-mode="2" data-original-left="' + escapeHtml(question.originalLeft) +
      '" data-original-right="' + escapeHtml(formatInt(question.originalRight)) + '" data-answer="' + escapeHtml(formatInt(question.answer)) + '">' +
      '<p class="worksheet-question-title">' + (index + 1) + '. ' + escapeHtml(equation) + '</p>' + renderBlankRows(7) + '</article>';
  }

  function renderWorksheetMode1(questions, student, date) {
    return '<section class="worksheet-page worksheet-mode1">' +
      worksheetHeader('S1 Ch4 Ex1｜解方程天平法工作紙', student, date) +
      renderWorksheetExample() +
      '<h2 class="worksheet-section-title">模式一：一步方程（6 題）</h2>' +
      questions.map(renderMode1WorksheetQuestion).join('') +
      '</section>';
  }

  function renderWorksheetMode2(questions, student, date) {
    return '<section class="worksheet-page worksheet-mode2">' +
      worksheetHeader('S1 Ch4 Ex1｜解方程天平法工作紙（續）', student, date) +
      '<h2 class="worksheet-section-title">模式二：兩步方程（6 題）</h2>' +
      '<p class="worksheet-answer-note">請按等號對齊；右邊先保留未運算式子，再逐步計算。</p>' +
      questions.map(renderMode2WorksheetQuestion).join('') +
      '</section>';
  }

  function renderWorksheetAnswers(mode1Questions, mode2Questions, student, date) {
    const rows1 = mode1Questions.map(function (question, index) {
      return worksheetAnswerRow('模式一 ' + (index + 1), question);
    }).join('');
    const rows2 = mode2Questions.map(function (question, index) {
      return worksheetAnswerRow('模式二 ' + (index + 1), question);
    }).join('');
    return '<section class="worksheet-page worksheet-answers">' +
      worksheetHeader('S1 Ch4 Ex1｜參考答案', student, date) +
      '<p class="worksheet-answer-note">每個答案均為整數；可按題目所示原式代回核對。</p>' +
      '<h2 class="worksheet-section-title">模式一：一步方程</h2>' + rows1 +
      '<h2 class="worksheet-section-title">模式二：兩步方程</h2>' + rows2 +
      '</section>';
  }

  function worksheetAnswerRow(label, question) {
    return '<p class="worksheet-answer-row" data-mode="' + question.mode + '" data-original-left="' + escapeHtml(question.originalLeft) +
      '" data-original-right="' + escapeHtml(formatInt(question.originalRight)) + '" data-answer="' + escapeHtml(formatInt(question.answer)) + '">' +
      '<strong>' + escapeHtml(label) + '</strong> ' + escapeHtml(question.originalLeft + ' = ' + formatInt(question.originalRight)) +
      '；x = ' + escapeHtml(formatInt(question.answer)) + '</p>';
  }

  function initEvents() {
    elements.hintToggle.addEventListener('click', function () {
      const open = elements.hintPanel.hidden;
      elements.hintPanel.hidden = !open;
      elements.hintToggle.setAttribute('aria-expanded', String(open));
      elements.hintToggle.textContent = open ? '收起提示' : '打開提示';
      if (open) renderHint();
      else refreshKeyboardContext();
    });

    elements.modeTabs[0].addEventListener('click', function () { setMode(1); });
    elements.modeTabs[1].addEventListener('click', function () { setMode(2); });
    elements.methodBalance.addEventListener('click', function () { setMethod('balance'); });
    elements.methodTranspose.addEventListener('click', function () { setMethod('transpose'); });
    elements.nextQuestion.addEventListener('click', startNextQuestion);
    elements.resetMode.addEventListener('click', restartMode);
    elements.hintExampleTabs[0].addEventListener('click', function () { selectHintExample('add'); });
    elements.hintExampleTabs[1].addEventListener('click', function () { selectHintExample('multiply'); });
    elements.hintReset.addEventListener('click', function () { selectHintExample(activeHintExample); });
    elements.openScore.addEventListener('click', openScoreModal);
    elements.closeScoreIcon.addEventListener('click', closeScoreModal);
    elements.closeScoreButton.addEventListener('click', closeScoreModal);
    elements.resetScores.addEventListener('click', resetScores);
    elements.printWorksheet.addEventListener('click', generateAndPrint);

    attachSideTarget('practice', 'left');
    attachSideTarget('practice', 'right');
    attachSideTarget('hint', 'left');
    attachSideTarget('hint', 'right');

    document.addEventListener('click', function (event) {
      const cancelButton = event.target.closest('[data-cancel-context]');
      if (cancelButton) {
        cancelOperation(cancelButton.dataset.cancelContext);
        return;
      }
      const keypadButton = event.target.closest('.keypad-key');
      if (keypadButton) inputKey(keypadButton.dataset.context, keypadButton.dataset.key);
    });

    elements.scoreModal.addEventListener('click', function (event) {
      if (event.target === elements.scoreModal) closeScoreModal();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !elements.scoreModal.hidden) {
        closeScoreModal();
        return;
      }
      if (!elements.scoreModal.hidden || !activeKeyboardContext) return;
      if (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        inputKey(activeKeyboardContext, event.key);
      } else if (event.key === '-' || event.key === '−') {
        event.preventDefault();
        inputKey(activeKeyboardContext, 'NEG');
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        inputKey(activeKeyboardContext, 'DEL');
      } else if (event.key === 'Enter') {
        event.preventDefault();
        inputKey(activeKeyboardContext, 'SUBMIT');
      }
    });
  }

  buildKeypads();
  scores = readScores();
  modeProgress[1].solved = scores[1].correct + scores[1].wrong;
  modeProgress[2].solved = scores[2].correct + scores[2].wrong;
  modeProgress[1].state = makeQuestionState(1);
  hintState = makeHintState(activeHintExample);
  elements.scoreStartTime.textContent = formatDateTime(pageEntryTime);
  updateScoreUI();
  initEvents();
  renderPractice();
  renderHint();
}());
