(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetestM2Test3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ID = 'm2-test-3';
  var FIXED_VERSIONS = {
    V1: {
      q1a: [5, 3],
      q1b: [8, 3],
      q1c: { cond: '1\\le r\\le n', lhs: 'C^{n}_{r-1}+C^{n}_{r}', rhs: 'C^{n+1}_{r}', form: 'A' },
      q2: [3, -2],
      q3a: { a: 3, n: 6, k: 3 },
      q3b: { p: 1, q: 2, c: 3, n: 6 },
      q4: [3, -1]
    },
    V2: {
      q1a: [5, 4],
      q1b: [10, 4],
      q1c: { cond: '1\\le r\\le n-1', lhs: 'C^{n-1}_{r-1}+C^{n-1}_{r}', rhs: 'C^{n}_{r}', form: 'B' },
      q2: [2, -5],
      q3a: { a: 2, n: 8, k: 5 },
      q3b: { p: 2, q: 1, c: 3, n: 6 },
      q4: [2, -3]
    }
  };
  var FIXED = FIXED_VERSIONS;
  var PROOF = {
    A: [
      'C^{n}_{r-1}+C^{n}_{r}=\\frac{n!}{(r-1)!(n-r+1)!}+\\frac{n!}{r!(n-r)!}',
      '=\\frac{r\\cdot n!+(n-r+1)\\cdot n!}{r!(n-r+1)!}',
      '=\\frac{(n+1)\\cdot n!}{r!(n-r+1)!}=\\frac{(n+1)!}{r!(n+1-r)!}',
      '=C^{n+1}_{r}'
    ],
    B: [
      'C^{n-1}_{r-1}+C^{n-1}_{r}=\\frac{(n-1)!}{(r-1)!(n-r)!}+\\frac{(n-1)!}{r!(n-r-1)!}',
      '=\\frac{r(n-1)!+(n-r)(n-1)!}{r!(n-r)!}',
      '=\\frac{n(n-1)!}{r!(n-r)!}=\\frac{n!}{r!(n-r)!}',
      '=C^{n}_{r}'
    ]
  };
  var MARKS = Object.freeze({ '1a': 1, '1b': 2, '1c': 3, '2': 3, '3a': 3, '3b': 3, '4a': 2, '4b': 3 });
  var MARKING = Object.freeze({
    '1a': Object.freeze({ M: 0, A: 1 }),
    '1b': Object.freeze({ M: 1, A: 1 }),
    '1c': Object.freeze({ M: 2, A: 1 }),
    '2': Object.freeze({ M: 1, A: 2 }),
    '3a': Object.freeze({ M: 2, A: 1 }),
    '3b': Object.freeze({ M: 2, A: 1 }),
    '4a': Object.freeze({ M: 1, A: 1 }),
    '4b': Object.freeze({ M: 2, A: 1 })
  });
  var ORIGINAL = {
    q1a: [4, 3], q1b: [9, 3], q2: [2, -3],
    q3a: { a: 2, n: 7, k: 4 }, q3b: { p: 2, q: 1, c: 2, n: 6 }, q4: [2, -1]
  };
  var GENERATED_CACHE = Object.create(null);
  var GENERATED_FRONTIER = 2;
  var GENERATED_PREVIOUS = FIXED.V2;
  var MAX_CANDIDATES = 50000;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function parseVersion(value) {
    var match = String(value == null ? '' : value).trim().match(/^V?([1-9][0-9]*)$/i);
    if (!match) throw new Error('Version must be a positive integer such as V1.');
    var version = Number(match[1]);
    if (!Number.isSafeInteger(version)) throw new Error('Version exceeds the safe integer range.');
    return version;
  }

  function factorial(value) {
    var result = 1;
    for (var n = 2; n <= value; n += 1) result *= n;
    return result;
  }

  function combination(n, r) {
    if (!Number.isInteger(n) || !Number.isInteger(r) || r < 0 || r > n) return 0;
    var k = Math.min(r, n - r);
    var result = 1;
    for (var i = 1; i <= k; i += 1) result = result * (n - k + i) / i;
    return Math.round(result);
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var remainder = a % b; a = b; b = remainder; }
    return a || 1;
  }

  function expandDescending(a, b, n) {
    var values = [];
    for (var i = 0; i <= n; i += 1) values.push(combination(n, i) * Math.pow(a, n - i) * Math.pow(b, i));
    return values;
  }

  function expandAscending(a, b, n) { return expandDescending(a, b, n).reverse(); }

  function polynomialText(coefficients) {
    var degree = coefficients.length - 1;
    var output = '';
    coefficients.forEach(function (coefficient, index) {
      if (coefficient === 0) return;
      var power = degree - index;
      var magnitude = Math.abs(coefficient);
      var term = (magnitude !== 1 || power === 0 ? String(magnitude) : '') +
        (power === 0 ? '' : power === 1 ? 'x' : 'x^{' + power + '}');
      output += coefficient < 0 ? '-' + term : output ? '+' + term : term;
    });
    return output || '0';
  }

  function multiplyAscending(left, right) {
    var product = new Array(left.length + right.length - 1).fill(0);
    left.forEach(function (a, i) {
      right.forEach(function (b, j) { product[i + j] += a * b; });
    });
    return product;
  }

  function multiplyRepeatedAscending(factor, count) {
    var product = [1];
    for (var index = 0; index < count; index += 1) product = multiplyAscending(product, factor);
    return product;
  }

  function linear(a, b) {
    return (a === 1 ? '' : String(a)) + 'x' + (b > 0 ? '+' + b : '-' + Math.abs(b));
  }

  function q3bSolution(parameters) {
    var p = parameters.p, q = parameters.q, c = parameters.c, n = parameters.n;
    var divisor = p + q;
    if ((p * n) % divisor !== 0) throw new Error('The constant-term exponent does not give an integer r.');
    var r = p * n / divisor;
    return { r: r, value: combination(n, r) * Math.pow(-c, r) };
  }

  function q4bCoefficient(parameters) {
    var cubic = expandDescending(parameters[0], parameters[1], 3);
    var terms = [cubic[0], 4 * cubic[1], 6 * cubic[2], 4 * cubic[3]];
    return { terms: terms, value: terms.reduce(function (sum, term) { return sum + term; }, 0) };
  }

  function q3bExpression(parameters) {
    var xP = parameters.p === 1 ? 'x' : 'x^{' + parameters.p + '}';
    var xQ = parameters.q === 1 ? 'x' : 'x^{' + parameters.q + '}';
    return '\\left(' + xP + '-\\frac{' + parameters.c + '}{' + xQ + '}\\right)^{' + parameters.n + '}';
  }

  function answersFor(parameters) {
    var q2 = expandDescending(parameters.q2[0], parameters.q2[1], 4);
    var q3b = q3bSolution(parameters.q3b);
    var q4a = expandDescending(parameters.q4[0], parameters.q4[1], 3);
    var q4b = q4bCoefficient(parameters.q4);
    return {
      q1a: factorial(parameters.q1a[0]) + factorial(parameters.q1a[1]),
      q1b: combination(parameters.q1b[0], parameters.q1b[1]),
      q1c: 'form ' + parameters.q1c.form,
      q2: polynomialText(q2),
      q3a: combination(parameters.q3a.n, parameters.q3a.k) * Math.pow(parameters.q3a.a, parameters.q3a.k),
      q3b: q3b.value,
      q3bR: q3b.r,
      q4a: polynomialText(q4a),
      q4b: q4b.value
    };
  }

  function allowedProof(value) {
    var expected = value && value.form === 'A' ? FIXED.V1.q1c : value && value.form === 'B' ? FIXED.V2.q1c : null;
    return !!expected && JSON.stringify(value) === JSON.stringify(expected);
  }

  function verifyAlgebra(parameters) {
    var q2 = parameters.q2;
    var q2Expansion = expandDescending(q2[0], q2[1], 4);
    var q2ByMultiplication = multiplyRepeatedAscending([q2[1], q2[0]], 4);
    var q2Check = [-2, 1, 3].every(function (x) {
      var evaluated = q2Expansion.reduce(function (sum, coefficient, index) {
        return sum + coefficient * Math.pow(x, 4 - index);
      }, 0);
      return evaluated === Math.pow(q2[0] * x + q2[1], 4);
    }) && JSON.stringify(q2ByMultiplication) === JSON.stringify(expandAscending(q2[0], q2[1], 4));

    var q3a = parameters.q3a;
    var q3aCoefficient = combination(q3a.n, q3a.k) * Math.pow(q3a.a, q3a.k);
    var q3b = parameters.q3b;
    var q3bSolutionValue = q3bSolution(q3b);
    var directConstant = 0;
    var constantTerms = 0;
    for (var r = 0; r <= q3b.n; r += 1) {
      if (q3b.p * (q3b.n - r) - q3b.q * r === 0) {
        directConstant += combination(q3b.n, r) * Math.pow(-q3b.c, r);
        constantTerms += 1;
      }
    }

    var q4 = parameters.q4;
    var cubic = expandDescending(q4[0], q4[1], 3);
    var q4ByMultiplication = multiplyRepeatedAscending([q4[1], q4[0]], 3);
    var fullProduct = multiplyAscending(expandAscending(1, 1, 4), expandAscending(q4[0], q4[1], 3));
    var q4b = q4bCoefficient(q4);
    return {
      valid: q2Check && q3aCoefficient <= 10000 && constantTerms === 1 &&
        directConstant === q3bSolutionValue.value && fullProduct[3] === q4b.value &&
        polynomialText(cubic) === answersFor(parameters).q4a &&
        JSON.stringify(q4ByMultiplication) === JSON.stringify(expandAscending(q4[0], q4[1], 3)),
      q2Coefficients: q2Expansion,
      q2Multiplication: q2ByMultiplication,
      q3aCoefficient: q3aCoefficient,
      q3bConstant: directConstant,
      q3bR: q3bSolutionValue.r,
      q4aCoefficients: cubic,
      q4aMultiplication: q4ByMultiplication,
      q4bCoefficients: fullProduct,
      q4bCoefficient: fullProduct[3]
    };
  }

  function verifyParams(parameters) {
    if (!parameters || !Array.isArray(parameters.q1a) || !Array.isArray(parameters.q1b) ||
        !Array.isArray(parameters.q2) || !Array.isArray(parameters.q4)) return { valid: false, reason: 'shape' };
    var q1a = parameters.q1a, q1b = parameters.q1b, q2 = parameters.q2;
    var q3a = parameters.q3a, q3b = parameters.q3b, q4 = parameters.q4;
    if (!(Number.isInteger(q1a[0]) && q1a[0] >= 4 && q1a[0] <= 6 &&
        Number.isInteger(q1a[1]) && q1a[1] >= 2 && q1a[1] <= 5 && q1a[0] > q1a[1])) return { valid: false, reason: 'q1a-range' };
    if (!(Number.isInteger(q1b[0]) && q1b[0] >= 7 && q1b[0] <= 12 &&
        Number.isInteger(q1b[1]) && q1b[1] >= 3 && q1b[1] <= 5 && q1b[1] <= q1b[0] / 2)) return { valid: false, reason: 'q1b-range' };
    if (!allowedProof(parameters.q1c)) return { valid: false, reason: 'q1c-proof-form' };
    if (!(Number.isInteger(q2[0]) && (q2[0] === 2 || q2[0] === 3) &&
        Number.isInteger(q2[1]) && q2[1] !== 0 && q2[1] >= -5 && q2[1] <= 5 && gcd(q2[0], q2[1]) === 1)) return { valid: false, reason: 'q2-range-or-gcd' };
    if (!(q3a && (q3a.a === 2 || q3a.a === 3) && Number.isInteger(q3a.n) && q3a.n >= 5 && q3a.n <= 9 &&
        Number.isInteger(q3a.k) && q3a.k >= 2 && q3a.k <= q3a.n - 2 &&
        combination(q3a.n, q3a.k) * Math.pow(q3a.a, q3a.k) <= 10000)) return { valid: false, reason: 'q3a-range' };
    var allowedPairs = [[2, 1], [1, 2], [1, 1]];
    var pairAllowed = q3b && allowedPairs.some(function (pair) { return pair[0] === q3b.p && pair[1] === q3b.q; });
    var allowedN = q3b && q3b.p === 1 && q3b.q === 1 ? [4, 6, 8] : [6, 9];
    if (!(pairAllowed && allowedN.indexOf(q3b.n) !== -1 && Number.isInteger(q3b.c) && q3b.c >= 2 && q3b.c <= 4)) {
      return { valid: false, reason: 'q3b-range' };
    }
    var q3bAnswer;
    try { q3bAnswer = q3bSolution(q3b).value; } catch (error) { return { valid: false, reason: 'q3b-no-constant-term' }; }
    if (Math.abs(q3bAnswer) > 10000) return { valid: false, reason: 'q3b-answer-range' };
    if (!(q4[0] === 2 || q4[0] === 3 || q4[0] === 4) || !Number.isInteger(q4[1]) ||
        q4[1] === 0 || q4[1] < -4 || q4[1] > 4 ||
        gcd(q4[0], q4[1]) !== 1) return { valid: false, reason: 'q4-range-or-gcd' };
    if (JSON.stringify(q1a) === JSON.stringify(ORIGINAL.q1a) || JSON.stringify(q1b) === JSON.stringify(ORIGINAL.q1b) ||
        JSON.stringify(q2) === JSON.stringify(ORIGINAL.q2) || JSON.stringify(q3a) === JSON.stringify(ORIGINAL.q3a) ||
        JSON.stringify(q3b) === JSON.stringify(ORIGINAL.q3b) || JSON.stringify(q4) === JSON.stringify(ORIGINAL.q4)) {
      return { valid: false, reason: 'original-numbers' };
    }
    var algebra = verifyAlgebra(parameters);
    if (!algebra.valid) return { valid: false, reason: 'algebra-verification', algebra: algebra };
    return { valid: true, algebra: algebra };
  }

  function hash32(text) {
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 0x9e3779b9;
  }

  function makeRng(text) {
    var state = hash32(text);
    return function (limit) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return state % limit;
    };
  }

  function between(rng, min, max) { return min + rng(max - min + 1); }
  function pick(rng, values) { return values[rng(values.length)]; }
  function nonZeroInteger(rng, maxMagnitude) {
    return pick(rng, [-1, 1]) * between(rng, 1, maxMagnitude);
  }

  function generatedCandidate(version, candidateOrder) {
    var rng = makeRng(ID + '|V' + version + '|' + candidateOrder);
    var q1a = [between(rng, 4, 6), between(rng, 2, 5)];
    var q1b = [between(rng, 7, 12), between(rng, 3, 5)];
    var q2a = pick(rng, [2, 3]);
    var q2b = nonZeroInteger(rng, 5);
    var q3a = { a: pick(rng, [2, 3]), n: between(rng, 5, 9), k: 0 };
    q3a.k = between(rng, 2, q3a.n - 2);
    var q3bPair = pick(rng, [[2, 1], [1, 2], [1, 1]]);
    var q3bN = q3bPair[0] === 1 && q3bPair[1] === 1 ? pick(rng, [4, 6, 8]) : pick(rng, [6, 9]);
    var q3b = { p: q3bPair[0], q: q3bPair[1], c: between(rng, 2, 4), n: q3bN };
    var q4 = [pick(rng, [2, 3, 4]), nonZeroInteger(rng, 4)];
    return {
      q1a: q1a,
      q1b: q1b,
      q1c: clone(version % 2 === 1 ? FIXED.V1.q1c : FIXED.V2.q1c),
      q2: [q2a, q2b],
      q3a: q3a,
      q3b: q3b,
      q4: q4
    };
  }

  function answerSignatures(parameters) {
    var answers = answersFor(parameters);
    return {
      q1a: String(answers.q1a), q1b: String(answers.q1b), q2: answers.q2,
      q3a: String(answers.q3a), q3b: String(answers.q3b),
      q4a: answers.q4a, q4b: String(answers.q4b)
    };
  }

  function hasRepeatedAnswer(candidate, previous) {
    var candidateAnswers = answerSignatures(candidate);
    var fixedAnswers = [FIXED.V1, FIXED.V2];
    for (var i = 0; i < fixedAnswers.length; i += 1) {
      var fixed = answerSignatures(fixedAnswers[i]);
      if (Object.keys(candidateAnswers).some(function (key) { return candidateAnswers[key] === fixed[key]; })) return true;
    }
    if (!previous) return false;
    var previousAnswers = answerSignatures(previous);
    return Object.keys(candidateAnswers).some(function (key) { return candidateAnswers[key] === previousAnswers[key]; });
  }

  function nextGeneratedParams(version) {
    for (var order = 0; order < MAX_CANDIDATES; order += 1) {
      var candidate = generatedCandidate(version, order);
      var validation = verifyParams(candidate);
      if (!validation.valid || hasRepeatedAnswer(candidate, GENERATED_PREVIOUS)) continue;
      GENERATED_PREVIOUS = clone(candidate);
      GENERATED_FRONTIER = version;
      GENERATED_CACHE['V' + version] = clone(candidate);
      return candidate;
    }
    throw new Error('Could not find a valid candidate for V' + version + '.');
  }

  function parametersFor(version) {
    if (version === 1 || version === 2) return clone(FIXED['V' + version]);
    while (GENERATED_FRONTIER < version) nextGeneratedParams(GENERATED_FRONTIER + 1);
    return clone(GENERATED_CACHE['V' + version]);
  }

  function q3bQuestion(parameters) {
    return 'Find the constant term in $' + q3bExpression(parameters) + '$.';
  }

  function questionText(parameters) {
    var q1c = parameters.q1c;
    return {
      q1a: 'Calculate $' + parameters.q1a[0] + '!+' + parameters.q1a[1] + '!$.',
      q1b: 'Evaluate $C^{' + parameters.q1b[0] + '}_{' + parameters.q1b[1] + '}$ using the factorial formula.',
      q1c: 'For integer $r$ and $n$ satisfying $' + q1c.cond + '$, prove that $' + q1c.lhs + '=' + q1c.rhs + '$.',
      q2: 'Expand and simplify $(' + linear(parameters.q2[0], parameters.q2[1]) + ')^{4}$ in descending powers of $x$.',
      q3a: 'Find the coefficient of $x^{' + parameters.q3a.k + '}$ in $(1+' + parameters.q3a.a + 'x)^{' + parameters.q3a.n + '}$.',
      q3b: q3bQuestion(parameters.q3b),
      q4a: 'Expand $(' + linear(parameters.q4[0], parameters.q4[1]) + ')^{3}$.',
      q4b: 'Hence, find the coefficient of $x^{3}$ in $(x+1)^{4}(' + linear(parameters.q4[0], parameters.q4[1]) + ')^{3}$.'
    };
  }

  function binomialTerm(a, b, n, index) {
    var xFactor = '(' + a + 'x)';
    var bFactor = '(' + b + ')';
    var coefficient = combination(n, index) === 1 ? '' : String(combination(n, index));
    var left = n - index === 0 ? '' : n - index === 1 ? xFactor : xFactor + '^{' + (n - index) + '}';
    var right = index === 0 ? '' : index === 1 ? bFactor : bFactor + '^{' + index + '}';
    return coefficient + left + right;
  }

  function formatProofStep(value) {
    return PROOF[value.form];
  }

  function markingSteps(parameters) {
    var answers = answersFor(parameters);
    var steps = [];
    var a = parameters.q1a[0], b = parameters.q1a[1];
    steps.push({ text: '1(a)　$' + a + '!+' + b + '!=' + factorial(a) + '+' + factorial(b) + '=' + answers.q1a + '$', mark: '(1A)' });

    var n1 = parameters.q1b[0], r1 = parameters.q1b[1];
    steps.push({ text: '1(b)　$C^{' + n1 + '}_{' + r1 + '}=\\frac{' + n1 + '!}{' + r1 + '!(' + n1 + '-' + r1 + ')!}=\\frac{' + n1 + '!}{' + r1 + '!\\,' + (n1 - r1) + '!}$', mark: '(1M)' });
    var numerator = [];
    var denominator = [];
    for (var factor = 0; factor < r1; factor += 1) {
      numerator.push(String(n1 - factor));
      denominator.push(String(r1 - factor));
    }
    steps.push({ text: '　　　$=\\frac{' + numerator.join('\\times') + '}{' + denominator.join('\\times') + '}=' + answers.q1b + '$', mark: '(1A)' });

    var proof = formatProofStep(parameters.q1c);
    steps.push({ text: '1(c)　$' + proof[0] + '$', mark: '' });
    steps.push({ text: '　　　$' + proof[1] + '$', mark: '(1M)' });
    steps.push({ text: '　　　$' + proof[2] + '$', mark: '(1M)' });
    steps.push({ text: '　　　$' + proof[3] + '$', mark: '(1A)' });

    var q2 = parameters.q2;
    steps.push({ text: '2　$(' + linear(q2[0], q2[1]) + ')^{4}$', mark: '' });
    var q2Terms = [];
    for (var q2Index = 0; q2Index <= 4; q2Index += 1) q2Terms.push(binomialTerm(q2[0], q2[1], 4, q2Index));
    steps.push({ text: '　　$=' + q2Terms.join('+') + '$', mark: '(1M)' });
    steps.push({ text: '　　$=' + answers.q2 + '$', mark: '(1A + 1A)' });

    var q3a = parameters.q3a;
    steps.push({ text: '3(a)　General term: $T_{r+1}=C^{' + q3a.n + '}_{r}(' + q3a.a + 'x)^{r}$', mark: '(1M)' });
    steps.push({ text: '　　　For $x^{' + q3a.k + '}$, $r=' + q3a.k + '$.', mark: '(1M)' });
    steps.push({ text: '　　　Coefficient $=C^{' + q3a.n + '}_{' + q3a.k + '}\\cdot' + q3a.a + '^{' + q3a.k + '}=' + combination(q3a.n, q3a.k) + '\\cdot' + Math.pow(q3a.a, q3a.k) + '=' + answers.q3a + '$', mark: '(1A)' });

    var q3b = parameters.q3b;
    var r3b = answers.q3bR;
    var pExponent = q3b.p * q3b.n;
    var decrement = q3b.p + q3b.q;
    var firstPower = q3b.p === 1 ? 'x' : '(x^{' + q3b.p + '})';
    var denominatorPower = q3b.q === 1 ? 'x' : 'x^{' + q3b.q + '}';
    steps.push({ text: '3(b)　General term: $C^{' + q3b.n + '}_{r}' + firstPower + '^{' + q3b.n + '-r}\\left(-\\frac{' + q3b.c + '}{' + denominatorPower + '}\\right)^{r}' +
      '=C^{' + q3b.n + '}_{r}(-' + q3b.c + ')^{r}x^{' + pExponent + '-' + decrement + 'r}$', mark: '(1M)' });
    steps.push({ text: '　　　For a constant term, $' + pExponent + '-' + decrement + 'r=0$, so $r=' + r3b + '$.', mark: '(1M)' });
    var negativePower = Math.pow(-q3b.c, r3b);
    steps.push({ text: '　　　Constant term $=C^{' + q3b.n + '}_{' + r3b + '}(-' + q3b.c + ')^{' + r3b + '}=' +
      combination(q3b.n, r3b) + '\\cdot' + (negativePower < 0 ? '(' + negativePower + ')' : negativePower) + '=' + answers.q3b + '$', mark: '(1A)' });

    var q4 = parameters.q4;
    var q4Cubic = expandDescending(q4[0], q4[1], 3);
    steps.push({ text: '4(a)　$(' + linear(q4[0], q4[1]) + ')^{3}=' +
      [0, 1, 2, 3].map(function (index) { return binomialTerm(q4[0], q4[1], 3, index); }).join('+') + '$', mark: '(1M)' });
    steps.push({ text: '　　　$=' + polynomialText(q4Cubic) + '$', mark: '(1A)' });
    steps.push({ text: '4(b)　$(x+1)^{4}=x^{4}+4x^{3}+6x^{2}+4x+1$', mark: '' });
    var coefficientTerms = q4bCoefficient(q4).terms;
    var signedTerms = coefficientTerms.map(function (value, index) {
      if (!index) return value < 0 ? '-' + Math.abs(value) : String(value);
      return value < 0 ? '-' + Math.abs(value) : '+' + value;
    }).join('');
    steps.push({ text: '　　　Coefficient of $x^{3}=1\\cdot' + (q4Cubic[0] < 0 ? '(' + q4Cubic[0] + ')' : q4Cubic[0]) +
      '+4\\cdot' + (q4Cubic[1] < 0 ? '(' + q4Cubic[1] + ')' : q4Cubic[1]) +
      '+6\\cdot' + (q4Cubic[2] < 0 ? '(' + q4Cubic[2] + ')' : q4Cubic[2]) +
      '+4\\cdot' + (q4Cubic[3] < 0 ? '(' + q4Cubic[3] + ')' : q4Cubic[3]) + '$', mark: '(1M)' });
    steps.push({ text: '　　　$=' + signedTerms + '$', mark: '(1M)' });
    steps.push({ text: '　　　$=' + answers.q4b + '$', mark: '(1A)' });
    return steps;
  }

  function generate(versionInput) {
    var versionNumber = parseVersion(versionInput);
    var version = 'V' + versionNumber;
    var parameters = parametersFor(versionNumber);
    var validation = verifyParams(parameters);
    if (!validation.valid) throw new Error(version + ' failed verification: ' + validation.reason);
    var questions = questionText(parameters);
    var answers = answersFor(parameters);
    var steps = markingSteps(parameters);
    var q1Blocks = [
      { kind: 'question', number: '1', subquestionLabel: 'a', text: questions.q1a, marks: 1, displayMarks: 6, examMarks: 6, answerLineCount: 1 },
      { kind: 'subquestion', label: 'b', alignWithQuestion: true, text: questions.q1b },
      { kind: 'subquestion', label: 'c', alignWithQuestion: true, text: questions.q1c },
      { kind: 'spacer', cm: 13.5 },
      { kind: 'question', number: '2', text: questions.q2, marks: 3 }
    ];
    var q3Blocks = [
      { kind: 'question', number: '3', subquestionLabel: 'a', text: questions.q3a, marks: 3, displayMarks: 6, examMarks: 6, answerLineCount: 3 },
      { kind: 'subquestion', label: 'b', alignWithQuestion: true, text: questions.q3b },
      { kind: 'spacer', cm: 10.5 },
      { kind: 'question', number: '4', subquestionLabel: 'a', text: questions.q4a, marks: 2, displayMarks: 5, examMarks: 5, answerLineCount: 2 },
      { kind: 'subquestion', label: 'b', alignWithQuestion: true, text: questions.q4b }
    ];
    return {
      id: ID,
      grade: 'm2',
      gradeLabel: 'S4 M2',
      subject: 'Mathematics',
      name: 'Test 3 Retest',
      version: version,
      totalMarks: 20,
      params: parameters,
      questions: questions,
      answers: answers,
      answerSteps: steps,
      marks: Object.assign({}, MARKS),
      marking: MARKING,
      paperPages: [
        { withStudentInfo: true, blocks: q1Blocks },
        { withStudentInfo: false, blocks: q3Blocks }
      ],
      answerPages: [{ blocks: [
        { kind: 'answerHeading', text: 'M = method mark; A = accuracy mark. Accept equivalent correct working.' }
      ].concat(steps.map(function (step) {
        return { kind: 'answerStep', text: step.text, mark: step.mark };
      })).concat([{ kind: 'answerHeading', text: 'Total: Q1 6 + Q2 3 + Q3 6 + Q4 5 = 20 marks.' }]) }],
      pageCount: 2,
      academicYear: '2026-27 1st term'
    };
  }

  function verify(versionInput) {
    var result = generate(versionInput);
    var algebra = verifyAlgebra(result.params);
    return {
      valid: algebra.valid,
      version: result.version,
      answers: result.answers,
      marks: result.marks,
      algebra: algebra
    };
  }

  return Object.freeze({
    ID: ID,
    FIXED: FIXED,
    FIXED_VERSIONS: FIXED_VERSIONS,
    PROOF: PROOF,
    MARKS: MARKS,
    MARKING: MARKING,
    parseVersion: parseVersion,
    generate: generate,
    verify: verify,
    verifyParams: verifyParams
  });
});
