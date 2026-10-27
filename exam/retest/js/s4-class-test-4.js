(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetestS4ClassTest4 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ID = 's4-class-test-4';
  var FIXED = Object.freeze({
    V1: Object.freeze({
      q1: { a: 3, b: 2, c: 4 },
      q2: { p: 4, q: 3, r: 6, shift: 1 },
      q3: { u: 3, v: 4, t: 2 },
      q4: { a: 11, b: 2, d: 3, r: 1, s: 4 },
      q5: { u: 3, v: -4, w: 2, h: 2 },
      q6: ['sideways', 'upward', 'circle', 'vertical'],
      q7: { a: 4, b: 7, c: 2, y: 1, x: 3 },
      q8: { a: 2, b: 3, c: 4, x: 3, y: 2 },
      q9: { p: 4, q: 3, r: 2, s: 5, outer: 2 },
      q10: { m: 3, n: 4, r: 1, s: 2, t: 5 },
      q11: { a: 7, b: 7, root1: 2, root2: 8 },
      q12: { alpha: 1, beta: 5, shift: 2 }
    })
  });
  var MARKS = Object.freeze({
    q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1,
    q7a: 3, q7b: 1, q8: 3, q9: 3, q10a: 1, q10b: 2,
    q11a: 2, q11b: 3, q12a: 2, q12b: 2, q12c: 2
  });
  var MARKING = Object.freeze({
    q1: { M: 0, A: 1 }, q2: { M: 0, A: 1 }, q3: { M: 0, A: 1 },
    q4: { M: 0, A: 1 }, q5: { M: 0, A: 1 }, q6: { M: 0, A: 1 },
    q7a: { M: 2, A: 1 }, q7b: { M: 0, A: 1 }, q8: { M: 2, A: 1 },
    q9: { M: 2, A: 1 }, q10a: { M: 0, A: 1 }, q10b: { M: 1, A: 1 },
    q11a: { M: 1, A: 1 }, q11b: { M: 2, A: 1 }, q12a: { M: 0, A: 2 },
    q12b: { M: 1, A: 1 }, q12c: { M: 1, A: 1 }
  });
  var LETTERS = ['A', 'B', 'C', 'D'];
  var GRAPH_TYPES = ['sideways', 'upward', 'circle', 'vertical'];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function parseVersion(value) {
    var match = String(value == null ? '' : value).trim().match(/^V?([1-9][0-9]*)$/i);
    if (!match) throw new Error('版本須為 V1、V2… 等正整數格式。');
    var number = Number(match[1]);
    if (!Number.isSafeInteger(number)) throw new Error('版本號超出可處理範圍。');
    return number;
  }

  function hash32(text) {
    var hash = 2166136261;
    for (var index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function rngFor(version, candidateOrder) {
    var seed = ID + '|V' + version;
    if (candidateOrder) seed += '|C' + candidateOrder;
    var state = hash32(seed) || 0x6d2b79f5;
    return function (min, max) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return min + (state % (max - min + 1));
    };
  }

  function shuffle(values, rng) {
    var result = values.slice();
    for (var index = result.length - 1; index > 0; index -= 1) {
      var other = rng(0, index);
      var value = result[index];
      result[index] = result[other];
      result[other] = value;
    }
    return result;
  }

  function paramsForVersion(number, candidateOrder) {
    if (number === 1) return clone(FIXED.V1);
    var rng = rngFor(number, candidateOrder);
    var q7a = rng(6, 8), q7t = rng(1, 3), q7c = rng(1, 3), q7x = rng(4, 6);
    var q7b = q7x * (q7a - q7t) - q7c * q7t;
    var q11a = rng(5, 9), q11root1 = rng(2, 3);
    var q11root2 = q11a + 3 - q11root1;
    return {
      q1: { a: rng(2, 5), b: rng(1, 4), c: rng(2, 5) },
      q2: (function () {
        var p = rng(3, 5), q = rng(2, 4), shift = rng(1, 3);
        return { p: p, q: q, r: p + q - 1, shift: shift };
      })(),
      q3: { u: rng(2, 5), v: rng(2, 5), t: rng(1, 4) },
      q4: (function () {
        var d = rng(2, 4), b = rng(1, 3), r = rng(1, 2);
        var denominator = b + d * r;
        var whole = rng(8, 12), remainder = rng(1, denominator - 1), s = rng(2, 6);
        return { a: denominator * whole + remainder - d * s, b: b, d: d, r: r, s: s };
      })(),
      q5: { u: rng(2, 4), v: -rng(2, 5), w: rng(1, 5), h: rng(1, 3) },
      q6: shuffle(GRAPH_TYPES, rng),
      q7: { a: q7a, b: q7b, c: q7c, y: q7t, x: q7x },
      q8: (function () {
        var x = rng(1, 5), y = rng(1, 5), a = rng(2, 5), b = rng(1, 5), c = rng(2, 5);
        return { a: a, b: b, c: c, x: x, y: y };
      })(),
      q9: { p: rng(2, 6), q: rng(2, 5), r: rng(1, 4), s: rng(1, 6), outer: 2 },
      q10: { m: rng(1, 5), n: rng(1, 5), r: rng(1, 4), s: rng(1, 5), t: rng(1, 5) },
      q11: { a: q11a, b: q11root1 * q11root2 - q11a - 2, root1: q11root1, root2: q11root2 },
      q12: (function () {
        var alpha = rng(1, 4);
        return { alpha: alpha, beta: rng(alpha + 1, alpha + 5), shift: rng(1, 3) };
      })(),
      generator: { candidateOrder: candidateOrder }
    };
  }

  function signedTerm(coefficient, variable) {
    if (!coefficient) return '';
    var magnitude = Math.abs(coefficient);
    var body = (magnitude === 1 && variable ? '' : String(magnitude)) + variable;
    return coefficient < 0 ? '-' + body : '+' + body;
  }

  function polynomial(a, variableA, b, variableB, c, variableC) {
    var terms = [
      a ? (a < 0 ? '-' : '') + (Math.abs(a) === 1 && variableA ? '' : Math.abs(a)) + variableA : '',
      signedTerm(b, variableB), signedTerm(c, variableC)
    ].filter(Boolean);
    if (!terms.length) return '0';
    return terms[0] + terms.slice(1).join('');
  }

  function linearText(coefficient, variable, constant) {
    return polynomial(coefficient, variable, constant, '', 0, '');
  }

  function powerBase(exponent) { return String(Math.pow(2, exponent)); }

  function q2Exponent(params) {
    var nCoefficient = params.p + params.q - params.r;
    var constant = params.q * params.shift;
    return (nCoefficient === 1 ? 'n' : nCoefficient === -1 ? '-n' : nCoefficient + 'n') +
      (constant > 0 ? '+' + constant : constant < 0 ? constant : '');
  }

  function q2Options(params) {
    var answer = q2Exponent(params);
    var constant = params.q * params.shift;
    return [
      '2^{' + answer + '}', '2^{' + (params.p + params.q) + 'n+' + constant + '}',
      '2^{' + (params.p + params.q - params.r) + 'n+' + (constant + 2) + '}',
      '2^{' + (params.p + params.q - params.r + 2) + 'n+' + (constant - 1) + '}'
    ];
  }

  function q3Factor(params, sign, lastTerm) {
    return '(' + linearText(params.u, 'a', params.v) + 'b)(' +
      linearText(params.u, 'a', -params.v) + 'b' + sign + lastTerm + ')';
  }

  function q4Maximum(params) {
    return Math.ceil((params.a + params.d * params.s) / (params.b + params.d * params.r)) - 1;
  }

  function q5Coefficients(params) {
    return {
      a2: params.u,
      a1: params.v - 2 * params.u * params.h,
      constant: params.u * params.h * params.h - params.v * params.h + params.w
    };
  }

  function q7Text(params) {
    return '\\frac{' + params.a + 'x-' + params.b + '}{x+' + params.c + '}';
  }

  function q8Constants(params) {
    return { first: params.a * params.x + params.b * params.y, second: params.c * params.x - params.b * params.y };
  }

  function q9Exponents(params) {
    return { p: params.outer * params.p + params.r, q: params.outer * params.q + params.s };
  }

  function q10Coefficients(params) {
    return { p2: params.m * params.r, pq: -(params.m * params.s + params.n * params.r), q2: params.n * params.s };
  }

  function q11Polynomial(params) {
    return { a: 1, b: -(params.a + 3), c: params.b + params.a + 2 };
  }

  function q12Sum(params) { return params.alpha + params.beta; }
  function q12Product(params) { return params.alpha * params.beta; }

  function fraction(numerator, denominator) {
    function gcd(a, b) { while (b) { var remainder = a % b; a = b; b = remainder; } return Math.abs(a) || 1; }
    var divisor = gcd(numerator, denominator);
    numerator /= divisor; denominator /= divisor;
    if (denominator < 0) { numerator = -numerator; denominator = -denominator; }
    return denominator === 1 ? String(numerator) : '\\frac{' + numerator + '}{' + denominator + '}';
  }

  function graphLetter(order, type) { return LETTERS[order.indexOf(type)]; }

  function mcOptions(params, version, candidateOrder) {
    var q1 = params.q1;
    var q1Coefficients = { x2: q1.a - 1, xy: q1.a * q1.c - q1.b + 2, y2: -(q1.b * q1.c + 1) };
    var q1Correct = polynomial(q1Coefficients.x2, 'x^{2}', q1Coefficients.xy, 'xy', q1Coefficients.y2, 'y^{2}');
    var q1Choices = [q1Correct,
      polynomial(q1Coefficients.x2, 'x^{2}', q1Coefficients.xy - 2, 'xy', q1Coefficients.y2, 'y^{2}'),
      polynomial(q1Coefficients.x2, 'x^{2}', q1Coefficients.xy, 'xy', q1Coefficients.y2 + 2, 'y^{2}'),
      polynomial(q1Coefficients.x2 + 1, 'x^{2}', q1Coefficients.xy - 2, 'xy', q1Coefficients.y2, 'y^{2}')];
    var q1Order = version === 1 ? [
      '2x^{2}+8xy-9y^{2}', '2x^{2}+12xy-9y^{2}', '2x^{2}+12xy-7y^{2}', '3x^{2}+10xy-9y^{2}'
    ] : shuffle(q1Choices, rngFor(version, candidateOrder));
    var q1AnswerText = polynomial(q1.a, 'x', -q1.b, 'y', 0, '');
    var q1Question = '$(' + q1AnswerText + ')(x+' + q1.c + 'y)-(x-y)^{2}=$';

    var q2 = params.q2;
    var q2Question = '\\frac{' + powerBase(q2.p) + '^{n}\\cdot ' + powerBase(q2.q) + '^{n+' + q2.shift + '}}{' +
      powerBase(q2.r) + '^{n}}';
    var q2Order = version === 1 ? ['2^{n+3}', '2^{7n+3}', '2^{n+1}', '2^{3n+9}'] :
      shuffle(q2Options(q2), rngFor(version + 31, candidateOrder));

    var q3 = params.q3;
    var q3Polynomial = polynomial(q3.u * q3.u, 'a^{2}', -q3.v * q3.v, 'b^{2}', q3.u * q3.t, 'a');
    q3Polynomial += signedTerm(q3.v * q3.t, 'b');
    var q3Correct = q3Factor(q3, '+', String(q3.t));
    var q3Options = [q3Correct, q3Factor(q3, '-', String(q3.t)),
      '(' + linearText(q3.u, 'a', -q3.v) + 'b)(' + linearText(q3.u, 'a', q3.v) + 'b+' + q3.t + ')',
      q3Factor(q3, '+', String(q3.t + 1))];
    var q3Order = version === 1 ? [
      '(3a+4b)(3a-4b+2)', '(3a-4b)(3a+4b+2)', '(3a+4b)(3a-4b-2)', '(3a-4b)(3a-4b+2)'
    ] : shuffle(q3Options, rngFor(version + 67, candidateOrder));

    var q4 = params.q4;
    var q4Max = q4Maximum(q4);
    var q4Question = '\\frac{' + q4.a + '-' + q4.b + 'x}{' + q4.d + '}> ' + linearText(q4.r, 'x', -q4.s);
    var q4Options = [q4Max - 2, q4Max - 1, q4Max, q4Max + 1].map(String);
    var q4Order = version === 1 ? ['2', '3', '4', '5'] : shuffle(q4Options, rngFor(version + 101, candidateOrder));

    var q5 = params.q5;
    var q5Coeffs = q5Coefficients(q5);
    var q5Correct = polynomial(q5Coeffs.a2, 'a^{2}', q5Coeffs.a1, 'a', q5Coeffs.constant, '');
    var q5Options = [q5Correct,
      polynomial(q5Coeffs.a2, 'a^{2}', q5Coeffs.a1 + 2, 'a', q5Coeffs.constant, ''),
      polynomial(q5Coeffs.a2, 'a^{2}', q5Coeffs.a1, 'a', q5Coeffs.constant - 4, ''),
      polynomial(q5Coeffs.a2, 'a^{2}', q5Coeffs.a1 - 2, 'a', q5Coeffs.constant, '')];
    var q5Order = version === 1 ? [
      '3a^{2}-16a+22', '3a^{2}-14a+22', '3a^{2}-16a+18', '3a^{2}-12a+22'
    ] : shuffle(q5Options, rngFor(version + 211, candidateOrder));

    var q6Order = params.q6.slice();
    var graphAnswer = graphLetter(q6Order, 'upward');
    var entries = [
      { key: 'q1', number: 1, text: q1Question, options: q1Order, answer: LETTERS[q1Order.indexOf(q1Correct)],
        explanation: '展開後合併同類項。' },
      { key: 'q2', number: 2, text: '其中 $n$ 為正整數，$' + q2Question + '=$', options: q2Order,
        answer: LETTERS[q2Order.indexOf('2^{' + q2Exponent(q2) + '}')], explanation: '把底數改寫成 2，再按指數律相加減。' },
      { key: 'q3', number: 3, text: '因式分解 $' + q3Polynomial + '$。', options: q3Order,
        answer: LETTERS[q3Order.indexOf(q3Correct)], explanation: '先看成平方差，再提出同一二項式。' },
      { key: 'q4', number: 4, text: '滿足不等式 $' + q4Question + '$ 的最大整數是', options: q4Order,
        answer: LETTERS[q4Order.indexOf(String(q4Max))], explanation: '解出 x 的上界，再取最大的整數。' },
      { key: 'q5', number: 5, text: '設 $f(x)=' + polynomial(q5.u, 'x^{2}', q5.v, 'x', q5.w, '') + '$。以最簡形式表示 $f(a-' + q5.h + ')$。',
        options: q5Order, answer: LETTERS[q5Order.indexOf(q5Correct)], explanation: '以 a 減 h 代入函數並展開。' },
      { key: 'q6', number: 6, text: '下列哪一幅圖像表示 $y$ 是 $x$ 的函數？',
        graphOptions: q6Order, answer: graphAnswer, explanation: '逐一用鉛直線測試；每個 x 只能對應一個 y。' }
    ];
    return entries;
  }

  function q1AnswerWork(params) {
    var a = params.q1.a, b = params.q1.b, c = params.q1.c;
    var x2 = a - 1, xy = a * c - b + 2, y2 = -(b * c + 1);
    return polynomial(x2, 'x^{2}', xy, 'xy', y2, 'y^{2}');
  }

  function q3AnswerWork(params) {
    var q = params.q3;
    return '(' + linearText(q.u, 'a', q.v) + 'b)(' + linearText(q.u, 'a', -q.v) + 'b+' + q.t + ')';
  }

  function q5AnswerWork(params) {
    var coeffs = q5Coefficients(params.q5);
    return polynomial(coeffs.a2, 'a^{2}', coeffs.a1, 'a', coeffs.constant, '');
  }

  function q7AnswerWork(params) {
    var q = params.q7;
    return { formula: '\\frac{' + q.b + '+' + q.c + 'y}{' + q.a + '-y}', value: q.x };
  }

  function q10AnswerWork(params) {
    var q = params.q10;
    var second = linearText(q.r, 'p', -q.s);
    return {
      quadratic: '(' + linearText(q.m, 'p', -q.n) + 'q)(' + second + 'q)',
      result: '(' + second + 'q)(' + polynomial(q.m, 'p', -q.n, 'q', q.t, '') + ')'
    };
  }

  function answerSteps(params, mc) {
    var steps = [];
    function add(question, text, mark) { steps.push({ question: question, text: text, mark: mark }); }
    var mcByKey = Object.create(null);
    mc.forEach(function (item) { mcByKey[item.key] = item; });
    var q1Math = mcByKey.q1.text.replace(/^\$/, '').replace(/\$$/, '').replace(/=$/, '');
    add('1', '1.　(' + mcByKey.q1.answer + ')　$' + q1Math +
      '=(' + q1AnswerWork(params) + ')$。', '(1A)');
    add('2', '2.　(' + mcByKey.q2.answer + ')　$\\frac{2^{' + params.q2.p + 'n}\\cdot2^{' + params.q2.q + 'n+' +
      params.q2.q * params.q2.shift + '}}{2^{' + params.q2.r + 'n}}=2^{' + q2Exponent(params.q2) + '}$。', '(1A)');
    add('3', '3.　(' + mcByKey.q3.answer + ')　$' + q3AnswerWork(params) + '$。', '(1A)');
    var q4 = params.q4, numerator = q4.a + q4.d * q4.s, denominator = q4.b + q4.d * q4.r;
    add('4', '4.　(' + mcByKey.q4.answer + ')　兩邊乘以 ' + q4.d + '：$' + q4.a + '-' + q4.b +
      'x>' + q4.d * q4.r + 'x-' + q4.d * q4.s + '\\Rightarrow ' + denominator + 'x<' + numerator +
      '\\Rightarrow x<' + fraction(numerator, denominator) + '$；最大整數是 $' + q4Maximum(q4) + '$。', '(1A)');
    add('5', '5.　(' + mcByKey.q5.answer + ')　$f(a-' + params.q5.h + ')=' + params.q5.u + '(a-' + params.q5.h + ')^{2}' +
      (params.q5.v < 0 ? String(params.q5.v) : '+' + params.q5.v) + '(a-' + params.q5.h + ')' +
      (params.q5.w < 0 ? String(params.q5.w) : '+' + params.q5.w) + '=' + q5AnswerWork(params) + '$。', '(1A)');
    add('6', '6.　(' + mcByKey.q6.answer + ')　鉛直線最多與圖像相交於一點，所以只有 ' +
      mcByKey.q6.answer + ' 圖表示 $y$ 是 $x$ 的函數。', '(1A)');

    var q7 = params.q7, q7work = q7AnswerWork(params);
    add('7', '7(a)　$y(x+' + q7.c + ')= ' + q7.a + 'x-' + q7.b + '$', '(1M)');
    add('7', '$yx+' + q7.c + 'y=' + q7.a + 'x-' + q7.b + '$', '(1M)');
    add('7', '$(y-' + q7.a + ')x=-(' + q7.b + '+' + q7.c + 'y)\\Rightarrow x=' + q7work.formula + '$', '(1A)');
    add('7', '7(b)　當 $y=' + q7.y + '$，$x=' + q7work.formula.replace(/y/g, '(' + q7.y + ')') + '=' + q7.x + '$。', '(1A)');

    var q8 = params.q8, q8c = q8Constants(q8);
    add('8', '8.　兩式相加：$' + q8.a + 'x+' + q8.b + 'y+' + q8.c + 'x-' + q8.b + 'y=' +
      q8c.first + '+' + q8c.second + '$，所以 $' + (q8.a + q8.c) + 'x=' + (q8c.first + q8c.second) + '$。', '(1M)');
    add('8', '$x=' + q8.x+'$，代入第一式：$' + q8.a + '(' + q8.x + ')+' + q8.b + 'y=' + q8c.first +
      '\\Rightarrow y=' + q8.y + '$。', '(1M)');
    add('8', '因此 $\\left(x,y\\right)=\\left(' + q8.x + ',' + q8.y + '\\right)$。', '(1A)');

    var q9 = params.q9, q9exp = q9Exponents(q9);
    add('9', '9.　$\\frac{(p^{' + q9.p + '}q^{' + -q9.q + '})^{' + q9.outer + '}}{p^{' + -q9.r + '}q^{' + q9.s + '}}' +
      '=\\frac{p^{' + q9.outer * q9.p + '}q^{' + -q9.outer * q9.q + '}}{p^{' + -q9.r + '}q^{' + q9.s + '}}$。', '(1M)');
    add('9', '$=p^{' + q9.outer * q9.p + '+' + q9.r + '}q^{' + -q9.outer * q9.q + '-' + q9.s + '}$。', '(1M)');
    add('9', '$=\\frac{p^{' + q9exp.p + '}}{q^{' + q9exp.q + '}}$。', '(1A)');

    var q10 = params.q10, q10work = q10AnswerWork(params), q10c = q10Coefficients(q10);
    add('10', '10(a)　$' + polynomial(q10c.p2, 'p^{2}', q10c.pq, 'pq', q10c.q2, 'q^{2}') +
      '=' + q10work.quadratic + '$。', '(1A)');
    add('10', '10(b)　$' + q10work.quadratic + '+' + q10.t + '(' + linearText(q10.r, 'p', -q10.s) + 'q)$', '(1M)');
    add('10', '$=' + q10work.result + '$。', '(1A)');

    var q11 = params.q11, q11eq = q11Polynomial(q11);
    add('11', '11(a)　$f(a)=' + q11.b + '$，所以 $a^{2}-' + q11.a + 'a=0$。', '(1M)');
    add('11', '$a(a-' + q11.a + ')=0$，所以 $a=0$ 或 $a=' + q11.a + '$。', '(1A)');
    add('11', '11(b)　$' + '(k-1)^{2}-' + q11.a + '(k-1)+' + q11.b + '=k-1$。', '(1M)');
    add('11', '$k^{2}-' + (q11.a + 3) + 'k+' + (q11.b + q11.a + 2) + '=0$。', '(1M)');
    add('11', '$ (k-' + q11.root1 + ')(k-' + q11.root2 + ')=0$，即 $k=' + q11.root1 + '$ 或 $k=' + q11.root2 + '$。', '(1A)');

    var q12 = params.q12, sum = q12Sum(q12), product = q12Product(q12), shiftedSum = sum + 2 * q12.shift;
    var shiftedProduct = (q12.alpha + q12.shift) * (q12.beta + q12.shift);
    add('12', '12(a)　根與係數關係：$\\alpha+\\beta=' + sum + '$，$\\alpha\\beta=' + product + '$。', '(1A)(1A)');
    add('12', '12(b)　$\\frac{1}{\\alpha}+\\frac{1}{\\beta}=\\frac{\\alpha+\\beta}{\\alpha\\beta}=' +
      fraction(sum, product) + '$。', '(1M)(1A)');
    add('12', '12(c)　新根的和為 $' + shiftedSum + '$，積為 $' + shiftedProduct + '$。', '(1M)');
    add('12', '所求方程：$x^{2}-' + shiftedSum + 'x+' + shiftedProduct + '=0$。', '(1A)');
    return steps;
  }

  function paperPages(params, mc) {
    var q7 = params.q7, q8 = params.q8, q8c = q8Constants(q8), q9 = params.q9, q9e = q9Exponents(q9);
    var q10 = params.q10, q10c = q10Coefficients(q10), q11 = params.q11;
    var q12 = params.q12, sum = q12Sum(q12), product = q12Product(q12);
    var firstPage = [
      { kind: 'answerHeading', text: '甲部　選擇題（6 分）' },
      { kind: 'table', rows: [
        [{ text: '題號' }, '1', '2', '3', '4', '5', '6'],
        [{ text: '答案' }, '', '', '', '', '', '']
      ] },
      { kind: 'answerHeading', text: '乙部　基礎課題（18 分）' },
      { kind: 'question', number: '7', text: '設 $y=' + q7Text(q7) + '$。' },
      { kind: 'subquestion', label: 'a', text: '以 $y$ 表示 $x$。', marks: 3, blankCm: 1.1 },
      { kind: 'subquestion', label: 'b', text: '若 $y=' + q7.y + '$，求 $x$。', marks: 1, blankCm: 0.7 },
      { kind: 'spacer', cm: 2.3 },
      { kind: 'question', number: '8', text: '解下列聯立方程：$\\begin{cases}' + q8.a + 'x+' + q8.b + 'y=' +
        q8c.first + '\\\\' + q8.c + 'x-' + q8.b + 'y=' + q8c.second + '\\end{cases}$', marks: 3 },
      { kind: 'spacer', cm: 4.5 }
    ];
    var secondPage = [
      { kind: 'question', number: '9', text: '設 $p,q$ 均為非零數。化簡 $\\frac{(p^{' + q9.p + '}q^{' + -q9.q + '})^{' +
        q9.outer + '}}{p^{' + -q9.r + '}q^{' + q9.s + '}}$，並以正指數表示答案。', marks: 3 },
      { kind: 'spacer', cm: 4.5 },
      { kind: 'question', number: '10', text: '因式分解下列各式。' },
      { kind: 'subquestion', label: 'a', text: '$' + polynomial(q10c.p2, 'p^{2}', q10c.pq, 'pq', q10c.q2, 'q^{2}') + '$。', marks: 1, blankCm: 1.0 },
      { kind: 'subquestion', label: 'b', text: '由此，因式分解 $' + polynomial(q10c.p2, 'p^{2}', q10c.pq, 'pq', q10c.q2, 'q^{2}') +
        signedTerm(q10.t * q10.r, 'p') + signedTerm(-q10.t * q10.s, 'q') + '$。', marks: 2, blankCm: 1.2 }
    ];
    var thirdPage = [
      { kind: 'question', number: '11', text: '設 $f(x)=x^{2}-' + q11.a + 'x+' + q11.b + '$。' },
      { kind: 'subquestion', label: 'a', text: '若 $f(a)=' + q11.b + '$，求所有 $a$ 的值。', marks: 2, blankCm: 1.3 },
      { kind: 'subquestion', label: 'b', text: '若 $f(k-1)=k-1$，解方程求所有 $k$ 的值。', marks: 3, blankCm: 1.7 }
    ];
    var shiftedSum = sum + 2 * q12.shift, shiftedProduct = (q12.alpha + q12.shift) * (q12.beta + q12.shift);
    var fourthPage = [
      { kind: 'answerHeading', text: '乙部　非基礎課題（6 分）' },
      { kind: 'question', number: '12', text: '設 $\\alpha$ 及 $\\beta$ 為二次方程 $x^{2}-' + sum + 'x+' + product + '=0$ 的根。' },
      { kind: 'subquestion', label: 'a', text: '求 $\\alpha+\\beta$ 及 $\\alpha\\beta$ 的值。', marks: 2, blankCm: 0.8 },
      { kind: 'subquestion', label: 'b', text: '求 $\\frac{1}{\\alpha}+\\frac{1}{\\beta}$ 的值。', marks: 2, blankCm: 0.8 },
      { kind: 'subquestion', label: 'c', text: '建立以 $\\alpha+' + q12.shift + '$ 及 $\\beta+' + q12.shift + '$ 為根的二次方程。', marks: 2, blankCm: 1.2 },
      { kind: 'spacer', cm: 4.5 },
      { kind: 'answerHeading', text: '全卷完' }
    ];
    var fifthPage = [{ kind: 'answerHeading', text: '甲部　選擇題（第 1–3 題，每題 1 分）' },
      { kind: 'answerHeading', text: '答案填在答題表格內。' }];
    mc.slice(0, 3).forEach(function (item) {
      fifthPage.push({ kind: 'question', number: String(item.number), text: item.text });
      fifthPage.push({ kind: 'choices', options: item.options, answerText: '答案：______' });
      fifthPage.push({ kind: 'spacer', cm: 1.2 });
    });
    var sixthPage = [{ kind: 'answerHeading', text: '甲部　選擇題（續）' },
      { kind: 'answerHeading', text: '答案填在答題表格內。' }];
    mc.slice(3, 5).forEach(function (item) {
      sixthPage.push({ kind: 'question', number: String(item.number), text: item.text });
      sixthPage.push({ kind: 'choices', options: item.options, answerText: '答案：______' });
      sixthPage.push({ kind: 'spacer', cm: 1.0 });
    });
    sixthPage.push({ kind: 'question', number: '6', text: mc[5].text });
    sixthPage.push({ kind: 'functionGraphChoices', options: mc[5].graphOptions });
    return [
      { withStudentInfo: true, blocks: firstPage },
      { withStudentInfo: false, blocks: secondPage },
      { withStudentInfo: false, blocks: thirdPage },
      { withStudentInfo: false, blocks: fourthPage },
      { withStudentInfo: false, blocks: fifthPage },
      { withStudentInfo: false, blocks: sixthPage }
    ];
  }

  function answerPages(steps) {
    var first = [
      { kind: 'answerHeading', text: 'M＝方法分；A＝答案分；接受等價正確解法。' },
      { kind: 'answerHeading', text: '甲部　選擇題（6 分）' }
    ];
    var second = [{ kind: 'answerHeading', text: '乙部　基礎課題（續）' }];
    steps.forEach(function (step) {
      var block = { kind: 'answerStep', text: step.text, mark: step.mark };
      var q = Number.parseInt(step.question, 10);
      if (q <= 6) first.push(block);
      else if (q <= 10) {
        if (!first.some(function (item) { return item.kind === 'answerHeading' && item.text.indexOf('基礎課題') !== -1; })) {
          first.push({ kind: 'answerHeading', text: '乙部　基礎課題（18 分）' });
        }
        first.push(block);
      } else second.push(block);
    });
    second.push({ kind: 'answerHeading', text: '全卷 30 分；評分細分合計 M 12 分、A 18 分。' });
    return [
      { withStudentInfo: false, blocks: first },
      { withStudentInfo: false, blocks: second }
    ];
  }

  function buildResult(versionNumber, sourceParams) {
    var params = clone(sourceParams || paramsForVersion(versionNumber, 0));
    var candidateOrder = params.generator ? params.generator.candidateOrder : 0;
    var mc = mcOptions(params, versionNumber, candidateOrder);
    var steps = answerSteps(params, mc);
    var pages = paperPages(params, mc);
    var answers = {};
    mc.forEach(function (item) { answers[item.key] = item.answer; });
    var q7 = params.q7, q8 = params.q8, q9 = q9Exponents(params.q9), q10 = q10Coefficients(params.q10);
    var q12 = params.q12;
    answers.q7a = '\\frac{' + q7.b + '+' + q7.c + 'y}{' + q7.a + '-y}';
    answers.q7b = String(q7.x);
    answers.q8 = '(' + q8.x + ',' + q8.y + ')';
    answers.q9 = '\\frac{p^{' + q9.p + '}}{q^{' + q9.q + '}}';
    answers.q10a = q10AnswerWork(params).quadratic;
    answers.q10b = q10AnswerWork(params).result;
    answers.q11a = '0,' + params.q11.a;
    answers.q11b = params.q11.root1 + ',' + params.q11.root2;
    answers.q12a = { sum: q12Sum(q12), product: q12Product(q12) };
    answers.q12b = fraction(q12Sum(q12), q12Product(q12));
    answers.q12c = 'x^2-' + (q12Sum(q12) + 2 * q12.shift) + 'x+' +
      (q12.alpha + q12.shift) * (q12.beta + q12.shift) + '=0';
    return {
      id: ID,
      version: 'V' + versionNumber,
      name: '班測4 補測（Ch2-3 及初中課題）',
      academicYear: '2026-2027',
      gradeLabel: '中四',
      subject: '數學',
      defaultClass: '4CD3',
      durationMinutes: 25,
      totalMarks: 30,
      marks: clone(MARKS),
      marking: clone(MARKING),
      params: params,
      questions: { multipleChoice: mc },
      answers: answers,
      answerSteps: steps,
      paperPages: pages,
      answerPages: answerPages(steps),
      pageCount: pages.length
    };
  }

  function answerMarkTotals(steps) {
    return steps.reduce(function (totals, step) {
      var match, pattern = /(\d+)([MA])/g;
      while ((match = pattern.exec(step.mark || ''))) totals[match[2]] += Number(match[1]);
      return totals;
    }, { M: 0, A: 0 });
  }

  function questionSignature(result) {
    var questions = clone(result.params);
    delete questions.generator;
    return JSON.stringify({ parameters: questions, paperPages: result.paperPages });
  }

  function answerSignature(result) { return JSON.stringify(result.answers); }

  var MAX_CANDIDATES = 20000;
  var GENERATED_PARAMS_CACHE = { 1: clone(FIXED.V1) };
  var GENERATED_LAST_VERSION = 1;
  var GENERATED_QUESTION_SIGNATURES = new Set();
  var GENERATED_ANSWER_SIGNATURES = new Set();

  function verifyResult(result) {
    var number = parseVersion(result.version), p = result.params;
    var errors = [];
    var mc = result.questions.multipleChoice;
    if (mc.length !== 6 || mc.some(function (item) {
      return item.options ? item.options.length !== 4 || new Set(item.options).size !== 4 : !Array.isArray(item.graphOptions) || item.graphOptions.length !== 4;
    })) errors.push('甲部每題須有四個選項。');
    if (mc[5].answer !== graphLetter(p.q6, 'upward')) errors.push('第 6 題函數圖像答案錯誤。');
    if (q1AnswerWork(p) !== mc[0].options[LETTERS.indexOf(mc[0].answer)]) errors.push('第 1 題化簡答案錯誤。');
    if (q2Exponent(p.q2) !== mc[1].options[LETTERS.indexOf(mc[1].answer)].replace(/^2\^\{|\}$/g, '')) errors.push('第 2 題指數化簡答案錯誤。');
    var q3 = p.q3;
    if (q3Factor(q3, '+', String(q3.t)) !== mc[2].options[LETTERS.indexOf(mc[2].answer)]) errors.push('第 3 題因式分解選項答案錯誤。');
    var q3Points = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]];
    if (q3Points.some(function (point) {
      var a = point[0], b = point[1];
      var expanded = q3.u * q3.u * a * a - q3.v * q3.v * b * b + q3.u * q3.t * a + q3.v * q3.t * b;
      var factored = (q3.u * a + q3.v * b) * (q3.u * a - q3.v * b + q3.t);
      return expanded !== factored;
    })) errors.push('第 3 題因式分解未通過展開核對。');
    var q4 = p.q4, q4Denominator = q4.b + q4.d * q4.r, q4Numerator = q4.a + q4.d * q4.s;
    var q4Max = q4Maximum(q4);
    if (q4Denominator <= 0 || q4Max !== Number(mc[3].options[LETTERS.indexOf(mc[3].answer)]) ||
        q4Max * q4Denominator >= q4Numerator || (q4Max + 1) * q4Denominator < q4Numerator) {
      errors.push('第 4 題不等式答案錯誤。');
    }
    var q5 = p.q5, q5c = q5Coefficients(q5);
    if (q5AnswerWork(p) !== mc[4].options[LETTERS.indexOf(mc[4].answer)] ||
        q5c.a2 !== q5.u || q5c.a1 !== q5.v - 2 * q5.u * q5.h ||
        q5c.constant !== q5.u * q5.h * q5.h - q5.v * q5.h + q5.w ||
        [-1, 0, 1, 2].some(function (a) {
          return q5.u * (a - q5.h) * (a - q5.h) + q5.v * (a - q5.h) + q5.w !==
            q5c.a2 * a * a + q5c.a1 * a + q5c.constant;
        })) errors.push('第 5 題代入答案錯誤。');
    var q7 = p.q7;
    if (q7.a === q7.y || (q7.b + q7.c * q7.y) / (q7.a - q7.y) !== q7.x ||
        (q7.a * q7.x - q7.b) / (q7.x + q7.c) !== q7.y) errors.push('第 7 題變換主項答案錯誤。');
    var q8 = p.q8, q8c = q8Constants(q8);
    if (q8.a * q8.x + q8.b * q8.y !== q8c.first || q8.c * q8.x - q8.b * q8.y !== q8c.second) errors.push('第 8 題聯立方程答案錯誤。');
    var q9p = q9Exponents(p.q9);
    if (q9p.p !== p.q9.outer * p.q9.p + p.q9.r || q9p.q !== p.q9.outer * p.q9.q + p.q9.s) errors.push('第 9 題指數答案錯誤。');
    var q10 = p.q10, q10c = q10Coefficients(q10);
    if (q10c.p2 !== q10.m * q10.r || q10c.pq !== -(q10.m * q10.s + q10.n * q10.r) ||
        q10c.q2 !== q10.n * q10.s ||
        q10AnswerWork(p).result !== '(' + linearText(q10.r, 'p', -q10.s) + 'q)(' +
          polynomial(q10.m, 'p', -q10.n, 'q', q10.t, '') + ')' ||
        [[1, 1], [2, -1], [-1, 2]].some(function (point) {
          var x = point[0], y = point[1];
          var quadratic = q10c.p2 * x * x + q10c.pq * x * y + q10c.q2 * y * y;
          var factors = (q10.m * x - q10.n * y) * (q10.r * x - q10.s * y);
          var withExtraTerm = quadratic + q10.t * (q10.r * x - q10.s * y);
          var combined = (q10.r * x - q10.s * y) * (q10.m * x - q10.n * y + q10.t);
          return quadratic !== factors || withExtraTerm !== combined;
        })) errors.push('第 10 題因式分解未通過展開核對。');
    var q10AnswerSteps = result.answerSteps.filter(function (step) { return step.question === '10'; });
    if (q10AnswerSteps.length !== 3 || q10AnswerSteps[2].text !== '$=' + q10AnswerWork(p).result + '$。') {
      errors.push('第 10 題評卷參考的因式分解步驟錯誤。');
    }
    var q11 = p.q11, q11eq = q11Polynomial(q11);
    if (q11.root1 + q11.root2 !== q11.a + 3 || q11.root1 * q11.root2 !== q11.b + q11.a + 2 ||
        q11eq.b !== -(q11.a + 3)) errors.push('第 11 題方程根式錯誤。');
    var q11aStep = result.answerSteps.filter(function (step) { return step.question === '11'; })[0];
    if (!q11aStep || q11aStep.text.indexOf('f(a)=' + q11.b) === -1) errors.push('第 11 題 (a) 評卷步驟引用的條件錯誤。');
    var q12 = p.q12;
    if (q12.alpha + q12.beta !== q12Sum(q12) || q12.alpha * q12.beta !== q12Product(q12) ||
        (q12.alpha + q12.shift) * (q12.beta + q12.shift) !== q12Product(q12) +
          q12.shift * q12Sum(q12) + q12.shift * q12.shift) errors.push('第 12 題根與係數答案錯誤。');
    var q7work = q7AnswerWork(p), q8work = p.q8, q9work = q9Exponents(p.q9);
    if (result.answers.q7a !== q7work.formula || result.answers.q7b !== String(p.q7.x) ||
        result.answers.q8 !== '(' + q8work.x + ',' + q8work.y + ')' ||
        result.answers.q9 !== '\\frac{p^{' + q9work.p + '}}{q^{' + q9work.q + '}}' ||
        result.answers.q10a !== q10AnswerWork(p).quadratic || result.answers.q10b !== q10AnswerWork(p).result ||
        result.answers.q11a !== '0,' + p.q11.a || result.answers.q11b !== p.q11.root1 + ',' + p.q11.root2 ||
        JSON.stringify(result.answers.q12a) !== JSON.stringify({ sum: q12Sum(q12), product: q12Product(q12) }) ||
        result.answers.q12b !== fraction(q12Sum(q12), q12Product(q12)) ||
        result.answers.q12c !== 'x^2-' + (q12Sum(q12) + 2 * q12.shift) + 'x+' +
          (q12.alpha + q12.shift) * (q12.beta + q12.shift) + '=0') {
      errors.push('第 7–12 題答案欄與驗算結果不一致。');
    }
    if (result.paperPages.length !== 6 || result.answerPages.length !== 2 || result.durationMinutes !== 25) errors.push('頁數或限時與 V1 規格不符。');
    if (Object.keys(MARKS).reduce(function (total, key) { return total + MARKS[key]; }, 0) !== 30) errors.push('全卷分數不等於 30 分。');
    var totals = answerMarkTotals(result.answerSteps);
    if (totals.M !== 12 || totals.A !== 18) errors.push('答案步驟的 M/A 分值不等於 12M／18A。');
    if (Object.keys(MARKS).some(function (key) { return MARKING[key].M + MARKING[key].A !== MARKS[key]; })) errors.push('M/A 配分與題目分值不相符。');
    var q1AnswerStep = result.answerSteps.filter(function (step) { return step.question === '1'; })[0];
    if (!q1AnswerStep || q1AnswerStep.text.indexOf('=(' + q1AnswerWork(p) + ')$') === -1) {
      errors.push('第 1 題評卷參考的答案括號不完整。');
    }
    if (!/^\$[^$]+\$$/.test(mc[0].text) || !/\$\\frac\{/.test(mc[1].text)) {
      errors.push('第 1、2 題題幹的公式未標記為數學內容。');
    }
    return errors.length ? { valid: false, version: 'V' + number, reasons: errors } : { valid: true, version: 'V' + number, reasons: [] };
  }

  function selectGeneratedParams(number) {
    for (var candidateOrder = 0; candidateOrder < MAX_CANDIDATES; candidateOrder += 1) {
      var candidateParams = paramsForVersion(number, candidateOrder);
      var candidate = buildResult(number, candidateParams);
      if (!verifyResult(candidate).valid) continue;
      var questions = questionSignature(candidate);
      var answers = answerSignature(candidate);
      if (GENERATED_QUESTION_SIGNATURES.has(questions) || GENERATED_ANSWER_SIGNATURES.has(answers)) continue;
      GENERATED_QUESTION_SIGNATURES.add(questions);
      GENERATED_ANSWER_SIGNATURES.add(answers);
      return candidateParams;
    }
    throw new Error('在 ' + MAX_CANDIDATES + ' 個確定性候選中未找到題目組及答案組不重複的版本 V' + number + '。');
  }

  function generatedParamsForVersion(number) {
    for (var nextVersion = GENERATED_LAST_VERSION + 1; nextVersion <= number; nextVersion += 1) {
      GENERATED_PARAMS_CACHE[nextVersion] = selectGeneratedParams(nextVersion);
      GENERATED_LAST_VERSION = nextVersion;
    }
    return clone(GENERATED_PARAMS_CACHE[number]);
  }

  var fixedV1Result = buildResult(1, GENERATED_PARAMS_CACHE[1]);
  var fixedV1Validation = verifyResult(fixedV1Result);
  if (!fixedV1Validation.valid) throw new Error(fixedV1Validation.reasons.join('；'));
  GENERATED_QUESTION_SIGNATURES.add(questionSignature(fixedV1Result));
  GENERATED_ANSWER_SIGNATURES.add(answerSignature(fixedV1Result));

  function verify(version) {
    try {
      var number = parseVersion(version);
      return verifyResult(buildResult(number, generatedParamsForVersion(number)));
    } catch (error) {
      return { valid: false, reasons: [error.message] };
    }
  }

  function generate(version) {
    var number = parseVersion(version);
    var result = buildResult(number, generatedParamsForVersion(number));
    var validation = verifyResult(result);
    if (!validation.valid) throw new Error(validation.reasons.join('；'));
    return result;
  }

  return {
    ID: ID,
    FIXED: FIXED,
    fixedVersions: FIXED,
    MARKS: MARKS,
    MARKING: MARKING,
    marks: MARKS,
    marking: MARKING,
    paperPageCount: 6,
    answerPageCount: 2,
    generate: generate,
    verify: verify,
    parseVersion: parseVersion,
    getPaperPages: function (version) { return generate(version).paperPages; },
    getAnswerPages: function (version) { return generate(version).answerPages; }
  };
});
