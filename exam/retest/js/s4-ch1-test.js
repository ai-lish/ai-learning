(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetestS4Ch1 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ID = 's4-ch1-test';
  var MARKS = Object.freeze({ q7: 3, q8: 4, q9: 3, q10: 6, q12: 5 });
  var MARKING = Object.freeze({
    q7: Object.freeze({ M: 1, A: 2 }), q8: Object.freeze({ M: 1, A: 3 }),
    q9: Object.freeze({ M: 2, A: 1 }), q10: Object.freeze({ M: 3, A: 3 }),
    q12: Object.freeze({ M: 2, A: 3 })
  });

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a || 1;
  }

  function rat(n, d) {
    d = d == null ? 1 : d;
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error('無效分數。');
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return Object.freeze({ n: n / g, d: d / g });
  }

  function add(a, b) { return rat(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return rat(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return rat(a.n * b.n, a.d * b.d); }
  function div(a, b) { return rat(a.n * b.d, a.d * b.n); }
  function compare(a, b) { var d = a.n * b.d - b.n * a.d; return d < 0 ? -1 : d > 0 ? 1 : 0; }
  function equal(a, b) { return compare(a, b) === 0; }
  function isInteger(a) { return a.d === 1; }
  function absInt(n) { return Math.abs(n); }

  function parseVersion(value) {
    var match = String(value == null ? '' : value).trim().match(/^V?([1-9][0-9]*)$/i);
    if (!match) throw new Error('版本須為 V1、V2… 等正整數格式。');
    var n = Number(match[1]);
    if (!Number.isSafeInteger(n)) throw new Error('版本號超出可處理範圍。');
    return n;
  }

  var FIXED = Object.freeze({
    V1: Object.freeze({
      q7: [2, 5, 3], q8: [5, 2, 2],
      q10a: { lhs: '6x^{2}+5x', rhs: '3-2x', std: [6, 7, -3], fac: '(2x+3)(3x-1)', roots: [rat(-3, 2), rat(1, 3)] },
      q10b: { text: 'x^{2}+2-8x=0', std: [1, -8, 2], simp: '4\\pm\\sqrt{14}', raw: '\\frac{8\\pm\\sqrt{56}}{2}' },
      q10c: { lhs: '3x-2x^{2}', rhs: '4', std: [2, -3, 4] },
      q9: { L: 27, W: 18, D: 18, k: 4, x0: -3, x1: rat(81, 5), red: [5, -66, -243], fac: '(5x-81)(x+3)' },
      q12: { eq: [6, 1, -2], fac: '(3x+2)(2x-1)', al: rat(-2, 3), be: rat(1, 2), t: 3, new: [2, 1, -6], newfac: '(x+2)(2x-3)' }
    }),
    V2: Object.freeze({
      q7: [4, 3, 2], q8: [3, 5, 4],
      q10a: { lhs: '4x^{2}-3x', rhs: '6+2x', std: [4, -5, -6], fac: '(4x+3)(x-2)', roots: [rat(-3, 4), rat(2)] },
      q10b: { text: 'x^{2}+1-4x=0', std: [1, -4, 1], simp: '2\\pm\\sqrt{3}', raw: '\\frac{4\\pm\\sqrt{12}}{2}' },
      q10c: { lhs: 'x-3x^{2}', rhs: '2', std: [3, -1, 2] },
      q9: { L: 34, W: 24, D: 32, k: 4, x0: -2, x1: rat(118, 5), red: [5, -108, -236], fac: '(5x-118)(x+2)' },
      q12: { eq: [10, -1, -3], fac: '(2x+1)(5x-3)', al: rat(-1, 2), be: rat(3, 5), t: 5, new: [2, -1, -15], newfac: '(2x+5)(x-3)' }
    }),
    V3: Object.freeze({
      q7: [5, 2, 3], q8: [2, 7, 3],
      q10a: { lhs: '10x^{2}-2x', rhs: '2-3x', std: [10, 1, -2], fac: '(5x-2)(2x+1)', roots: [rat(-1, 2), rat(2, 5)] },
      q10b: { text: 'x^{2}+7-10x=0', std: [1, -10, 7], simp: '5\\pm3\\sqrt{2}', raw: '\\frac{10\\pm\\sqrt{72}}{2}' },
      q10c: { lhs: '4x-5x^{2}', rhs: '2', std: [5, -4, 2] },
      q9: { L: 39, W: 15, D: 27, k: 4, x0: -3, x1: rat(113, 5), red: [5, -98, -339], fac: '(5x-113)(x+3)' },
      q12: { eq: [4, -4, -3], fac: '(2x+1)(2x-3)', al: rat(-1, 2), be: rat(3, 2), t: 4, new: [1, -4, -12], newfac: '(x+2)(x-6)' }
    })
  });
  var GENERATED_CACHE = Object.create(null);
  var GENERATED_CACHE_ORDER = [];
  var GENERATED_FRONTIER_VERSION = 3;
  var GENERATED_FRONTIER_PARAMS = FIXED.V3;

  function term(n, variable) {
    return (n === 1 ? '' : String(n)) + variable;
  }

  function poly2(a, b, c, u, w) {
    u = u || 'x'; w = w || 'y';
    return term(a, u + '^{2}') + '+' + term(b, u + w) + '+' + term(c, w + '^{2}');
  }

  function linear(a, b, u, w, sign) {
    u = u || 'x'; w = w || 'y'; sign = sign || '+';
    return term(a, u) + sign + term(b, w);
  }

  function q7Text(params) {
    var a = params.q7[0], b = params.q7[1], k = params.q7[2];
    var square = poly2(a * a, 2 * a * b, b * b);
    var base = linear(a, b);
    return { square: square, second: square + '-' + k * a + 'x-' + k * b + 'y', base: base, k: k };
  }

  function q8Text(params) {
    var alpha = params.q8[0], beta = params.q8[1], gamma = params.q8[2];
    var alphaP = term(alpha, 'p'), betaQ = term(beta, 'q');
    var qa = (gamma * alpha) + 'pr-' + (gamma * beta) + 'qr';
    var qb = term(alpha * alpha, 'p^{2}') + '-' + term(beta * beta, 'q^{2}');
    var qc = qb + '-' + qa.replace(/-/g, '+');
    return { a: qa, b: qb, c: qc, alphaP: alphaP, betaQ: betaQ, gamma: gamma };
  }

  function stdEq(a, b, c) {
    var result = '';
    [[a, 'x^{2}'], [b, 'x'], [c, '']].forEach(function (pair) {
      var value = pair[0], variable = pair[1];
      if (!value) return;
      var magnitude = Math.abs(value);
      var body = (magnitude === 1 && variable ? variable : String(magnitude) + variable);
      result += (value < 0 ? '-' : (result ? '+' : '')) + body;
    });
    return result + '=0';
  }

  function fractionTex(value) {
    if (value.d === 1) return String(value.n);
    return (value.n < 0 ? '-' : '') + '\\frac{' + Math.abs(value.n) + '}{' + value.d + '}';
  }

  function sqrtParts(value) {
    var coefficient = 1;
    var radicand = value;
    for (var n = Math.floor(Math.sqrt(value)); n >= 2; n -= 1) {
      var square = n * n;
      if (value % square === 0) {
        coefficient = n;
        radicand = value / square;
        break;
      }
    }
    return { coefficient: coefficient, radicand: radicand };
  }

  function simplifiedQuadraticRoots(b, discriminant) {
    var parts = sqrtParts(discriminant);
    var centerNumerator = -b;
    var radicalCoefficient = parts.coefficient;
    if (centerNumerator % 2 === 0 && radicalCoefficient % 2 === 0) {
      centerNumerator /= 2;
      radicalCoefficient /= 2;
      var center = centerNumerator === 0 ? '' : (centerNumerator < 0 ? '-' : '') + Math.abs(centerNumerator);
      var radical = (radicalCoefficient === 1 ? '' : radicalCoefficient) +
        (parts.radicand === 1 ? '' : '\\sqrt{' + parts.radicand + '}');
      if (parts.radicand === 1 && radicalCoefficient === 1) radical = '1';
      if (center === '') return '\\pm' + radical;
      return center + '\\pm' + radical;
    }
    var radicalTerm = (radicalCoefficient === 1 ? '' : radicalCoefficient) +
      (parts.radicand === 1 ? '' : '\\sqrt{' + parts.radicand + '}');
    if (parts.radicand === 1 && radicalCoefficient === 1) radicalTerm = '1';
    return '\\frac{' + centerNumerator + '\\pm' + radicalTerm + '}{2}';
  }

  function normalizeVersion(version) { return 'V' + parseVersion(version); }

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
    return function (min, max) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return min + (state % (max - min + 1));
    };
  }

  function signed(n) { return n > 0 ? '+' + n : String(n); }

  function gcd3(a, b, c) { return gcd(gcd(a, b), c); }

  var PYTHAGOREAN_TRIPLES = Object.freeze([
    Object.freeze([3, 4, 5]), Object.freeze([5, 12, 13]), Object.freeze([8, 15, 17]),
    Object.freeze([7, 24, 25]), Object.freeze([20, 21, 29])
  ]);

  function matchesPythagoreanTriple(length, width, diagonal) {
    return PYTHAGOREAN_TRIPLES.some(function (triple) {
      if (diagonal % triple[2] !== 0) return false;
      var scale = diagonal / triple[2];
      return scale > 0 && ((length === triple[0] * scale && width === triple[1] * scale) ||
        (length === triple[1] * scale && width === triple[0] * scale));
    });
  }

  function makeQ9(legA, legB, hypotenuse, chooseOtherLeg, xMagnitude, k) {
    var lengthLeg = chooseOtherLeg ? legB : legA;
    var widthLeg = chooseOtherLeg ? legA : legB;
    var L = lengthLeg + xMagnitude;
    var W = widthLeg;
    var D = hypotenuse - k * xMagnitude;
    if (L <= 0 || W <= 0 || D <= 0 || L > 45 || W > 45 || D > 45) return null;
    if (xMagnitude < 1 || xMagnitude > 8 || (k !== 3 && k !== 4)) return null;
    if (!matchesPythagoreanTriple(L - xMagnitude, W, D + k * xMagnitude)) return null;
    var A = k * k - 1;
    var B = -(2 * L + 2 * k * D);
    var C = D * D - L * L - W * W;
    var divisor = gcd3(A, B, C);
    var red = [A / divisor, B / divisor, C / divisor];
    if (red.some(function (coefficient) { return Math.abs(coefficient) > 400; })) return null;
    var x0 = -xMagnitude;
    var x1 = div(rat(C), mul(rat(A), rat(x0)));
    var physical0 = L + x0 > 0 && D - k * x0 > 0;
    var physical1 = L + x1.n / x1.d > 0 && D - k * x1.n / x1.d > 0;
    var factorCoefficient = red[0] * x1.n / x1.d;
    if (!physical0 || physical1 || !isInteger(x1) && !Number.isInteger(factorCoefficient)) return null;
    if (!Number.isInteger(factorCoefficient)) return null;
    var factor = '(' + red[0] + 'x-' + factorCoefficient + ')(x+' + xMagnitude + ')';
    return { L: L, W: W, D: D, k: k, x0: x0, x1: x1, red: red, fac: factor };
  }

  function signedTerm(n, variable) {
    if (!n) return '';
    var body = term(Math.abs(n), variable);
    return n < 0 ? '-' + body : '+' + body;
  }

  function makeQ10a(rng) {
    var p = rng(1, 5), r = rng(1, 5);
    var q = rng(-6, 6), s = rng(-6, 6);
    if (q === 0 || s === 0) return null;
    var A = p * r;
    if (A < 2 || A > 10) return null;
    var first = rat(-q, p), second = rat(-s, r);
    if (equal(first, second)) return null;
    var roots = compare(first, second) < 0 ? [first, second] : [second, first];
    var B = p * s + q * r, C = q * s;
    if (gcd3(A, B, C) !== 1) return null;
    var rightX = rng(-6, 6);
    if (rightX === 0) return null;
    var leftX = B + rightX;
    if (leftX === 0) return null;
    var lhs = term(A, 'x^{2}') + signedTerm(leftX, 'x');
    var rhs = (C === 0 ? '' : String(-C)) + signedTerm(rightX, 'x');
    if (C === 0 && rightX > 0) rhs = rhs.slice(1);
    return {
      lhs: lhs, rhs: rhs, std: [A, B, C],
      fac: '(' + term(p, 'x') + signed(q) + ')(' + term(r, 'x') + signed(s) + ')',
      roots: roots, leftX: leftX, rightX: rightX,
      factorParams: { p: p, r: r, q: q, s: s }
    };
  }

  function makeQ10b(rng) {
    var b = rng(-12, 12);
    if (b === 0) return null;
    var c = rng(1, 9);
    var discriminant = b * b - 4 * c;
    if (discriminant <= 0) return null;
    var root = Math.floor(Math.sqrt(discriminant));
    if (root * root === discriminant) return null;
    var text = 'x^{2}+' + c + signedTerm(-b, 'x') + '=0';
    return {
      text: text,
      b: b, c: c,
      std: [1, -b, c],
      raw: '\\frac{' + b + '\\pm\\sqrt{' + discriminant + '}}{2}',
      simp: simplifiedQuadraticRoots(-b, discriminant)
    };
  }

  function makeQ10c(rng) {
    var a = rng(2, 5), b = rng(1, 6), c = rng(1, 9);
    if (gcd3(a, b, c) !== 1 || b * b - 4 * a * c >= 0) return null;
    var lhs = term(b, 'x') + '-' + term(a, 'x^{2}');
    return { a: a, b: b, c: c, lhs: lhs, rhs: String(c), std: [a, -b, c] };
  }

  function lcm(a, b) { return a / gcd(a, b) * b; }

  function quadraticFromRoots(alpha, beta) {
    var sum = add(alpha, beta);
    var product = mul(alpha, beta);
    var A = lcm(sum.d, product.d);
    var B = -sum.n * (A / sum.d);
    var C = product.n * (A / product.d);
    var divisor = gcd3(A, B, C);
    A /= divisor; B /= divisor; C /= divisor;
    if (A < 0) { A = -A; B = -B; C = -C; }
    return [A, B, C];
  }

  function factorForRoot(root) {
    return '(' + term(root.d, 'x') + signed(-root.n) + ')';
  }

  function makeQ12(rng) {
    var p = rng(1, 6), r = rng(1, 6);
    var q = rng(-6, 6), s = rng(-6, 6);
    if (q === 0 || s === 0) return null;
    if (gcd(p, q) !== 1 || gcd(r, s) !== 1) return null;
    var alpha = rat(-q, p), beta = rat(-s, r);
    if (equal(alpha, beta)) return null;
    if (compare(alpha, beta) > 0) { var swap = alpha; alpha = beta; beta = swap; }
    var eq = [p * r, p * s + q * r, q * s];
    if (gcd3(eq[0], eq[1], eq[2]) !== 1) return null;
    var t = rng(2, 5);
    var alphaScaled = mul(rat(t), alpha);
    var betaScaled = mul(rat(t), beta);
    var newEquation = quadraticFromRoots(alphaScaled, betaScaled);
    if (Math.max(Math.abs(newEquation[0]), Math.abs(newEquation[1]), Math.abs(newEquation[2])) > 60) return null;
    return {
      eq: eq,
      fac: '(' + term(p, 'x') + signed(q) + ')(' + term(r, 'x') + signed(s) + ')',
      al: alpha,
      be: beta,
      t: t,
      new: newEquation,
      newfac: factorForRoot(alphaScaled) + factorForRoot(betaScaled),
      factorParams: { p: p, r: r, q: q, s: s }
    };
  }

  function makeCandidate(version, attempt) {
    var rng = rngFor(version, attempt);
    var a = rng(2, 5), b = rng(1, 5), k = rng(2, 5);
    if (a < 2 || gcd(a, b) !== 1 || gcd3(a, b, k) !== 1) return null;
    var alpha = rng(2, 7), beta = rng(2, 7), gamma = rng(2, 5);
    if (gcd(alpha, beta) !== 1 || gamma * alpha > 35 || gamma * beta > 35) return null;
    var triple = PYTHAGOREAN_TRIPLES[rng(0, PYTHAGOREAN_TRIPLES.length - 1)];
    var scale = rng(1, Math.floor(45 / triple[2]));
    var xMagnitude = rng(1, 8);
    var q9 = makeQ9(triple[0] * scale, triple[1] * scale, triple[2] * scale,
      rng(0, 1) === 1, xMagnitude, 4);
    if (!q9) return null;
    var q10a = makeQ10a(rng), q10b = makeQ10b(rng), q10c = makeQ10c(rng), q12 = makeQ12(rng);
    if (!q10a || !q10b || !q10c || !q12) return null;
    return {
      q7: [a, b, k], q8: [alpha, beta, gamma], q9: q9,
      q10a: q10a, q10b: q10b, q10c: q10c, q12: q12
    };
  }

  function rationalKey(value) { return value.n + '/' + value.d; }

  function answerSignatures(params) {
    var q12a = params.q12.al, q12b = params.q12.be;
    var scaledA = mul(rat(params.q12.t), q12a);
    var scaledB = mul(rat(params.q12.t), q12b);
    var discriminant10c = params.q10c.std[1] * params.q10c.std[1] -
      4 * params.q10c.std[0] * params.q10c.std[2];
    return {
      q7a: params.q7.slice(0, 2).join(','),
      q7b: params.q7.join(','),
      q8a: params.q8.join(','),
      q8b: params.q8.slice(0, 2).join(','),
      q8c: params.q8.join(','),
      // x0 is the final accepted value; x1 is rejected by the geometry condition.
      q9: String(params.q9.x0),
      q10a: params.q10a.roots.map(rationalKey).join('|'),
      q10b: params.q10b.std.join(','),
      q10c: params.q10c.std.join(',') + '|' + discriminant10c,
      q12a: rationalKey(q12a) + '|' + rationalKey(q12b),
      q12b: rationalKey(scaledA) + '|' + rationalKey(scaledB) + '|' + params.q12.new.join(',')
    };
  }

  function repeatsAnswer(candidate, comparisonParams) {
    var candidateAnswers = answerSignatures(candidate);
    return comparisonParams.some(function (previous) {
      var previousAnswers = answerSignatures(previous);
      return Object.keys(candidateAnswers).some(function (questionPart) {
        return candidateAnswers[questionPart] === previousAnswers[questionPart];
      });
    });
  }

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === 'object') {
      if (Number.isInteger(value.n) && Number.isInteger(value.d)) return rat(value.n, value.d);
      var result = {};
      Object.keys(value).forEach(function (key) { result[key] = clone(value[key]); });
      return result;
    }
    return value;
  }

  function signature(value) {
    if (Array.isArray(value)) return '[' + value.map(signature).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (key) { return key + ':' + signature(value[key]); }).join(',') + '}';
    }
    return String(value);
  }

  function generatedParamsFor(n, previousParams) {
    var fixedVersions = Object.keys(FIXED);
    var fixedSignatures = fixedVersions.map(function (version) { return signature(FIXED[version]); });
    var comparisonParams = fixedVersions.map(function (version) { return FIXED[version]; });
    comparisonParams.push(previousParams);
    for (var attempt = 0; attempt < 100000; attempt += 1) {
      var candidate = makeCandidate(n, attempt);
      if (!candidate) continue;
      var sig = signature(candidate);
      if (fixedSignatures.indexOf(sig) !== -1) continue;
      var check = verifyParams(candidate);
      if (!check.valid) continue;
      if (repeatsAnswer(candidate, comparisonParams)) continue;
      return candidate;
    }
    throw new Error('無法為 V' + n + ' 找到符合條件的題目。');
  }

  function paramsFor(n) {
    if (n <= 3) return FIXED['V' + n];
    var version = 'V' + n;
    if (GENERATED_CACHE[version]) return clone(GENERATED_CACHE[version]);
    var advancesFrontier = n > GENERATED_FRONTIER_VERSION;
    var current = advancesFrontier ? GENERATED_FRONTIER_VERSION + 1 : 4;
    var previous = advancesFrontier ? GENERATED_FRONTIER_PARAMS : FIXED.V3;
    var generated;
    for (; current <= n; current += 1) {
      generated = generatedParamsFor(current, previous);
      previous = generated;
      if (advancesFrontier) {
        GENERATED_FRONTIER_VERSION = current;
        GENERATED_FRONTIER_PARAMS = clone(generated);
      }
      var currentVersion = 'V' + current;
      var oldIndex = GENERATED_CACHE_ORDER.indexOf(currentVersion);
      if (oldIndex !== -1) GENERATED_CACHE_ORDER.splice(oldIndex, 1);
      GENERATED_CACHE[currentVersion] = clone(generated);
      GENERATED_CACHE_ORDER.push(currentVersion);
      while (GENERATED_CACHE_ORDER.length > 32) {
        delete GENERATED_CACHE[GENERATED_CACHE_ORDER.shift()];
      }
    }
    return generated;
  }

  function verifyQ9(q) {
    var A = q.k * q.k - 1;
    var B = -(2 * q.L + 2 * q.k * q.D);
    var C = q.D * q.D - q.L * q.L - q.W * q.W;
    var divisor = gcd3(A, B, C);
    var reduced = [A / divisor, B / divisor, C / divisor];
    if (reduced.join(',') !== q.red.join(',')) return false;
    [rat(q.x0), q.x1].forEach(function (x) {
      var value = add(add(mul(rat(reduced[0]), mul(x, x)), mul(rat(reduced[1]), x)), rat(reduced[2]));
      if (value.n !== 0) throw new Error('Q9 方程根驗算失敗。');
      var length = add(rat(q.L), x);
      var diagonal = sub(rat(q.D), mul(rat(q.k), x));
      if (equal(x, rat(q.x0)) && !(length.n > 0 && diagonal.n > 0)) throw new Error('Q9 可取根的邊長不為正。');
      if (!equal(x, rat(q.x0)) && length.n > 0 && diagonal.n > 0) throw new Error('Q9 捨去根仍符合長方形邊長條件。');
    });
    var p = q.red[0] * q.x1.n / q.x1.d;
    if (!Number.isInteger(p)) return false;
    var expanded = [q.red[0], -q.red[0] * q.x0 - p, p * q.x0];
    return expanded.join(',') === q.red.join(',');
  }

  function verifyParams(params) {
    var v = 'generated';
    var a = params.q7[0], b = params.q7[1], k = params.q7[2];
    if (a < 2 || a > 5 || b < 1 || b > 5 || k < 2 || k > 5 ||
        gcd(a, b) !== 1 || gcd3(a, b, k) !== 1) return { valid: false, reason: 'q7-range-or-gcd' };
    [[rat(1), rat(2)], [rat(-3), rat(5)], [rat(1, 2), rat(-7)]].forEach(function (pair) {
      var x = pair[0], y = pair[1];
      var lhs = add(add(mul(rat(a * a), mul(x, x)), mul(rat(2 * a * b), mul(x, y))), mul(rat(b * b), mul(y, y)));
      var rightTerm = add(mul(rat(a), x), mul(rat(b), y));
      if (!equal(lhs, mul(rightTerm, rightTerm))) throw new Error('Q7 完全平方條件驗算失敗。');
      var secondLeft = sub(lhs, add(mul(rat(k * a), x), mul(rat(k * b), y)));
      var secondRight = mul(rightTerm, sub(rightTerm, rat(k)));
      if (!equal(secondLeft, secondRight)) throw new Error('Q7 (b) 因式分解驗算失敗。');
    });
    var alpha = params.q8[0], beta = params.q8[1], gamma = params.q8[2];
    if (alpha < 2 || alpha > 7 || beta < 2 || beta > 7 || gamma < 2 || gamma > 5 ||
        gamma * alpha > 35 || gamma * beta > 35 ||
        gcd(alpha, beta) !== 1 || gcd3(alpha, beta, gamma) !== 1) {
      return { valid: false, reason: 'q8-range-or-gcd' };
    }
    var points = [[rat(1), rat(2)], [rat(-3), rat(5)], [rat(1, 2), rat(-7)]];
    points.forEach(function (pair) {
      var p = pair[0], q = pair[1], r = add(p, mul(rat(2), q));
      var leftA = sub(mul(rat(gamma * alpha), mul(p, r)), mul(rat(gamma * beta), mul(q, r)));
      var rightA = mul(mul(rat(gamma), r), sub(mul(rat(alpha), p), mul(rat(beta), q)));
      if (!equal(leftA, rightA)) throw new Error('Q8(a) 提取公因式驗算失敗。');
      var leftB = sub(mul(rat(alpha * alpha), mul(p, p)), mul(rat(beta * beta), mul(q, q)));
      var rightB = mul(add(mul(rat(alpha), p), mul(rat(beta), q)), sub(mul(rat(alpha), p), mul(rat(beta), q)));
      if (!equal(leftB, rightB)) throw new Error('Q8(b) 平方差驗算失敗。');
      var leftC = sub(leftB, leftA);
      var rightC = mul(sub(mul(rat(alpha), p), mul(rat(beta), q)), sub(add(mul(rat(alpha), p), mul(rat(beta), q)), mul(rat(gamma), r)));
      if (!equal(leftC, rightC)) throw new Error('Q8(c) 因式分解驗算失敗。');
    });
    var q9 = params.q9;
    var actualLength = q9.L + q9.x0;
    var actualDiagonal = q9.D - q9.k * q9.x0;
    if (q9.k !== 3 && q9.k !== 4) return { valid: false, reason: 'q9-k-range' };
    if (!Number.isInteger(q9.x0) || q9.x0 < -8 || q9.x0 > -1 ||
        q9.L < 1 || q9.L > 45 || q9.W < 1 || q9.W > 45 || q9.D < 1 || q9.D > 45 ||
        !matchesPythagoreanTriple(actualLength, q9.W, actualDiagonal) ||
        q9.red.some(function (coefficient) { return Math.abs(coefficient) > 400; }) ||
        !verifyQ9(q9)) return { valid: false, reason: 'q9-range-or-geometry' };
    var qa = params.q10a, qaa = qa.std;
    if (qaa[0] < 2 || qaa[0] > 10 || gcd3(qaa[0], qaa[1], qaa[2]) !== 1) {
      return { valid: false, reason: 'q10a-leading-or-gcd' };
    }
    qa.roots.forEach(function (root) {
      var value = add(add(mul(rat(qaa[0]), mul(root, root)), mul(rat(qaa[1]), root)), rat(qaa[2]));
      if (value.n !== 0) throw new Error('Q10(a) 根驗算失敗。');
    });
    var qb = params.q10b.std;
    var q10b = params.q10b;
    var q10bB = -qb[1], q10bC = qb[2];
    if (qb[0] !== 1 || Math.abs(q10bB) > 12 || q10bB === 0 || q10bC < 1 || q10bC > 9 ||
        (q10b.b != null && qb[1] !== -q10b.b) || (q10b.c != null && qb[2] !== q10b.c)) {
      return { valid: false, reason: 'q10b-range' };
    }
    var discriminant = qb[1] * qb[1] - 4 * qb[0] * qb[2];
    if (!(discriminant > 0 && Math.floor(Math.sqrt(discriminant)) ** 2 !== discriminant)) return { valid: false, reason: 'q10b-discriminant' };
    var qc = params.q10c.std;
    var q10c = params.q10c;
    var q10cA = qc[0], q10cB = -qc[1], q10cC = qc[2];
    if (q10cA < 2 || q10cA > 5 || q10cB < 1 || q10cB > 8 || q10cC < 1 || q10cC > 9 ||
        gcd3(q10cA, q10cB, q10cC) !== 1 ||
        (q10c.a != null && qc[0] !== q10c.a) ||
        (q10c.b != null && qc[1] !== -q10c.b) ||
        (q10c.c != null && qc[2] !== q10c.c)) {
      return { valid: false, reason: 'q10c-range' };
    }
    if (!(qc[1] * qc[1] - 4 * qc[0] * qc[2] < 0)) return { valid: false, reason: 'q10c-discriminant' };
    var q12 = params.q12;
    if (gcd3(q12.eq[0], q12.eq[1], q12.eq[2]) !== 1 ||
        q12.t < 2 || q12.t > 5 || q12.new[0] <= 0 || gcd3(q12.new[0], q12.new[1], q12.new[2]) !== 1 ||
        Math.max(Math.abs(q12.new[0]), Math.abs(q12.new[1]), Math.abs(q12.new[2])) > 60) {
      return { valid: false, reason: 'q12-range-or-gcd' };
    }
    if (compare(q12.al, q12.be) >= 0) return { valid: false, reason: 'q12-root-order' };
    [q12.al, q12.be].forEach(function (root) {
      var value = add(add(mul(rat(q12.eq[0]), mul(root, root)), mul(rat(q12.eq[1]), root)), rat(q12.eq[2]));
      if (value.n !== 0) throw new Error('Q12 原方程根驗算失敗。');
    });
    var scaled = [mul(rat(q12.t), q12.al), mul(rat(q12.t), q12.be)];
    scaled.forEach(function (root) {
      var value = add(add(mul(rat(q12.new[0]), mul(root, root)), mul(rat(q12.new[1]), root)), rat(q12.new[2]));
      if (value.n !== 0) throw new Error('Q12 新方程根驗算失敗。');
    });
    if (Object.keys(MARKS).reduce(function (sum, key) { return sum + MARKS[key]; }, 0) !== 21) {
      throw new Error(v + ' 評分細分總分不等於 21。');
    }
    return { valid: true, discriminant10b: discriminant, discriminant10c: qc[1] * qc[1] - 4 * qc[0] * qc[2] };
  }

  function questionText(params) {
    var q7 = q7Text(params), q8 = q8Text(params), q9 = params.q9;
    var q10c = params.q10c;
    var q12 = params.q12;
    return {
      q7: { a: q7.square, b: q7.second },
      q8: { a: q8.a, b: q8.b, c: q8.c },
      q9: '一長方形的長及闊分別為 $(' + q9.L + '+x)$ cm 及 $' + q9.W + '$ cm。若該長方形的對角線的長度為 $(' + q9.D + '-' + q9.k + 'x)$ cm，求 $x$。',
      q10: {
        a: '$' + params.q10a.lhs + '=' + params.q10a.rhs + '$',
        b: '$' + params.q10b.text + '$',
        c: '$' + q10c.lhs + '=' + q10c.rhs + '$'
      },
      q12: '設 $\\alpha$ 和 $\\beta$ 為二次方程 $' + stdEq.apply(null, q12.eq) + '$ 的根，其中 $\\alpha<\\beta$。'
    };
  }

  function answerSteps(params) {
    var steps = [];
    var q7 = q7Text(params), q8 = q8Text(params), q9 = params.q9;
    var q9A = q9.k * q9.k - 1;
    var q9B = -(2 * q9.L + 2 * q9.k * q9.D);
    var q9C = q9.D * q9.D - q9.L * q9.L - q9.W * q9.W;
    var q12 = params.q12;
    steps.push({ page: 1, text: '7.　(3 分)', mark: '', heading: true });
    steps.push({ page: 1, text: '(a)　$' + q7.square + '=\\left(' + q7.base + '\\right)^{2}$', mark: '(1A)' });
    steps.push({ page: 1, text: '(b)　$' + q7.second + '=\\left(' + q7.base + '\\right)^{2}-' + q7.k + '\\left(' + q7.base + '\\right)$', mark: '(1M)' });
    steps.push({ page: 1, text: '　　$=\\left(' + q7.base + '\\right)\\left(' + q7.base + '-' + q7.k + '\\right)$', mark: '(1A)' });
    steps.push({ page: 1, text: '8.　(4 分)', mark: '', heading: true });
    steps.push({ page: 1, text: '(a)　$' + q8.a + '=' + q8.gamma + 'r(' + q8.alphaP + '-' + q8.betaQ + ')$', mark: '(1A)' });
    steps.push({ page: 1, text: '(b)　$' + q8.b + '=(' + q8.alphaP + '+' + q8.betaQ + ')(' + q8.alphaP + '-' + q8.betaQ + ')$', mark: '(1A)' });
    steps.push({ page: 1, text: '(c)　$' + q8.c + '$', mark: '' });
    steps.push({ page: 1, text: '　　$=(' + q8.alphaP + '+' + q8.betaQ + ')(' + q8.alphaP + '-' + q8.betaQ + ')-' + q8.gamma + 'r(' + q8.alphaP + '-' + q8.betaQ + ')$', mark: '(1M)' });
    steps.push({ page: 1, text: '　　$=(' + q8.alphaP + '-' + q8.betaQ + ')(' + q8.alphaP + '+' + q8.betaQ + '-' + q8.gamma + 'r)$', mark: '(1A)' });

    steps.push({ page: 2, text: '9.　(3 分)', mark: '', heading: true });
    steps.push({ page: 2, text: '$(' + q9.L + '+x)^{2}+' + q9.W + '^{2}=(' + q9.D + '-' + q9.k + 'x)^{2}$（畢氏定理）', mark: '(1M)' });
    steps.push({ page: 2, text: '$' + q9.L * q9.L + '+' + 2 * q9.L + 'x+x^{2}+' + q9.W * q9.W + '=' + q9.D * q9.D + '-' + 2 * q9.k * q9.D + 'x+' + q9.k * q9.k + 'x^{2}$', mark: '' });
    steps.push({ page: 2, text: '$' + stdEq(q9A, q9B, q9C) + '$', mark: '(1M)' });
    if ([q9A, q9B, q9C].join(',') !== q9.red.join(',')) {
      steps.push({ page: 2, text: '$' + stdEq.apply(null, q9.red) + '$', mark: '' });
    }
    steps.push({ page: 2, text: '$' + q9.fac + '=0$', mark: '' });
    steps.push({ page: 2, text: '$x=' + fractionTex(q9.x1) + '$（捨去）或 $x=' + q9.x0 + '$', mark: '(1A)' });

    steps.push({ page: 3, text: '10.　(6 分)', mark: '', heading: true });
    var q10a = params.q10a, rootsA = q10a.roots;
    steps.push({ page: 3, text: '(a)　$' + stdEq.apply(null, q10a.std) + '$', mark: '' });
    steps.push({ page: 3, text: '　　$' + q10a.fac + '=0$', mark: '(1M)' });
    steps.push({ page: 3, text: '　　$x=' + fractionTex(rootsA[0]) + '$ 或 $x=' + fractionTex(rootsA[1]) + '$', mark: '(1A)' });
    var q10b = params.q10b, qb = q10b.std;
    var discB = qb[1] * qb[1] - 4 * qb[0] * qb[2];
    steps.push({ page: 3, text: '(b)　$' + stdEq.apply(null, qb) + '$', mark: '' });
    steps.push({ page: 3, text: '　　$x=\\frac{-(' + qb[1] + ')\\pm\\sqrt{(' + qb[1] + ')^{2}-4(1)(' + qb[2] + ')}}{2(1)}$', mark: '(1M)' });
    steps.push({ page: 3, text: q10b.raw === q10b.simp
      ? '　　$=' + q10b.raw + '$'
      : '　　$=' + q10b.raw + '$（或 $' + q10b.simp + '$）', mark: '(1A)' });
    var qc = params.q10c, cc = qc.std;
    var discC = cc[1] * cc[1] - 4 * cc[0] * cc[2];
    steps.push({ page: 3, text: '(c)　$' + stdEq.apply(null, cc) + '$', mark: '' });
    steps.push({ page: 3, text: '　　$\\Delta=(' + cc[1] + ')^{2}-4(' + cc[0] + ')(' + cc[2] + ')=' + discC + '<0$', mark: '(1M)' });
    steps.push({ page: 3, text: '　　$\\therefore$ 該方程沒有實根。', mark: '(1A)' });

    steps.push({ page: 4, text: '12.　(5 分)', mark: '', heading: true });
    steps.push({ page: 4, text: '(a)　$' + stdEq.apply(null, q12.eq) + '$', mark: '' });
    steps.push({ page: 4, text: '　　$' + q12.fac + '=0$', mark: '' });
    steps.push({ page: 4, text: '　　$\\alpha=' + fractionTex(q12.al) + '$ 及 $\\beta=' + fractionTex(q12.be) + '$', mark: '(1A+1A)' });
    var scaledA = mul(rat(q12.t), q12.al), scaledB = mul(rat(q12.t), q12.be);
    steps.push({ page: 5, text: '(b)　所求方程的根是 $' + q12.t + '\\alpha=' + fractionTex(scaledA) + '$ 和 $' + q12.t + '\\beta=' + fractionTex(scaledB) + '$', mark: '(1M)' });
    steps.push({ page: 5, text: '　　所求的二次方程是 $' + q12.newfac + '=0$', mark: '(1M)' });
    steps.push({ page: 5, text: '　　$' + stdEq.apply(null, q12.new) + '$', mark: '(1A)' });
    return steps;
  }

  function generate(versionInput) {
    var n = parseVersion(versionInput);
    var version = normalizeVersion(versionInput);
    var params = clone(paramsFor(n));
    var validation = verifyParams(params);
    if (!validation.valid) throw new Error(version + ' 未通過驗算：' + validation.reason);
    var questions = questionText(params);
    var steps = answerSteps(params);
    var paperPages = [
      { withStudentInfo: true, blocks: [
        { kind: 'question', number: '7', text: '因式分解', marks: 3 },
        { kind: 'subquestion', label: 'a', math: questions.q7.a },
        { kind: 'subquestion', label: 'b', math: questions.q7.b },
        { kind: 'spacer', cm: 7.5 },
        { kind: 'question', number: '8', text: '因式分解', marks: 4 },
        { kind: 'subquestion', label: 'a', math: questions.q8.a },
        { kind: 'subquestion', label: 'b', math: questions.q8.b },
        { kind: 'subquestion', label: 'c', math: questions.q8.c }
      ] },
      { withStudentInfo: false, blocks: [
        { kind: 'question', number: '9', text: questions.q9, marks: 3 }
      ] },
      { withStudentInfo: false, blocks: [
        { kind: 'question', number: '10', text: '解下列各二次方程', marks: 6 },
        { kind: 'subquestion', label: 'a', text: questions.q10.a },
        { kind: 'spacer', cm: 6 },
        { kind: 'subquestion', label: 'b', text: questions.q10.b },
        { kind: 'spacer', cm: 6 },
        { kind: 'subquestion', label: 'c', text: questions.q10.c }
      ] },
      { withStudentInfo: false, blocks: [
        { kind: 'question', number: '12', text: questions.q12, marks: 5 },
        { kind: 'subquestion', text: '(a)　求 $\\alpha$ 和 $\\beta$ 的值。' },
        { kind: 'spacer', cm: 7 },
        { kind: 'subquestion', text: '(b)　由此，建立一個以 $x$ 為未知數的二次方程，使其根為 $' + params.q12.t +
          '\\alpha$ 和 $' + params.q12.t + '\\beta$，並把答案寫成一般式，其中各項的係數均為整數。' }
      ] }
    ];
    var answerPages = [1, 2].map(function (answerPage) {
      return { blocks: steps.filter(function (step) {
        return answerPage === 1 ? step.page <= 4 : step.page === 5;
      }).map(function (step) {
        return { kind: step.heading ? 'answerHeading' : 'answerStep', text: step.text, mark: step.mark };
      }) };
    });
    return {
      id: ID,
      grade: 's4',
      gradeLabel: '中四級',
      subject: '數學科',
      name: '第一章 一元二次方程 級測補測',
      version: version,
      totalMarks: 21,
      params: params,
      questions: questions,
      answerSteps: steps,
      paperPages: paperPages,
      answerPages: answerPages,
      marks: Object.assign({}, MARKS),
      marking: MARKING,
      discriminants: { q10b: validation.discriminant10b, q10c: validation.discriminant10c },
      pageCount: 4,
      academicYear: '2026-2027'
    };
  }

  function verify(versionInput) {
    var result = generate(versionInput);
    return { valid: true, version: result.version, discriminants: result.discriminants, marks: result.marks };
  }

  return Object.freeze({
    ID: ID,
    FIXED: FIXED,
    MARKS: MARKS,
    MARKING: MARKING,
    rat: rat,
    stdEq: stdEq,
    parseVersion: parseVersion,
    generate: generate,
    verify: verify,
    verifyParams: verifyParams
  });
});
