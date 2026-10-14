(function () {
  'use strict';

  const scoreStorageKey = 's1ch4ex2_scores';
  const layoutStorageKey = 's1ch4ex2_layout';
  const worksheetUrl = 'https://ai-lish.github.io/ai-learning/S1Ch4Ex2.html';
  const defaultStepsWidth = 58;
  const pageEntryTime = new Date();
  const modeNames = {
    1: '同類項加減',
    2: '拆括號',
    3: '兩邊都有 x',
    4: '分數方程'
  };
  const keyDefinitions = [
    { value: '7', label: '7' }, { value: '8', label: '8' }, { value: '9', label: '9' }, { value: 'X', label: 'x' }, { value: 'DEL', label: 'DEL', ariaLabel: '刪除最後一個符號' },
    { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' }, { value: '+', label: '+' }, { value: '-', label: '−', ariaLabel: '減號或負號' },
    { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '×', label: '×' }, { value: '÷', label: '÷' },
    { value: '(', label: '(' }, { value: '0', label: '0' }, { value: ')', label: ')' }, { value: '=', label: '=' }, { value: 'SUBMIT', label: '提交', submit: true }
  ];
  const elements = {
    modeTabs: [1, 2, 3, 4].map(function (mode) { return document.getElementById('mode-tab-' + mode); }),
    stepKicker: document.getElementById('step-kicker'),
    progressPill: document.getElementById('progress-pill'),
    equation: document.getElementById('equation-display'),
    instruction: document.getElementById('instruction'),
    balanceModeToggle: document.getElementById('balance-mode-toggle'),
    practiceWorkspace: document.getElementById('practice-workspace'),
    stepsColumn: document.getElementById('steps-column'),
    balanceResizer: document.getElementById('balance-resizer'),
    balanceLayout: document.getElementById('balance-layout'),
    board: document.getElementById('balance-drop-zone'),
    balanceSvg: document.getElementById('balance-svg'),
    leftEquation: document.getElementById('scale-left-equation'),
    rightEquation: document.getElementById('scale-right-equation'),
    balanceCaption: document.getElementById('balance-caption'),
    workSteps: document.getElementById('work-steps'),
    equationInput: document.getElementById('equation-input'),
    keypad: document.getElementById('equation-keypad'),
    feedback: document.getElementById('feedback'),
    nextQuestion: document.getElementById('next-question'),
    resetMode: document.getElementById('reset-mode'),
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

  let activeMode = 1;
  let balanceVisible = false;
  let stepsWidthPercent = readStepsWidth();
  let splitterPointerId = null;
  let qrCodeLoadPromise = null;
  let scores = readScores();
  const modeProgress = {};

  [1, 2, 3, 4].forEach(function (mode) {
    modeProgress[mode] = { solved: scores[mode].correct + scores[mode].wrong, state: null };
  });

  function randomInt(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  }

  function randomSign() {
    return Math.random() < 0.5 ? -1 : 1;
  }

  function formatInt(value) {
    return String(value).replace(/-/g, '−');
  }

  function signedTerm(value, suffix) {
    return (value < 0 ? ' − ' : ' + ') + formatInt(Math.abs(value)) + (suffix || '');
  }

  function xTerm(coefficient) {
    const magnitude = Math.abs(coefficient);
    return (coefficient < 0 ? '−' : '') + (magnitude === 1 ? '' : String(magnitude)) + 'x';
  }

  function linearExpression(coefficient, constant) {
    return xTerm(coefficient) + (constant < 0 ? ' − ' : ' + ') + formatInt(Math.abs(constant));
  }

  function bracketExpression(constant) {
    return 'x ' + (constant < 0 ? '− ' : '+ ') + formatInt(Math.abs(constant));
  }

  function fractionExpression(numerator, denominator) {
    return '(' + numerator + ') ÷ ' + String(denominator);
  }

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
    if (denominator === 0n) throw parserError('zero-denominator');
    let n = numerator;
    let d = denominator;
    if (d < 0n) { n = -n; d = -d; }
    const divisor = bigIntGcd(n, d);
    return { n: n / divisor, d: d / divisor };
  }

  function rationalAdd(left, right) {
    return rational(left.n * right.d + right.n * left.d, left.d * right.d);
  }

  function rationalSubtract(left, right) {
    return rational(left.n * right.d - right.n * left.d, left.d * right.d);
  }

  function rationalMultiply(left, right) {
    return rational(left.n * right.n, left.d * right.d);
  }

  function rationalDivide(left, right) {
    return rational(left.n * right.d, left.d * right.n);
  }

  function rationalNegate(value) {
    return { n: -value.n, d: value.d };
  }

  function rationalEquals(left, right) {
    return left.n === right.n && left.d === right.d;
  }

  function rationalIsZero(value) {
    return value.n === 0n;
  }

  function zeroRational() {
    return { n: 0n, d: 1n };
  }

  function oneRational() {
    return { n: 1n, d: 1n };
  }

  function parserError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
  }

  function affine(xCoefficient, constant) {
    return { x: xCoefficient, c: constant };
  }

  function affineAdd(left, right) {
    return affine(rationalAdd(left.x, right.x), rationalAdd(left.c, right.c));
  }

  function affineSubtract(left, right) {
    return affine(rationalSubtract(left.x, right.x), rationalSubtract(left.c, right.c));
  }

  function affineNegate(value) {
    return affine(rationalNegate(value.x), rationalNegate(value.c));
  }

  function affineMultiply(left, right) {
    if (!rationalIsZero(left.x) && !rationalIsZero(right.x)) throw parserError('non-linear');
    const xCoefficient = rationalAdd(rationalMultiply(left.x, right.c), rationalMultiply(right.x, left.c));
    return affine(xCoefficient, rationalMultiply(left.c, right.c));
  }

  function affineDivide(left, right) {
    if (!rationalIsZero(right.x)) throw parserError('variable-denominator');
    if (rationalIsZero(right.c)) throw parserError('zero-denominator');
    return affine(rationalDivide(left.x, right.c), rationalDivide(left.c, right.c));
  }

  function tokenizeExpression(source) {
    const input = String(source);
    const tokens = [];
    let index = 0;
    while (index < input.length) {
      if (/\s/.test(input[index])) { index += 1; continue; }
      const match = /^(?:\d+|[xX]|[()+−\-×*/÷])/.exec(input.slice(index));
      if (!match) throw parserError('invalid-character');
      tokens.push(match[0]);
      index += match[0].length;
    }
    if (!tokens.length) throw parserError('empty-expression');
    return tokens;
  }

  function parseExpression(source) {
    const tokens = tokenizeExpression(source);
    let cursor = 0;

    function parsePrimary() {
      const token = tokens[cursor];
      if (token === undefined) throw parserError('incomplete-expression');
      if (/^\d+$/.test(token)) {
        cursor += 1;
        return { ast: { type: 'number', value: BigInt(token) }, value: affine(zeroRational(), rational(BigInt(token), 1n)) };
      }
      if (token.toLowerCase() === 'x') {
        cursor += 1;
        return { ast: { type: 'x' }, value: affine(oneRational(), zeroRational()) };
      }
      if (token === '(') {
        cursor += 1;
        const inside = parseAdditive();
        if (tokens[cursor] !== ')') throw parserError('unmatched-parenthesis');
        cursor += 1;
        return { ast: { type: 'group', child: inside.ast }, value: inside.value };
      }
      throw parserError('expected-value');
    }

    function parseUnary() {
      const token = tokens[cursor];
      if (token === '+' || token === '−' || token === '-') {
        cursor += 1;
        const child = parseUnary();
        if (token === '+') return child;
        return { ast: { type: 'negate', child: child.ast }, value: affineNegate(child.value) };
      }
      return parsePrimary();
    }

    function parseProduct() {
      let result = parseUnary();
      while (cursor < tokens.length) {
        const token = tokens[cursor];
        if (token === '×' || token === '*') {
          cursor += 1;
          const right = parseUnary();
          result = { ast: { type: 'multiply', left: result.ast, right: right.ast }, value: affineMultiply(result.value, right.value) };
          continue;
        }
        if (token === '÷' || token === '/') {
          cursor += 1;
          const right = parseUnary();
          if (containsVariable(right.ast)) throw parserError('variable-denominator');
          result = { ast: { type: 'divide', left: result.ast, right: right.ast }, value: affineDivide(result.value, right.value) };
          continue;
        }
        if (token.toLowerCase() === 'x' || token === '(') {
          const right = parseUnary();
          result = { ast: { type: 'multiply', left: result.ast, right: right.ast }, value: affineMultiply(result.value, right.value) };
          continue;
        }
        break;
      }
      return result;
    }

    function parseAdditive() {
      let result = parseProduct();
      while (cursor < tokens.length && (tokens[cursor] === '+' || tokens[cursor] === '−' || tokens[cursor] === '-')) {
        const operator = tokens[cursor];
        cursor += 1;
        const right = parseProduct();
        if (operator === '+') result = { ast: { type: 'add', left: result.ast, right: right.ast }, value: affineAdd(result.value, right.value) };
        else result = { ast: { type: 'subtract', left: result.ast, right: right.ast }, value: affineSubtract(result.value, right.value) };
      }
      return result;
    }

    const result = parseAdditive();
    if (cursor !== tokens.length) throw parserError(tokens[cursor] === ')' ? 'unmatched-parenthesis' : 'unexpected-token');
    return result;
  }

  function parseEquationLine(source) {
    const raw = String(source);
    const equals = raw.indexOf('=');
    if (equals < 0 || raw.indexOf('=', equals + 1) >= 0) throw parserError('equation-needs-one-equals');
    const leftText = raw.slice(0, equals).trim();
    const rightText = raw.slice(equals + 1).trim();
    const left = parseExpression(leftText);
    const right = parseExpression(rightText);
    const coefficient = rationalSubtract(left.value.x, right.value.x);
    const difference = rationalSubtract(right.value.c, left.value.c);
    const unique = !rationalIsZero(coefficient);
    const solution = unique ? rationalDivide(difference, coefficient) : null;
    return {
      source: raw,
      leftText: leftText,
      rightText: rightText,
      leftAst: left.ast,
      rightAst: right.ast,
      left: left.value,
      right: right.value,
      unique: unique,
      solution: solution,
      reversedFinal: rationalIsZero(left.value.x) && isSimpleX(right.ast),
      unsolvedAnswer: isSimpleX(left.ast) && !containsVariable(right.ast) && hasArithmetic(right.ast),
      finalAnswer: isSimpleX(left.ast) && rationalIsZero(right.value.x) && !hasArithmetic(right.ast) && solution && solution.d === 1n
    };
  }

  function isSimpleX(node) {
    if (!node) return false;
    if (node.type === 'x') return true;
    return node.type === 'group' && isSimpleX(node.child);
  }

  function hasArithmetic(node) {
    if (!node) return false;
    if (node.type === 'add' || node.type === 'subtract' || node.type === 'multiply' || node.type === 'divide') return true;
    if (node.type === 'group' || node.type === 'negate') return hasArithmetic(node.child);
    return false;
  }

  function containsVariable(node) {
    if (!node) return false;
    if (node.type === 'x') return true;
    if (node.type === 'group' || node.type === 'negate') return containsVariable(node.child);
    return Boolean(node.left && containsVariable(node.left)) || Boolean(node.right && containsVariable(node.right));
  }

  function flattenAdditiveTerms(node, output, sign) {
    if (node.type === 'add') {
      flattenAdditiveTerms(node.left, output, sign);
      flattenAdditiveTerms(node.right, output, sign);
      return;
    }
    if (node.type === 'subtract') {
      flattenAdditiveTerms(node.left, output, sign);
      flattenAdditiveTerms(node.right, output, -sign);
      return;
    }
    if (node.type === 'negate') {
      flattenAdditiveTerms(node.child, output, -sign);
      return;
    }
    if (node.type === 'group') {
      flattenAdditiveTerms(node.child, output, sign);
      return;
    }
    output.push({ node: node, sign: sign });
  }

  function hasCombinedLikeTerms(row) {
    const leftTerms = [];
    const rightTerms = [];
    flattenAdditiveTerms(row.leftAst, leftTerms, 1);
    flattenAdditiveTerms(row.rightAst, rightTerms, 1);
    const counts = [leftTerms, rightTerms].map(function (terms) {
      return {
        variables: terms.filter(function (term) { return containsVariable(term.node); }).length,
        constants: terms.filter(function (term) { return !containsVariable(term.node); }).length
      };
    });
    return counts.every(function (count) { return count.variables <= 1 && count.constants <= 1; });
  }

  function hasNoBrackets(row) {
    return !/[()]/.test(row.source);
  }

  function hasXOnlyOnOneSide(row) {
    const leftHasX = !rationalIsZero(row.left.x);
    const rightHasX = !rationalIsZero(row.right.x);
    return leftHasX !== rightHasX;
  }

  function hasNoFractions(row) {
    return !/[÷/]/.test(row.source);
  }

  function rowHasRequiredStep(mode, row) {
    if (row.initial || row.unsolvedAnswer || row.finalAnswer) return false;
    if (mode === 1) return hasCombinedLikeTerms(row);
    if (mode === 2) return hasNoBrackets(row);
    if (mode === 3) return hasXOnlyOnOneSide(row);
    return hasNoFractions(row);
  }

  function integerFromRational(value) {
    if (!value || value.d !== 1n) return null;
    const number = Number(value.n);
    return Number.isSafeInteger(number) ? number : null;
  }

  function assertQuestion(question) {
    const parsed = parseEquationLine(question.left + ' = ' + question.right);
    if (!parsed.unique || parsed.solution.d !== 1n) return false;
    const answer = integerFromRational(parsed.solution);
    if (answer === null || (Number.isInteger(question.expected) && answer !== question.expected)) return false;
    const xValue = rational(BigInt(answer), 1n);
    const leftValue = rationalAdd(rationalMultiply(parsed.left.x, xValue), parsed.left.c);
    const rightValue = rationalAdd(rationalMultiply(parsed.right.x, xValue), parsed.right.c);
    if (!rationalEquals(leftValue, rightValue)) return false;
    question.answer = answer;
    return true;
  }

  function generateMode1Question() {
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const firstCoefficient = randomInt(2, 8);
      const secondCoefficient = randomInt(2, 7) * randomSign();
      const totalCoefficient = firstCoefficient + secondCoefficient;
      if (Math.abs(totalCoefficient) < 2) continue;
      const firstConstant = randomInt(2, 12) * randomSign();
      const secondConstant = randomInt(2, 12) * randomSign();
      const answer = randomInt(-8, 10);
      const right = totalCoefficient * answer + firstConstant + secondConstant;
      const left = String(firstCoefficient) + 'x' + signedTerm(firstConstant, '') + signedTerm(secondCoefficient, 'x') + signedTerm(secondConstant, '');
      const question = { mode: 1, type: 'collect-like-terms', left: left, right: formatInt(right), expected: answer };
      if (assertQuestion(question)) return question;
    }
    throw new Error('Unable to generate a mode 1 equation.');
  }

  function generateMode2Question(forcedType) {
    const type = Number.isInteger(forcedType) ? forcedType : randomInt(0, 3);
    for (let attempt = 0; attempt < 700; attempt += 1) {
      const a = randomInt(2, 5);
      const b = randomInt(2, 7) * randomSign();
      const answer = randomInt(-7, 9);
      let question;
      if (type === 0) {
        const right = a * (answer + b);
        question = { mode: 2, type: 'bracket-a', left: String(a) + '(' + bracketExpression(b) + ')', right: formatInt(right), expected: answer };
      } else if (type === 1) {
        const d = randomInt(2, 10) * randomSign();
        const right = a * (answer + b) + d;
        question = { mode: 2, type: 'bracket-b-constant', left: String(a) + '(' + bracketExpression(b) + ')' + signedTerm(d, ''), right: formatInt(right), expected: answer };
      } else if (type === 2) {
        let e = randomInt(2, 5);
        if (Math.abs(a - e) < 2) e = a + 2;
        const f = randomInt(2, 7) * randomSign();
        const right = a * (answer + b) - e * (answer + f);
        question = { mode: 2, type: 'bracket-b-two-brackets', left: String(a) + '(' + bracketExpression(b) + ') − ' + String(e) + '(' + bracketExpression(f) + ')', right: formatInt(right), expected: answer };
      } else {
        const constant = randomInt(2, 12);
        const right = constant - a * (answer + b);
        question = { mode: 2, type: 'bracket-negative', left: formatInt(constant) + ' − ' + String(a) + '(' + bracketExpression(b) + ')', right: formatInt(right), expected: answer };
      }
      if (assertQuestion(question)) return question;
    }
    throw new Error('Unable to generate a mode 2 equation.');
  }

  function generateMode3Question(forcedType) {
    const type = Number.isInteger(forcedType) ? forcedType : randomInt(0, 2);
    for (let attempt = 0; attempt < 700; attempt += 1) {
      const a = randomInt(2, 8);
      let c = randomInt(2, 8);
      if (Math.abs(a - c) < 2) c = a + 2;
      const answer = randomInt(-8, 9);
      let left;
      let right;
      if (type === 0) {
        const b = randomInt(2, 12) * randomSign();
        const d = a * answer + b - c * answer;
        left = linearExpression(a, b);
        right = linearExpression(c, d);
      } else if (type === 1) {
        const constant = randomInt(2, 12);
        const d = constant - (a + c) * answer;
        left = formatInt(constant) + ' − ' + String(a) + 'x';
        right = linearExpression(c, d);
      } else {
        const b = randomInt(2, 8) * randomSign();
        const d = a * (answer + b) - c * answer;
        left = String(a) + '(' + bracketExpression(b) + ')';
        right = linearExpression(c, d);
      }
      const question = { mode: 3, type: 'variables-both-sides-' + String(type + 1), left: left, right: right };
      question.expected = answer;
      if (assertQuestion(question)) return question;
    }
    throw new Error('Unable to generate a mode 3 equation.');
  }

  function greatestCommonDivisor(left, right) {
    let a = Math.abs(left);
    let b = Math.abs(right);
    while (b) {
      const remainder = a % b;
      a = b;
      b = remainder;
    }
    return a || 1;
  }

  function leastCommonMultiple(left, right) {
    return Math.abs(left * right) / greatestCommonDivisor(left, right);
  }

  function generateMode4CrossQuestion() {
    for (let attempt = 0; attempt < 2000; attempt += 1) {
      const m = randomInt(2, 7);
      let n = randomInt(2, 7);
      if (n === m) n = n === 7 ? 2 : n + 1;
      if (leastCommonMultiple(m, n) > 24) continue;
      const a = randomInt(2, 5);
      const c = randomInt(2, 5);
      const b = randomInt(2, 9) * randomSign();
      const d = randomInt(2, 9) * randomSign();
      if (greatestCommonDivisor(a, b) > 1 || greatestCommonDivisor(c, d) > 1) continue;
      const coefficient = a * n - c * m;
      if (coefficient === 0) continue;
      const numerator = m * d - n * b;
      if (numerator % coefficient !== 0) continue;
      const answer = numerator / coefficient;
      if (Math.abs(answer) > 12) continue;
      if (a * answer + b === 0 && c * answer + d === 0) continue;
      const question = {
        mode: 4,
        type: 'fraction-cross-multiply',
        left: fractionExpression(linearExpression(a, b), m),
        right: fractionExpression(linearExpression(c, d), n),
        expected: answer
      };
      if (assertQuestion(question)) return question;
    }
    throw new Error('Unable to generate a cross-multiplication equation.');
  }

  function generateMode4LcmAddQuestion() {
    for (let attempt = 0; attempt < 3000; attempt += 1) {
      const m = randomInt(2, 6);
      let n = randomInt(2, 6);
      if (n === m) n = n === 6 ? 2 : n + 1;
      const common = leastCommonMultiple(m, n);
      if (common > 24) continue;
      const answer = randomInt(-6, 10);
      if (Math.abs(answer) > 12) continue;
      const b = randomInt(2, 8) * randomSign();
      const d = randomInt(2, 8) * randomSign();
      const total = rationalAdd(rational(BigInt(answer + b), BigInt(m)), rational(BigInt(answer + d), BigInt(n)));
      if (total.d !== 1n) continue;
      const rhs = Number(total.n);
      const question = {
        mode: 4,
        type: 'fraction-lcm-sum',
        left: fractionExpression(linearExpression(1, b), m) + ' + ' + fractionExpression(linearExpression(1, d), n),
        right: formatInt(rhs),
        expected: answer,
        lcm: common
      };
      if (assertQuestion(question)) return question;
    }
    throw new Error('Unable to generate an LCM equation.');
  }

  function generateMode4LcmBothSidesQuestion() {
    for (let attempt = 0; attempt < 3000; attempt += 1) {
      const m = randomInt(2, 7);
      let n = randomInt(2, 7);
      if (n === m) n = n === 7 ? 2 : n + 1;
      const firstDenominator = randomInt(2, 7);
      const firstNumeratorMagnitude = randomInt(1, firstDenominator - 1);
      if (greatestCommonDivisor(firstNumeratorMagnitude, firstDenominator) > 1) continue;
      const secondDenominator = randomInt(2, 7);
      const secondNumeratorMagnitude = randomInt(1, secondDenominator - 1);
      if (greatestCommonDivisor(secondNumeratorMagnitude, secondDenominator) > 1) continue;
      const firstNumerator = firstNumeratorMagnitude * randomSign();
      const secondNumerator = secondNumeratorMagnitude * randomSign();
      const common = leastCommonMultiple(leastCommonMultiple(m, n), leastCommonMultiple(firstDenominator, secondDenominator));
      if (common > 24) continue;
      const coefficient = rationalSubtract(rational(1n, BigInt(m)), rational(1n, BigInt(n)));
      if (rationalIsZero(coefficient)) continue;
      const constantDifference = rationalSubtract(rational(BigInt(secondNumerator), BigInt(secondDenominator)), rational(BigInt(firstNumerator), BigInt(firstDenominator)));
      const answerValue = rationalDivide(constantDifference, coefficient);
      const answer = integerFromRational(answerValue);
      if (answer === null || Math.abs(answer) > 12) continue;
      const question = {
        mode: 4,
        type: 'fraction-lcm-both-sides',
        left: 'x ÷ ' + String(m) + signedTerm(firstNumerator, ' ÷ ' + String(firstDenominator)),
        right: 'x ÷ ' + String(n) + signedTerm(secondNumerator, ' ÷ ' + String(secondDenominator)),
        expected: answer,
        lcm: common
      };
      if (assertQuestion(question)) return question;
    }
    throw new Error('Unable to generate an LCM equation with fractions on both sides.');
  }

  function generateQuestion(mode, preferredType) {
    if (mode === 1) return generateMode1Question();
    if (mode === 2) return generateMode2Question();
    if (mode === 3) return generateMode3Question();
    if (preferredType === 'fraction-cross-multiply') return generateMode4CrossQuestion();
    if (preferredType === 'fraction-lcm-both-sides') return generateMode4LcmBothSidesQuestion();
    if (preferredType === 'fraction-lcm-sum') return generateMode4LcmAddQuestion();
    const kind = randomInt(0, 2);
    if (kind === 0) return generateMode4CrossQuestion();
    if (kind === 1) return generateMode4LcmAddQuestion();
    return generateMode4LcmBothSidesQuestion();
  }

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
    elements.balanceResizer.setAttribute('aria-valuenow', String(Math.round(stepsWidthPercent)));
    if (!window.matchMedia('(min-width: 900px)').matches) {
      elements.practiceWorkspace.style.gridTemplateColumns = '';
      return;
    }
    if (elements.practiceWorkspace.classList.contains('is-collapsed')) {
      elements.practiceWorkspace.style.gridTemplateColumns = 'minmax(0, 1fr)';
      return;
    }
    const resizerWidth = 44;
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
    return {
      1: { correct: 0, wrong: 0 },
      2: { correct: 0, wrong: 0 },
      3: { correct: 0, wrong: 0 },
      4: { correct: 0, wrong: 0 }
    };
  }

  function readScores() {
    const empty = emptyScores();
    try {
      const parsed = JSON.parse(window.localStorage.getItem(scoreStorageKey) || 'null');
      [1, 2, 3, 4].forEach(function (mode) {
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

  function saveScores() {
    try {
      window.localStorage.setItem(scoreStorageKey, JSON.stringify(scores));
    } catch (error) {
      console.warn('無法儲存本機分數。');
    }
    updateScoreUI();
  }

  function makeQuestionState(mode, preferredType) {
    const question = generateQuestion(mode, preferredType);
    const initial = parseEquationLine(question.left + ' = ' + question.right);
    initial.initial = true;
    return {
      mode: mode,
      question: question,
      history: [initial],
      input: '',
      completed: false,
      hadMistake: false,
      scoreRecorded: false,
      feedback: '逐行輸入一個等價方程。',
      feedbackKind: 'neutral',
      tiltPreview: null,
      tiltTimer: null
    };
  }

  function currentState() {
    if (!modeProgress[activeMode].state) modeProgress[activeMode].state = makeQuestionState(activeMode);
    return modeProgress[activeMode].state;
  }

  function updateScoreUI() {
    [1, 2, 3, 4].forEach(function (mode) {
      document.getElementById('score-correct-' + mode).textContent = String(scores[mode].correct);
      document.getElementById('score-wrong-' + mode).textContent = String(scores[mode].wrong);
    });
    elements.headerScoreCorrect.textContent = String(scores[activeMode].correct);
    elements.headerScoreWrong.textContent = String(scores[activeMode].wrong);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function displayText(value) {
    return String(value).replace(/-/g, '−').replace(/\*/g, '×').replace(/\//g, '÷');
  }

  function appendMathExpression(parent, source) {
    const text = displayText(source);
    const pattern = /(\([^()]*\)|x|\d+)\s*÷\s*(\d+|\([^()]*\))/gi;
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text))) {
      if (match.index > cursor) parent.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      const fraction = document.createElement('span');
      fraction.className = 'math-fraction';
      fraction.setAttribute('aria-hidden', 'true');
      const numerator = document.createElement('span');
      numerator.className = 'fraction-numerator';
      numerator.textContent = stripOuterParentheses(match[1]);
      const denominator = document.createElement('span');
      denominator.className = 'fraction-denominator';
      denominator.textContent = stripOuterParentheses(match[2]);
      fraction.append(numerator, denominator);
      parent.appendChild(fraction);
      cursor = pattern.lastIndex;
    }
    if (cursor < text.length) parent.appendChild(document.createTextNode(text.slice(cursor)));
  }

  function stripOuterParentheses(value) {
    const text = String(value).trim();
    return text[0] === '(' && text[text.length - 1] === ')' ? text.slice(1, -1) : text;
  }

  function mathExpressionHtml(source) {
    const text = displayText(source);
    const pattern = /(\([^()]*\)|x|\d+)\s*÷\s*(\d+|\([^()]*\))/gi;
    let html = '';
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text))) {
      html += escapeHtml(text.slice(cursor, match.index));
      html += '<span class="math-fraction" aria-hidden="true"><span class="fraction-numerator">' + escapeHtml(stripOuterParentheses(match[1])) + '</span><span class="fraction-denominator">' + escapeHtml(stripOuterParentheses(match[2])) + '</span></span>';
      cursor = pattern.lastIndex;
    }
    return html + escapeHtml(text.slice(cursor));
  }

  function renderEquationGrid(parent, leftText, rightText, extraClass) {
    parent.replaceChildren();
    const grid = document.createElement('span');
    grid.className = 'equation-grid' + (/[÷/]/.test(leftText + rightText) ? ' has-fraction' : '') + (extraClass ? ' ' + extraClass : '');
    grid.setAttribute('role', 'img');
    grid.setAttribute('aria-label', displayText(leftText) + ' 等於 ' + displayText(rightText));
    const left = document.createElement('span');
    left.className = 'step-left';
    appendMathExpression(left, leftText);
    const equals = document.createElement('span');
    equals.className = 'step-equals';
    equals.textContent = '=';
    const right = document.createElement('span');
    right.className = 'step-right';
    appendMathExpression(right, rightText);
    grid.append(left, equals, right);
    parent.appendChild(grid);
  }

  function renderWorkSteps(state) {
    elements.workSteps.replaceChildren();
    state.history.forEach(function (row, index) {
      const wrap = document.createElement('div');
      wrap.className = 'equation-step-wrap' + (index === state.history.length - 1 ? ' is-current' : '');
      wrap.dataset.rowNumber = String(index + 1);
      const number = document.createElement('span');
      number.className = 'equation-step-number';
      number.textContent = String(index + 1) + '.';
      const line = document.createElement('div');
      renderEquationGrid(line, row.leftText, row.rightText);
      const equationGrid = line.querySelector('.equation-grid');
      if (Math.max(row.leftText.length, row.rightText.length) > 11) equationGrid.classList.add('is-compact');
      wrap.append(number, line);
      elements.workSteps.appendChild(wrap);
    });
  }

  function renderQuestion(state) {
    renderEquationGrid(elements.equation, state.question.left, state.question.right, 'question-equation-grid');
    elements.equation.dataset.questionType = state.question.type;
  }

  function normalizedEquationText(value) {
    return String(value).replace(/−/g, '-').replace(/\s+/g, '').toLowerCase();
  }

  function renderInput(state) {
    renderEquationGrid(elements.equationInput, state.input.split('=')[0] || '', state.input.includes('=') ? state.input.slice(state.input.indexOf('=') + 1) : '', 'manual-preview-grid');
    if (!state.input) {
      elements.equationInput.replaceChildren(document.createTextNode('—'));
      elements.equationInput.setAttribute('aria-label', '尚未輸入方程');
    } else {
      elements.equationInput.setAttribute('aria-label', displayText(state.input));
    }
  }

  function renderSvgMath(node, expression) {
    const namespace = 'http://www.w3.org/2000/svg';
    node.replaceChildren();
    const source = displayText(expression);
    node.setAttribute('aria-label', source || '空白');
    const pattern = /(\([^()]*\)|x|\d+)\s*÷\s*(\d+|\([^()]*\))/gi;
    let cursor = 0;
    let width = 0;
    function addText(textValue) {
      if (!textValue) return;
      const segment = document.createElementNS(namespace, 'g');
      const text = document.createElementNS(namespace, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '119');
      text.setAttribute('text-anchor', 'start');
      text.setAttribute('xml:space', 'preserve');
      text.textContent = textValue;
      segment.appendChild(text);
      node.appendChild(segment);
      let textWidth = textValue.length * 10;
      try { textWidth = text.getBBox().width; } catch (error) { textWidth = textValue.length * 10; }
      segment.setAttribute('transform', 'translate(' + width + ' 0)');
      width += textWidth + 3;
    }
    function addFraction(numeratorText, denominatorText) {
      const segment = document.createElementNS(namespace, 'g');
      const numerator = document.createElementNS(namespace, 'text');
      numerator.setAttribute('x', '0');
      numerator.setAttribute('y', '108');
      numerator.setAttribute('text-anchor', 'middle');
      numerator.textContent = stripOuterParentheses(numeratorText);
      const denominator = document.createElementNS(namespace, 'text');
      denominator.setAttribute('x', '0');
      denominator.setAttribute('y', '130');
      denominator.setAttribute('text-anchor', 'middle');
      denominator.textContent = stripOuterParentheses(denominatorText);
      segment.append(numerator, denominator);
      node.appendChild(segment);
      let fractionWidth = 42;
      try { fractionWidth = Math.max(numerator.getBBox().width, denominator.getBBox().width) + 8; } catch (error) { fractionWidth = Math.max(numerator.textContent.length, denominator.textContent.length) * 10 + 8; }
      numerator.setAttribute('x', String(fractionWidth / 2));
      denominator.setAttribute('x', String(fractionWidth / 2));
      const bar = document.createElementNS(namespace, 'line');
      bar.setAttribute('x1', '1');
      bar.setAttribute('x2', String(fractionWidth - 1));
      bar.setAttribute('y1', '114');
      bar.setAttribute('y2', '114');
      bar.setAttribute('class', 'scale-fraction-bar');
      segment.appendChild(bar);
      segment.setAttribute('transform', 'translate(' + width + ' 0)');
      width += fractionWidth + 3;
    }
    let match;
    while ((match = pattern.exec(source))) {
      addText(source.slice(cursor, match.index));
      addFraction(match[1], match[2]);
      cursor = pattern.lastIndex;
    }
    addText(source.slice(cursor));
    width = Math.max(0, width - 3);
    const center = Number(node.dataset.centerX || 195);
    node.setAttribute('transform', 'translate(' + (center - width / 2) + ' 0)');
    const fontSize = Math.max(9, Math.min(19, width > 105 ? 19 * 105 / width : 19));
    node.setAttribute('font-size', String(fontSize));
  }

  function renderBalance(state) {
    const row = state.tiltPreview || state.history[state.history.length - 1];
    renderSvgMath(elements.leftEquation, row.leftText);
    renderSvgMath(elements.rightEquation, row.rightText);
    elements.board.classList.remove('is-tilted-left', 'is-tilted-right', 'is-balanced');
    if (state.tiltPreview) {
      elements.board.classList.add('is-tilted-left');
      elements.balanceCaption.textContent = '兩邊不再相等；請檢查這一行的運算。';
      elements.balanceSvg.setAttribute('aria-label', '兩邊不再相等，天平傾側');
    } else {
      elements.board.classList.add('is-balanced');
      elements.balanceCaption.textContent = '兩邊相等時，天平保持平衡。';
      elements.balanceSvg.setAttribute('aria-label', '天平兩邊保持平衡');
    }
  }

  function render() {
    const state = currentState();
    const progress = modeProgress[activeMode];
    elements.modeTabs.forEach(function (button, index) {
      const selected = activeMode === index + 1;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    elements.stepKicker.textContent = '模式' + formatInt(activeMode) + ' · ' + modeNames[activeMode];
    const questionNumber = progress.solved + (state.completed ? 0 : 1);
    elements.progressPill.textContent = '第 ' + questionNumber + ' 題 · 已完成 ' + progress.solved + ' 題';
    elements.instruction.textContent = state.completed
      ? '本題完成。可按「下一題」繼續，或重新開始本模式。'
      : '逐行輸入完整方程；每一步都要與原題有相同解集。抵消行可以跳過。';
    elements.balanceModeToggle.textContent = balanceVisible ? '收起天平' : '顯示天平';
    elements.balanceModeToggle.setAttribute('aria-pressed', String(balanceVisible));
    elements.balanceLayout.hidden = !balanceVisible;
    elements.practiceWorkspace.classList.toggle('is-collapsed', !balanceVisible);
    syncWorkspaceWidth();
    renderQuestion(state);
    renderWorkSteps(state);
    renderInput(state);
    renderBalance(state);
    elements.feedback.textContent = state.feedback;
    elements.feedback.dataset.kind = state.feedbackKind;
    elements.nextQuestion.disabled = !state.completed;
    elements.nextQuestion.textContent = state.completed ? '下一題' : '完成這題後可繼續';
    elements.keypad.querySelectorAll('button').forEach(function (button) { button.disabled = state.completed; });
    updateScoreUI();
  }

  function setFeedback(state, message, kind) {
    state.feedback = message;
    state.feedbackKind = kind || 'neutral';
  }

  function appendInput(state, text) {
    if (state.completed || state.input.length + text.length > 120) {
      if (!state.completed) setFeedback(state, '這一行太長，請刪去多餘符號後再輸入。', 'try');
      render();
      return;
    }
    state.input += text;
    setFeedback(state, '逐行輸入一個等價方程。', 'neutral');
    render();
  }

  function enterKey(key) {
    const state = currentState();
    if (state.completed) return;
    if (key === 'SUBMIT') { submitEquation(state); return; }
    if (key === 'DEL') {
      state.input = state.input.slice(0, -1);
      setFeedback(state, '逐行輸入一個等價方程。', 'neutral');
      render();
      return;
    }
    if (key === 'X') appendInput(state, 'x');
    else if (key === '+') appendInput(state, ' + ');
    else if (key === '-') {
      const trimmed = state.input.trimEnd();
      const unary = !trimmed || /[=+−\-×÷/(]$/.test(trimmed);
      appendInput(state, unary ? '−' : ' − ');
    } else if (key === '×' || key === '÷') appendInput(state, ' ' + key + ' ');
    else if (key === '=') appendInput(state, ' = ');
    else if (key === '(' || key === ')') appendInput(state, key);
    else if (/^\d$/.test(key)) appendInput(state, key);
  }

  function missingStepMessage(state) {
    const proofRows = state.history.filter(function (row) { return rowHasRequiredStep(state.mode, row); });
    const hasRequiredStep = proofRows.length > 0;
    const hasUnsolvedAnswer = state.history.some(function (row) { return row.unsolvedAnswer; });
    const messages = [];
    if (!hasRequiredStep) {
      if (state.mode === 1) messages.push('請先寫一行已合併同類項的方程；每邊至多保留一個 x 項及一個常數項。');
      else if (state.mode === 2) messages.push('請先用日式拆括號，寫出一行不含括號的等價方程。');
      else if (state.mode === 3) messages.push('請先移項，寫出一行 x 只在等號一邊的等價方程。');
      else messages.push('請先寫一行不含分母或「÷」的等價方程；單一分數等於單一分數可交叉乘分母，其餘要兩邊同乘 L.C.M.。');
    }
    if (!hasUnsolvedAnswer) messages.push('請先寫出未計算的答案一行，例如 x = 20 ÷ 4，再寫 x = n。');
    return messages.join(' ');
  }

  function normalizedEquationText(value) {
    return String(value).replace(/−/g, '-').replace(/\s+/g, '').toLowerCase();
  }

  function showWrongBalance(state, parsed) {
    if (state.tiltTimer) window.clearTimeout(state.tiltTimer);
    state.tiltPreview = parsed;
    state.tiltTimer = window.setTimeout(function () {
      state.tiltPreview = null;
      state.tiltTimer = null;
      renderBalance(state);
    }, 1000);
  }

  function completeQuestion(state, finalRow) {
    state.history.push(finalRow);
    state.completed = true;
    state.input = '';
    state.tiltPreview = null;
    if (!state.scoreRecorded) {
      state.scoreRecorded = true;
      if (state.hadMistake) scores[state.mode].wrong += 1;
      else scores[state.mode].correct += 1;
      modeProgress[state.mode].solved = scores[state.mode].correct + scores[state.mode].wrong;
      saveScores();
    }
    setFeedback(state, '完成！答案是 x = ' + formatInt(state.question.answer) + '。', 'complete');
    render();
  }

  function submitEquation(state) {
    const raw = state.input.trim();
    if (!raw) {
      setFeedback(state, '請輸入完整方程，再按「提交」。', 'try');
      render();
      return;
    }
    if (raw.length > 120) {
      setFeedback(state, '這一行太長，請刪去多餘符號後再輸入。', 'try');
      render();
      return;
    }
    const normalized = normalizedEquationText(raw);
    if (state.history.some(function (row) { return normalizedEquationText(row.source) === normalized; })) {
      setFeedback(state, '這一行與之前相同，請寫下一步。', 'neutral');
      render();
      return;
    }

    let parsed;
    try {
      parsed = parseEquationLine(raw);
    } catch (error) {
      if (error.code === 'non-linear' || error.code === 'variable-denominator') {
        const equals = raw.indexOf('=');
        const preview = { leftText: raw.slice(0, equals).trim(), rightText: raw.slice(equals + 1).trim() };
        state.hadMistake = true;
        setFeedback(state, error.code === 'non-linear'
          ? '這不是一元一次方程（例如 x × x）；這一行不收，請輸入只含一次 x 的方程。'
          : '分母不能含有 x；這一行不收，請輸入一元一次方程。', 'try');
        showWrongBalance(state, preview);
      } else if (error.code === 'zero-denominator') setFeedback(state, '分母不可為 0，請檢查這一行。', 'try');
      else setFeedback(state, '未能讀取這一行，請檢查括號、運算符號和等號。', 'try');
      render();
      return;
    }

    if (parsed.reversedFinal) {
      setFeedback(state, '請把 x 寫在等號左邊，再輸入最後答案。', 'neutral');
      render();
      return;
    }
    if (!parsed.unique || !rationalEquals(parsed.solution, rational(BigInt(state.question.answer), 1n))) {
      state.hadMistake = true;
      setFeedback(state, !parsed.unique
        ? '這一行未能得到唯一解，與原題不等價；請檢查兩邊的運算。'
        : '這一行與原題的解集不相同，請檢查兩邊的運算。', 'try');
      showWrongBalance(state, parsed);
      render();
      return;
    }

    parsed.initial = false;
    if (parsed.finalAnswer) {
      const missing = missingStepMessage(state);
      if (missing) {
        setFeedback(state, missing, 'neutral');
        render();
        return;
      }
      completeQuestion(state, parsed);
      return;
    }

    state.history.push(parsed);
    state.input = '';
    setFeedback(state, parsed.unsolvedAnswer
      ? '這一行已加入；現在計算右邊，再輸入 x = n。'
      : '這一步已加入；繼續寫一個與原題等價的方程。', 'correct');
    render();
  }

  function startNextQuestion() {
    const state = currentState();
    if (!state.completed) return;
    if (state.tiltTimer) window.clearTimeout(state.tiltTimer);
    modeProgress[activeMode].state = makeQuestionState(activeMode);
    setFeedback(currentState(), '新一題開始。逐行輸入等價方程。', 'neutral');
    render();
  }

  function restartMode() {
    const previous = currentState();
    if (previous.tiltTimer) window.clearTimeout(previous.tiltTimer);
    modeProgress[activeMode].state = makeQuestionState(activeMode);
    setFeedback(currentState(), '已重新開始本模式；累計分數保留。', 'neutral');
    render();
  }

  function setMode(mode) {
    if (mode < 1 || mode > 4) return;
    activeMode = mode;
    render();
  }

  function toggleBalanceMode() {
    balanceVisible = !balanceVisible;
    render();
  }

  function resetScores() {
    scores = emptyScores();
    [1, 2, 3, 4].forEach(function (mode) {
      const previous = modeProgress[mode].state;
      if (previous && previous.tiltTimer) window.clearTimeout(previous.tiltTimer);
      modeProgress[mode].solved = 0;
      modeProgress[mode].state = makeQuestionState(mode);
    });
    saveScores();
    closeScoreModal();
    setFeedback(currentState(), '四個模式的分數及進度已重設。', 'neutral');
    render();
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

  function buildKeypad() {
    keyDefinitions.forEach(function (definition) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'keypad-key' + (definition.submit ? ' keypad-key--submit' : (definition.value === 'DEL' ? ' keypad-key--delete' : ''));
      button.dataset.key = definition.value;
      button.textContent = definition.label;
      button.setAttribute('aria-label', definition.ariaLabel || definition.label);
      elements.keypad.appendChild(button);
    });
    elements.keypad.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-key]');
      if (button && elements.keypad.contains(button)) enterKey(button.dataset.key);
    });
  }

  function initKeyboard() {
    document.addEventListener('keydown', function (event) {
      if (!elements.scoreModal.hidden) {
        if (event.key === 'Escape') closeScoreModal();
        return;
      }
      const target = event.target;
      if (target && (target.matches('input, textarea, select') || target.isContentEditable)) return;
      if (event.key === 'Enter') { event.preventDefault(); enterKey('SUBMIT'); return; }
      if (event.key === 'Backspace') { event.preventDefault(); enterKey('DEL'); return; }
      if (/^\d$/.test(event.key)) { event.preventDefault(); enterKey(event.key); return; }
      const map = {
        x: 'X', X: 'X', '+': '+', '-': '-', '−': '-', '*': '×', '×': '×', '/': '÷', '÷': '÷', '(': '(', ')': ')', '=': '='
      };
      if (map[event.key]) { event.preventDefault(); enterKey(map[event.key]); }
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

  function worksheetHeader(title, student, date, pageNumber) {
    const className = student.className ? escapeHtml(student.className) : '________';
    const name = student.name ? escapeHtml(student.name) : '____________';
    const number = student.number ? escapeHtml(student.number) : '____';
    return '<header class="worksheet-header"><div class="worksheet-header-copy"><h1 class="worksheet-title">' + escapeHtml(title) + '</h1><p class="worksheet-student-line">班別：' + className + '　姓名：' + name + '　學號：' + number + '　日期：' + date + '</p></div><div id="print-qr-page-' + pageNumber + '" class="print-qr" aria-label="線上 Ex2 網址 QR 碼"></div></header>';
  }

  function printGrid(left, right) {
    const hasFraction = /[÷/]/.test(left + right);
    return '<div class="print-equation-grid' + (hasFraction ? ' has-fraction' : '') + '"><span class="step-left">' + mathExpressionHtml(left) + '</span><span class="step-equals">=</span><span class="step-right">' + mathExpressionHtml(right) + '</span></div>';
  }

  function worksheetExample(title, lines) {
    return '<article class="worksheet-example"><p class="worksheet-example-title">' + escapeHtml(title) + '</p>' + lines.map(function (line) { return printGrid(line[0], line[1]); }).join('') + '</article>';
  }

  function mode1Example() {
    return worksheetExample('示範：先合併同類項，再解方程', [
      ['6x + 5 − 2x', '25'], ['4x + 5', '25'], ['4x', '25 − 5'], ['4x', '20'], ['x', '20 ÷ 4'], ['x', '5']
    ]);
  }

  function mode2Examples() {
    return [
      worksheetExample('甲型：日式拆括號', [['3(x + 2)', '18'], ['3x + 6', '18'], ['3x', '18 − 6'], ['x', '12 ÷ 3'], ['x', '4']]),
      worksheetExample('乙型：括號外有加數', [['2(x + 3) + 4', '18'], ['2x + 6 + 4', '18'], ['2x + 10', '18'], ['2x', '18 − 10'], ['x', '8 ÷ 2'], ['x', '4']]),
      worksheetExample('乙型：兩個括號相減', [['4(x + 2) − 2(x + 5)', '6'], ['4x + 8 − 2x − 10', '6'], ['2x − 2', '6'], ['2x', '6 + 2'], ['x', '8 ÷ 2'], ['x', '4']]),
      worksheetExample('丙型：負數乘括號', [['5 − 2(x + 1)', '−9'], ['5 − 2x − 2', '−9'], ['3 − 2x', '−9'], ['−2x', '−9 − 3'], ['x', '(−12) ÷ (−2)'], ['x', '6']])
    ].join('');
  }

  function mode3Examples() {
    return [
      worksheetExample('兩邊都有 x：移項及合併同類項', [['5x + 3', '2x + 15'], ['5x − 2x', '15 − 3'], ['3x', '12'], ['x', '12 ÷ 3'], ['x', '4']]),
      worksheetExample('x 項先在左邊', [['7 − 2x', 'x − 8'], ['−2x − x', '−8 − 7'], ['−3x', '−15'], ['x', '(−15) ÷ (−3)'], ['x', '5']]),
      worksheetExample('先日式拆括號，再移項', [['3(x − 1)', 'x + 7'], ['3x − 3', 'x + 7'], ['2x', '10'], ['x', '10 ÷ 2'], ['x', '5']])
    ].join('');
  }

  function parseGeneratedNumerator(source) {
    const match = /^(\d*)x\s*([+−])\s*(\d+)$/.exec(String(source).trim());
    if (!match) throw new Error('Unable to read generated numerator: ' + source);
    return {
      coefficient: Number(match[1] || 1),
      constant: (match[2] === '+' ? 1 : -1) * Number(match[3])
    };
  }

  function parseFormattedInteger(source) {
    return Number(String(source).replace(/−/g, '-'));
  }

  function parseGeneratedBothSideTerm(source) {
    const match = /^x ÷ (\d+) ([+−]) (\d+) ÷ (\d+)$/.exec(String(source).trim());
    if (!match) throw new Error('Unable to read generated fractional term: ' + source);
    return {
      xDenominator: Number(match[1]),
      constant: (match[2] === '+' ? 1 : -1) * Number(match[3]),
      constantDenominator: Number(match[4])
    };
  }

  function uncomputedIntegerDivision(dividend, divisor) {
    const left = dividend < 0 ? '(' + formatInt(dividend) + ')' : formatInt(dividend);
    const right = divisor < 0 ? '(' + formatInt(divisor) + ')' : formatInt(divisor);
    return left + ' ÷ ' + right;
  }

  function mode4WorkedExampleLines(question) {
    const lines = [];
    function addLine(left, right) {
      const candidate = { left: left, right: right, expected: question.answer };
      if (!assertQuestion(candidate)) throw new Error('Generated worked example is not equivalent: ' + left + ' = ' + right);
      lines.push([left, right]);
    }

    addLine(question.left, question.right);
    let coefficient;
    let remainingConstant;

    if (question.type === 'fraction-cross-multiply') {
      const leftMatch = /^\(([^()]*)\) ÷ (\d+)$/.exec(question.left);
      const rightMatch = /^\(([^()]*)\) ÷ (\d+)$/.exec(question.right);
      if (!leftMatch || !rightMatch) throw new Error('Unable to read generated cross-multiplication question.');
      const leftNumerator = parseGeneratedNumerator(leftMatch[1]);
      const rightNumerator = parseGeneratedNumerator(rightMatch[1]);
      const leftDenominator = Number(leftMatch[2]);
      const rightDenominator = Number(rightMatch[2]);
      addLine(String(rightDenominator) + '(' + leftMatch[1] + ')', String(leftDenominator) + '(' + rightMatch[1] + ')');
      const leftCoefficient = leftNumerator.coefficient * rightDenominator;
      const leftConstant = leftNumerator.constant * rightDenominator;
      const rightCoefficient = rightNumerator.coefficient * leftDenominator;
      const rightConstant = rightNumerator.constant * leftDenominator;
      addLine(linearExpression(leftCoefficient, leftConstant), linearExpression(rightCoefficient, rightConstant));
      coefficient = leftCoefficient - rightCoefficient;
      remainingConstant = rightConstant - leftConstant;
    } else if (question.type === 'fraction-lcm-sum') {
      const match = /^\(([^()]*)\) ÷ (\d+) \+ \(([^()]*)\) ÷ (\d+)$/.exec(question.left);
      if (!match) throw new Error('Unable to read generated L.C.M. sum question.');
      const firstNumerator = parseGeneratedNumerator(match[1]);
      const secondNumerator = parseGeneratedNumerator(match[3]);
      const firstDenominator = Number(match[2]);
      const secondDenominator = Number(match[4]);
      const firstMultiplier = question.lcm / firstDenominator;
      const secondMultiplier = question.lcm / secondDenominator;
      const clearedRight = parseFormattedInteger(question.right) * question.lcm;
      addLine(String(firstMultiplier) + '(' + match[1] + ') + ' + String(secondMultiplier) + '(' + match[3] + ')', formatInt(clearedRight));
      const firstExpanded = linearExpression(firstMultiplier, firstMultiplier * firstNumerator.constant);
      const secondExpanded = linearExpression(secondMultiplier, secondMultiplier * secondNumerator.constant);
      addLine(firstExpanded + ' + ' + secondExpanded, formatInt(clearedRight));
      const combinedCoefficient = firstMultiplier + secondMultiplier;
      const combinedConstant = firstMultiplier * firstNumerator.constant + secondMultiplier * secondNumerator.constant;
      addLine(linearExpression(combinedCoefficient, combinedConstant), formatInt(clearedRight));
      coefficient = combinedCoefficient;
      remainingConstant = clearedRight - combinedConstant;
    } else {
      const leftTerm = parseGeneratedBothSideTerm(question.left);
      const rightTerm = parseGeneratedBothSideTerm(question.right);
      const leftCoefficient = question.lcm / leftTerm.xDenominator;
      const leftConstant = leftTerm.constant * question.lcm / leftTerm.constantDenominator;
      const rightCoefficient = question.lcm / rightTerm.xDenominator;
      const rightConstant = rightTerm.constant * question.lcm / rightTerm.constantDenominator;
      addLine(linearExpression(leftCoefficient, leftConstant), linearExpression(rightCoefficient, rightConstant));
      coefficient = leftCoefficient - rightCoefficient;
      remainingConstant = rightConstant - leftConstant;
    }

    addLine(xTerm(coefficient), formatInt(remainingConstant));
    addLine('x', uncomputedIntegerDivision(remainingConstant, coefficient));
    addLine('x', formatInt(question.answer));
    return lines;
  }

  function mode4Examples() {
    const crossQuestion = generateMode4CrossQuestion();
    const sumQuestion = generateMode4LcmAddQuestion();
    const bothSidesQuestion = generateMode4LcmBothSidesQuestion();
    return [
      worksheetExample('單一分數等於單一分數：交叉乘分母', mode4WorkedExampleLines(crossQuestion)),
      worksheetExample('其餘分數方程：兩邊同乘 L.C.M.', mode4WorkedExampleLines(sumQuestion)),
      worksheetExample('兩邊都有分數：兩邊同乘 L.C.M.', mode4WorkedExampleLines(bothSidesQuestion))
    ].join('');
  }

  function worksheetQuestion(question, index) {
    const questionNumber = index + 1;
    const label = questionNumber + '. ' + question.left + ' = ' + question.right;
    return '<article class="worksheet-question" data-question-type="' + escapeHtml(question.type) + '"><p class="worksheet-question-title">' + escapeHtml(label) + '</p><div class="worksheet-writing-lines"><div class="worksheet-blank-line"></div><div class="worksheet-blank-line"></div><div class="worksheet-blank-line"></div><div class="worksheet-blank-line"></div></div></article>';
  }

  function answerStepSummary(mode, question) {
    if (mode === 1) return '合併同類項 → 移項 → x = ' + formatInt(question.answer);
    if (mode === 2) return '日式拆括號 → 合併同類項 → x = ' + formatInt(question.answer);
    if (mode === 3) return '移項 → 合併同類項 → x = ' + formatInt(question.answer);
    return (question.type === 'fraction-cross-multiply' ? '交叉乘分母' : '兩邊同乘 L.C.M.') + ' → 化簡 → x = ' + formatInt(question.answer);
  }

  function answerStrip(mode, questions) {
    const rows = questions.map(function (question, index) {
      return '<span class="worksheet-answer-row"><strong>' + (index + 1) + '.</strong> ' + escapeHtml(answerStepSummary(mode, question)) + '</span>';
    }).join('');
    return '<footer class="print-answer-strip" aria-label="模式' + mode + '答案及簡要步驟"><div class="print-fold-label">沿此線摺　｜　答案及簡要步驟</div><div class="print-answer-strip-content">' + rows + '</div></footer>';
  }

  function worksheetQuestions(mode) {
    const questions = [];
    for (let index = 0; index < 6; index += 1) {
      let question;
      if (mode === 1) question = generateMode1Question();
      else if (mode === 2) question = index < 4 ? generateMode2QuestionOfType(index) : generateMode2Question();
      else if (mode === 3) question = index < 3 ? generateMode3Question(index) : generateMode3Question();
      else if (index % 2 === 0) question = generateMode4CrossQuestion();
      else question = index % 4 === 1 ? generateMode4LcmAddQuestion() : generateMode4LcmBothSidesQuestion();
      questions.push(question);
    }
    return questions;
  }

  function generateMode2QuestionOfType(type) {
    return generateMode2Question(type);
  }

  function renderWorksheetPage(mode, student, date, pageNumber) {
    const questions = worksheetQuestions(mode);
    const examples = mode === 1 ? mode1Example() : (mode === 2 ? mode2Examples() : (mode === 3 ? mode3Examples() : mode4Examples()));
    const title = '模式' + formatInt(mode) + '：' + modeNames[mode] + '（6 題）';
    return '<section class="worksheet-page worksheet-mode-' + mode + '">' +
      worksheetHeader('S1 Ch4 Ex2｜解方程的進一步技巧工作紙', student, date, pageNumber) +
      '<h2 class="worksheet-section-title">' + title + '</h2>' +
      '<p class="worksheet-answer-note">逐行寫出等價方程；抵消行可略去。答案行之前須有未計算的 x = 式子。</p>' +
      '<div class="worksheet-examples">' + examples + '</div>' +
      '<div class="worksheet-questions">' + questions.map(worksheetQuestion).join('') + '</div>' +
      answerStrip(mode, questions) +
      '</section>';
  }

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
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.async = true;
      script.onload = function () { finish(true); };
      script.onerror = function () { finish(false); };
      document.head.appendChild(script);
    });
    return qrCodeLoadPromise;
  }

  async function generateAndPrintWorksheet() {
    elements.printWorksheet.disabled = true;
    try {
      const qrAvailable = await loadQRCodeLibrary();
      const student = {
        className: elements.studentClass.value.trim(),
        name: elements.studentName.value.trim(),
        number: elements.studentNumber.value.trim()
      };
      const date = formatDate(new Date());
      elements.printArea.innerHTML = [1, 2, 3, 4].map(function (mode) { return renderWorksheetPage(mode, student, date, mode); }).join('');
      if (qrAvailable) {
        [1, 2, 3, 4].forEach(function (pageNumber) {
          const target = document.getElementById('print-qr-page-' + pageNumber);
          target.replaceChildren();
          new window.QRCode(target, { text: worksheetUrl, width: 128, height: 128, correctLevel: window.QRCode.CorrectLevel.M });
        });
      } else {
        console.warn('QR 碼程式庫未能載入；工作紙將不會顯示 QR 碼。');
      }
      await new Promise(function (resolve) { window.setTimeout(resolve, 100); });
      window.print();
    } finally {
      elements.printWorksheet.disabled = false;
    }
  }

  function initEvents() {
    elements.modeTabs.forEach(function (button, index) {
      button.addEventListener('click', function () { setMode(index + 1); });
    });
    elements.balanceModeToggle.addEventListener('click', toggleBalanceMode);
    elements.nextQuestion.addEventListener('click', startNextQuestion);
    elements.resetMode.addEventListener('click', restartMode);
    elements.openScore.addEventListener('click', openScoreModal);
    elements.closeScoreIcon.addEventListener('click', closeScoreModal);
    elements.closeScoreButton.addEventListener('click', closeScoreModal);
    elements.resetScores.addEventListener('click', resetScores);
    elements.printWorksheet.addEventListener('click', generateAndPrintWorksheet);
    elements.scoreModal.addEventListener('click', function (event) {
      if (event.target === elements.scoreModal) closeScoreModal();
    });
    elements.scoreStartTime.textContent = formatDateTime(pageEntryTime);
  }

  buildKeypad();
  initWorkspaceResizer();
  initKeyboard();
  initEvents();
  modeProgress[1].state = makeQuestionState(1);
  render();
}());
