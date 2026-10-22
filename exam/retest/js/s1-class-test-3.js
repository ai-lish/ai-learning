(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetestS1ClassTest3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ID = 's1-class-test-3';
  var LETTERS = ['A', 'B', 'C', 'D'];
  var VARIABLE_LETTERS = 'abcdfghjkmnpqrstuvwxyz'.split('');
  var ANSWER_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5a', 'q5b', 'q6a', 'q6b', 'q7a', 'q7b', 'q8', 'q9', 'q10'];
  var MARKS = {
    '1': 1, '2': 1, '3': 1, '4': 1,
    '5a': 2, '5b': 2, '6a': 1, '6b': 2, '7a': 1, '7b': 2,
    '8': 2, '9': 2, '10': 2
  };
  var MARKING = {
    '1': { M: 0, A: 1 }, '2': { M: 0, A: 1 }, '3': { M: 0, A: 1 }, '4': { M: 0, A: 1 },
    '5a': { M: 1, A: 1 }, '5b': { M: 1, A: 1 }, '6a': { M: 0, A: 1 }, '6b': { M: 1, A: 1 },
    '7a': { M: 0, A: 1 }, '7b': { M: 1, A: 1 }, '8': { M: 1, A: 1 }, '9': { M: 1, A: 1 },
    '10': { M: 1, A: 1 }
  };
  var FIXED = {
    V1: {
      mc: [
        ['求 $24-3\\times(4+2)$ 的值。', ['$126$', '$6$', '$10$', '$14$'], 'B', '$24-3\\times(4+2)=6$'],
        ['計算 $-12+7$。', ['$-19$', '$5$', '$-5$', '$19$'], 'C', '$-12+7=-5$'],
        ['化簡 $6a-4+2a+9$。', ['$8a+13$', '$4a+5$', '$8a+5$', '$8a-5$'], 'C', '$6a-4+2a+9=8a+5$'],
        ['解方程 $3x+2=17$。', ['$x=5$', '$x=19$', '$x=3$', '$x=-5$'], 'A', '$x=5$']
      ],
      q1: { a: 24, b: 3, c: 4, d: 2 },
      q2: { negative: 12, positive: 7 },
      q3: { p: 6, operation: '+', q: 2, constant1: -4, constant2: 9, variable: 'a' },
      q4: { p: 3, constant: 2, rhs: 17, answer: 5 },
      q5: { p: 6, operation: '+', q: 3, constant1: -4, constant2: 7, variable: 'y', value: -2 },
      q6: {
        item1: '自動鉛筆', unit1: '枝', price1: 7,
        item2: '筆芯', unit2: '盒', quantity2: '一盒', price2: 3,
        buyer: '小敏', x: 3
      },
      q7: { first: 3, difference: 5 },
      q8: { p: 6, q: 2, constant: 3, rhs: 19, answer: 4 },
      q9: { p: 7, b: 3, q: 5, d: 15, answer: 6 },
      q10: { p: 3, offset: 2, rhs: 16, q: 2, answer: 2 }
    },
    V2: {
      mc: [
        ['求 $30-4\\times(3+4)$ 的值。', ['$14$', '$22$', '$2$', '$182$'], 'C', '$30-4\\times(3+4)=2$'],
        ['計算 $-9+14$。', ['$-23$', '$23$', '$-5$', '$5$'], 'D', '$-9+14=5$'],
        ['化簡 $7b+5-3b-2$。', ['$10b+3$', '$4b+7$', '$4b+3$', '$-4b+3$'], 'C', '$7b+5-3b-2=4b+3$'],
        ['解方程 $4x-3=13$。', ['$x=4$', '$x=16$', '$x=10$', '$x=-4$'], 'A', '$x=4$']
      ],
      q1: { a: 30, b: 4, c: 3, d: 4 },
      q2: { negative: 9, positive: 14 },
      q3: { p: 7, operation: '-', q: 3, constant1: 5, constant2: -2, variable: 'b' },
      q4: { p: 4, constant: -3, rhs: 13, answer: 4 },
      q5: { p: 8, operation: '-', q: 3, constant1: 5, constant2: -7, variable: 't', value: -2 },
      q6: {
        item1: '橡皮擦', unit1: '塊', price1: 5,
        item2: '間尺', unit2: '把', quantity2: '一把', price2: 6,
        buyer: '小明', x: 4
      },
      q7: { first: 5, difference: 6 },
      q8: { p: 8, q: 5, constant: 2, rhs: 17, answer: 5 },
      q9: { p: 4, b: 5, q: 2, d: 17, answer: 6 },
      q10: { p: 4, offset: -1, rhs: 14, q: 2, answer: 3 }
    }
  };
  var ORIGINAL_ANSWERS = {
    q1: '6', q2: '-5', q3: '3a+5', q4: 'x=4',
    q5a: '7y+4', q5b: -10, q6a: '8x+5', q6b: 21,
    q7a: 18, q7b: 38, q8: 4, q9: 5, q10: 2.5
  };
  var STATIONERY = [
    { item1: '自動鉛筆', unit1: '枝', item2: '筆芯', unit2: '盒', quantity2: '一盒' },
    { item1: '橡皮擦', unit1: '塊', item2: '間尺', unit2: '把', quantity2: '一把' },
    { item1: '鉛筆', unit1: '枝', item2: '練習簿', unit2: '本', quantity2: '一本' },
    { item1: '顏色筆', unit1: '盒', item2: '鉛筆刨', unit2: '個', quantity2: '一個' }
  ];
  var BUYERS = ['小敏', '小明', '小欣', '小華', '小美'];
  var MAX_CANDIDATES = 20000;
  var GENERATED_CACHE = { 2: deepClone(FIXED.V2) };

  function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
  function parseVersion(value) {
    var match = String(value == null ? '' : value).trim().match(/^V?([1-9][0-9]*)$/i);
    if (!match) throw new Error('版本須為 V1 或以上的正整數。');
    var number = Number(match[1]);
    if (!Number.isSafeInteger(number)) throw new Error('版本號超出安全整數範圍。');
    return number;
  }
  function stripMath(value) { return String(value).replace(/^\$/, '').replace(/\$$/, ''); }
  function unique(values) { return new Set(values).size === values.length; }
  function inRange(value, min, max) { return Number.isInteger(value) && value >= min && value <= max; }
  function signed(value) { return value < 0 ? '−' + Math.abs(value) : '+' + value; }
  function term(coefficient, variable) {
    if (coefficient === 1) return variable;
    if (coefficient === -1) return '−' + variable;
    return (coefficient < 0 ? '−' : '') + Math.abs(coefficient) + variable;
  }
  function constantPart(value) { return value === 0 ? '' : signed(value); }
  function expression(coefficient, variable, constant) {
    return term(coefficient, variable) + constantPart(constant);
  }
  function shuffle(values, rng) {
    var result = values.slice();
    for (var i = result.length - 1; i > 0; i -= 1) {
      var j = rng(i + 1);
      var value = result[i];
      result[i] = result[j];
      result[j] = value;
    }
    return result;
  }
  function hashSeed(text) {
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 0x9e3779b9;
  }
  function makeRng(seedText) {
    var state = hashSeed(seedText);
    return function (limit) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return state % limit;
    };
  }
  function pick(rng, values) { return values[rng(values.length)]; }
  function between(rng, min, max) { return min + rng(max - min + 1); }
  function nonZero(rng, min, max) {
    var value = 0;
    while (value === 0) value = between(rng, min, max);
    return value;
  }
  function choiceRow(question, entries, working, rng) {
    var ordered = shuffle(entries, rng);
    var correctIndex = ordered.findIndex(function (entry) { return entry.correct; });
    return [question, ordered.map(function (entry) { return '$' + entry.value + '$'; }), LETTERS[correctIndex], working];
  }
  function fixedEntries(values, correctValue) {
    return values.map(function (value) { return { value: String(value), correct: String(value) === String(correctValue) }; });
  }
  function signedEquationConstant(value) {
    return value < 0 ? '−' + Math.abs(value) : '+' + value;
  }
  function q5Expression(q5) {
    return term(q5.p, q5.variable) + signedEquationConstant(q5.constant1) +
      (q5.operation === '+' ? '+' : '−') + q5.q + q5.variable + signedEquationConstant(q5.constant2);
  }
  function q5Simplified(q5) {
    var coefficient = q5.operation === '+' ? q5.p + q5.q : q5.p - q5.q;
    return { coefficient: coefficient, constant: q5.constant1 + q5.constant2,
      text: expression(coefficient, q5.variable, q5.constant1 + q5.constant2) };
  }
  function q8Equation(q8) {
    return q8.p + 'x−' + q8.q + 'x' + signedEquationConstant(q8.constant) + '=' + q8.rhs;
  }
  function q9Equation(q9) {
    return q9.p + 'x' + signedEquationConstant(q9.b) + '=' + q9.q + 'x' + signedEquationConstant(q9.d);
  }
  function q10Equation(q10) {
    return q10.p + '(x' + (q10.offset < 0 ? '−' + Math.abs(q10.offset) : '+' + q10.offset) + ')=' +
      q10.rhs + '−' + q10.q + 'x';
  }
  function correctOption(row) {
    return stripMath(row[1][LETTERS.indexOf(row[2])]);
  }
  function normalizeMinus(value) { return String(value).replace(/-/g, '−'); }

  function makeGeneratedCandidate(version, candidateOrder) {
    var rng = makeRng(ID + '|V' + version + '|' + candidateOrder);
    var q1 = { b: between(rng, 2, 4), c: between(rng, 2, 5), d: between(rng, 2, 5) };
    q1.a = q1.b * (q1.c + q1.d) + between(rng, 1, 8);
    var q1Answer = q1.a - q1.b * (q1.c + q1.d);
    var q1Wrong = [
      q1.a - q1.b * q1.c + q1.d,
      (q1.a - q1.b) * (q1.c + q1.d),
      q1.a - (q1.b + q1.c) * q1.d
    ];
    var q1Text = '求 $' + q1.a + '-' + q1.b + '\\times(' + q1.c + '+' + q1.d + ')$ 的值。';
    var q1Working = '$' + q1.a + '-' + q1.b + '\\times(' + q1.c + '+' + q1.d + ')=' + q1Answer + '$';

    var q2 = { negative: between(rng, 6, 15), positive: between(rng, 3, 15) };
    var q2Answer = q2.positive - q2.negative;
    var q2Text = '計算 $-' + q2.negative + '+' + q2.positive + '$。';
    var q2Entries = fixedEntries([
      -(q2.negative + q2.positive), q2.negative + q2.positive,
      q2.negative - q2.positive, q2Answer
    ], q2Answer);

    var q3 = {
      p: between(rng, 4, 9), operation: pick(rng, ['+', '-']),
      constant1: nonZero(rng, -8, 8), constant2: nonZero(rng, -8, 8),
      variable: pick(rng, VARIABLE_LETTERS)
    };
    q3.q = between(rng, 2, q3.p - 2);
    var q3Reduced = q5Simplified({ p: q3.p, q: q3.q, operation: q3.operation,
      constant1: q3.constant1, constant2: q3.constant2, variable: q3.variable });
    var q3WrongCoefficient = q3.operation === '+' ? q3.p - q3.q : q3.p + q3.q;
    var q3Text = '化簡 $' + q5Expression(q3) + '$。';
    var q3Entries = fixedEntries([
      q3Reduced.text,
      expression(q3WrongCoefficient, q3.variable, q3Reduced.constant),
      expression(q3Reduced.coefficient, q3.variable, q3.constant1 - q3.constant2),
      expression(2 * q3.p, q3.variable, q3Reduced.constant)
    ], q3Reduced.text);

    var q4 = { p: between(rng, 2, 5), answer: between(rng, 2, 8), constant: between(rng, -3, 8) };
    q4.rhs = q4.p * q4.answer + q4.constant;
    var q4Text = '解方程 $' + q4.p + 'x' + signedEquationConstant(q4.constant) + '=' + q4.rhs + '$。';
    var q4Entries = fixedEntries([
      'x=' + q4.answer, 'x=' + (q4.p * q4.answer), 'x=' + (q4.answer + q4.p), 'x=' + (-q4.answer)
    ], 'x=' + q4.answer);

    var mc = [
      choiceRow(q1Text, fixedEntries([q1Answer].concat(q1Wrong), q1Answer), q1Working, rng),
      choiceRow(q2Text, q2Entries, '$-' + q2.negative + '+' + q2.positive + '=' + q2Answer + '$', rng),
      choiceRow(q3Text, q3Entries, '$' + q3Reduced.text + '$', rng),
      choiceRow(q4Text, q4Entries, '$x=' + q4.answer + '$', rng)
    ];

    var q5 = {
      p: between(rng, 4, 9), operation: pick(rng, ['+', '-']),
      constant1: nonZero(rng, -8, 8), constant2: nonZero(rng, -8, 8),
      variable: pick(rng, VARIABLE_LETTERS), value: pick(rng, [-3, -2, 2, 3])
    };
    q5.q = between(rng, 2, q5.p - 2);

    var stationery = STATIONERY[rng(STATIONERY.length)];
    var q6 = {
      item1: stationery.item1, unit1: stationery.unit1, item2: stationery.item2, unit2: stationery.unit2,
      quantity2: stationery.quantity2, buyer: pick(rng, BUYERS),
      price1: between(rng, 2, 9), price2: between(rng, 2, 9), x: between(rng, 2, 6)
    };
    var q7 = { first: between(rng, 2, 8), difference: between(rng, 2, 7) };
    var q8 = { p: between(rng, 4, 9), constant: nonZero(rng, -4, 8), answer: between(rng, 2, 8) };
    q8.q = between(rng, 1, q8.p - 2);
    q8.rhs = (q8.p - q8.q) * q8.answer + q8.constant;
    var q9 = { p: between(rng, 3, 9), b: between(rng, 1, 9), answer: between(rng, 2, 8) };
    q9.q = between(rng, 1, q9.p - 2);
    q9.d = q9.b + (q9.p - q9.q) * q9.answer;
    var q10 = {
      p: between(rng, 2, 5), q: between(rng, 1, 5),
      offset: pick(rng, [-3, -2, -1, 1, 2, 3]), answer: between(rng, 2, 8)
    };
    q10.rhs = (q10.p + q10.q) * q10.answer + q10.p * q10.offset;

    return {
      mc: mc, q1: q1, q2: q2, q3: q3, q4: q4, q5: q5,
      q6: q6, q7: q7, q8: q8, q9: q9, q10: q10,
      generator: { candidateOrder: candidateOrder }
    };
  }

  function answersFor(params) {
    var q5 = q5Simplified(params.q5);
    var q6 = params.q6;
    return {
      q1: correctOption(params.mc[0]), q2: correctOption(params.mc[1]),
      q3: correctOption(params.mc[2]), q4: correctOption(params.mc[3]),
      q5a: q5.text, q5b: q5.coefficient * params.q5.value + q5.constant,
      q6a: q6.price1 + 'x+' + q6.price2, q6b: q6.price1 * q6.x + q6.price2,
      q7a: params.q7.first + 3 * params.q7.difference,
      q7b: params.q7.first + 8 * params.q7.difference,
      q8: params.q8.answer, q9: params.q9.answer, q10: params.q10.answer
    };
  }

  function generatedRangesValid(params) {
    var q1 = params.q1; var q2 = params.q2; var q3 = params.q3; var q4 = params.q4;
    var q5 = params.q5; var q6 = params.q6; var q7 = params.q7; var q8 = params.q8;
    var q9 = params.q9; var q10 = params.q10;
    var q3Reduced = q5Simplified(q3); var q5Reduced = q5Simplified(q5);
    return inRange(q1.a, 17, 48) && inRange(q1.b, 2, 4) && inRange(q1.c, 2, 5) && inRange(q1.d, 2, 5) &&
      q1.a > q1.b * (q1.c + q1.d) &&
      inRange(q2.negative, 6, 15) && inRange(q2.positive, 3, 15) && q2.negative !== q2.positive &&
      inRange(q3.p, 4, 9) && inRange(q3.q, 2, q3.p - 2) && ['+', '-'].indexOf(q3.operation) !== -1 &&
      inRange(q3.constant1, -8, 8) && q3.constant1 !== 0 && inRange(q3.constant2, -8, 8) && q3.constant2 !== 0 &&
      q3Reduced.constant !== 0 && VARIABLE_LETTERS.indexOf(q3.variable) !== -1 &&
      inRange(q4.p, 2, 5) && inRange(q4.answer, 2, 8) && inRange(q4.constant, -3, 8) && q4.rhs > 0 &&
      inRange(q5.p, 4, 9) && inRange(q5.q, 2, q5.p - 2) && ['+', '-'].indexOf(q5.operation) !== -1 &&
      inRange(q5.constant1, -8, 8) && q5.constant1 !== 0 && inRange(q5.constant2, -8, 8) && q5.constant2 !== 0 &&
      q5Reduced.constant !== 0 && [-3, -2, 2, 3].indexOf(q5.value) !== -1 && VARIABLE_LETTERS.indexOf(q5.variable) !== -1 &&
      inRange(q6.price1, 2, 9) && inRange(q6.price2, 2, 9) && inRange(q6.x, 2, 6) &&
      STATIONERY.some(function (item) {
        return item.item1 === q6.item1 && item.unit1 === q6.unit1 && item.item2 === q6.item2 &&
          item.unit2 === q6.unit2 && item.quantity2 === q6.quantity2;
      }) && BUYERS.indexOf(q6.buyer) !== -1 &&
      inRange(q7.first, 2, 8) && inRange(q7.difference, 2, 7) &&
      inRange(q8.p, 4, 9) && inRange(q8.q, 1, q8.p - 2) && inRange(q8.constant, -4, 8) && q8.constant !== 0 &&
      inRange(q8.answer, 2, 8) && q8.rhs > 0 &&
      inRange(q9.p, 3, 9) && inRange(q9.q, 1, q9.p - 2) && inRange(q9.b, 1, 9) &&
      inRange(q9.answer, 2, 8) && q9.d > q9.b &&
      inRange(q10.p, 2, 5) && inRange(q10.q, 1, 5) && [-3, -2, -1, 1, 2, 3].indexOf(q10.offset) !== -1 &&
      inRange(q10.answer, 2, 8) && q10.rhs > 0;
  }

  function generatedChoiceChecks(params) {
    if (params.mc.length !== 4 || new Set(params.mc.map(function (row) { return row[2]; })).size < 2) return false;
    if (params.mc.some(function (row) { return row[1].length !== 4 || !unique(row[1].map(stripMath)); })) return false;
    var q1 = params.q1; var q2 = params.q2; var q3 = params.q3; var q4 = params.q4;
    var q1Expected = String(q1.a - q1.b * (q1.c + q1.d));
    var q2Expected = String(q2.positive - q2.negative);
    var q3Expected = q5Simplified(q3).text;
    var q4Expected = 'x=' + q4.answer;
    return correctOption(params.mc[0]) === q1Expected && correctOption(params.mc[1]) === q2Expected &&
      correctOption(params.mc[2]) === q3Expected && correctOption(params.mc[3]) === q4Expected;
  }
  function answerMathValid(params) {
    var q5 = q5Simplified(params.q5);
    var q6 = params.q6;
    var q7 = params.q7;
    var q4 = params.q4;
    var q8 = params.q8;
    var q9 = params.q9;
    var q10 = params.q10;
    var q1ExpectedText = '求 $' + params.q1.a + '-' + params.q1.b + '\\times(' + params.q1.c + '+' + params.q1.d + ')$ 的值。';
    var q2ExpectedText = '計算 $-' + params.q2.negative + '+' + params.q2.positive + '$。';
    var q3ExpectedText = '化簡 $' + q5Expression(params.q3) + '$。';
    var q4ExpectedText = '解方程 $' + params.q4.p + 'x' + signedEquationConstant(params.q4.constant) + '=' + params.q4.rhs + '$。';
    return generatedChoiceChecks(params) &&
      [q1ExpectedText, q2ExpectedText, q3ExpectedText, q4ExpectedText].every(function (text, index) {
        return normalizeMinus(params.mc[index][0]) === normalizeMinus(text);
      }) && params.q1.a - params.q1.b * (params.q1.c + params.q1.d) === Number(correctOption(params.mc[0])) &&
      params.q2.positive - params.q2.negative === Number(correctOption(params.mc[1])) &&
      q4.rhs === q4.p * q4.answer + q4.constant &&
      q5.coefficient === (params.q5.operation === '+' ? params.q5.p + params.q5.q : params.q5.p - params.q5.q) &&
      q5.constant === params.q5.constant1 + params.q5.constant2 &&
      q5.coefficient * params.q5.value + q5.constant === answersFor(params).q5b &&
      answersFor(params).q6a === q6.price1 + 'x+' + q6.price2 &&
      answersFor(params).q6b === q6.price1 * q6.x + q6.price2 &&
      answersFor(params).q7a === q7.first + 3 * q7.difference &&
      answersFor(params).q7b === q7.first + 8 * q7.difference &&
      q8.p > q8.q && q8.rhs - q8.constant === (q8.p - q8.q) * q8.answer &&
      q9.p > q9.q && q9.d - q9.b === (q9.p - q9.q) * q9.answer &&
      q10.rhs - q10.p * q10.offset === (q10.p + q10.q) * q10.answer;
  }

  function answerSteps(params, answers) {
    var result = [];
    function add(question, text, mark) { result.push({ question: String(question), text: text, mark: mark || '' }); }
    params.mc.forEach(function (row, index) {
      add(index + 1, 'Q' + (index + 1) + '　' + row[2] + '（' + correctOption(row) + '）', '1A');
    });
    var q5 = params.q5; var q5Reduced = q5Simplified(q5);
    add('5a', '5(a)　$' + q5Expression(q5) + '=' + term(q5Reduced.coefficient, q5.variable) +
      signedEquationConstant(q5Reduced.constant) + '$', '1M');
    add('5a', '$' + q5Reduced.text + '$', '1A');
    add('5b', '5(b)　原式$=' + q5Reduced.text + '$，' + q5.variable + '$=' + q5.value + '$', '1M');
    add('5b', '$' + q5Reduced.coefficient + '(' + q5.value + ')' + signedEquationConstant(q5Reduced.constant) + '=' + answers.q5b + '$', '');
    add('5b', '$' + answers.q5b + '$', '1A');
    var q6 = params.q6;
    add('6a', '6(a)　$C=' + answers.q6a + '$', '1A');
    add('6b', '6(b)　$C=' + q6.price1 + '(' + q6.x + ')+' + q6.price2 + '$', '1M');
    add('6b', '$C=' + answers.q6b + '$元', '1A');
    var q7 = params.q7;
    add('7a', '7(a)　$T_4=' + q7.first + '+3\\times' + q7.difference + '=' + answers.q7a + '$', '1A');
    add('7b', '7(b)　公差$=' + q7.difference + '$；$T_9=' + q7.first + '+8\\times' + q7.difference + '$', '1M');
    add('7b', '$T_9=' + answers.q7b + '$', '1A');
    var q8 = params.q8; var q8Coefficient = q8.p - q8.q;
    add('8', '8　$' + q8Equation(q8) + '\\Rightarrow ' + q8Coefficient + 'x' + signedEquationConstant(q8.constant) + '=' + q8.rhs + '$', '1M');
    add('8', '$' + q8Coefficient + 'x=' + (q8.rhs - q8.constant) + '$', '');
    add('8', '$x=' + answers.q8 + '$', '1A');
    var q9 = params.q9; var q9Coefficient = q9.p - q9.q;
    add('9', '9　$' + q9Equation(q9) + '\\Rightarrow ' + q9Coefficient + 'x' + signedEquationConstant(q9.b) + '=' + q9.d + '$', '1M');
    add('9', '$' + q9Coefficient + 'x=' + (q9.d - q9.b) + '$', '');
    add('9', '$x=' + answers.q9 + '$', '1A');
    var q10 = params.q10; var q10Coefficient = q10.p + q10.q;
    var q10Expanded = q10.p + 'x' + signedEquationConstant(q10.p * q10.offset) + '=' + q10.rhs + '−' + q10.q + 'x';
    add('10', '10　$' + q10Equation(q10) + '\\Rightarrow ' + q10Expanded + '$', '1M');
    add('10', '$' + q10Coefficient + 'x=' + (q10.rhs - q10.p * q10.offset) + '$', '');
    add('10', '$x=' + answers.q10 + '$', '1A');
    return result;
  }

  function answerMarkTotals(steps) {
    return steps.reduce(function (total, step) {
      var match; var pattern = /(\d+)([MA])/g;
      while ((match = pattern.exec(step.mark))) total[match[2]] += Number(match[1]);
      return total;
    }, { M: 0, A: 0 });
  }

  function paperPages(params) {
    var first = [{ kind: 'answerHeading', text: '甲部　選擇題（4分）每題1分。請選出正確答案，並將選項字母填在答案空格。' }];
    params.mc.forEach(function (row, index) {
      first.push({ kind: 'question', number: String(index + 1), text: row[0], marks: 1 });
      first.push({ kind: 'choices', options: row[1].map(stripMath), answerText: '答案：______' });
    });
    var q5 = params.q5; var q5Reduced = q5Simplified(q5); var q6 = params.q6; var q7 = params.q7;
    first.push({ kind: 'answerHeading', text: '乙部　解答題（16分）。請列出計算步驟。' });
    first.push({ kind: 'question', number: '5', text: '化簡下列代數式。' });
    first.push({ kind: 'subquestion', label: 'a', text: '$' + q5Expression(q5) + '$。', marks: 2, blankCm: 1.0, examAnswerRows: 3 });
    first.push({ kind: 'subquestion', label: 'b', text: '當 $' + q5.variable + '=' + q5.value + '$ 時，求原式的值。', marks: 2, blankCm: 1.1, examAnswerRows: 3 });
    first.push({ kind: 'question', number: '6', text: '文具部' + q6.item1 + '每' + q6.unit1 + q6.price1 + '元，' + q6.item2 + '每' + q6.unit2 + q6.price2 + '元。' + q6.buyer + '買了 $x$ ' + q6.unit1 + q6.item1 + '和' + q6.quantity2 + q6.item2 + '。' });
    first.push({ kind: 'subquestion', label: 'a', text: '設總費用為 $C$ 元，寫出 $C$ 的代數式。', marks: 1, blankCm: 0.8, examAnswerRows: 2 });
    first.push({ kind: 'subquestion', label: 'b', text: '若 $x=' + q6.x + '$，求總費用。', marks: 2, blankCm: 1.0, examAnswerRows: 3 });
    var sequence = [1, 2, 3, 4].map(function (n) { return q7.first + (n - 1) * q7.difference; });
    first.push({ kind: 'question', number: '7', text: '數列 $' + sequence.join(',') + ',\\ldots$ 按規律排列。' });
    first.push({ kind: 'subquestion', label: 'a', text: '求 $T_4$。', marks: 1, blankCm: 0.7, examAnswerRows: 2 });
    first.push({ kind: 'subquestion', label: 'b', text: '求第 9 項。', marks: 2, blankCm: 1.4, examAnswerRows: 3 });

    var second = [
      { kind: 'answerHeading', text: '乙部　解答題（續）' },
      { kind: 'question', number: '8', text: '解方程 $' + q8Equation(params.q8) + '$。', marks: 2, examAnswerRows: 4 },
      { kind: 'spacer', cm: 2.3 },
      { kind: 'question', number: '9', text: '解方程 $' + q9Equation(params.q9) + '$。', marks: 2, examAnswerRows: 4 },
      { kind: 'spacer', cm: 2.3 },
      { kind: 'question', number: '10', text: '解方程 $' + q10Equation(params.q10) + '$。', marks: 2, examAnswerRows: 4 },
      { kind: 'spacer', cm: 2.7 }
    ];
    return [
      { withStudentInfo: true, blocks: first },
      { withStudentInfo: false, blocks: second }
    ];
  }

  function answerPages(params, answers, steps) {
    var firstBlocks = [
      { kind: 'answerHeading', text: 'M＝方法分；A＝答案分。其他等價正確答案可給相應分數。' },
      { kind: 'answerHeading', text: '甲部　選擇題（4分）' }
    ];
    var secondBlocks = [{ kind: 'answerHeading', text: '乙部　解答題（續）' }];
    var partBHeadingAdded = false;
    steps.forEach(function (step) {
      var block = { kind: 'answerStep', text: step.text, mark: step.mark };
      var questionNumber = Number.parseInt(step.question, 10);
      if (questionNumber <= 4) {
        firstBlocks.push(block);
      } else if (questionNumber <= 6) {
        if (!partBHeadingAdded) {
          firstBlocks.push({ kind: 'answerHeading', text: '乙部　解答題（16分）' });
          partBHeadingAdded = true;
        }
        firstBlocks.push(block);
      } else {
        secondBlocks.push(block);
      }
    });
    secondBlocks.push({ kind: 'answerHeading', text: '合計：甲部 4 分＋乙部 16 分＝20 分。' });
    return [
      { withStudentInfo: false, blocks: firstBlocks },
      { withStudentInfo: false, blocks: secondBlocks }
    ];
  }

  function buildResult(params, version) {
    var answers = answersFor(params);
    var steps = answerSteps(params, answers);
    var paper = paperPages(params);
    var answer = answerPages(params, answers, steps);
    return {
      id: ID,
      version: version,
      name: '班測3 重測',
      academicYear: '2026-27 第一學期',
      gradeLabel: '中一級',
      subject: '數學科',
      defaultClass: '1A',
      durationMinutes: 20,
      totalMarks: 20,
      marks: deepClone(MARKS),
      marking: deepClone(MARKING),
      params: deepClone(params),
      questions: { mc: deepClone(params.mc), q5: deepClone(params.q5), q6: deepClone(params.q6),
        q7: deepClone(params.q7), q8: deepClone(params.q8), q9: deepClone(params.q9), q10: deepClone(params.q10) },
      answers: answers,
      answerSteps: steps,
      paperPages: paper,
      answerPages: answer,
      pageCount: paper.length
    };
  }

  function hasRepeatedAnswer(current, previous) {
    var baselines = [ORIGINAL_ANSWERS, answersFor(FIXED.V1), answersFor(FIXED.V2)];
    return ANSWER_KEYS.some(function (key) {
      if (baselines.some(function (baseline) { return String(current[key]) === String(baseline[key]); })) return true;
      return !!previous && String(current[key]) === String(previous[key]);
    });
  }
  function selectGenerated(version, previousParams) {
    var previousAnswers = answersFor(previousParams);
    for (var candidateOrder = 0; candidateOrder < MAX_CANDIDATES; candidateOrder += 1) {
      var candidate = makeGeneratedCandidate(version, candidateOrder);
      if (!generatedRangesValid(candidate) || !generatedChoiceChecks(candidate)) continue;
      if (hasRepeatedAnswer(answersFor(candidate), previousAnswers)) continue;
      candidate.generator.version = version;
      return candidate;
    }
    throw new Error('在 ' + MAX_CANDIDATES + ' 個確定性候選中未找到符合驗算及答案不重複條件的版本 V' + version + '。');
  }
  function paramsForVersion(number) {
    if (number === 1 || number === 2) return deepClone(FIXED['V' + number]);
    var cached = 2;
    while (cached < number && GENERATED_CACHE[cached + 1]) cached += 1;
    var previous = deepClone(GENERATED_CACHE[cached]);
    for (var version = cached + 1; version <= number; version += 1) {
      previous = selectGenerated(version, previous);
      GENERATED_CACHE[version] = deepClone(previous);
    }
    return deepClone(GENERATED_CACHE[number]);
  }
  function validateGenerated(params) {
    var errors = [];
    if (!generatedRangesValid(params)) errors.push('生成參數超出範圍或違反條件。');
    if (!generatedChoiceChecks(params)) errors.push('選擇題選項或正確答案不符合題目。');
    var previous = params.generator && params.generator.version > 3 ? paramsForVersion(params.generator.version - 1) : FIXED.V2;
    if (hasRepeatedAnswer(answersFor(params), answersFor(previous))) errors.push('答案與原題、固定版本或緊接前版重複。');
    return errors;
  }
  function verify(version) {
    try {
      var number = parseVersion(version);
      var params = paramsForVersion(number);
      var errors = [];
      if (!Array.isArray(params.mc) || params.mc.length !== 4) errors.push('甲部須有四道選擇題。');
      if (params.mc.some(function (row) { return row[1].length !== 4 || !unique(row[1].map(stripMath)); })) {
        errors.push('甲部各題須有四個互不相同的選項。');
      }
      if (number >= 3) errors = errors.concat(validateGenerated(params));
      if (!answerMathValid(params)) errors.push('題目答案與數學關係不符。');
      var result = buildResult(params, 'V' + number);
      if (result.durationMinutes !== 20 || result.totalMarks !== 20) errors.push('限時或總分錯誤。');
      if (result.paperPages.length !== 2 || result.answerPages.length !== 2 || result.pageCount !== 2) errors.push('一般版式試卷及答案頁數錯誤。');
      if (Object.keys(MARKS).reduce(function (total, key) { return total + MARKS[key]; }, 0) !== 20) errors.push('題目分數總和不是 20 分。');
      var totals = answerMarkTotals(result.answerSteps);
      if (totals.M !== 7 || totals.A !== 13) errors.push('答案步驟 M/A 分數總和錯誤。');
      if (Object.keys(MARKING).some(function (key) { return MARKING[key].M + MARKING[key].A !== MARKS[key]; })) {
        errors.push('M/A 分拆與各題分數不一致。');
      }
      if (errors.length) return { valid: false, version: 'V' + number, reasons: errors };
      return { valid: true, version: 'V' + number, reasons: [] };
    } catch (error) {
      return { valid: false, reasons: [error.message] };
    }
  }
  function generate(version) {
    var number = parseVersion(version);
    var params = paramsForVersion(number);
    var result = buildResult(params, 'V' + number);
    var validation = verify('V' + number);
    if (!validation.valid) throw new Error(validation.reasons.join('；'));
    return result;
  }

  return {
    ID: ID,
    FIXED: FIXED,
    fixedVersions: FIXED,
    ORIGINAL_ANSWERS: ORIGINAL_ANSWERS,
    MARKS: MARKS,
    MARKING: MARKING,
    marks: MARKS,
    marking: MARKING,
    paperPageCount: 2,
    answerPageCount: 2,
    generate: generate,
    verify: verify,
    parseVersion: parseVersion,
    getPaperPages: function (version) { return generate(version).paperPages; },
    getAnswerPages: function (version) { return generate(version).answerPages; },
    answerKeys: ANSWER_KEYS.slice(),
    variableLetters: VARIABLE_LETTERS.slice(),
    stationery: deepClone(STATIONERY)
  };
});
