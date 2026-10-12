(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetestS1ClassTest2 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ID = 's1-class-test-2';
  var LETTERS = ['A', 'B', 'C', 'D'];
  var VARIABLE_LETTERS = 'abcdfghjkmnpqrstuvwxyz'.split('');
  var ANSWER_KEYS = [
    'q1', 'q2', 'q3', 'q4', 'q5', 'q6a', 'q6b', 'q6c', 'q8',
    'q9a', 'q9b', 'q9c', 'q10a', 'q10b', 'q10cExpression', 'q10cValue'
  ];
  var NON_REPEAT_KEYS = ANSWER_KEYS.filter(function (key) { return key !== 'q3'; });
  var MARKS = {
    '1': 1, '2': 1, '3': 1, '4': 1, '5': 1,
    '6a': 1, '6b': 2, '6c': 2, '8': 2,
    '9a': 1, '9b': 1, '9c': 2, '10a': 2, '10b': 2, '10c': 2
  };
  var MARKING = {
    '1': { M: 0, A: 1 }, '2': { M: 0, A: 1 }, '3': { M: 0, A: 1 },
    '4': { M: 0, A: 1 }, '5': { M: 0, A: 1 }, '6a': { M: 0, A: 1 },
    '6b': { M: 1, A: 1 }, '6c': { M: 1, A: 1 }, '8': { M: 1, A: 1 },
    '9a': { M: 0, A: 1 }, '9b': { M: 0, A: 1 }, '9c': { M: 1, A: 1 },
    '10a': { M: 1, A: 1 }, '10b': { M: 1, A: 1 }, '10c': { M: 0, A: 2 }
  };
  var FIXED = {
    V1: {
      mc: [
        ['化簡 $4b+3b$。', ['$12b$', '$7b^{2}$', '$7b$', '$b$'], 'C', '$4b+3b=7b$'],
        ['若 $x=3$，求 $2x+5$ 的值。', ['$10$', '$11$', '$16$', '$28$'], 'B', '$2(3)+5=11$'],
        ['把「$a$ 與 $b$ 的積」寫成代數式。', ['$a+b$', '$a-b$', '$ab$', '$a\\div b$'], 'C', '$ab$'],
        ['把「$x$ 的 5 倍」寫成代數式。', ['$5x$', '$5+x$', '$x^{5}$', '$x\\div5$'], 'A', '$5x$'],
        ['化簡 $4n\\times2$。', ['$6n$', '$6n^{2}$', '$8n^{2}$', '$8n$'], 'D', '$4n\\times2=8n$']
      ],
      q6a: ['9k-4k', '5k'],
      q6b: ['5x+7-3x+2', '2x+9'],
      q6c: ['4b(5b)-3b^{2}', '20b^{2}-3b^{2}', '17b^{2}'],
      q8: { a: -5, b: 2, p: 2, q: 3 },
      q9: { c: -1, d: 4 },
      q10: { item: '原子筆', unit: '枝', who: '小美', price: 7, fee: 10, x: 6, paid: 100 }
    },
    V2: {
      mc: [
        ['化簡 $6c+2c$。', ['$8c$', '$12c$', '$8c^{2}$', '$4c$'], 'A', '$6c+2c=8c$'],
        ['若 $x=5$，求 $4x+3$ 的值。', ['$12$', '$32$', '$48$', '$23$'], 'D', '$4(5)+3=23$'],
        ['把「$h$ 與 $k$ 的和」寫成代數式。', ['$hk$', '$h+k$', '$h-k$', '$2h+k$'], 'B', '$h+k$'],
        ['把「$t$ 的 4 倍」寫成代數式。', ['$t+4$', '$t^{4}$', '$4t$', '$t\\div4$'], 'C', '$4t$'],
        ['化簡 $5p\\times3$。', ['$15p$', '$8p$', '$15p^{2}$', '$8p^{2}$'], 'A', '$5p\\times3=15p$']
      ],
      q6a: ['8m-5m', '3m'],
      q6b: ['7x+4-3x+6', '4x+10'],
      q6c: ['3c(6c)-4c^{2}', '18c^{2}-4c^{2}', '14c^{2}'],
      q8: { a: -4, b: 3, p: 4, q: 3 },
      q9: { c: -1, d: 5 },
      q10: { item: '橡皮擦', unit: '塊', who: '小華', price: 4, fee: 12, x: 7, paid: 50 }
    }
  };
  var GENERATED_CACHE = { 2: deepClone(FIXED.V2) };
  var ORIGINAL_ANSWERS = {
    q1: '5a', q2: 7, q3: 'p+q', q4: '3y', q5: '6m',
    q6a: '4y', q6b: '4x+8', q6c: '28a^{2}', q8: -5,
    q9a: 2, q9b: 14, q9c: 299, q10a: '6x+8', q10b: 38,
    q10cExpression: '50-(6x+8)', q10cValue: 12
  };
  var STATIONERY = [
    { item: '鉛筆', unit: '枝', who: '小明' },
    { item: '原子筆', unit: '枝', who: '小美' },
    { item: '橡皮擦', unit: '塊', who: '小華' },
    { item: '間尺', unit: '把', who: '小明' },
    { item: '顏色筆', unit: '盒', who: '小美' },
    { item: '練習簿', unit: '本', who: '小華' },
    { item: '鉛筆刨', unit: '個', who: '小明' }
  ];
  var MAX_CANDIDATES = 20000;

  function deepClone(value) { return JSON.parse(JSON.stringify(value)); }

  function parseVersion(value) {
    var match = String(value == null ? '' : value).trim().match(/^V?([1-9][0-9]*)$/i);
    if (!match) throw new Error('版本須為 V1 或以上的正整數。');
    var number = Number(match[1]);
    if (!Number.isSafeInteger(number)) throw new Error('版本號超出安全整數範圍。');
    return number;
  }

  function inRange(value, min, max) { return Number.isInteger(value) && value >= min && value <= max; }
  function stripMath(value) { return String(value).replace(/^\$/, '').replace(/\$$/, ''); }
  function unique(values) { return new Set(values).size === values.length; }
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var remainder = a % b;
      a = b;
      b = remainder;
    }
    return a;
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
  function signed(value) { return value < 0 ? String(value) : '+' + value; }
  function tex(value) { return '$' + value + '$'; }
  function choiceRow(question, entries, working, rng) {
    var ordered = shuffle(entries, rng);
    var correctIndex = ordered.findIndex(function (entry) { return entry.correct; });
    return [question, ordered.map(function (entry) { return tex(entry.tex); }), LETTERS[correctIndex], working];
  }
  function baseEntries(values, correctValue) {
    return values.map(function (value) { return { tex: String(value), correct: String(value) === String(correctValue) }; });
  }

  function makeGeneratedCandidate(version, candidateOrder) {
    var rng = makeRng(ID + '|V' + version + '|' + candidateOrder);
    var q1 = { p: between(rng, 2, 9), q: between(rng, 2, 9), variable: pick(rng, VARIABLE_LETTERS) };
    var q1sum = q1.p + q1.q;
    var q1difference = Math.abs(q1.p - q1.q);
    var q1Entries = [
      { tex: q1sum + q1.variable, correct: true },
      { tex: (q1.p * q1.q) + q1.variable, correct: false },
      { tex: q1sum + q1.variable + '^{2}', correct: false },
      { tex: (q1difference === 1 ? '' : q1difference) + q1.variable, correct: false }
    ];
    var q1Text = '化簡 ' + tex(q1.p + q1.variable + '+' + q1.q + q1.variable) + '。';
    var q1Working = tex(q1.p + q1.variable + '+' + q1.q + q1.variable + '=' + q1sum + q1.variable);

    var q2 = { k: between(rng, 2, 6), m: between(rng, 2, 6), c: between(rng, 1, 9) };
    var q2Answer = q2.m * q2.k + q2.c;
    var q2Entries = baseEntries([
      q2Answer, q2.m + q2.k + q2.c, q2.m * (q2.k + q2.c), (10 * q2.m + q2.k) + q2.c
    ], q2Answer);
    var q2Text = '若 ' + tex('x=' + q2.k) + '，求 ' + tex(q2.m + 'x+' + q2.c) + ' 的值。';
    var q2Working = tex(q2.m + '(' + q2.k + ')+' + q2.c + '=' + q2Answer);

    var q3 = { type: pick(rng, ['sum', 'product']) };
    var q3Entries = q3.type === 'sum' ? [
      { tex: 'u+v', correct: true }, { tex: 'u-v', correct: false },
      { tex: 'uv', correct: false }, { tex: '2u+v', correct: false }
    ] : [
      { tex: 'u+v', correct: false }, { tex: 'u-v', correct: false },
      { tex: 'uv', correct: true }, { tex: 'u\\div v', correct: false }
    ];
    var q3Description = q3.type === 'sum' ? '和' : '積';
    var q3Answer = q3.type === 'sum' ? 'u+v' : 'uv';
    var q3Text = '把「$u$ 與 $v$ 的' + q3Description + '」寫成代數式。';

    var q4 = { k: between(rng, 2, 9), variable: pick(rng, VARIABLE_LETTERS) };
    var q4Entries = [
      { tex: q4.k + q4.variable, correct: true },
      { tex: q4.k + '+' + q4.variable, correct: false },
      { tex: q4.variable + '^{' + q4.k + '}', correct: false },
      { tex: q4.variable + '\\div' + q4.k, correct: false }
    ];
    var q4Text = '把「$' + q4.variable + '$ 的 ' + q4.k + ' 倍」寫成代數式。';

    var q5 = { p: between(rng, 2, 9), k: between(rng, 2, 9), variable: pick(rng, VARIABLE_LETTERS) };
    var q5Product = q5.p * q5.k;
    var q5Sum = q5.p + q5.k;
    var q5Entries = [
      { tex: q5Product + q5.variable, correct: true },
      { tex: q5Sum + q5.variable, correct: false },
      { tex: q5Product + q5.variable + '^{2}', correct: false },
      { tex: q5Sum + q5.variable + '^{2}', correct: false }
    ];
    var q5Text = '化簡 ' + tex(q5.p + q5.variable + '\\times' + q5.k) + '。';
    var q5Working = tex(q5.p + q5.variable + '\\times' + q5.k + '=' + q5Product + q5.variable);

    var mc = [
      choiceRow(q1Text, q1Entries, q1Working, rng),
      choiceRow(q2Text, q2Entries, q2Working, rng),
      choiceRow(q3Text, q3Entries, tex(q3Answer), rng),
      choiceRow(q4Text, q4Entries, tex(q4.k + q4.variable), rng),
      choiceRow(q5Text, q5Entries, q5Working, rng)
    ];

    var q6a = { p: between(rng, 2, 9), q: between(rng, 2, 9), variable: pick(rng, VARIABLE_LETTERS) };
    while (q6a.p - q6a.q < 2) {
      q6a.p = between(rng, 2, 9);
      q6a.q = between(rng, 2, 9);
    }
    var q6b = {
      a: between(rng, 2, 9), c: between(rng, 2, 9), b: between(rng, 1, 9), d: between(rng, 1, 9)
    };
    while (q6b.a - q6b.c < 2) {
      q6b.a = between(rng, 2, 9);
      q6b.c = between(rng, 2, 9);
    }
    var q6c = { p: between(rng, 2, 9), q: between(rng, 2, 9), r: between(rng, 2, 9), variable: pick(rng, VARIABLE_LETTERS) };
    while (q6c.p * q6c.q - q6c.r < 2) q6c.r = between(rng, 2, Math.min(9, q6c.p * q6c.q - 2));

    var q8 = { a: -between(rng, 2, 9), b: between(rng, 2, 9), p: between(rng, 2, 5), q: between(rng, 2, 5) };
    while (q8.p * q8.a + q8.q * q8.b >= 0) {
      q8.a = -between(rng, 2, 9);
      q8.b = between(rng, 2, 9);
      q8.p = between(rng, 2, 5);
      q8.q = between(rng, 2, 5);
    }

    var q9 = { c: -between(rng, 1, 3), d: between(rng, 3, 9) };
    while (q9.c + q9.d <= 0 || (q9.c === -1 && q9.d === 3)) {
      q9.c = -between(rng, 1, 3);
      q9.d = between(rng, 3, 9);
    }

    var q10Seed = STATIONERY[rng(STATIONERY.length)];
    var q10 = {
      item: q10Seed.item, unit: q10Seed.unit, who: q10Seed.who,
      price: between(rng, 3, 9), fee: between(rng, 5, 15),
      x: between(rng, 3, 9), paid: pick(rng, [50, 100])
    };
    while (q10.paid <= q10.price * q10.x + q10.fee) q10.paid = 100;

    return {
      params: {
        mc: mc,
        q6a: [q6a.p + q6a.variable + '-' + q6a.q + q6a.variable, (q6a.p - q6a.q) + q6a.variable],
        q6b: [q6b.a + 'x+' + q6b.b + '-' + q6b.c + 'x+' + q6b.d,
          (q6b.a - q6b.c) + 'x+' + (q6b.b + q6b.d)],
        q6c: [q6c.p + q6c.variable + '(' + q6c.q + q6c.variable + ')-' + q6c.r + q6c.variable + '^{2}',
          (q6c.p * q6c.q) + q6c.variable + '^{2}-' + q6c.r + q6c.variable + '^{2}',
          (q6c.p * q6c.q - q6c.r) + q6c.variable + '^{2}'],
        q8: q8,
        q9: q9,
        q10: q10,
        generator: {
          candidateOrder: candidateOrder,
          q1: q1, q2: q2, q3: q3, q4: q4, q5: q5,
          q6a: q6a, q6b: q6b, q6c: q6c,
          stationeryIndex: STATIONERY.indexOf(q10Seed)
        }
      }
    };
  }

  function answersFor(params) {
    var answers = {};
    params.mc.forEach(function (row, index) {
      var answerIndex = LETTERS.indexOf(row[2]);
      answers['q' + (index + 1)] = stripMath(row[1][answerIndex]);
    });
    answers.q6a = params.q6a[1];
    answers.q6b = params.q6b[1];
    answers.q6c = params.q6c[2];
    answers.q8 = params.q8.p * params.q8.a + params.q8.q * params.q8.b;
    answers.q9a = params.q9.c + params.q9.d;
    answers.q9b = params.q9.c + params.q9.d * 5;
    answers.q9c = params.q9.c + params.q9.d * 100;
    var q10 = params.q10;
    var cost = q10.price * q10.x + q10.fee;
    answers.q10a = q10.price + 'x+' + q10.fee;
    answers.q10b = cost;
    answers.q10cExpression = q10.paid + '-(' + q10.price + 'x+' + q10.fee + ')';
    answers.q10cValue = q10.paid - cost;
    return answers;
  }

  function generatedRangesValid(params) {
    var g = params.generator;
    if (!g) return false;
    var q1 = g.q1;
    if (!inRange(q1.p, 2, 9) || !inRange(q1.q, 2, 9) || q1.p === q1.q || q1.p * q1.q === q1.p + q1.q ||
      VARIABLE_LETTERS.indexOf(q1.variable) === -1) return false;
    var q2 = g.q2;
    if (!inRange(q2.k, 2, 6) || !inRange(q2.m, 2, 6) || !inRange(q2.c, 1, 9)) return false;
    var q3 = g.q3;
    if (q3.type !== 'sum' && q3.type !== 'product') return false;
    var q4 = g.q4;
    if (!inRange(q4.k, 2, 9) || VARIABLE_LETTERS.indexOf(q4.variable) === -1) return false;
    var q5 = g.q5;
    if (!inRange(q5.p, 2, 9) || !inRange(q5.k, 2, 9) || q5.p * q5.k === q5.p + q5.k ||
      VARIABLE_LETTERS.indexOf(q5.variable) === -1) return false;
    var q6a = g.q6a;
    if (!inRange(q6a.p, 2, 9) || !inRange(q6a.q, 2, 9) || q6a.p - q6a.q < 2 ||
      VARIABLE_LETTERS.indexOf(q6a.variable) === -1) return false;
    var q6b = g.q6b;
    if (!inRange(q6b.a, 2, 9) || !inRange(q6b.c, 2, 9) || q6b.a - q6b.c < 2 ||
      !inRange(q6b.b, 1, 9) || !inRange(q6b.d, 1, 9)) return false;
    var q6c = g.q6c;
    if (!inRange(q6c.p, 2, 9) || !inRange(q6c.q, 2, 9) || !inRange(q6c.r, 2, 9) ||
      q6c.p * q6c.q - q6c.r < 2 || VARIABLE_LETTERS.indexOf(q6c.variable) === -1) return false;
    var q8value = params.q8.p * params.q8.a + params.q8.q * params.q8.b;
    if (!inRange(params.q8.a, -9, -2) || !inRange(params.q8.b, 2, 9) ||
      !inRange(params.q8.p, 2, 5) || !inRange(params.q8.q, 2, 5) || q8value >= 0) return false;
    if (!inRange(params.q9.c, -3, -1) || !inRange(params.q9.d, 3, 9) || params.q9.c + params.q9.d <= 0 ||
      (params.q9.c === -1 && params.q9.d === 3)) return false;
    var q10 = params.q10;
    var priceTotal = q10.price * q10.x + q10.fee;
    if (!inRange(q10.price, 3, 9) || !inRange(q10.fee, 5, 15) || !inRange(q10.x, 3, 9) ||
      [50, 100].indexOf(q10.paid) === -1 || q10.paid <= priceTotal ||
      !STATIONERY.some(function (item) { return item.item === q10.item && item.unit === q10.unit && item.who === q10.who; })) return false;
    return true;
  }

  function generatedChoiceChecks(params) {
    var g = params.generator;
    var mc = params.mc;
    if (!Array.isArray(mc) || mc.length !== 5) return false;
    if (!mc.every(function (row) { return Array.isArray(row) && row.length === 4 && row[1].length === 4 && unique(row[1]); })) return false;
    if (new Set(mc.map(function (row) { return row[2]; })).size === 1) return false;
    var q1Expected = (g.q1.p + g.q1.q) + g.q1.variable;
    var q2Expected = String(g.q2.m * g.q2.k + g.q2.c);
    var q3Expected = g.q3.type === 'sum' ? 'u+v' : 'uv';
    var q4Expected = g.q4.k + g.q4.variable;
    var q5Expected = (g.q5.p * g.q5.k) + g.q5.variable;
    var expected = [q1Expected, q2Expected, q3Expected, q4Expected, q5Expected];
    return mc.every(function (row, index) {
      var answerIndex = LETTERS.indexOf(row[2]);
      return answerIndex >= 0 && stripMath(row[1][answerIndex]) === expected[index];
    });
  }

  function answerSteps(params, answers) {
    var steps = [];
    params.mc.forEach(function (row, index) {
      steps.push({ text: (index + 1) + '. ' + row[3] + '（' + row[2] + '）', mark: '(1A)' });
    });
    steps.push({ text: '6(a) ' + tex(params.q6a[0] + '=' + params.q6a[1]), mark: '(1A)' });
    steps.push({ text: '6(b) ' + tex(params.q6b[0] + '=' + params.q6b[1]), mark: '(1M)(1A)' });
    steps.push({ text: '6(c) ' + tex(params.q6c[0] + '=' + params.q6c[1] + '=' + params.q6c[2]), mark: '(1M)(1A)' });
    var q8 = params.q8;
    var firstQ8 = q8.p * q8.a;
    var secondQ8 = q8.q * q8.b;
    steps.push({ text: '8. ' + tex(q8.p + '(' + q8.a + ')+' + q8.q + '(' + q8.b + ')=' + firstQ8 + signed(secondQ8) + '=' + answers.q8), mark: '(1M)(1A)' });
    steps.push({ text: '9(a) 首項 ' + tex('=' + answers.q9a), mark: '(1A)' });
    steps.push({ text: '9(b) ' + tex('T_{5}=' + answers.q9b), mark: '(1A)' });
    steps.push({ text: '9(c) ' + tex('T_{100}=' + params.q9.c + '+' + params.q9.d + '(100)=' + answers.q9c), mark: '(1M)(1A)' });
    var q10 = params.q10;
    var total = q10.price * q10.x + q10.fee;
    steps.push({ text: '10(a) ' + tex('C=' + q10.price + 'x+' + q10.fee), mark: '(1M)(1A)' });
    steps.push({ text: '10(b) ' + tex('C=' + q10.price + '(' + q10.x + ')+' + q10.fee+'='+total) + ' 元', mark: '(1M)(1A)' });
    steps.push({ text: '10(c) 找回金額 ' + tex('=' + q10.paid + '-(' + q10.price + 'x+' + q10.fee + ')') +
      '（或 ' + tex('=' + (q10.paid - q10.fee) + '-' + q10.price + 'x') + '）', mark: '(1A)' });
    steps.push({ text: '　　 ' + tex('x=' + q10.x) + ' 時，' + tex(q10.paid + '-(' + q10.price + '(' + q10.x + ')+' + q10.fee + ')=' + answers.q10cValue) + ' 元', mark: '(1A)' });
    return steps;
  }

  function answerMarkTotals(steps) {
    return steps.reduce(function (totals, step) {
      var match;
      var pattern = /(\d+)([MA])/g;
      while ((match = pattern.exec(step.mark))) totals[match[2]] += Number(match[1]);
      return totals;
    }, { M: 0, A: 0 });
  }

  function paperPages(params) {
    var blocks = [];
    blocks.push({ kind: 'answerHeading', text: '甲部　選擇題（共5分）每題1分。請將選項字母填在答案空格。' });
    params.mc.forEach(function (row, index) {
      blocks.push({ kind: 'question', number: String(index + 1), text: row[0], marks: 1 });
      blocks.push({ kind: 'choices', options: row[1].map(stripMath), answerText: '答案：______' });
    });
    blocks.push({ kind: 'answerHeading', text: '乙部　解答題（共17分）。請列出計算步驟。' });
    blocks.push({ kind: 'question', number: '6', text: '化簡下列代數式。' });
    blocks.push({ kind: 'subquestion', label: 'a', text: tex(params.q6a[0]) + '。', marks: 1, blankCm: 2.0 });
    blocks.push({ kind: 'subquestion', label: 'b', text: tex(params.q6b[0]) + '。', marks: 2, blankCm: 2.8 });
    blocks.push({ kind: 'subquestion', label: 'c', text: tex(params.q6c[0]) + '。', marks: 2 });
    var q8 = params.q8;
    var q10 = params.q10;
    var terms = [];
    for (var n = 1; n <= 4; n += 1) terms.push(String(params.q9.c + params.q9.d * n));
    var page2 = [
      { kind: 'answerHeading', text: '乙部　解答題（續）' },
      { kind: 'question', number: '8', text: '若 $a=' + q8.a + '$、$b=' + q8.b + '$，求 $' + q8.p + 'a+' + q8.q + 'b$ 的值。', marks: 2 },
      { kind: 'spacer', cm: 3.0 },
      { kind: 'question', number: '9', text: '下表列出一個數列的項數 $n$ 及項值 $T_{n}$。' },
      {
        kind: 'table',
        rows: [
          [{ parts: [{ text: '項數 ' }, { math: 'n' }] },
            { text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }, { text: '5' }, { text: '……' }, { text: '100' }],
          [{ parts: [{ text: '項值 ' }, { math: 'T_{n}' }] },
            { text: terms[0] }, { text: terms[1] }, { text: terms[2] }, { text: terms[3] }, { text: '?' }, { text: '……' }, { text: '?' }]
        ]
      },
      { kind: 'subquestion', label: 'a', text: '求首項。', marks: 1, blankCm: 0.9 },
      { kind: 'subquestion', label: 'b', text: '求 $T_{5}$。', marks: 1, blankCm: 0.9 },
      { kind: 'subquestion', label: 'c', text: '已知 $T_{n}=' + params.q9.c + '+' + params.q9.d + 'n$，求第 100 項。', marks: 2, blankCm: 2.4 },
      { kind: 'question', number: '10', text: q10.item + '每' + q10.unit + ' ' + q10.price + ' 元，' + q10.who + '買了 $x$ ' + q10.unit + '，另付 ' + q10.fee + ' 元運費。' },
      { kind: 'subquestion', label: 'a', text: '寫出總費用 $C$ 的代數式。', marks: 2, blankCm: 1.7 },
      { kind: 'subquestion', label: 'b', text: '若 $x=' + q10.x + '$，求總費用 $C$。', marks: 2, blankCm: 2.0 },
      { kind: 'subquestion', label: 'c', text: '若' + q10.who + '付 ' + q10.paid + ' 元，寫出找回金額的代數式，並求 $x=' + q10.x + '$ 時找回多少元。', marks: 2 }
    ];
    return [
      { withStudentInfo: true, blocks: blocks },
      { withStudentInfo: false, blocks: page2 }
    ];
  }

  function answerPages(params, answers, steps) {
    var blocks = [
      { kind: 'answerHeading', text: 'M＝方法分；A＝答案分。其他等價正確答案可給相應分數。' },
      { kind: 'answerHeading', text: '甲部　選擇題（5 分）' }
    ];
    steps.forEach(function (step, index) {
      if (index === 5) blocks.push({ kind: 'answerHeading', text: '乙部　解答題（17 分）' });
      blocks.push({ kind: 'answerStep', text: step.text, mark: step.mark });
    });
    blocks.push({ kind: 'answerHeading', text: '總分核對：甲部 5 分；乙部 5＋2＋4＋6＝17 分；全卷 22 分。' });
    return [{ withStudentInfo: false, blocks: blocks }];
  }

  function buildResult(params, version) {
    var answers = answersFor(params);
    var steps = answerSteps(params, answers);
    return {
      id: ID,
      version: version,
      name: '班測2 重測',
      academicYear: '2026-27 第一學期',
      gradeLabel: '中一級',
      subject: '數學科',
      defaultClass: '1A',
      durationMinutes: 20,
      totalMarks: 22,
      marks: deepClone(MARKS),
      marking: deepClone(MARKING),
      params: deepClone(params),
      questions: {
        mc: deepClone(params.mc), q6a: deepClone(params.q6a), q6b: deepClone(params.q6b),
        q6c: deepClone(params.q6c), q8: deepClone(params.q8), q9: deepClone(params.q9), q10: deepClone(params.q10)
      },
      answers: answers,
      answerSteps: steps,
      paperPages: paperPages(params),
      answerPages: answerPages(params, answers, steps),
      pageCount: 2
    };
  }

  function hasRepeatedAnswer(current, previous) {
    var baselines = [ORIGINAL_ANSWERS, answersFor(FIXED.V1), answersFor(FIXED.V2)];
    return NON_REPEAT_KEYS.some(function (key) {
      if (baselines.some(function (baseline) { return current[key] === baseline[key]; })) return true;
      return !!previous && current[key] === previous[key];
    });
  }

  function selectGenerated(version, previousParams) {
    var previousAnswers = answersFor(previousParams);
    for (var candidateOrder = 0; candidateOrder < MAX_CANDIDATES; candidateOrder += 1) {
      var candidate = makeGeneratedCandidate(version, candidateOrder).params;
      if (!generatedRangesValid(candidate) || !generatedChoiceChecks(candidate)) continue;
      if (hasRepeatedAnswer(answersFor(candidate), previousAnswers)) continue;
      candidate.generator.version = version;
      return candidate;
    }
    throw new Error('在 20000 個確定性候選中未找到符合驗算及答案不重複條件的版本 V' + version + '。');
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

  function validateGeneratedCandidate(params) {
    var errors = [];
    if (!generatedRangesValid(params)) errors.push('生成參數超出指定範圍或違反條件。');
    if (!generatedChoiceChecks(params)) errors.push('選擇題選項或正確答案不符合題目。');
    var answers = answersFor(params);
    if (hasRepeatedAnswer(answers, null)) errors.push('答案與原卷、V1 或 V2 重複。');
    return errors;
  }

  function verify(version) {
    try {
      var number = parseVersion(version);
      var params = paramsForVersion(number);
      var errors = [];
      if (!Array.isArray(params.mc) || params.mc.length !== 5) errors.push('甲部須有五道選擇題。');
      if (params.mc.some(function (row) { return row[1].length !== 4 || !unique(row[1]); })) errors.push('甲部選項須為四個互不相同的答案。');
      if (number >= 3) {
        errors = errors.concat(validateGeneratedCandidate(params));
        var previousAnswers = answersFor(paramsForVersion(number - 1));
        if (NON_REPEAT_KEYS.some(function (key) { return answersFor(params)[key] === previousAnswers[key]; })) {
          errors.push('答案與緊接前一版本重複。');
        }
      }
      var result = buildResult(params, 'V' + number);
      if (result.paperPages.length !== 2 || result.answerPages.length !== 1 || result.pageCount !== 2) errors.push('試卷或答案頁數錯誤。');
      if (Object.keys(MARKS).reduce(function (total, key) { return total + MARKS[key]; }, 0) !== 22) errors.push('題目分數總和不是 22 分。');
      var markTotals = answerMarkTotals(result.answerSteps);
      if (markTotals.M !== 6 || markTotals.A !== 16) errors.push('答案步驟 M/A 分數總和錯誤。');
      if (Object.keys(MARKING).some(function (key) {
        return MARKING[key].M + MARKING[key].A !== MARKS[key];
      })) errors.push('M/A 分拆與各題分數不一致。');
      if (errors.length) return { valid: false, reasons: errors };
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

  var api = {
    ID: ID,
    FIXED: FIXED,
    fixedVersions: FIXED,
    ORIGINAL_ANSWERS: ORIGINAL_ANSWERS,
    MARKS: MARKS,
    MARKING: MARKING,
    marks: MARKS,
    marking: MARKING,
    paperPageCount: 2,
    answerPageCount: 1,
    generate: generate,
    verify: verify,
    parseVersion: parseVersion,
    getPaperPages: function (version) { return generate(version).paperPages; },
    getAnswerPages: function (version) { return generate(version).answerPages; },
    answerKeys: ANSWER_KEYS.slice(),
    nonRepeatKeys: NON_REPEAT_KEYS.slice(),
    variableLetters: VARIABLE_LETTERS.slice(),
    stationery: deepClone(STATIONERY)
  };
  return api;
});
