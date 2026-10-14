(function () {
  'use strict';

  const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  const mode2QuestionTypes = ['two-step', 'fraction-x', 'fraction-binomial'];
  const scoreStorageKey = 's1ch4ex1_scores';
  const layoutStorageKey = 's1ch4ex1_layout';
  const defaultStepsWidth = 58;
  const pageEntryTime = new Date();
  const keyDefinitions = [
    { value: '7', label: '7' }, { value: '8', label: '8' }, { value: '9', label: '9' },
    { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' },
    { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
    { value: 'NEG', label: '−', ariaLabel: '負號' }, { value: '0', label: '0' },
    { value: 'DEL', label: '⌫', ariaLabel: '刪除最後一位' },
    { value: 'SUBMIT', label: '確定', ariaLabel: '確定答案', submit: true }
  ];
  const equationKeyDefinitions = [
    { value: '7', label: '7' }, { value: '8', label: '8' }, { value: '9', label: '9' },
    { value: 'X', label: 'x', ariaLabel: '未知數 x' }, { value: 'DEL', label: '⌫', ariaLabel: '刪除最後一位', delete: true },
    { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' },
    { value: 'ADD', label: '+' }, { value: 'SUBTRACT', label: '−' },
    { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
    { value: 'MULTIPLY', label: '×' }, { value: 'DIVIDE', label: '÷' },
    { value: 'LPAREN', label: '(' }, { value: '0', label: '0' }, { value: 'RPAREN', label: ')' },
    { value: 'EQUALS', label: '=', span: 2 },
    { value: 'SUBMIT', label: '確定', ariaLabel: '確定方程', submit: true }
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
    balanceModeToggle: document.getElementById('balance-mode-toggle'),
    practiceWorkspace: document.getElementById('practice-workspace'),
    stepsColumn: document.getElementById('steps-column'),
    balanceResizer: document.getElementById('balance-resizer'),
    balanceLayout: document.querySelector('.balance-layout'),
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
    practiceAnswerHelp: document.getElementById('practice-answer-help'),
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
  elements.headerScoreCorrect = document.getElementById('header-score-correct');
  elements.headerScoreWrong = document.getElementById('header-score-wrong');

  const hintExamples = {
    add: {
      type: 0, left: 'x + 3', right: '11', operand: 3, inverse: 'subtract', solution: 8
    },
    multiply: {
      type: 2, left: '2x', right: '8', operand: 2, inverse: 'divide', solution: 4
    }
  };

  let activeMode = 1;
  let balanceVisible = false;
  let activeHintExample = 'add';
  let hintState = null;
  let activeKeyboardContext = null;
  let dragJustEnded = false;
  let printInProgress = false;
  let qrCodeLoadPromise = null;
  let stepsWidthPercent = readStepsWidth();
  let splitterPointerId = null;
  let scores = readScores();

  function readStepsWidth() {
    try {
      const saved = Number(window.localStorage.getItem(layoutStorageKey));
      if (Number.isFinite(saved) && saved >= 40 && saved <= 72) return saved;
    } catch (error) {
      return defaultStepsWidth;
    }
    return defaultStepsWidth;
  }

  function saveStepsWidth() {
    try {
      window.localStorage.setItem(layoutStorageKey, String(Math.round(stepsWidthPercent * 10) / 10));
    } catch (error) {
      return;
    }
  }

  function syncWorkspaceWidth() {
    if (!elements.practiceWorkspace || !elements.balanceResizer) return;
    elements.balanceResizer.setAttribute('aria-valuenow', String(Math.round(stepsWidthPercent)));
    if (!window.matchMedia('(min-width: 900px)').matches) {
      elements.practiceWorkspace.style.gridTemplateColumns = '';
      return;
    }
    if (elements.practiceWorkspace.classList.contains('is-collapsed')) {
      elements.practiceWorkspace.style.gridTemplateColumns = 'minmax(0, 1fr)';
      return;
    }
    elements.practiceWorkspace.style.gridTemplateColumns = '';
    const resizerWidth = elements.balanceResizer.offsetWidth;
    const availableWidth = Math.max(0, elements.practiceWorkspace.clientWidth - resizerWidth);
    const stepsWidth = Math.round(availableWidth * stepsWidthPercent / 100);
    elements.practiceWorkspace.style.gridTemplateColumns = 'minmax(0, ' + stepsWidth + 'px) ' + resizerWidth + 'px minmax(0, 1fr)';
  }

  function setStepsWidth(percent) {
    stepsWidthPercent = Math.max(40, Math.min(72, percent));
    saveStepsWidth();
    syncWorkspaceWidth();
  }

  function initWorkspaceResizer() {
    const resizer = elements.balanceResizer;
    resizer.addEventListener('pointerdown', function (event) {
      if (!window.matchMedia('(min-width: 900px)').matches || elements.practiceWorkspace.classList.contains('is-collapsed')) return;
      event.preventDefault();
      splitterPointerId = event.pointerId;
      resizer.setPointerCapture(event.pointerId);
      resizer.classList.add('is-dragging');
    });
    resizer.addEventListener('pointermove', function (event) {
      if (splitterPointerId !== event.pointerId) return;
      const bounds = elements.practiceWorkspace.getBoundingClientRect();
      const availableWidth = Math.max(1, bounds.width - resizer.offsetWidth);
      setStepsWidth((event.clientX - bounds.left - resizer.offsetWidth / 2) / availableWidth * 100);
    });
    function stopResize(event) {
      if (splitterPointerId !== event.pointerId) return;
      splitterPointerId = null;
      resizer.classList.remove('is-dragging');
      if (resizer.hasPointerCapture(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    }
    resizer.addEventListener('pointerup', stopResize);
    resizer.addEventListener('pointercancel', stopResize);
    resizer.addEventListener('lostpointercapture', function () {
      splitterPointerId = null;
      resizer.classList.remove('is-dragging');
    });
    resizer.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      setStepsWidth(stepsWidthPercent + (event.key === 'ArrowRight' ? 2 : -2));
    });
    window.addEventListener('resize', syncWorkspaceWidth);
    syncWorkspaceWidth();
  }

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

  function bigIntGcd(left, right) {
    let a = left < 0n ? -left : left;
    let b = right < 0n ? -right : right;
    while (b) {
      const remainder = a % b;
      a = b;
      b = remainder;
    }
    return a || 1n;
  }

  function rational(numerator, denominator) {
    if (denominator === 0n) throw new Error('zero-denominator');
    let n = numerator;
    let d = denominator;
    if (d < 0n) { n = -n; d = -d; }
    const divisor = bigIntGcd(n, d);
    return { n: n / divisor, d: d / divisor };
  }

  function rationalAdd(left, right) { return rational(left.n * right.d + right.n * left.d, left.d * right.d); }
  function rationalSubtract(left, right) { return rational(left.n * right.d - right.n * left.d, left.d * right.d); }
  function rationalMultiply(left, right) { return rational(left.n * right.n, left.d * right.d); }
  function rationalDivide(left, right) { return rational(left.n * right.d, left.d * right.n); }
  function rationalNegate(value) { return { n: -value.n, d: value.d }; }
  function rationalEquals(left, right) { return left.n === right.n && left.d === right.d; }
  function zeroRational() { return { n: 0n, d: 1n }; }
  function oneRational() { return { n: 1n, d: 1n }; }

  function tokenizeExpression(source) {
    const text = String(source).replace(/−/g, '-');
    const tokens = [];
    let cursor = 0;
    if (text.length > 120) throw new Error('expression-too-long');
    while (cursor < text.length) {
      const character = text[cursor];
      if (/\s/.test(character)) { cursor += 1; continue; }
      if (/\d/.test(character)) {
        let end = cursor + 1;
        while (end < text.length && /\d/.test(text[end])) end += 1;
        tokens.push({ type: 'number', value: BigInt(text.slice(cursor, end)) });
        cursor = end;
        continue;
      }
      if (character.toLowerCase() === 'x') {
        tokens.push({ type: 'x' });
        cursor += 1;
        continue;
      }
      if ('+-*×/÷()'.indexOf(character) !== -1) {
        tokens.push({ type: character });
        cursor += 1;
        continue;
      }
      throw new Error('unsupported-character');
    }

    const expanded = [];
    tokens.forEach(function (token) {
      const previous = expanded[expanded.length - 1];
      const previousEndsFactor = previous && (previous.type === 'number' || previous.type === 'x' || previous.type === ')');
      const currentStartsFactor = token.type === 'x' || token.type === '(';
      if (previousEndsFactor && currentStartsFactor) expanded.push({ type: '*', implicit: true });
      expanded.push(token);
    });
    return expanded;
  }

  function parseExpressionAst(source) {
    const tokens = tokenizeExpression(source);
    let cursor = 0;
    function peek() { return tokens[cursor]; }
    function take(type) {
      if (!peek() || peek().type !== type) throw new Error('unexpected-token');
      return tokens[cursor++];
    }
    function parsePrimary() {
      const token = peek();
      if (!token) throw new Error('missing-value');
      if (token.type === 'number') { cursor += 1; return { type: 'number', value: token.value }; }
      if (token.type === 'x') { cursor += 1; return { type: 'x' }; }
      if (token.type === '(') {
        cursor += 1;
        const value = parseSum();
        take(')');
        return { type: 'group', value: value };
      }
      throw new Error('missing-value');
    }
    function parseUnary() {
      if (peek() && (peek().type === '+' || peek().type === '-')) {
        const operator = tokens[cursor++].type;
        return { type: 'unary', operator: operator, value: parseUnary() };
      }
      return parsePrimary();
    }
    function parseProduct() {
      let value = parseUnary();
      while (peek() && ['*', '×', '/', '÷'].indexOf(peek().type) !== -1) {
        const operatorToken = tokens[cursor++];
        value = {
          type: 'binary', operator: operatorToken.type, implicit: Boolean(operatorToken.implicit),
          left: value, right: parseUnary()
        };
      }
      return value;
    }
    function parseSum() {
      let value = parseProduct();
      while (peek() && (peek().type === '+' || peek().type === '-')) {
        const operator = tokens[cursor++].type;
        value = { type: 'binary', operator: operator, left: value, right: parseProduct() };
      }
      return value;
    }
    if (!tokens.length) throw new Error('empty-expression');
    const ast = parseSum();
    if (cursor !== tokens.length) throw new Error('trailing-token');
    return ast;
  }

  function polynomialAdd(left, right) {
    return { x: rationalAdd(left.x, right.x), constant: rationalAdd(left.constant, right.constant) };
  }

  function polynomialSubtract(left, right) {
    return { x: rationalSubtract(left.x, right.x), constant: rationalSubtract(left.constant, right.constant) };
  }

  function polynomialScale(value, scalar) {
    return { x: rationalMultiply(value.x, scalar), constant: rationalMultiply(value.constant, scalar) };
  }

  function astContainsVariable(ast) {
    if (!ast) return false;
    if (ast.type === 'x') return true;
    if (ast.type === 'group' || ast.type === 'unary') return astContainsVariable(ast.value);
    if (ast.type === 'binary') return astContainsVariable(ast.left) || astContainsVariable(ast.right);
    return false;
  }

  function polynomialMultiply(left, right) {
    if (left.x.n !== 0n && right.x.n !== 0n) throw new Error('quadratic-term');
    const x = rationalAdd(rationalMultiply(left.x, right.constant), rationalMultiply(right.x, left.constant));
    return { x: x, constant: rationalMultiply(left.constant, right.constant) };
  }

  function polynomialDivide(left, right) {
    if (right.x.n !== 0n) throw new Error('division-by-variable');
    if (right.constant.n === 0n) throw new Error('zero-denominator');
    return polynomialScale(left, rationalDivide(oneRational(), right.constant));
  }

  function polynomialForAst(ast) {
    if (ast.type === 'number') return { x: zeroRational(), constant: rational(ast.value, 1n) };
    if (ast.type === 'x') return { x: oneRational(), constant: zeroRational() };
    if (ast.type === 'group') return polynomialForAst(ast.value);
    if (ast.type === 'unary') {
      const value = polynomialForAst(ast.value);
      return ast.operator === '-' ? polynomialScale(value, rational(-1n, 1n)) : value;
    }
    const left = polynomialForAst(ast.left);
    const right = polynomialForAst(ast.right);
    if (ast.operator === '+') return polynomialAdd(left, right);
    if (ast.operator === '-') return polynomialSubtract(left, right);
    if (ast.operator === '*' || ast.operator === '×') return polynomialMultiply(left, right);
    if (astContainsVariable(ast.right)) throw new Error('division-by-variable');
    return polynomialDivide(left, right);
  }

  function unwrapGroups(ast) {
    let node = ast;
    while (node && node.type === 'group') node = node.value;
    return node;
  }

  function isOnlyVariable(ast) {
    const node = unwrapGroups(ast);
    if (node && node.type === 'x') return true;
    return Boolean(node && node.type === 'unary' && node.operator === '+' && isOnlyVariable(node.value));
  }

  function isIntegerLiteral(ast) {
    const node = unwrapGroups(ast);
    if (node && node.type === 'number') return true;
    return Boolean(node && node.type === 'unary' && (node.operator === '+' || node.operator === '-') && isIntegerLiteral(node.value));
  }

  function isPureVariableTerm(ast) {
    const node = unwrapGroups(ast);
    if (!node) return false;
    if (node.type === 'x') return true;
    if (node.type === 'unary') return isPureVariableTerm(node.value);
    if (node.type !== 'binary') return false;
    if (node.operator === '*' || node.operator === '×') {
      return (isPureVariableTerm(node.left) && polynomialForAst(node.right).x.n === 0n) ||
        (isPureVariableTerm(node.right) && polynomialForAst(node.left).x.n === 0n);
    }
    if (node.operator === '/' || node.operator === '÷') {
      return isPureVariableTerm(node.left) && polynomialForAst(node.right).x.n === 0n && polynomialForAst(node.right).constant.n !== 0n;
    }
    return false;
  }

  function isVariablePlusConstant(ast) {
    const node = unwrapGroups(ast);
    if (!node || node.type !== 'binary' || (node.operator !== '+' && node.operator !== '-')) return false;
    if (isOnlyVariable(node.left)) {
      const constant = polynomialForAst(node.right);
      return constant.x.n === 0n && constant.constant.n !== 0n;
    }
    if (node.operator === '+' && isOnlyVariable(node.right)) {
      const constant = polynomialForAst(node.left);
      return constant.x.n === 0n && constant.constant.n !== 0n;
    }
    return false;
  }

  function containsBinaryOperation(ast) {
    if (!ast) return false;
    if (ast.type === 'binary') return true;
    if (ast.type === 'group' || ast.type === 'unary') return containsBinaryOperation(ast.value);
    return false;
  }

  function parseEquationLine(source, expectedAnswer) {
    const text = String(source).replace(/\[\[([^\]|]+)\|(\d+)\]\]/g, '($1)/$2');
    const equals = [];
    for (let index = 0; index < text.length; index += 1) if (text[index] === '=') equals.push(index);
    if (equals.length !== 1) throw new Error('one-equals-required');
    const leftText = text.slice(0, equals[0]).trim();
    const rightText = text.slice(equals[0] + 1).trim();
    if (!leftText || !rightText) throw new Error('empty-side');
    const leftAst = parseExpressionAst(leftText);
    const rightAst = parseExpressionAst(rightText);
    const left = polynomialForAst(leftAst);
    const right = polynomialForAst(rightAst);
    const difference = polynomialSubtract(left, right);
    const hasUniqueSolution = difference.x.n !== 0n;
    const solution = hasUniqueSolution ? rationalDivide(rationalNegate(difference.constant), difference.x) : null;
    const equivalent = Boolean(hasUniqueSolution && solution.n === BigInt(expectedAnswer) * solution.d);
    const intermediateLeft = left.constant.n === 0n && left.x.n !== 0n &&
      !rationalEquals(left.x, oneRational()) && isPureVariableTerm(leftAst);
    const additiveLeft = rationalEquals(left.x, oneRational()) && left.constant.n !== 0n && isVariablePlusConstant(leftAst);
    return {
      leftText: leftText,
      rightText: rightText,
      leftAst: leftAst,
      rightAst: rightAst,
      left: left,
      right: right,
      equivalent: equivalent,
      hasUniqueSolution: hasUniqueSolution,
      finalVariableOnLeft: isOnlyVariable(leftAst) && rationalEquals(left.x, oneRational()) && left.constant.n === 0n,
      finalIntegerOnRight: isIntegerLiteral(rightAst) && right.x.n === 0n && right.constant.d === 1n,
      reversedFinal: isIntegerLiteral(leftAst) && isOnlyVariable(rightAst) && right.x.n === 1n && right.constant.n === 0n,
      intermediate: (intermediateLeft || additiveLeft) && containsBinaryOperation(rightAst),
      unsolvedAnswer: isOnlyVariable(leftAst) && rationalEquals(left.x, oneRational()) && left.constant.n === 0n && containsBinaryOperation(rightAst),
      rightHasOperation: containsBinaryOperation(rightAst)
    };
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatInt(value) {
    const integer = Number(String(value).replace(/−/g, '-'));
    return integer < 0 ? '−' + Math.abs(integer) : String(integer);
  }

  function signedMagnitude(magnitude, negative) {
    return negative ? -Math.abs(magnitude) : Math.abs(magnitude);
  }

  function fractionExpression(numerator, denominator) {
    return '[[' + numerator + '|' + denominator + ']]';
  }

  function generateQuestionData(mode, forcedMode2Type) {
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

    const questionType = forcedMode2Type || (Math.random() < 0.5
      ? 'two-step'
      : (Math.random() < 0.5 ? 'fraction-x' : 'fraction-binomial'));

    if (questionType === 'two-step') {
      const coefficient = randomInt(2, 6);
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

    if (questionType === 'fraction-x') {
      const denominator = randomInt(2, 6);
      const quotientMagnitude = randomInt(1, 9);
      const quotient = signedMagnitude(quotientMagnitude, Math.random() < 0.5);
      const constant = randomInt(2, 8);
      const plus = Math.random() < 0.5;
      const constantSign = plus ? '+' : '−';
      const right = plus ? quotient + constant : quotient - constant;

      return {
        mode: 2,
        type: 'fraction-x',
        originalLeft: fractionExpression('x', denominator) + ' ' + constantSign + ' ' + constant,
        originalRight: String(right),
        answer: denominator * quotient,
        coefficient: denominator,
        constant: constant,
        constantSign: constantSign,
        quotient: quotient,
        firstInverse: plus ? 'subtract' : 'add'
      };
    }

    const magnitude = randomInt(2, 9);
    const solution = signedMagnitude(magnitude, Math.random() < 0.5);
    const denominator = randomInt(2, 6);
    const plus = Math.random() < 0.5;
    const constantSign = plus ? '+' : '−';
    const validConstants = [];
    for (let constant = 2; constant <= 8; constant += 1) {
      const numerator = solution + (plus ? constant : -constant);
      if (numerator % denominator === 0) validConstants.push(constant);
    }
    const constant = validConstants[randomInt(0, validConstants.length - 1)];
    const numeratorValue = solution + (plus ? constant : -constant);
    const right = numeratorValue / denominator;

    return {
      mode: 2,
      type: 'fraction-binomial',
      originalLeft: fractionExpression('x ' + constantSign + ' ' + constant, denominator),
      originalRight: String(right),
      answer: solution,
      coefficient: denominator,
      constant: constant,
      constantSign: constantSign,
      numeratorValue: numeratorValue,
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
      quotient: data.quotient,
      numeratorValue: data.numeratorValue,
      firstInverse: data.firstInverse,
      stage: 0,
      method: 'balance',
      phase: 'operations',
      history: [{ left: data.originalLeft, right: formatInt(data.originalRight), current: true }],
      sideOperations: { left: null, right: null },
      pendingPlacementHadMistake: null,
      selectedOperation: null,
      answerSpec: null,
      inputValue: '',
      manualInput: '',
      balanceResumePending: false,
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
    const source = String(right).trim();
    const isInteger = /^(?:−|-)?\d+$/.test(source);
    const expression = isInteger ? formatInt(source) : source;
    const grouped = !isInteger && /[+−\-×÷/*]/.test(expression)
      ? '(' + expression + ')'
      : expression;
    return grouped + ' ' + symbols[operation] + ' ' + value;
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

    if (state.stage === 0 && state.type === 'fraction-x') {
      const leftFraction = fractionExpression('x', state.coefficient);
      return {
        expected: state.firstInverse,
        value: state.constant,
        leftBefore: state.originalLeft,
        rightBefore: state.originalRight,
        afterLeft: leftFraction,
        afterRight: formatRightOperation(state.originalRight, state.firstInverse, state.constant),
        answerLeft: leftFraction,
        answer: state.quotient,
        nextStage: true,
        targetText: '先處理加減項，再調分母',
        cancelParts: cancellationParts(state, 0)
      };
    }

    if (state.stage === 0 && state.type === 'fraction-binomial') {
      const numerator = 'x ' + state.constantSign + ' ' + state.constant;
      return {
        expected: 'multiply',
        value: state.coefficient,
        leftBefore: state.originalLeft,
        rightBefore: state.originalRight,
        afterLeft: numerator,
        afterRight: formatRightOperation(state.originalRight, 'multiply', state.coefficient),
        answerLeft: numerator,
        answer: state.numeratorValue,
        nextStage: true,
        targetText: '先乘分母',
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

    if (state.type === 'fraction-x') {
      return {
        expected: 'multiply',
        value: state.coefficient,
        leftBefore: state.left,
        rightBefore: state.right,
        afterLeft: 'x',
        afterRight: formatRightOperation(state.right, 'multiply', state.coefficient),
        answerLeft: 'x',
        answer: state.solution,
        targetText: '令 x 單獨留下',
        cancelParts: cancellationParts(state, 1)
      };
    }

    if (state.type === 'fraction-binomial') {
      const inverse = state.constantSign === '+' ? 'subtract' : 'add';
      return {
        expected: inverse,
        value: state.constant,
        leftBefore: state.left,
        rightBefore: state.right,
        afterLeft: 'x',
        afterRight: formatRightOperation(state.right, inverse, state.constant),
        answerLeft: 'x',
        answer: state.solution,
        targetText: '令 x 單獨留下',
        cancelParts: cancellationParts(state, 1)
      };
    }

    return {
      expected: 'divide',
      value: state.coefficient,
      leftBefore: state.left,
      rightBefore: state.right,
      afterLeft: 'x',
      afterRight: formatRightOperation(state.right, 'divide', state.coefficient),
      answerLeft: 'x',
      answer: state.solution,
      targetText: '令 x 前面的係數變成 1',
      cancelParts: cancellationParts(state, 1)
    };
  }

  function cancellationParts(state, stage) {
    const number = String(state.mode === 2 && state.type === 'fraction-binomial' && stage === 1
      ? state.constant
      : (stage === 0 && state.mode === 1 ? state.operand : (stage === 0 ? state.constant : state.coefficient)));
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
    if (state.mode === 2 && state.type === 'fraction-x' && stage === 0) {
      return [
        { fraction: { numerator: 'x', denominator: state.coefficient } },
        { text: state.constantSign === '+' ? ' + ' + number + ' − ' + number : ' − ' + number + ' + ' + number, cancelled: true }
      ];
    }
    if (state.mode === 2 && state.type === 'fraction-x' && stage === 1) {
      return [
        { fraction: { numerator: 'x', denominator: state.coefficient, cancelDenominator: true } },
        { text: ' × ' + state.coefficient, cancelled: true }
      ];
    }
    if (state.mode === 2 && state.type === 'fraction-binomial' && stage === 0) {
      return [
        { fraction: { numerator: 'x ' + state.constantSign + ' ' + state.constant, denominator: state.coefficient, cancelDenominator: true } },
        { text: ' × ' + state.coefficient, cancelled: true }
      ];
    }
    if (state.mode === 2 && state.type === 'fraction-binomial' && stage === 1) {
      return [
        { text: 'x' },
        { text: state.constantSign === '+' ? ' + ' + number + ' − ' + number : ' − ' + number + ' + ' + number, cancelled: true }
      ];
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

  function mathExpressionParts(expression) {
    const parts = [];
    const pattern = /\[\[([^\]|]+)\|(\d+)\]\]|(\([^()]*\)|x|\d+)\s*\/\s*(\([^()]*\)|x|\d+)/g;
    const text = String(expression);
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text))) {
      if (match.index > cursor) parts.push({ type: 'text', value: text.slice(cursor, match.index) });
      parts.push({ type: 'fraction', numerator: match[1] || match[3], denominator: match[2] || match[4] });
      cursor = pattern.lastIndex;
    }
    if (cursor < text.length) parts.push({ type: 'text', value: text.slice(cursor) });
    if (!parts.length) parts.push({ type: 'text', value: text });
    return parts;
  }

  function readableMathText(value) {
    return String(value)
      .replace(/−(\d+)/g, '負 $1')
      .replace(/ \+ /g, ' 加 ')
      .replace(/ − /g, ' 減 ')
      .replace(/ × /g, ' 乘 ')
      .replace(/ ÷ /g, ' 除以 ')
      .trim();
  }

  function accessibleMathExpression(expression) {
    return mathExpressionParts(expression).map(function (part) {
      if (part.type === 'text') return readableMathText(part.value);
      if (part.numerator.trim() === 'x') return 'x 除以 ' + part.denominator;
      return '分子 ' + readableMathText(part.numerator) + '，分母 ' + part.denominator;
    }).filter(Boolean).join(' ');
  }

  function accessibleEquation(left, right) {
    return accessibleMathExpression(left) + ' 等於 ' + accessibleMathExpression(right);
  }

  function appendFractionElement(parent, numerator, denominator, cancelDenominator) {
    const fraction = document.createElement('span');
    fraction.className = 'math-fraction';
    fraction.setAttribute('aria-hidden', 'true');
    fraction.dataset.numerator = numerator;
    fraction.dataset.denominator = String(denominator);

    const numeratorNode = document.createElement('span');
    numeratorNode.className = 'fraction-numerator';
    numeratorNode.textContent = numerator;
    const denominatorNode = document.createElement(cancelDenominator ? 'del' : 'span');
    denominatorNode.className = cancelDenominator ? 'fraction-denominator cancelled-term' : 'fraction-denominator';
    denominatorNode.textContent = String(denominator);
    fraction.append(numeratorNode, denominatorNode);
    parent.appendChild(fraction);
  }

  function appendMathExpression(parent, expression) {
    mathExpressionParts(expression).forEach(function (part) {
      if (part.type === 'text') {
        parent.appendChild(document.createTextNode(part.value));
      } else {
        appendFractionElement(parent, part.numerator, part.denominator, false);
      }
    });
  }

  function appendParsedExpression(parent, node) {
    if (node.type === 'number') {
      parent.appendChild(document.createTextNode(String(node.value)));
      return;
    }
    if (node.type === 'x') {
      parent.appendChild(document.createTextNode('x'));
      return;
    }
    if (node.type === 'group') {
      parent.appendChild(document.createTextNode('('));
      appendParsedExpression(parent, node.value);
      parent.appendChild(document.createTextNode(')'));
      return;
    }
    if (node.type === 'unary') {
      parent.appendChild(document.createTextNode(node.operator === '-' ? '−' : '+'));
      appendParsedExpression(parent, node.value);
      return;
    }
    if (node.operator === '/' || node.operator === '÷') {
      const fraction = document.createElement('span');
      fraction.className = 'math-fraction';
      fraction.setAttribute('aria-hidden', 'true');
      const numerator = document.createElement('span');
      numerator.className = 'fraction-numerator';
      const denominator = document.createElement('span');
      denominator.className = 'fraction-denominator';
      appendFractionExpression(numerator, node.left);
      appendFractionExpression(denominator, node.right);
      fraction.append(numerator, denominator);
      parent.appendChild(fraction);
      return;
    }
    appendParsedExpression(parent, node.left);
    if (node.implicit) {
      appendParsedExpression(parent, node.right);
      return;
    }
    const operator = document.createElement('span');
    operator.className = 'manual-expression-operator';
    operator.textContent = ' ' + ({ '*': '×', '÷': '÷', '+': '+', '-': '−' }[node.operator] || node.operator) + ' ';
    parent.appendChild(operator);
    appendParsedExpression(parent, node.right);
  }

  function appendFractionExpression(parent, node) {
    if (node && node.type === 'group') {
      appendFractionExpression(parent, node.value);
      return;
    }
    appendParsedExpression(parent, node);
  }

  function appendLooseExpression(parent, expression) {
    const source = String(expression);
    const fractionPattern = /(\([^()]*\)|x|\d+)\s*(?:\/|÷)\s*(\([^()]*\)|x|\d+)/g;
    let cursor = 0;
    let match;
    while ((match = fractionPattern.exec(source))) {
      parent.appendChild(document.createTextNode(source.slice(cursor, match.index).replace(/-/g, '−')));
      const fraction = document.createElement('span');
      fraction.className = 'math-fraction';
      fraction.setAttribute('aria-hidden', 'true');
      const numerator = document.createElement('span');
      numerator.className = 'fraction-numerator';
      numerator.textContent = match[1];
      const denominator = document.createElement('span');
      denominator.className = 'fraction-denominator';
      denominator.textContent = match[2];
      fraction.append(numerator, denominator);
      parent.appendChild(fraction);
      cursor = fractionPattern.lastIndex;
    }
    const partialFraction = /(\([^()]*\)|x|\d+)\s*(?:\/|÷)\s*([−-]?\d*|x?)\s*$/.exec(source);
    if (partialFraction && partialFraction.index >= cursor) {
      parent.appendChild(document.createTextNode(source.slice(cursor, partialFraction.index).replace(/-/g, '−')));
      const fraction = document.createElement('span');
      fraction.className = 'math-fraction';
      fraction.setAttribute('aria-hidden', 'true');
      const numerator = document.createElement('span');
      numerator.className = 'fraction-numerator';
      numerator.textContent = partialFraction[1];
      const denominator = document.createElement('span');
      denominator.className = 'fraction-denominator';
      denominator.textContent = partialFraction[2] || '□';
      fraction.append(numerator, denominator);
      parent.appendChild(fraction);
      cursor = source.length;
    }
    const remainder = source.slice(cursor).replace(/-/g, '−').replace(/\//g, '÷');
    if (remainder) parent.appendChild(document.createTextNode(remainder));
  }

  function appendManualExpression(parent, expression) {
    try {
      appendParsedExpression(parent, parseExpressionAst(expression));
    } catch (error) {
      appendLooseExpression(parent, expression);
    }
  }

  function manualAccessibleText(expression) {
    return String(expression)
      .replace(/−/g, '-')
      .replace(/(\([^()]*\)|x|\d+)\s*(?:\/|÷)\s*(\([^()]*\)|x|\d+)/g, '$2 分之 $1')
      .replace(/\*/g, ' 乘以 ')
      .replace(/×/g, ' 乘以 ')
      .replace(/÷/g, ' 除以 ')
      .replace(/\+/g, ' 加 ')
      .replace(/-/g, ' 減 ')
      .replace(/=/g, ' 等於 ')
      .replace(/[()]/g, function (part) { return part === '(' ? ' 左括號 ' : ' 右括號 '; })
      .trim();
  }

  function renderManualPreview(output, source) {
    output.replaceChildren();
    output.classList.add('equation-preview');
    const text = String(source);
    output.dataset.rawInput = text;
    const equalsIndex = text.indexOf('=');
    const leftText = (equalsIndex < 0 ? text : text.slice(0, equalsIndex)).trim();
    const rightText = equalsIndex < 0 ? '' : text.slice(equalsIndex + 1).trim();
    const grid = document.createElement('span');
    grid.className = 'equation-grid manual-preview-grid' + (/[\/÷]/.test(text) ? ' has-fraction' : '');
    grid.setAttribute('role', 'img');
    grid.setAttribute('aria-label', leftText + (equalsIndex < 0 ? '' : ' 等於 ' + rightText));
    const left = document.createElement('span');
    left.className = 'step-left';
    appendManualExpression(left, leftText || ' ');
    const equals = document.createElement('span');
    equals.className = 'step-equals';
    equals.textContent = equalsIndex < 0 ? '' : '=';
    const right = document.createElement('span');
    right.className = 'step-right';
    appendManualExpression(right, rightText || ' ');
    grid.append(left, equals, right);
    output.appendChild(grid);
    output.setAttribute('aria-label', text ? manualAccessibleText(text) : '尚未輸入方程');
  }

  function renderQuestionEquation(element, state) {
    element.replaceChildren();
    const left = document.createElement('span');
    left.className = 'question-equation-left';
    appendMathExpression(left, state.originalLeft);
    const equals = document.createElement('span');
    equals.className = 'question-equation-equals';
    equals.textContent = ' = ';
    const right = document.createElement('span');
    right.className = 'question-equation-right';
    right.textContent = formatInt(state.originalRight);
    element.append(left, equals, right);
    element.classList.toggle('has-fraction', String(state.originalLeft).indexOf('[[') !== -1);
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', accessibleEquation(state.originalLeft, state.originalRight));
    element.dataset.questionType = String(state.type);
    element.dataset.originalLeft = state.originalLeft;
    element.dataset.originalRight = formatInt(state.originalRight);
  }

  function mathExpressionHtml(expression) {
    return mathExpressionParts(expression).map(function (part) {
      if (part.type === 'text') return escapeHtml(part.value);
      return '<span class="math-fraction" aria-hidden="true"><span class="fraction-numerator">' +
        escapeHtml(part.numerator) + '</span><span class="fraction-denominator">' + escapeHtml(part.denominator) + '</span></span>';
    }).join('');
  }

  function renderHistory(container, state, context) {
    container.replaceChildren();
    state.history.forEach(function (entry, index) {
      const wrap = document.createElement('div');
      wrap.className = 'equation-step-wrap' + (entry.current ? ' is-current' : '');
      wrap.dataset.stepIndex = String(index);

      const grid = document.createElement('div');
      grid.className = 'equation-grid' + (entry.current ? ' is-current' : '');
      grid.classList.toggle('has-fraction', String(entry.left).indexOf('[[') !== -1 || String(entry.right).indexOf('[[') !== -1 ||
        (entry.manual && (/[\/÷]/.test(String(entry.left)) || /[\/÷]/.test(String(entry.right)))));
      grid.setAttribute('role', 'img');
      grid.setAttribute('aria-label', entry.manual
        ? manualAccessibleText(entry.left) + ' 等於 ' + manualAccessibleText(entry.right)
        : accessibleEquation(entry.left, entry.right));

      const left = document.createElement('span');
      left.className = 'step-left';
      if (entry.cancelled && entry.cancelParts) {
        entry.cancelParts.forEach(function (part) {
          if (part.fraction) {
            appendFractionElement(left, part.fraction.numerator, part.fraction.denominator, Boolean(part.fraction.cancelDenominator));
            return;
          }
          const segment = document.createElement(part.cancelled ? 'del' : 'span');
          if (part.cancelled) segment.className = 'cancelled-term';
          appendMathExpression(segment, part.text);
          left.appendChild(segment);
        });
      } else {
        if (entry.manual) appendManualExpression(left, entry.left);
        else appendMathExpression(left, entry.left);
      }

      const equals = document.createElement('span');
      equals.className = 'step-equals';
      equals.textContent = '=';

      const right = document.createElement('span');
      right.className = 'step-right';
      if (entry.manual) appendManualExpression(right, entry.right);
      else appendMathExpression(right, entry.right);
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
    node.replaceChildren();
    const displayEquation = String(equation).replace(/-/g, '−');
    node.setAttribute('aria-label', accessibleMathExpression(displayEquation));
    const namespace = 'http://www.w3.org/2000/svg';
    let cursor = 0;
    mathExpressionParts(displayEquation).forEach(function (part) {
      const segment = document.createElementNS(namespace, 'g');
      node.appendChild(segment);
      if (part.type === 'text') {
        const text = document.createElementNS(namespace, 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '119');
        text.setAttribute('text-anchor', 'start');
        text.setAttribute('xml:space', 'preserve');
        text.textContent = part.value;
        segment.appendChild(text);
        const width = text.getBBox().width;
        segment.setAttribute('transform', 'translate(' + cursor + ' 0)');
        cursor += width + 3;
        return;
      }

      const numerator = document.createElementNS(namespace, 'text');
      numerator.setAttribute('x', '0');
      numerator.setAttribute('y', '108');
      numerator.setAttribute('text-anchor', 'middle');
      numerator.textContent = part.numerator;
      const denominator = document.createElementNS(namespace, 'text');
      denominator.setAttribute('x', '0');
      denominator.setAttribute('y', '130');
      denominator.setAttribute('text-anchor', 'middle');
      denominator.textContent = part.denominator;
      segment.append(numerator, denominator);
      const fractionWidth = Math.max(numerator.getBBox().width, denominator.getBBox().width) + 8;
      numerator.setAttribute('x', String(fractionWidth / 2));
      denominator.setAttribute('x', String(fractionWidth / 2));
      const bar = document.createElementNS(namespace, 'line');
      bar.setAttribute('x1', '1');
      bar.setAttribute('x2', String(fractionWidth - 1));
      bar.setAttribute('y1', '114');
      bar.setAttribute('y2', '114');
      bar.setAttribute('class', 'scale-fraction-bar');
      segment.appendChild(bar);
      segment.setAttribute('transform', 'translate(' + cursor + ' 0)');
      cursor += fractionWidth + 3;
    });
    const width = Math.max(0, cursor - 3);
    const center = Number(node.dataset.centerX || node.getAttribute('data-center-x') || 195);
    node.setAttribute('transform', 'translate(' + (center - width / 2) + ' 0)');
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

  function setHangerPositions(svg, prefix, tilt) {
    const angle = tilt === 'left' ? -5 : (tilt === 'right' ? 5 : 0);
    const radians = angle * Math.PI / 180;
    [
      { side: 'left', anchor: 100 },
      { side: 'right', anchor: 290 }
    ].forEach(function (hanger) {
      const offsetX = (Math.cos(radians) - 1) * (hanger.anchor - 195);
      const offsetY = Math.sin(radians) * (hanger.anchor - 195);
      const node = document.getElementById((prefix ? prefix + '-' : '') + hanger.side + '-hanger');
      if (node) node.setAttribute('transform', 'translate(' + offsetX.toFixed(2) + ' ' + offsetY.toFixed(2) + ')');
    });
  }

  function animateScale(svg) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    window.clearTimeout(svg.settleTimer);
    svg.classList.remove('is-moving');
    void svg.getBoundingClientRect();
    svg.classList.add('is-moving');
    svg.settleTimer = window.setTimeout(function () { svg.classList.remove('is-moving'); }, 700);
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
    svg.setAttribute('viewBox', '0 0 390 195');

    renderScaleEquation(leftEquation, state.left);
    renderScaleEquation(rightEquation, state.right);
    leftStamp.textContent = leftOperation ? formatOperation(leftOperation, operationValueFor(state, leftOperation)) : '';
    rightStamp.textContent = rightOperation ? formatOperation(rightOperation, operationValueFor(state, rightOperation)) : '';
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

    const tiltDirection = board.classList.contains('is-tilted-left') ? 'left' : (board.classList.contains('is-tilted-right') ? 'right' : '');
    setHangerPositions(svg, context === 'hint' ? 'hint' : '', tiltDirection);
    const boardState = [state.left, state.right, leftOperation || '', rightOperation || '', tiltDirection].join('|');
    if (svg.dataset.boardState && svg.dataset.boardState !== boardState) animateScale(svg);
    svg.dataset.boardState = boardState;

    const phaseAllowsPlacement = state.phase === 'operations';
    ['left', 'right'].forEach(function (side) {
      const target = targets[side];
      const operation = state.sideOperations[side];
      target.disabled = !phaseAllowsPlacement;
      target.classList.toggle('has-operation', Boolean(operation));
      target.classList.toggle('is-correct', Boolean(isBalanced && operation));
      target.textContent = operation ? formatOperation(operation, operationValueFor(state, operation)) : '放卡';
      target.setAttribute('aria-label', context === 'hint' ? '提示天平' + sideLabel(side) + (operation ? '已放 ' + formatOperation(operation, operationValueFor(state, operation)) : '放置區') : '天平' + sideLabel(side) + (operation ? '已放 ' + formatOperation(operation, operationValueFor(state, operation)) : '放置區'));
    });

    const boardStatus = isBalanced ? '天平平衡。' : (leftOperation || rightOperation ? tiltText(board) : '天平兩邊保持平衡。');
    const leftContent = accessibleMathExpression(state.left) + (leftOperation ? '，左盤再做 ' + accessibleOperation(leftOperation, operationValueFor(state, leftOperation)) : '');
    const rightContent = accessibleMathExpression(state.right) + (rightOperation ? '，右盤再做 ' + accessibleOperation(rightOperation, operationValueFor(state, rightOperation)) : '');
    svg.setAttribute('aria-label', '天平左盤是 ' + leftContent + '，右盤是 ' + rightContent + '；' + boardStatus);
    if (context === 'practice') elements.dropStatus.textContent = boardStatus;
    else elements.hintDropStatus.textContent = boardStatus;
  }

  function accessibleOperation(operation, value) {
    return ({ add: '加', subtract: '減', multiply: '乘以', divide: '除以' }[operation] || '') + ' ' + value;
  }

  function tiltText(board) {
    return board.classList.contains('is-tilted-left') ? '天平左邊下沉。' : '天平右邊下沉。';
  }

  function sideLabel(side) {
    return side === 'left' ? '左盤' : '右盤';
  }

  function operationValueFor(state, operation) {
    if (state.mode === 1) return state.operand;
    return operation === 'add' || operation === 'subtract' ? state.constant : state.coefficient;
  }

  function cardOperations(state) {
    if (state.mode === 2 && state.stage === 0 && state.method === 'transpose') {
      const value = state.type === 'fraction-binomial'
        ? '分母 ' + state.coefficient + ' → × ' + state.coefficient
        : state.constantSign + state.constant + ' → ' + (state.constantSign === '+' ? '−' : '+') + state.constant;
      return [{ id: 'transpose', symbol: '移項', value: value }];
    }
    return ['add', 'subtract', 'multiply', 'divide'].map(function (operation) {
      return { id: operation, symbol: symbols[operation], value: operationValueFor(state, operation) };
    });
  }

  function createOperationCard(operation, context, selected) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'operation-card' + (operation.id === 'transpose' ? ' is-move' : '');
    button.draggable = true;
    button.dataset.operation = operation.id;
    button.dataset.value = String(operation.value);
    button.dataset.context = context;
    button.setAttribute('aria-pressed', String(selected === operation.id));
    button.setAttribute('aria-label', operation.id === 'transpose'
      ? (operation.value.indexOf('分母') === 0 ? '移項卡：把分母移到右邊作乘數' : '移項卡：把 ' + operation.value + ' 移到右邊')
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
      const transpose = state.mode === 2 && state.stage === 0 && state.method === 'transpose';
      title.textContent = transpose
        ? (state.type === 'fraction-binomial' ? '把分母移到等號右邊' : '把常數項移到等號右邊')
        : (state.mode === 1 ? '選擇相反運算' : '選擇下一步運算');
      subtitle.textContent = transpose
        ? '選取移項卡，再放到右盤；右邊先保留未運算式子。'
        : (state.mode === 1 ? '選卡後放到左盤或右盤；再在另一邊放相同運算。' : '每階段均可選加、減、乘、除；判斷合適步驟後，在兩邊放相同卡。');
    }

    operations.forEach(function (operation) {
      tray.appendChild(createOperationCard(operation, context, state.selectedOperation));
    });
  }

  function renderAnswerArea(state, context) {
    const area = context === 'hint' ? elements.hintAnswerArea : elements.practiceAnswerArea;
    const display = context === 'hint' ? elements.hintAnswerDisplay : elements.practiceAnswerDisplay;
    const prompt = context === 'hint' ? elements.hintAnswerPrompt : elements.practiceAnswerPrompt;
    const manual = context === 'practice' && !balanceVisible;
    const visible = manual ? !state.completed : state.phase === 'answer' && Boolean(state.answerSpec);
    area.hidden = !visible;
    area.classList.toggle('is-equation-entry', manual);
    renderKeypad(context, manual);
    if (!visible) return;
    if (manual) {
      prompt.textContent = state.mode === 1
        ? '逐行輸入完整方程；每一步須與原題等價，先寫未計算的一行，再寫答案。'
        : '逐行輸入完整方程；每一步都要與原題等價。';
      elements.practiceAnswerHelp.textContent = '按「÷」輸入分數；桌面亦可用實體鍵盤。';
      renderManualPreview(display, state.manualInput);
      return;
    }
    display.classList.remove('equation-preview');
    if (context === 'practice') elements.practiceAnswerHelp.textContent = '使用螢幕數字鍵盤；桌面亦可用實體鍵盤。';
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
    updateScoreUI();
    renderQuestionEquation(elements.equation, state);
    elements.methodRow.hidden = activeMode !== 2;
    elements.balanceModeToggle.hidden = false;
    elements.balanceModeToggle.textContent = balanceVisible ? '收起天平' : '顯示天平';
    elements.balanceModeToggle.setAttribute('aria-pressed', String(balanceVisible));
    elements.balanceLayout.hidden = !balanceVisible;
    elements.practiceWorkspace.classList.toggle('is-collapsed', !balanceVisible);
    syncWorkspaceWidth();
    elements.methodBalance.classList.toggle('is-selected', state.method === 'balance');
    elements.methodTranspose.classList.toggle('is-selected', state.method === 'transpose');
    elements.methodBalance.setAttribute('aria-pressed', String(state.method === 'balance'));
    elements.methodTranspose.setAttribute('aria-pressed', String(state.method === 'transpose'));
    const methodCanChange = state.mode === 2 && state.stage === 0 && !state.completed;
    elements.methodBalance.disabled = !methodCanChange;
    elements.methodTranspose.disabled = !methodCanChange;

    if (!balanceVisible) {
      elements.instruction.textContent = activeMode === 1
        ? '天平已收起：逐行輸入方程；每一步須與原題等價，先寫出未計算的一行，再寫答案。抵消一行可以跳過。'
        : '天平已收起：逐行輸入完整方程，寫出每一步；抵消一行可以跳過。';
      elements.methodDescription.textContent = '切回顯示天平後，可繼續使用目前的解題進度。';
    } else if (activeMode === 1) {
      elements.instruction.textContent = '先把相反運算放到一邊，再在另一邊放相同運算。';
      elements.methodDescription.textContent = '兩邊都做相反運算，讓左邊只剩下 x。';
    } else if (state.method === 'transpose' && state.stage === 0) {
      elements.instruction.textContent = state.type === 'fraction-binomial'
        ? '移項跳步：把分母移到右邊變成乘法。'
        : '移項跳步：把加減項移到右邊，正負號改變。';
      elements.methodDescription.textContent = '直接寫出未運算的右邊，再用數字鍵盤計算。';
    } else if (state.stage === 0) {
      elements.instruction.textContent = '判斷先調整分母，還是先處理加減項；選卡後兩邊要做相同運算。';
      elements.methodDescription.textContent = '天平先保持平衡；抵消步驟可以在書寫時略過。';
    } else if (!state.completed) {
      elements.instruction.textContent = state.type === 'fraction-x'
        ? '加減項已處理；現在調整 x 的分母。'
        : (state.type === 'fraction-binomial' ? '分母已處理；現在處理分子內的加減項。' : '常數項已消去；現在令 x 前面的係數變成 1。');
      elements.methodDescription.textContent = state.type === 'fraction-x'
        ? '兩邊同乘分母。'
        : (state.type === 'fraction-binomial' ? '把分子內的加減項移到右邊。' : '兩邊同除以未知數的係數。');
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
    if (context === 'practice' && state && !balanceVisible) return !state.completed;
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
      const value = state.type === 'fraction-binomial'
        ? '分母 ' + state.coefficient + ' → × ' + state.coefficient
        : state.constantSign + state.constant + ' → ' + (state.constantSign === '+' ? '−' : '+') + state.constant;
      return '移項 ' + value;
    }
    return formatOperation(operation, operationValueFor(state, operation));
  }

  function wrongOperationFeedback(state, operation, spec) {
    if (state.mode === 2 && state.stage === 0 && state.type === 'fraction-binomial' && (operation === 'add' || operation === 'subtract')) {
      return '天平仍然平衡，但 ' + state.constantSign + ' ' + state.constant + ' 在分子裏面，未去分母前不能直接抵消；先在兩邊乘 ' + state.coefficient + '。戳印清除後可以再試。';
    }
    if (state.mode === 2 && state.stage === 0 && state.type === 'fraction-x' && operation === 'multiply') {
      return '天平仍然平衡，但這樣兩邊每一項都要乘 ' + state.coefficient + '；這題先處理 ' + state.constantSign + ' ' + state.constant + ' 比較直接。戳印清除後可以再試。';
    }
    if (state.mode === 2 && state.stage === 0 && state.type === 'two-step' && operation === 'divide') {
      return '天平仍然平衡，但這樣兩邊每一項都要除以 ' + state.coefficient + '，可能出現分數；這題先處理 ' + state.constantSign + ' ' + state.constant + ' 比較直接。戳印清除後可以再試。';
    }
    return '天平仍然平衡，但這一步未能' + spec.targetText + '。戳印清除後再試。';
  }

  function handlePlace(context, side, operation) {
    const state = contextState(context);
    if (!state || state.phase !== 'operations') return;
    state.transientFeedback = null;
    if (!state.sideOperations.left && !state.sideOperations.right) state.pendingPlacementHadMistake = state.hadMistake;

    if (operation === 'transpose') {
      if (side !== 'right') {
        setFeedback(context, state.type === 'fraction-binomial'
          ? '移項卡要放到右盤，表示把分母移到等號右邊作乘數。'
          : '移項卡要放到右盤，表示把常數項移到等號右邊。', 'try');
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
      state.pendingPlacementHadMistake = null;
      state.hadMistake = true;
      state.attempts += 1;
      state.phase = 'error';
      state.feedbackMessage = wrongOperationFeedback(state, leftOperation, spec);
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
    state.pendingPlacementHadMistake = null;
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
    const spec = getStageSpec(state);
    const movedRight = spec.afterRight;
    const left = spec.afterLeft;
    state.selectedOperation = null;
    state.left = left;
    state.right = movedRight;
    state.answerSpec = {
      answerLeft: spec.answerLeft,
      answer: spec.answer,
      isIntermediate: true,
      nextStage: true
    };
    state.phase = 'answer';
    state.inputValue = '';
    appendHistoryRow(state, { left: left, right: movedRight, current: true });
    activeKeyboardContext = context;
    setFeedback(context, '移項跳步：直接寫出右邊未運算式子 ' + accessibleEquation(left, movedRight) + '，再用鍵盤計算。', 'correct');
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
    if (context === 'practice' && state && !balanceVisible) {
      inputEquationKey(state, key);
      return;
    }
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
    if (state.mode === 2 && !answerSpec.nextStage) {
      const proofs = manualProofsAlreadyWritten(state);
      if (!proofs.intermediate || !proofs.unsolvedAnswer) {
        const missingIntermediate = !proofs.intermediate;
        const message = missingIntermediate && !proofs.unsolvedAnswer
          ? manualIntermediateGuidance(state) + ' ' + manualAnswerGuidance(state)
          : (missingIntermediate ? manualIntermediateGuidance(state) : manualAnswerGuidance(state));
        state.inputValue = '';
        setTransientFeedback(state, context, message, 'neutral');
        if (context === 'hint') renderHint();
        else renderPractice();
        return;
      }
    }
    state.transientFeedback = null;
    appendHistoryRow(state, { left: answerSpec.answerLeft, right: formatInt(answer), current: true });
    state.inputValue = '';
    state.answerSpec = null;
    state.sideOperations = { left: null, right: null };

    if (answerSpec.nextStage && state.mode === 2) {
      state.left = answerSpec.answerLeft;
      state.right = formatInt(answer);
      state.stage = 1;
      state.phase = 'operations';
      const nextInstruction = state.type === 'fraction-x'
        ? '正確！現在兩邊乘以 ' + state.coefficient + '，去掉 x 的分母。'
        : (state.type === 'fraction-binomial'
          ? '正確！現在處理分子內的常數項。'
          : '正確！現在進行第二步：兩邊除以 ' + state.coefficient + '，令 x 前面的係數變成 1。');
      setFeedback(context, nextInstruction, 'correct');
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

  function appendEquationInput(state, text) {
    if (state.manualInput.length + text.length > 120) {
      setTransientFeedback(state, 'practice', '這一行太長，請刪去多餘符號後再輸入。', 'try');
      return;
    }
    state.manualInput += text;
  }

  function inputEquationKey(state, key) {
    if (state.completed) return;
    state.transientFeedback = null;
    activeKeyboardContext = 'practice';
    if (key === 'SUBMIT') {
      submitEquationLine(state);
      return;
    }
    if (key === 'DEL') {
      state.manualInput = state.manualInput.slice(0, -1);
    } else if (/^\d$/.test(key)) {
      appendEquationInput(state, key);
    } else if (key === 'X') {
      appendEquationInput(state, 'x');
    } else if (key === 'ADD') {
      appendEquationInput(state, ' + ');
    } else if (key === 'SUBTRACT' || key === 'NEG') {
      const trimmed = state.manualInput.trimEnd();
      const unary = !trimmed || /[=+−\-×÷/*(]$/.test(trimmed);
      appendEquationInput(state, unary ? '−' : ' − ');
    } else if (key === 'MULTIPLY') {
      appendEquationInput(state, ' × ');
    } else if (key === 'DIVIDE') {
      appendEquationInput(state, ' ÷ ');
    } else if (key === 'LPAREN') {
      appendEquationInput(state, '(');
    } else if (key === 'RPAREN') {
      appendEquationInput(state, ')');
    } else if (key === 'EQUALS') {
      appendEquationInput(state, ' = ');
    }
    renderPractice();
  }

  function normalizedEquationText(value) {
    return String(value)
      .replace(/\[\[([^\]|]+)\|(\d+)\]\]/g, function (match, numerator, denominator) {
        const trimmed = numerator.trim();
        return (trimmed === 'x' || /^\d+$/.test(trimmed) ? trimmed : '(' + trimmed + ')') + '/' + denominator;
      })
      .replace(/−/g, '-')
      .replace(/\s+/g, '');
  }

  function manualProofsAlreadyWritten(state) {
    const proofs = { intermediate: false, unsolvedAnswer: false };
    state.history.forEach(function (entry) {
      try {
        const parsed = parseEquationLine(entry.left + ' = ' + entry.right, state.solution);
        proofs.intermediate = proofs.intermediate || parsed.intermediate;
        proofs.unsolvedAnswer = proofs.unsolvedAnswer || parsed.unsolvedAnswer;
      } catch (error) {
        return;
      }
    });
    return proofs;
  }

  function manualIntermediateGuidance(state) {
    if (state.type === 'fraction-binomial') {
      return '請先寫出中間行，例如把分母 ' + state.coefficient + ' 移到等號右邊作乘數，再處理分子內的加減項。';
    }
    if (state.type === 'fraction-x') {
      return '請先寫出中間行，例如先處理 ' + state.constantSign + ' ' + state.constant + '，再兩邊乘 ' + state.coefficient + '。';
    }
    return '請先寫出中間行，例如先處理 ' + state.constantSign + ' ' + state.constant + '，再兩邊除以 ' + state.coefficient + '。';
  }

  function manualAnswerGuidance(state) {
    let example;
    if (state.type === 'fraction-x') example = 'x = □ × ' + state.coefficient;
    else if (state.type === 'fraction-binomial') example = 'x = □ ' + (state.constantSign === '+' ? '−' : '+') + ' ' + state.constant;
    else example = 'x = □ ÷ ' + state.coefficient;
    return '請先寫出未計算的答案一行，例如 ' + example + '，再寫答案。';
  }

  function manualOneStepAnswerGuidance(state) {
    const operation = state.type === 0 ? '−'
      : (state.type === 1 ? '+' : (state.type === 2 ? '÷' : '×'));
    return '請先寫出未計算的一行，例如 x = □ ' + operation + ' ' + state.operand + '，再寫答案。';
  }

  function finishManualEquation(state, parsed) {
    appendHistoryRow(state, { left: parsed.leftText, right: parsed.rightText, current: true, manual: true });
    state.left = parsed.leftText;
    state.right = parsed.rightText;
    state.manualInput = '';
    state.transientFeedback = null;
    if (parsed.finalVariableOnLeft && parsed.finalIntegerOnRight) {
      state.left = 'x';
      state.right = formatInt(state.solution);
      state.phase = 'complete';
      state.completed = true;
      recordScore(state);
      setFeedback('practice', '完成！答案是 x = ' + formatInt(state.solution) + '。', 'complete');
    } else if (parsed.reversedFinal) {
      setFeedback('practice', '請把 x 寫在等號左邊，再輸入最後答案。', 'neutral');
    } else if (parsed.unsolvedAnswer && state.mode === 1) {
      setFeedback('practice', '這一步已加入；計算右邊後輸入答案。', 'correct');
    } else if (parsed.unsolvedAnswer && !manualProofsAlreadyWritten(state).intermediate) {
      setFeedback('practice', manualIntermediateGuidance(state), 'neutral');
    } else {
      setFeedback('practice', '這一步已加入；可以繼續寫下一行。', 'correct');
    }
    if (!state.completed && !balanceVisible) state.balanceResumePending = true;
    renderPractice();
  }

  function submitEquationLine(state) {
    const raw = state.manualInput.trim();
    if (!raw || raw.length > 120) {
      setTransientFeedback(state, 'practice', '未能讀取這一行，請檢查後再輸入', 'try');
      renderPractice();
      return;
    }
    const previous = state.history[state.history.length - 1];
    if (previous && normalizedEquationText(previous.left + '=' + previous.right) === normalizedEquationText(raw)) {
      setTransientFeedback(state, 'practice', '這一行與上一行相同，請寫下一步', 'try');
      renderPractice();
      return;
    }

    let parsed;
    try {
      parsed = parseEquationLine(raw, state.solution);
    } catch (error) {
      setTransientFeedback(state, 'practice', '未能讀取這一行，請檢查後再輸入', 'try');
      renderPractice();
      return;
    }
    if (!parsed.equivalent) {
      state.hadMistake = true;
      state.attempts += 1;
      setTransientFeedback(state, 'practice', '這一行與上一行不相等，請檢查兩邊是否做了同一運算', 'try');
      renderPractice();
      return;
    }

    if (parsed.reversedFinal) {
      setTransientFeedback(state, 'practice', '請把 x 寫在等號左邊，再輸入最後答案。', 'neutral');
      renderPractice();
      return;
    }

    if (parsed.finalVariableOnLeft && parsed.finalIntegerOnRight) {
      const proofs = manualProofsAlreadyWritten(state);
      if (state.mode === 1 && !proofs.unsolvedAnswer) {
        setTransientFeedback(state, 'practice', manualOneStepAnswerGuidance(state), 'neutral');
        renderPractice();
        return;
      }
      if (state.mode === 2 && (!proofs.intermediate || !proofs.unsolvedAnswer)) {
        const missingIntermediate = !proofs.intermediate;
        const missingAnswer = !proofs.unsolvedAnswer;
        const message = missingIntermediate && missingAnswer
          ? manualIntermediateGuidance(state) + ' ' + manualAnswerGuidance(state)
          : (missingIntermediate ? manualIntermediateGuidance(state) : manualAnswerGuidance(state));
        setTransientFeedback(state, 'practice', message, 'neutral');
        renderPractice();
        return;
      }
    }

    finishManualEquation(state, parsed);
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
    elements.headerScoreCorrect.textContent = String(scores[activeMode].correct);
    elements.headerScoreWrong.textContent = String(scores[activeMode].wrong);
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
    if (balanceVisible && state.balanceResumePending && !state.completed) resumeBalanceFromHistory(state);
    if (state.completed) setFeedback('practice', '本題已完成，答案是 x = ' + formatInt(state.solution) + '。', 'complete');
    else if (state.phase === 'answer') setFeedback('practice', '繼續輸入右邊的計算結果。', 'neutral');
    else if (state.phase === 'cancel') setFeedback('practice', '兩邊相同，天平已平衡；按「抵消」繼續。', 'neutral');
    else setFeedback('practice', '選擇運算卡，依次放到左盤和右盤。', 'neutral');
    renderPractice();
  }

  function matchesFirstBalanceStep(state, parsed) {
    if (state.mode === 1) return false;
    if (state.type === 'two-step') {
      return parsed.left.constant.n === 0n && rationalEquals(parsed.left.x, rational(BigInt(state.coefficient), 1n));
    }
    if (state.type === 'fraction-x') {
      return parsed.left.constant.n === 0n && rationalEquals(parsed.left.x, rational(1n, BigInt(state.coefficient)));
    }
    const signedConstant = state.constantSign === '+' ? BigInt(state.constant) : -BigInt(state.constant);
    return rationalEquals(parsed.left.x, oneRational()) && rationalEquals(parsed.left.constant, rational(signedConstant, 1n));
  }

  function resumeBalanceFromHistory(state) {
    state.sideOperations = { left: null, right: null };
    state.selectedOperation = null;
    state.answerSpec = null;
    state.inputValue = '';
    state.cancelRowIndex = null;
    state.balanceResumePending = false;
    const last = state.history[state.history.length - 1];
    let parsed = null;
    try { parsed = parseEquationLine(last.left + ' = ' + last.right, state.solution); } catch (error) { parsed = null; }
    const modeOneHasUnsolvedAnswerProof = state.mode !== 1 || manualProofsAlreadyWritten(state).unsolvedAnswer;
    if (parsed && parsed.finalVariableOnLeft && parsed.rightHasOperation && modeOneHasUnsolvedAnswerProof) {
      state.left = parsed.leftText;
      state.right = parsed.rightText;
      state.stage = 2;
      state.phase = 'answer';
      state.answerSpec = { answerLeft: 'x', answer: state.solution, isIntermediate: false, nextStage: false };
      activeKeyboardContext = 'practice';
      return;
    }
    if (parsed && matchesFirstBalanceStep(state, parsed)) {
      state.left = parsed.leftText;
      state.right = parsed.rightText;
      state.stage = 1;
    } else {
      state.left = state.originalLeft;
      state.right = state.originalRight;
      state.stage = 0;
    }
    state.phase = 'operations';
    activeKeyboardContext = null;
  }

  function toggleBalanceMode() {
    const state = currentState();
    if (state.errorTimer) window.clearTimeout(state.errorTimer);
    state.errorTimer = null;
    if (balanceVisible) {
      if (state.phase === 'operations' && (state.sideOperations.left || state.sideOperations.right) && state.pendingPlacementHadMistake !== null) {
        state.hadMistake = state.pendingPlacementHadMistake;
      }
      if (state.phase === 'cancel' && Number.isInteger(state.cancelRowIndex)) {
        state.history.splice(state.cancelRowIndex, 1);
        state.history.forEach(function (row, index) { row.current = index === state.history.length - 1; });
      }
      state.sideOperations = { left: null, right: null };
      state.pendingPlacementHadMistake = null;
      state.selectedOperation = null;
      state.answerSpec = null;
      state.inputValue = '';
      state.phase = state.completed ? 'complete' : 'operations';
      state.cancelRowIndex = null;
      balanceVisible = false;
      activeKeyboardContext = 'practice';
      setFeedback('practice', '天平已收起；逐行輸入完整方程。已完成的步驟保留。', 'neutral');
    } else {
      if (!state.completed) resumeBalanceFromHistory(state);
      balanceVisible = true;
      setFeedback('practice', state.phase === 'answer'
        ? '繼續計算右邊未運算式子的結果。'
        : '天平已顯示；繼續用運算卡完成本題。已完成的步驟保留。', 'neutral');
    }
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
    const methodFeedback = method === 'balance'
      ? '天平逐步：左右各放一次相同運算卡。'
      : (state.type === 'fraction-binomial' ? '移項跳步：把分母移到右邊作乘數。' : '移項跳步：把常數項移到右邊，正負號改變。');
    setFeedback('practice', methodFeedback, 'neutral');
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
      pendingPlacementHadMistake: null,
      selectedOperation: null,
      answerSpec: null,
      inputValue: '',
      manualInput: '',
      balanceResumePending: false,
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
      renderKeypad(context, false);
    });
  }

  function renderKeypad(context, equationMode) {
    const container = context === 'hint' ? elements.hintKeypad : elements.practiceKeypad;
    const mode = equationMode && context === 'practice' ? 'equation' : 'number';
    if (container.dataset.keypadMode === mode) return;
    container.dataset.keypadMode = mode;
    container.classList.toggle('equation-keypad', mode === 'equation');
    container.setAttribute('aria-label', mode === 'equation' ? '方程輸入鍵盤' : (context === 'hint' ? '提示數字鍵盤' : '數字鍵盤'));
    container.replaceChildren();
    const definitions = mode === 'equation' ? equationKeyDefinitions : keyDefinitions;
    definitions.forEach(function (definition) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'keypad-key' + (definition.submit ? ' keypad-key--submit' : (definition.delete || definition.value === 'DEL' ? ' keypad-key--delete' : ''));
      button.dataset.key = definition.value;
      button.dataset.context = context;
      button.textContent = definition.label;
      button.setAttribute('aria-label', definition.ariaLabel || definition.label);
      if (definition.span) button.style.gridColumn = 'span ' + definition.span;
      container.appendChild(button);
    });
  }

  const qrCodeLibraryUrl = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

  function loadQRCodeLibrary() {
    if (window.QRCode) return Promise.resolve(true);
    if (qrCodeLoadPromise) return qrCodeLoadPromise;

    qrCodeLoadPromise = new Promise(function (resolve) {
      const script = document.createElement('script');
      let settled = false;
      const timeoutId = window.setTimeout(function () { finish(false); }, 8000);
      function finish(loaded) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        const available = loaded && Boolean(window.QRCode);
        if (!available) {
          script.remove();
          qrCodeLoadPromise = null;
        }
        resolve(available);
      }
      script.src = qrCodeLibraryUrl;
      script.async = true;
      script.onload = function () { finish(true); };
      script.onerror = function () { finish(false); };
      document.head.appendChild(script);
    });
    return qrCodeLoadPromise;
  }

  function renderWorksheetQRCodes() {
    try {
      document.querySelectorAll('.print-qr').forEach(function (target) {
        new window.QRCode(target, {
          text: window.location.href,
          width: 90,
          height: 90,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.H
        });
      });
    } catch (error) {
      document.querySelectorAll('.print-qr').forEach(function (target) { target.innerHTML = ''; });
      console.warn('QR codes could not be generated; printing without QR codes.');
    }
  }

  async function generateAndPrint() {
    if (printInProgress) return;
    printInProgress = true;
    try {
      let qrAvailable = false;
      try {
        qrAvailable = await loadQRCodeLibrary();
      } catch (error) {
        qrAvailable = false;
      }
      if (!qrAvailable) console.warn('QR code library failed to load; printing without QR codes.');

      const mode1Questions = Array.from({ length: 6 }, function () { return generateQuestionData(1); });
      const worksheetTypes = mode2QuestionTypes.concat(mode2QuestionTypes);
      for (let index = worksheetTypes.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInt(0, index);
        [worksheetTypes[index], worksheetTypes[swapIndex]] = [worksheetTypes[swapIndex], worksheetTypes[index]];
      }
      const mode2Questions = worksheetTypes.map(function (type) { return generateQuestionData(2, type); });

      const student = {
        className: elements.studentClass.value.trim(),
        name: elements.studentName.value.trim(),
        number: elements.studentNumber.value.trim()
      };
      const date = formatDate(new Date());
      const pageOne = renderWorksheetMode1(mode1Questions, student, date);
      const mode2Pages = renderWorksheetMode2(mode2Questions, student, date);
      elements.printArea.innerHTML = pageOne + mode2Pages;
      if (qrAvailable) renderWorksheetQRCodes();

      await new Promise(function (resolve) { window.setTimeout(resolve, 80); });
      window.print();
    } finally {
      printInProgress = false;
    }
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

  function worksheetHeader(title, student, date, pageNumber) {
    return '<header class="worksheet-header"><div class="worksheet-header-copy"><h1 class="worksheet-title">' + title + '</h1>' + worksheetStudentLine(student, date) + '</div>' +
      '<div id="print-qr-page-' + pageNumber + '" class="print-qr" aria-label="本頁網址 QR 碼"></div></header>';
  }

  function printGrid(left, right) {
    const hasFraction = String(left).indexOf('[[') !== -1 || String(right).indexOf('[[') !== -1;
    return '<div class="print-equation-grid' + (hasFraction ? ' has-fraction' : '') + '"><span class="step-left">' + mathExpressionHtml(left) + '</span><span class="step-equals">=</span><span class="step-right">' + mathExpressionHtml(right) + '</span></div>';
  }

  function renderWorksheetExample() {
    return '<section class="worksheet-example"><p class="worksheet-example-title">已完成示範（抵消一行可在書寫時略過）</p>' +
      printGrid('x + 3', '−4') +
      printGrid('x + 3 − 3', '−4 − 3') +
      printGrid('x', '−4 − 3') +
      printGrid('x', '−7') +
      '</section>';
  }

  function renderWorksheetMode2Examples() {
    return '<section class="worksheet-mode2-examples" aria-label="模式二已完成例題">' +
      '<article class="worksheet-example worksheet-mode2-example"><p class="worksheet-example-title">例一：先調加減（抵消行可在書寫時略過）</p>' +
      printGrid('[[x|3]] + 2', '5') +
      printGrid('[[x|3]] + 2 − 2', '5 − 2') +
      printGrid('[[x|3]]', '5 − 2') +
      printGrid('[[x|3]]', '3') +
      printGrid('[[x|3]] × 3', '3 × 3') +
      printGrid('x', '3 × 3') +
      printGrid('x', '9') +
      '</article>' +
      '<article class="worksheet-example worksheet-mode2-example"><p class="worksheet-example-title">例二：先調分母（抵消行可在書寫時略過）</p>' +
      printGrid('[[x + 2|3]]', '4') +
      printGrid('[[x + 2|3]] × 3', '4 × 3') +
      printGrid('x + 2', '4 × 3') +
      printGrid('x + 2', '12') +
      printGrid('x + 2 − 2', '12 − 2') +
      printGrid('x', '12 − 2') +
      printGrid('x', '10') +
      '</article>' +
      '</section>';
  }

  function renderBlankRows(count) {
    let rows = '';
    for (let index = 0; index < count; index += 1) rows += '<div class="worksheet-blank-line"></div>';
    return '<div class="worksheet-writing-lines">' + rows + '</div>';
  }

  function renderMode1WorksheetQuestion(question, index) {
    const equation = question.originalLeft + ' = ' + formatInt(question.originalRight);
    return '<article class="worksheet-question" data-mode="1" data-question-number="' + (index + 1) + '" data-question-type="' + escapeHtml(question.type) + '" data-original-left="' + escapeHtml(question.originalLeft) +
      '" data-original-right="' + escapeHtml(formatInt(question.originalRight)) + '" data-answer="' + escapeHtml(formatInt(question.answer)) + '">' +
      '<p class="worksheet-question-title">' + (index + 1) + '. ' + escapeHtml(equation) + '</p>' + renderBlankRows(4) + '</article>';
  }

  function renderMode2WorksheetQuestion(question, index, numberOffset) {
    const hasFraction = String(question.originalLeft).indexOf('[[') !== -1;
    const questionNumber = index + numberOffset + 1;
    return '<article class="worksheet-question worksheet-mode2" data-mode="2" data-question-type="' + escapeHtml(question.type) + '" data-original-left="' + escapeHtml(question.originalLeft) +
      '" data-question-number="' + questionNumber + '" data-original-right="' + escapeHtml(formatInt(question.originalRight)) + '" data-answer="' + escapeHtml(formatInt(question.answer)) + '">' +
      '<p class="worksheet-question-title' + (hasFraction ? ' has-fraction' : '') + '" role="img" aria-label="' + escapeHtml(accessibleEquation(question.originalLeft, question.originalRight)) + '">' + questionNumber + '. ' + mathExpressionHtml(question.originalLeft) + ' = ' + escapeHtml(formatInt(question.originalRight)) + '</p>' + renderBlankRows(7) + '</article>';
  }

  function renderWorksheetMode1(questions, student, date) {
    return '<section class="worksheet-page worksheet-mode1">' +
      worksheetHeader('S1 Ch4 Ex1｜解方程天平法工作紙', student, date, 1) +
      renderWorksheetExample() +
      '<h2 class="worksheet-section-title">模式一：一步方程（6 題）</h2>' +
      questions.map(renderMode1WorksheetQuestion).join('') +
      renderWorksheetAnswerStrip(1, questions, 0) +
      '</section>';
  }

  function renderWorksheetMode2(questions, student, date) {
    const firstQuestions = questions.slice(0, 2);
    const secondQuestions = questions.slice(2);
    return renderWorksheetMode2Page(firstQuestions, 0, student, date, 2, false, renderWorksheetMode2Examples()) +
      renderWorksheetMode2Page(secondQuestions, 2, student, date, 3, true, '');
  }

  function renderWorksheetMode2Page(questions, numberOffset, student, date, pageNumber, continuation, examples) {
    const title = continuation ? 'S1 Ch4 Ex1｜解方程天平法工作紙（續）' : 'S1 Ch4 Ex1｜解方程天平法工作紙（模式二）';
    const sectionTitle = continuation ? '模式二：兩步方程（續）' : '模式二：兩步方程（6 題）';
    return '<section class="worksheet-page worksheet-mode2' + (continuation ? ' worksheet-mode2-continuation' : ' worksheet-mode2-first') + '">' +
      worksheetHeader(title, student, date, pageNumber) +
      '<h2 class="worksheet-section-title">' + sectionTitle + '</h2>' +
      '<p class="worksheet-answer-note">請按等號對齊；右邊先保留未運算式子，再逐步計算。</p>' +
      examples + questions.map(function (question, index) { return renderMode2WorksheetQuestion(question, index, numberOffset); }).join('') +
      renderWorksheetAnswerStrip(2, questions, numberOffset) +
      '</section>';
  }

  function renderWorksheetAnswerStrip(mode, questions, numberOffset) {
    const rows = questions.map(function (question, index) {
      const questionNumber = index + numberOffset + 1;
      return '<span class="worksheet-answer-row" data-mode="' + mode + '" data-question-number="' + questionNumber + '" data-question-type="' + escapeHtml(question.type) + '" data-original-left="' + escapeHtml(question.originalLeft) +
        '" data-original-right="' + escapeHtml(formatInt(question.originalRight)) + '" data-answer="' + escapeHtml(formatInt(question.answer)) + '"><strong>' + questionNumber + '.</strong> x = ' + escapeHtml(formatInt(question.answer)) + '</span>';
    }).join('　');
    return '<footer class="print-answer-strip" aria-label="模式' + mode + '最終答案"><div class="print-fold-label">沿此線摺</div><div class="print-answer-strip-content">' + rows + '</div></footer>';
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
    elements.balanceModeToggle.addEventListener('click', toggleBalanceMode);
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
    initWorkspaceResizer();

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
      const activeState = contextState(activeKeyboardContext);
      if (activeKeyboardContext === 'practice' && activeState && !balanceVisible) {
        const equationKeys = {
          x: 'X', '+': 'ADD', '-': 'SUBTRACT', '−': 'SUBTRACT', '*': 'MULTIPLY', '×': 'MULTIPLY',
          '÷': 'DIVIDE', '/': 'DIVIDE', '(': 'LPAREN', ')': 'RPAREN', '=': 'EQUALS'
        };
        if (/^\d$/.test(event.key)) {
          event.preventDefault();
          inputKey(activeKeyboardContext, event.key);
        } else if (equationKeys[event.key]) {
          event.preventDefault();
          inputKey(activeKeyboardContext, equationKeys[event.key]);
        } else if (event.key === 'Backspace') {
          event.preventDefault();
          inputKey(activeKeyboardContext, 'DEL');
        } else if (event.key === 'Enter') {
          event.preventDefault();
          inputKey(activeKeyboardContext, 'SUBMIT');
        }
        return;
      }
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
