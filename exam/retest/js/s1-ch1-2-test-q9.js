(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetestS1Ch12Q9 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ID = 's1-ch1-2-test-q9';
  var ORIGINAL = Object.freeze({
    a: [-3, -4],
    b: [20, -5, -4],
    c: [-3, -9, 12],
    d: [10, 3, -15],
    e: [-28, 4, 11]
  });
  var FIXED = Object.freeze({
    V1: Object.freeze({
      a: [-5, -8], b: [18, -3, -2], c: [-8, -6, 10], d: [7, 4, -6], e: [-45, 3, 12]
    }),
    V2: Object.freeze({
      a: [-2, -7], b: [28, -7, -5], c: [-12, -10, 14], d: [9, 5, -8], e: [-42, 2, 8]
    }),
    V3: Object.freeze({
      a: [-9, -5], b: [30, -6, -2], c: [-20, -9, 14], d: [12, 2, -11], e: [-54, 3, 12]
    })
  });
  var MARKS = Object.freeze({ a: 2, b: 2, c: 3, d: 3, e: 3 });
  var MARKING = Object.freeze({
    a: Object.freeze({ M: 1, A: 1 }), b: Object.freeze({ M: 1, A: 1 }),
    c: Object.freeze({ M: 2, A: 1 }), d: Object.freeze({ M: 2, A: 1 }),
    e: Object.freeze({ M: 2, A: 1 })
  });
  var KEYS = ['a', 'b', 'c', 'd', 'e'];
  var GENERATED_CACHE = Object.create(null);
  var GENERATED_CACHE_ORDER = [];
  var GENERATED_FRONTIER_VERSION = 3;
  var GENERATED_FRONTIER_PARAMS = FIXED.V3;

  function parseVersion(value) {
    var match = String(value == null ? '' : value).trim().match(/^V?([1-9][0-9]*)$/i);
    if (!match) throw new Error('版本須為 V1、V2… 等正整數格式。');
    var n = Number(match[1]);
    if (!Number.isSafeInteger(n)) throw new Error('版本號超出可處理範圍。');
    return n;
  }

  function fmtSigned(n) {
    return n > 0 ? '(+' + n + ')' : '(' + n + ')';
  }

  function solve(params) {
    var a = params.a, b = params.b, c = params.c, d = params.d, e = params.e;
    if (!(a[0] < 0 && a[1] < 0)) throw new Error('Q9(a) 正負號條件不符。');
    if (!(b[0] > 0 && b[1] < 0 && b[2] < 0 && b[0] % b[1] === 0)) {
      throw new Error('Q9(b) 須為整數除法且保留正負號結構。');
    }
    if (!(c[0] < 0 && c[1] < 0 && c[2] > 0 && c[1] + c[2] !== 0 && c[0] % (c[1] + c[2]) === 0)) {
      throw new Error('Q9(c) 須為整數分數且保留正負號結構。');
    }
    if (!(d[0] > 0 && d[1] > 0 && d[2] < 0)) throw new Error('Q9(d) 正負號條件不符。');
    if (!(e[0] < 0 && 0 < e[1] && e[1] < e[2] && e[0] % (e[1] - e[2]) === 0)) {
      throw new Error('Q9(e) 須為整數除法且保留正負號結構。');
    }
    return {
      a: a[0] - a[1],
      b: (b[0] / b[1]) * b[2],
      c: c[0] / (c[1] + c[2]),
      d: d[0] + d[1] * d[2],
      e: e[0] / (e[1] - e[2])
    };
  }

  function questionText(params) {
    return {
      a: fmtSigned(params.a[0]) + '-' + fmtSigned(params.a[1]),
      b: fmtSigned(params.b[0]) + '\\div' + fmtSigned(params.b[1]) + '\\times' + fmtSigned(params.b[2]),
      c: '\\frac{' + fmtSigned(params.c[0]) + '}{' + fmtSigned(params.c[1]) + '+' + fmtSigned(params.c[2]) + '}',
      d: fmtSigned(params.d[0]) + '+' + fmtSigned(params.d[1]) + fmtSigned(params.d[2]),
      e: params.e[0] + '\\div[' + fmtSigned(params.e[1]) + '-' + fmtSigned(params.e[2]) + ']'
    };
  }

  function hash32(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rngFor(version, attempt) {
    var state = hash32(ID + '|V' + version + '|' + attempt) || 0x6d2b79f5;
    return function (minimum, maximum) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return minimum + (state % (maximum - minimum + 1));
    };
  }

  function candidate(version, attempt) {
    var rng = rngFor(version, attempt);
    var firstMagnitude = rng(2, 12), secondMagnitude = rng(2, 12);
    if (firstMagnitude === secondMagnitude) return null;
    var bDivisor = rng(2, 12), bQuotient = rng(1, 10), bMultiplier = rng(1, 10);
    var cDenominator = rng(2, 12), cFactor = rng(1, 12), cNegativePart = rng(1, 10);
    var dFirstFactor = rng(2, 8), dSecondMagnitude = rng(2, 10);
    var dFirstTerm = rng(1, dFirstFactor * dSecondMagnitude - 1);
    var eDifference = rng(1, 10), eQuotient = rng(1, 12), eFirstPart = rng(1, 10);
    return {
      a: [-firstMagnitude, -secondMagnitude],
      b: [bDivisor * bQuotient, -bDivisor, -bMultiplier],
      c: [-cDenominator * cFactor, -cNegativePart, cNegativePart + cDenominator],
      d: [dFirstTerm, dFirstFactor, -dSecondMagnitude],
      e: [-eDifference * eQuotient, eFirstPart, eFirstPart + eDifference]
    };
  }

  function signature(params) {
    return KEYS.map(function (key) { return params[key].join(','); }).join('|');
  }

  function cloneParams(params) {
    var copy = {};
    KEYS.forEach(function (key) { copy[key] = params[key].slice(); });
    return copy;
  }

  function generatedParamsFor(n, previous) {
    var baseline = [ORIGINAL, FIXED.V1, FIXED.V2, FIXED.V3];
    var usedAnswers = { a: new Set(), b: new Set(), c: new Set(), d: new Set(), e: new Set() };
    baseline.concat([previous]).forEach(function (params) {
      var answers = solve(params);
      KEYS.forEach(function (key) { usedAnswers[key].add(answers[key]); });
    });
    var baselineSignatures = new Set(baseline.map(signature));
    for (var attempt = 0; attempt < 100000; attempt += 1) {
      var params = candidate(n, attempt);
      if (!params || baselineSignatures.has(signature(params)) || !KEYS.every(function (key) {
        return params[key].every(Number.isSafeInteger);
      })) continue;
      var answers;
      try { answers = solve(params); } catch (e) { continue; }
      if (answers.d >= 0 || KEYS.some(function (key) { return usedAnswers[key].has(answers[key]); })) continue;
      return params;
    }
    throw new Error('無法為 V' + n + ' 找到符合條件的題目。');
  }

  function paramsFor(n) {
    if (n <= 3) return FIXED['V' + n];
    var version = 'V' + n;
    if (GENERATED_CACHE[version]) return cloneParams(GENERATED_CACHE[version]);
    var advancesFrontier = n > GENERATED_FRONTIER_VERSION;
    var current = advancesFrontier ? GENERATED_FRONTIER_VERSION + 1 : 4;
    var previous = advancesFrontier ? GENERATED_FRONTIER_PARAMS : FIXED.V3;
    var generated;
    for (; current <= n; current += 1) {
      generated = generatedParamsFor(current, previous);
      previous = generated;
      if (advancesFrontier) {
        GENERATED_FRONTIER_VERSION = current;
        GENERATED_FRONTIER_PARAMS = cloneParams(generated);
      }
      var currentVersion = 'V' + current;
      var oldIndex = GENERATED_CACHE_ORDER.indexOf(currentVersion);
      if (oldIndex !== -1) GENERATED_CACHE_ORDER.splice(oldIndex, 1);
      GENERATED_CACHE[currentVersion] = cloneParams(generated);
      GENERATED_CACHE_ORDER.push(currentVersion);
      while (GENERATED_CACHE_ORDER.length > 32) {
        delete GENERATED_CACHE[GENERATED_CACHE_ORDER.shift()];
      }
    }
    return cloneParams(generated);
  }

  function answerSteps(params, answers, questions) {
    var a = params.a, b = params.b, c = params.c, d = params.d, e = params.e;
    var signedA = fmtSigned(a[0]), signedB = fmtSigned(b[0] / b[1]), signedC = fmtSigned(b[2]);
    var denominatorSum = c[1] + c[2];
    var dProduct = d[1] * d[2];
    var eDifference = e[1] - e[2];
    return [
      { part: 'a', math: questions.a + '=' + a[0] + '+' + (-a[1]), mark: '(1M)' },
      { part: 'a', math: '=' + answers.a, mark: '(1A)' },
      { part: 'b', math: questions.b + '=' + signedB + '\\times' + signedC, mark: '(1M)' },
      { part: 'b', math: '=' + answers.b, mark: '(1A)' },
      { part: 'c', math: questions.c + '=\\frac{' + fmtSigned(c[0]) + '}{' + c[1] + '+' + c[2] + '}', mark: '(1M)' },
      { part: 'c', math: '=\\frac{' + fmtSigned(c[0]) + '}{' + fmtSigned(denominatorSum) + '}', mark: '(1M)' },
      { part: 'c', math: '=' + answers.c, mark: '(1A)' },
      { part: 'd', math: questions.d + '=' + fmtSigned(d[0]) + '+' + fmtSigned(dProduct), mark: '(1M)' },
      { part: 'd', math: '=' + d[0] + '-' + Math.abs(dProduct), mark: '(1M)' },
      { part: 'd', math: '=' + answers.d, mark: '(1A)' },
      { part: 'e', math: questions.e + '=' + e[0] + '\\div(' + e[1] + '-' + e[2] + ')', mark: '(1M)' },
      { part: 'e', math: '=' + e[0] + '\\div' + fmtSigned(eDifference), mark: '(1M)' },
      { part: 'e', math: '=' + answers.e, mark: '(1A)' }
    ];
  }

  function generate(versionInput) {
    var n = parseVersion(versionInput);
    var version = 'V' + n;
    var params = cloneParams(paramsFor(n));
    var answers = solve(params);
    var questions = questionText(params);
    var steps = answerSteps(params, answers, questions);
    return {
      id: ID,
      grade: 's1',
      gradeLabel: '中一級',
      subject: '數學科',
      name: '級測一 第 9 題重測',
      version: version,
      totalMarks: 13,
      questionNumber: 9,
      instruction: '計算以下各題。必須列出步驟。（重測須取得滿分）',
      params: params,
      answers: answers,
      questions: questions,
      marks: Object.assign({}, MARKS),
      marking: MARKING,
      answerSteps: steps,
      paperPages: [{
        withStudentInfo: true,
        blocks: [
          { kind: 'question', number: '9', text: '計算以下各題。必須列出步驟。（重測須取得滿分）' },
          { kind: 'subquestion', label: 'a', math: questions.a, marks: 2, blankCm: 3.0 },
          { kind: 'subquestion', label: 'b', math: questions.b, marks: 2, blankCm: 3.0 },
          { kind: 'subquestion', label: 'c', math: questions.c, marks: 3, blankCm: 3.6 },
          { kind: 'subquestion', label: 'd', math: questions.d, marks: 3, blankCm: 3.6 },
          { kind: 'subquestion', label: 'e', math: questions.e, marks: 3, blankCm: 3.6 }
        ]
      }],
      answerPages: [{ blocks: steps.map(function (step) {
        return { kind: 'answerStep', text: '(' + step.part + ')　$' + step.math + '$', mark: step.mark };
      }) }],
      pageCount: 1,
      academicYear: ''
    };
  }

  function verify(versionInput) {
    var result = generate(versionInput);
    var solved = solve(result.params);
    if (JSON.stringify(solved) !== JSON.stringify(result.answers)) throw new Error(result.version + ' 答案與驗算不一致。');
    if (Object.keys(result.marks).reduce(function (sum, key) { return sum + result.marks[key]; }, 0) !== 13) {
      throw new Error('評分細分總分不等於 13。');
    }
    return { valid: true, version: result.version, answers: solved };
  }

  return Object.freeze({
    ID: ID,
    ORIGINAL: ORIGINAL,
    FIXED: FIXED,
    MARKS: MARKS,
    MARKING: MARKING,
    parseVersion: parseVersion,
    solve: solve,
    questionText: questionText,
    generate: generate,
    verify: verify
  });
});
