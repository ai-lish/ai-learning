(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetestM2Test4 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ID = 'm2-test-4';
  var FIXED_VERSIONS = {
    V1: {
      q1: { lower: 4, upper: 6 },
      q2: { n: 5, c: 3, d: 4 },
      q3: { degrees: 60, radians: 0.8 },
      q4: { opposite: 5, adjacent: 12, hypotenuse: 13 },
      q5: { radius: 6, angle: 90 }
    },
    V2: {
      q1: { lower: 8, upper: 14 },
      q2: { n: 6, c: 2, d: 5 },
      q3: { degrees: 150, radians: 1.4 },
      q4: { opposite: 8, adjacent: 15, hypotenuse: 17 },
      q5: { radius: 10, angle: 60 }
    }
  };
  var FIXED = FIXED_VERSIONS;
  var MARKS = Object.freeze({
    '1a': 4, '1b': 2, '2a': 2, '2b': 2, '3a': 1, '3b': 1,
    '4': 2, '5a': 1, '5b': 3, '5c': 2
  });
  var MARKING = Object.freeze({
    '1a': Object.freeze({ M: 2, A: 2 }),
    '1b': Object.freeze({ M: 1, A: 1 }),
    '2a': Object.freeze({ M: 1, A: 1 }),
    '2b': Object.freeze({ M: 1, A: 1 }),
    '3a': Object.freeze({ M: 0, A: 1 }),
    '3b': Object.freeze({ M: 0, A: 1 }),
    '4': Object.freeze({ M: 1, A: 1 }),
    '5a': Object.freeze({ M: 0, A: 1 }),
    '5b': Object.freeze({ M: 1, A: 2 }),
    '5c': Object.freeze({ M: 1, A: 1 })
  });
  var ORIGINAL = {
    q1: { lower: 7, upper: 14 },
    q2: { n: 5, c: 2, d: 3 },
    q3: { degrees: 135, radians: 1.2 },
    q4: { opposite: 3, adjacent: 4, hypotenuse: 5 },
    q5: { radius: 8, angle: 120 }
  };
  var GENERATED_CACHE = Object.create(null);
  var GENERATED_FRONTIER = 2;
  var GENERATED_PREVIOUS = FIXED.V2;
  var MAX_CANDIDATES = 50000;
  var DEGREE_CHOICES = [30, 45, 60, 75, 90, 105, 120, 150];
  var TRIANGLE_ANGLES = [60, 90, 120, 150];
  var RADIAN_TENTHS = [];
  for (var radianTenth = 6; radianTenth <= 24; radianTenth += 1) {
    if (radianTenth !== 12) RADIAN_TENTHS.push(radianTenth);
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function parseVersion(value) {
    var match = String(value == null ? '' : value).trim().match(/^V?([1-9][0-9]*)$/i);
    if (!match) throw new Error('Version must be a positive integer such as V1.');
    var version = Number(match[1]);
    if (!Number.isSafeInteger(version)) throw new Error('Version exceeds the safe integer range.');
    return version;
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var remainder = a % b; a = b; b = remainder; }
    return a || 1;
  }

  function fraction(numerator, denominator) {
    if (!denominator) throw new Error('A denominator cannot be zero.');
    var sign = numerator * denominator < 0 ? '-' : '';
    var n = Math.abs(numerator), d = Math.abs(denominator);
    var divisor = gcd(n, d);
    n /= divisor; d /= divisor;
    if (d === 1) return sign + String(n);
    return sign + '\\frac{' + n + '}{' + d + '}';
  }

  function piMultiple(numerator, denominator) {
    var divisor = gcd(numerator, denominator);
    var n = numerator / divisor, d = denominator / divisor;
    if (d === 1) return (n === 1 ? '' : String(n)) + '\\pi';
    if (n === 1) return '\\frac{\\pi}{' + d + '}';
    return '\\frac{' + n + '\\pi}{' + d + '}';
  }

  function combination(n, r) {
    if (!Number.isInteger(n) || !Number.isInteger(r) || r < 0 || r > n) return 0;
    var k = Math.min(r, n - r);
    var result = 1;
    for (var i = 1; i <= k; i += 1) result = result * (n - k + i) / i;
    return Math.round(result);
  }

  function q1PartialSum(n) {
    return Math.pow(2, n + 1) / (n + 2) - 1;
  }

  function q1RangeValue(lower, upper) {
    var numerator = Math.pow(2, upper + 1) * (lower + 1) -
      Math.pow(2, lower) * (upper + 2);
    var denominator = (upper + 2) * (lower + 1);
    var divisor = gcd(numerator, denominator);
    return { numerator: numerator / divisor, denominator: denominator / divisor,
      text: fraction(numerator, denominator) };
  }

  function q2Coefficients(parameters) {
    return {
      x: parameters.n * parameters.c,
      x2: combination(parameters.n, 2) * Math.pow(parameters.c, 2)
    };
  }

  function q2Expansion(parameters) {
    var coefficients = q2Coefficients(parameters);
    return '1+' + coefficients.x + 'x+' + coefficients.x2 + 'x^{2}+\\cdots';
  }

  function q2Coefficient(parameters) {
    var coefficients = q2Coefficients(parameters);
    return parameters.d * coefficients.x2 - coefficients.x;
  }

  function q4Answer(parameters) {
    return fraction(parameters.opposite + parameters.adjacent, parameters.hypotenuse);
  }

  function q5BaseAngle(parameters) {
    return (180 - parameters.angle) / 2;
  }

  function scaledRadical(coefficient, denominator, radicalExpression) {
    var factor = fraction(coefficient, denominator);
    if (factor === '1') return radicalExpression;
    if (factor === '-1') return '-' + radicalExpression;
    var needsGrouping = radicalExpression.indexOf('+') !== -1 || radicalExpression.indexOf('-') !== -1;
    return factor + (needsGrouping ? '\\left(' + radicalExpression + '\\right)' : radicalExpression);
  }

  function q5Leg(parameters, sine) {
    var radius = parameters.radius;
    var angle = q5BaseAngle(parameters);
    if (angle === 60) return sine ?
      scaledRadical(radius, 2, '\\sqrt{3}') : fraction(radius, 2);
    if (angle === 45) return scaledRadical(radius, 2, '\\sqrt{2}');
    if (angle === 30) return sine ?
      fraction(radius, 2) : scaledRadical(radius, 2, '\\sqrt{3}');
    if (angle === 15) {
      return scaledRadical(radius, 4, sine ?
        '\\sqrt{6}-\\sqrt{2}' : '\\sqrt{6}+\\sqrt{2}');
    }
    throw new Error('Unsupported base angle.');
  }

  function q5Arc(parameters) {
    return piMultiple(parameters.radius * parameters.angle, 180);
  }

  function answersFor(parameters) {
    var q1 = q1RangeValue(parameters.q1.lower, parameters.q1.upper);
    var q2 = q2Coefficients(parameters.q2);
    var q3a = piMultiple(parameters.q3.degrees, 180);
    var q3b = (Math.round(parameters.q3.radians * 1800 / Math.PI) / 10).toFixed(1);
    return {
      q1a: 'P(n): \\sum_{r=1}^{n}\\frac{r2^{r}}{(r+1)(r+2)}=' +
        '\\frac{2^{n+1}}{n+2}-1',
      q1b: q1.text,
      q2a: q2Expansion(parameters.q2),
      q2b: String(q2Coefficient(parameters.q2)),
      q3a: q3a,
      q3b: q3b,
      q4: q4Answer(parameters.q4),
      q5a: String(q5BaseAngle(parameters.q5)) + '^\\circ',
      q5bAD: q5Leg(parameters.q5, true) + '\\,\\mathrm{cm}',
      q5bBD: q5Leg(parameters.q5, false) + '\\,\\mathrm{cm}',
      q5bBC: q5Leg({ radius: 2 * parameters.q5.radius, angle: parameters.q5.angle }, false) +
        '\\,\\mathrm{cm}',
      q5c: q5Arc(parameters.q5) + '\\,\\mathrm{cm}'
    };
  }

  function exactOriginal(parameters) {
    return parameters.q1.lower === ORIGINAL.q1.lower && parameters.q1.upper === ORIGINAL.q1.upper &&
      parameters.q2.n === ORIGINAL.q2.n && parameters.q2.c === ORIGINAL.q2.c && parameters.q2.d === ORIGINAL.q2.d &&
      parameters.q3.degrees === ORIGINAL.q3.degrees && parameters.q3.radians === ORIGINAL.q3.radians &&
      parameters.q4.opposite === ORIGINAL.q4.opposite && parameters.q4.adjacent === ORIGINAL.q4.adjacent &&
      parameters.q5.radius === ORIGINAL.q5.radius && parameters.q5.angle === ORIGINAL.q5.angle;
  }

  function makeRng(seed) {
    var state = 0;
    for (var i = 0; i < seed.length; i += 1) state = (state * 31 + seed.charCodeAt(i)) % 2147483647;
    if (state <= 0) state = 1;
    return function (max) {
      state = (state * 48271) % 2147483647;
      return state % max;
    };
  }

  function between(rng, min, max) { return min + rng(max - min + 1); }
  function pick(rng, values) { return values[rng(values.length)]; }

  function pythagoreanRatios() {
    var ratios = [];
    var seen = Object.create(null);
    for (var m = 2; m <= 8; m += 1) {
      for (var n = 1; n < m; n += 1) {
        if (gcd(m, n) !== 1 || (m - n) % 2 === 0) continue;
        var legs = [m * m - n * n, 2 * m * n].sort(function (a, b) { return a - b; });
        var hypotenuse = m * m + n * n;
        if (hypotenuse > 65) continue;
        [[legs[0], legs[1]], [legs[1], legs[0]]].forEach(function (pair) {
          var key = pair[0] + ':' + pair[1];
          if (seen[key] || (pair[0] === ORIGINAL.q4.opposite && pair[1] === ORIGINAL.q4.adjacent)) return;
          seen[key] = true;
          ratios.push({ opposite: pair[0], adjacent: pair[1], hypotenuse: hypotenuse });
        });
      }
    }
    return ratios;
  }

  var Q4_RATIOS = pythagoreanRatios();

  function generatedCandidate(version, candidateOrder) {
    var rng = makeRng(ID + '|V' + version + '|' + candidateOrder);
    var upper = between(rng, 5, 13);
    var lower = between(rng, 2, upper - 1);
    var q1 = { lower: lower, upper: upper };
    var q2 = { n: between(rng, 4, 7), c: between(rng, 1, 4), d: between(rng, 2, 6) };
    var q3 = { degrees: pick(rng, DEGREE_CHOICES),
      radians: pick(rng, RADIAN_TENTHS) / 10 };
    var q4 = clone(pick(rng, Q4_RATIOS));
    var q5 = { radius: pick(rng, [4, 6, 8, 10, 12]), angle: pick(rng, TRIANGLE_ANGLES) };
    return { q1: q1, q2: q2, q3: q3, q4: q4, q5: q5 };
  }

  function answerSignatures(parameters) {
    var answers = answersFor(parameters);
    return {
      q1b: answers.q1b, q2a: answers.q2a, q2b: answers.q2b,
      q3a: answers.q3a, q3b: answers.q3b, q4: answers.q4,
      q5a: answers.q5a, q5bAD: answers.q5bAD, q5bBD: answers.q5bBD,
      q5bBC: answers.q5bBC, q5c: answers.q5c
    };
  }

  function hasRepeatedAnswer(candidate, previous) {
    if (!previous) return false;
    var current = answerSignatures(candidate);
    var prior = answerSignatures(previous);
    return Object.keys(current).some(function (key) { return current[key] === prior[key]; });
  }

  function verifyParams(parameters) {
    if (!parameters || !parameters.q1 || !parameters.q2 || !parameters.q3 ||
        !parameters.q4 || !parameters.q5) return { valid: false, reason: 'shape' };
    var q1 = parameters.q1, q2 = parameters.q2, q3 = parameters.q3;
    var q4 = parameters.q4, q5 = parameters.q5;
    if (!(Number.isInteger(q1.lower) && Number.isInteger(q1.upper) &&
        q1.lower >= 2 && q1.lower < q1.upper && q1.upper <= 14 &&
        !(q1.lower === ORIGINAL.q1.lower && q1.upper === ORIGINAL.q1.upper))) {
      return { valid: false, reason: 'q1-range' };
    }
    if (!(Number.isInteger(q2.n) && q2.n >= 4 && q2.n <= 7 &&
        Number.isInteger(q2.c) && q2.c >= 1 && q2.c <= 4 &&
        Number.isInteger(q2.d) && q2.d >= 2 && q2.d <= 6 &&
        q2Coefficient(q2) > 0 &&
        !(q2.n === ORIGINAL.q2.n && q2.c === ORIGINAL.q2.c && q2.d === ORIGINAL.q2.d))) {
      return { valid: false, reason: 'q2-range' };
    }
    if (!(DEGREE_CHOICES.indexOf(q3.degrees) !== -1 &&
        Number.isInteger(q3.radians * 10) && q3.radians >= 0.6 && q3.radians <= 2.4 &&
        q3.radians !== ORIGINAL.q3.radians)) return { valid: false, reason: 'q3-range' };
    if (!(Number.isInteger(q4.opposite) && Number.isInteger(q4.adjacent) &&
        Number.isInteger(q4.hypotenuse) && q4.opposite > 0 && q4.adjacent > 0 &&
        q4.opposite <= 65 && q4.adjacent <= 65 && q4.hypotenuse <= 65 &&
        q4.opposite * q4.opposite + q4.adjacent * q4.adjacent === q4.hypotenuse * q4.hypotenuse &&
        gcd(q4.opposite, q4.adjacent) === 1 &&
        !(q4.opposite === ORIGINAL.q4.opposite && q4.adjacent === ORIGINAL.q4.adjacent))) {
      return { valid: false, reason: 'q4-ratio' };
    }
    if (!(Number.isInteger(q5.radius) && q5.radius >= 4 && q5.radius <= 12 &&
        q5.radius % 2 === 0 && TRIANGLE_ANGLES.indexOf(q5.angle) !== -1 &&
        !(q5.radius === ORIGINAL.q5.radius && q5.angle === ORIGINAL.q5.angle))) {
      return { valid: false, reason: 'q5-range' };
    }
    if (exactOriginal(parameters)) return { valid: false, reason: 'original-values' };

    var q1Checks = true;
    for (var n = 1; n <= 12; n += 1) {
      var direct = 0;
      for (var r = 1; r <= n; r += 1) direct += r * Math.pow(2, r) / ((r + 1) * (r + 2));
      if (Math.abs(direct - q1PartialSum(n)) > 1e-9) q1Checks = false;
    }
    var q2Values = q2Coefficients(q2);
    var q2Direct = q2.d * combination(q2.n, 2) * Math.pow(q2.c, 2) -
      q2.n * q2.c;
    var q3Degrees = Math.round(q3.radians * 1800 / Math.PI) / 10;
    var q4Sum = q4.opposite / q4.hypotenuse + q4.adjacent / q4.hypotenuse;
    var q4Expected = (q4.opposite + q4.adjacent) / q4.hypotenuse;
    var betaRadians = q5BaseAngle(q5) * Math.PI / 180;
    var q5AD = q5.radius * Math.sin(betaRadians);
    var q5BC = 2 * q5.radius * Math.cos(betaRadians);
    var q5ArcLength = q5.radius * q5.angle * Math.PI / 180;
    var algebra = {
      q1Formula: q1Checks,
      q1RangeAnswer: q1RangeValue(q1.lower, q1.upper).text,
      q2ExpansionCoefficients: q2Values,
      q2ProductCoefficient: q2Direct,
      q3bRoundedDegrees: q3Degrees,
      q4Pythagorean: q4.opposite * q4.opposite + q4.adjacent * q4.adjacent ===
        q4.hypotenuse * q4.hypotenuse,
      q4SinPlusCos: Math.abs(q4Sum - q4Expected) < 1e-12,
      q5BaseAngle: q5BaseAngle(q5),
      q5AD: q5AD,
      q5BC: q5BC,
      q5ArcLength: q5ArcLength
    };
    var validMath = q1Checks && q2Direct === q2Coefficient(q2) &&
      Number.isFinite(q2Values.x2) && Number.isFinite(q3Degrees) &&
      algebra.q4Pythagorean && algebra.q4SinPlusCos &&
      Math.abs(q5AD - q5.radius * Math.sin(betaRadians)) < 1e-12 &&
      Math.abs(q5BC - 2 * q5.radius * Math.cos(betaRadians)) < 1e-12 &&
      Number.isFinite(q5ArcLength);
    return { valid: validMath, reason: validMath ? '' : 'math-verification', algebra: algebra };
  }

  function nextGeneratedParams(version) {
    for (var order = 0; order < MAX_CANDIDATES; order += 1) {
      var candidate = generatedCandidate(version, order);
      if (!verifyParams(candidate).valid || hasRepeatedAnswer(candidate, GENERATED_PREVIOUS)) continue;
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

  function questionText(parameters) {
    var q1 = parameters.q1, q2 = parameters.q2, q3 = parameters.q3;
    var q4 = parameters.q4, q5 = parameters.q5;
    return {
      q1a: 'Prove, by mathematical induction, that $\\sum_{r=1}^{n}' +
        '\\frac{r\\cdot 2^{r}}{(r+1)(r+2)}=\\frac{2^{n+1}}{n+2}-1$ for all positive integers $n$.',
      q1b: 'Hence, evaluate $\\sum_{r=' + q1.lower + '}^{' + q1.upper + '}' +
        '\\frac{r\\cdot 2^{r}}{(r+1)(r+2)}$.',
      q2a: 'Expand $(1+' + q2.c + 'x)^{' + q2.n +
        '}$ in ascending powers of $x$ up to the term in $x^{2}$.',
      q2b: 'Hence, find the coefficient of $x^{2}$ in the expansion of $(' +
        q2.d + '-x)(1+' + q2.c + 'x)^{' + q2.n + '}$.',
      q3a: 'Express $' + q3.degrees + '^\\circ$ in radians, in terms of $\\pi$.',
      q3b: 'Express $' + q3.radians.toFixed(1) + '\\,\\mathrm{rad}$ in degrees, correct to 1 decimal place.',
      q4: 'Given that $\\tan\\theta=\\frac{' + q4.opposite + '}{' + q4.adjacent +
        '}$ and $0<\\theta<\\frac{\\pi}{2}$, find the exact value of $\\sin\\theta+\\cos\\theta$.',
      q5a: 'In the isosceles triangle $ABC$, $AB=AC=' + q5.radius +
        '\\,\\mathrm{cm}$ and $\\angle BAC=' + q5.angle +
        '^\\circ$. $D$ lies on $BC$ such that $AD\\perp BC$. The minor arc $BC$ has centre $A$. Find $\\angle ABC$.',
      q5b: 'Find the exact values of $AD$ and $BC$.',
      q5c: 'Find the length of the minor arc $BC$, in terms of $\\pi$.'
    };
  }

  function markingSteps(parameters) {
    var q1 = parameters.q1, q2 = parameters.q2, q3 = parameters.q3;
    var q4 = parameters.q4, q5 = parameters.q5;
    var answers = answersFor(parameters);
    var q2Values = q2Coefficients(q2);
    var beta = q5BaseAngle(q5);
    var steps = [
      { text: '1(a)　Let $P(n):\\;\\sum_{r=1}^{n}\\frac{r\\cdot 2^{r}}{(r+1)(r+2)}=\\frac{2^{n+1}}{n+2}-1$.', mark: '' },
      { text: '　　　Base case: $n=1$, LHS $=\\frac{1\\cdot2}{2\\cdot3}=\\frac{1}{3}$; RHS $=\\frac{2^{2}}{3}-1=\\frac{1}{3}$, so $P(1)$ is true.', mark: '(1A)' },
      { text: '　　　Assume $P(k)$ for $k\\in\\mathbb{Z}^{+}$. For $n=k+1$,', mark: '' },
      { text: '　　　$\\sum_{r=1}^{k+1}\\frac{r\\cdot2^{r}}{(r+1)(r+2)}=\\frac{2^{k+1}}{k+2}-1+\\frac{(k+1)2^{k+1}}{(k+2)(k+3)}$.', mark: '(1M)' },
      { text: '　　　$=\\frac{2^{k+1}[(k+3)+(k+1)]}{(k+2)(k+3)}-1=\\frac{2^{k+2}}{k+3}-1$.', mark: '(1M)' },
      { text: '　　　$=\\frac{2^{(k+1)+1}}{(k+1)+2}-1$; hence $P(k+1)$ is true.', mark: '(1A)' },
      { text: '　　　Therefore, $P(n)$ holds for all positive integers $n$ by mathematical induction.', mark: '' },
      { text: '1(b)　$\\sum_{r=' + q1.lower + '}^{' + q1.upper + '}\\frac{r\\cdot2^{r}}{(r+1)(r+2)}$', mark: '' },
      { text: '　　　$=\\left(\\frac{2^{' + (q1.upper + 1) + '}}{' + (q1.upper + 2) +
        '}-1\\right)-\\left(\\frac{2^{' + q1.lower + '}}{' + (q1.lower + 1) + '}-1\\right)$.', mark: '(1M)' },
      { text: '　　　$=' + answers.q1b + '$', mark: '(1A)' },
      { text: '2(a)　$(1+' + q2.c + 'x)^{' + q2.n + '}$', mark: '' },
      { text: '　　　$=1+C^{' + q2.n + '}_{1}(' + q2.c + 'x)+C^{' + q2.n +
        '}_{2}(' + q2.c + 'x)^2+\\cdots$', mark: '(1M)' },
      { text: '　　　$=1+' + q2Values.x + 'x+' + q2Values.x2 + 'x^{2}+\\cdots$', mark: '(1A)' },
      { text: '2(b)　Coefficient of $x^{2}=\\,' + q2.d + '(' + q2Values.x2 +
        ')+(-1)(' + q2Values.x + ')$', mark: '(1M)' },
      { text: '　　　$=' + answers.q2b + '$', mark: '(1A)' },
      { text: '3(a)　$' + q3.degrees + '^\\circ=' + answers.q3a + '\\,\\mathrm{rad}$', mark: '(1A)' },
      { text: '3(b)　$' + q3.radians.toFixed(1) +
        '\\times\\frac{180^\\circ}{\\pi}\\approx' + answers.q3b + '^\\circ$', mark: '(1A)' },
      { text: '4　$\\tan\\theta=\\frac{' + q4.opposite + '}{' + q4.adjacent +
        '}\\Rightarrow\\mathrm{opp.:adj.:hyp.}=' + q4.opposite + ':' + q4.adjacent + ':' + q4.hypotenuse + '$', mark: '' },
      { text: '　　　$\\sqrt{' + q4.opposite + '^2+' + q4.adjacent + '^2}=' + q4.hypotenuse + '$', mark: '(1M)' },
      { text: '　　　$\\sin\\theta+\\cos\\theta=\\frac{' + q4.opposite + '}{' + q4.hypotenuse +
        '}+\\frac{' + q4.adjacent + '}{' + q4.hypotenuse + '}=' + answers.q4 + '$', mark: '(1A)' },
      { text: '5(a)　$AB=AC\\Rightarrow\\angle ABC=\\angle ACB$.', mark: '' },
      { text: '　　　$\\angle ABC=\\frac{180^\\circ-' + q5.angle + '^\\circ}{2}=' + beta + '^\\circ$', mark: '(1A)' },
      { text: '5(b)　$AD=AB\\sin' + beta + '^\\circ=' + q5.radius + '\\sin' + beta +
        '^\\circ=' + answers.q5bAD + '$', mark: '(1A)' },
      { text: '　　　$BD=AB\\cos' + beta + '^\\circ=' + q5.radius + '\\cos' + beta +
        '^\\circ=' + answers.q5bBD + '$', mark: '(1M)' },
      { text: '　　　$AB=AC,\\;AD\\perp BC\\Rightarrow BD=DC$; $BC=2BD=' + answers.q5bBC + '$', mark: '(1A)' },
      { text: '5(c)　$\\theta=' + q5.angle + '^\\circ=' + piMultiple(q5.angle, 180) +
        '\\,\\mathrm{rad}$; $s=r\\theta=' + q5.radius + '\\times' + piMultiple(q5.angle, 180) + '$', mark: '(1M)' },
      { text: '　　　$=' + answers.q5c + '$', mark: '(1A)' }
    ];
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
    var page1 = [
      { kind: 'question', number: '1', subquestionLabel: 'a', text: questions.q1a,
        marks: MARKS['1a'], displayMarks: 6, examMarks: 6, answerLineCount: 4 },
      { kind: 'subquestion', label: 'b', alignWithQuestion: true, text: questions.q1b, marks: MARKS['1b'] },
      { kind: 'spacer', cm: 3.5 },
      { kind: 'question', number: '2', subquestionLabel: 'a', text: questions.q2a,
        marks: MARKS['2a'], displayMarks: 4, examMarks: 4, answerLineCount: 2 },
      { kind: 'subquestion', label: 'b', alignWithQuestion: true, text: questions.q2b, marks: MARKS['2b'] }
    ];
    var page2 = [
      { kind: 'question', number: '3', subquestionLabel: 'a', text: questions.q3a,
        marks: MARKS['3a'], displayMarks: 2, examMarks: 2, answerLineCount: 1 },
      { kind: 'subquestion', label: 'b', alignWithQuestion: true, text: questions.q3b, marks: MARKS['3b'] },
      { kind: 'spacer', cm: 1.2 },
      { kind: 'question', number: '4', text: questions.q4, marks: MARKS['4'], answerLineCount: 2 },
      { kind: 'spacer', cm: 1.2 },
      { kind: 'question', number: '5', subquestionLabel: 'a', text: questions.q5a,
        marks: MARKS['5a'], displayMarks: 6, examMarks: 6, answerLineCount: 1 },
      { kind: 'subquestion', label: 'b', alignWithQuestion: true, text: questions.q5b, marks: MARKS['5b'] },
      { kind: 'subquestion', label: 'c', alignWithQuestion: true, text: questions.q5c, marks: MARKS['5c'] }
    ];
    return {
      id: ID,
      grade: 'm2',
      gradeLabel: 'S4 M2',
      subject: 'Mathematics',
      name: 'Test 4 Retest',
      version: version,
      totalMarks: 20,
      timeAllowedMinutes: 25,
      params: parameters,
      questions: questions,
      answers: answers,
      answerSteps: steps,
      marks: Object.assign({}, MARKS),
      marking: MARKING,
      paperPages: [
        { withStudentInfo: true, blocks: page1 },
        { withStudentInfo: false, blocks: page2 }
      ],
      answerPages: [{ blocks: [
        { kind: 'answerHeading', text: 'M = method mark; A = accuracy mark.' }
      ].concat(steps.map(function (step) {
        return { kind: 'answerStep', text: step.text, mark: step.mark };
      })).concat([{ kind: 'answerHeading', text: 'Total: Q1 6 + Q2 4 + Q3 2 + Q4 2 + Q5 6 = 20 marks.' }]) }],
      pageCount: 2,
      academicYear: '2026-27 1st term'
    };
  }

  function verify(versionInput) {
    var result = generate(versionInput);
    var validation = verifyParams(result.params);
    return {
      valid: validation.valid,
      version: result.version,
      answers: result.answers,
      marks: result.marks,
      algebra: validation.algebra
    };
  }

  return Object.freeze({
    ID: ID,
    FIXED: FIXED,
    FIXED_VERSIONS: FIXED_VERSIONS,
    ORIGINAL: ORIGINAL,
    MARKS: MARKS,
    MARKING: MARKING,
    parseVersion: parseVersion,
    generate: generate,
    verify: verify,
    verifyParams: verifyParams,
    q1RangeValue: q1RangeValue,
    answersFor: answersFor
  });
});
