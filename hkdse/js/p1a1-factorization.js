/*
 * HKDSE P1 A1 factorisation core. Pure JavaScript: no DOM, storage or network.
 * The source GeoGebra construction title still says 2021#4 inequality; its
 * QuestionText and answer objects define the factorisation questions used here.
 * Likewise, the 2019 construction contains stale unused coefficient objects.
 */
(function (factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.HKDSEP1A1 = api;
})(function () {
  'use strict';

  const COEFFICIENTS = Object.freeze([1, 2, 3, 5]);
  const VARIABLE_ORDER = Object.freeze(['x', 'y', 'm', 'n']);
  const MAX_INPUT_LENGTH = 2000;
  const MAX_POLY_TERMS = 512;
  const MAX_POLY_DEGREE = 20;
  const MAX_TOP_LEVEL_FACTORS = 64;

  function gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) { const r = a % b; a = b; b = r; }
    return a;
  }

  function normalizePowers(powers) {
    const out = {};
    Object.keys(powers || {}).sort((a, b) => VARIABLE_ORDER.indexOf(a) - VARIABLE_ORDER.indexOf(b)).forEach((v) => {
      const e = powers[v];
      if (!VARIABLE_ORDER.includes(v) || !Number.isInteger(e) || e < 0) throw new Error('Invalid monomial.');
      if (e) out[v] = e;
    });
    return out;
  }

  function keyFromPowers(powers) {
    return Object.keys(powers).map((v) => powers[v] === 1 ? v : v + '^' + powers[v]).join('*');
  }

  function powersFromKey(key) {
    if (!key) return {};
    const out = {};
    key.split('*').forEach((piece) => {
      const match = /^([xymn])(?:\^(\d+))?$/.exec(piece);
      if (!match) throw new Error('Invalid polynomial term.');
      out[match[1]] = Number(match[2] || 1);
    });
    return normalizePowers(out);
  }

  function monomialDegree(powers) {
    return Object.values(powers).reduce((sum, exponent) => sum + exponent, 0);
  }

  function constantPoly(value) {
    const n = BigInt(value);
    return n === 0n ? new Map() : new Map([['', n]]);
  }

  function variablePoly(variable) {
    return new Map([[variable, 1n]]);
  }

  function addPoly(left, right, sign) {
    const out = new Map(left);
    right.forEach((coefficient, key) => {
      const value = (out.get(key) || 0n) + sign * coefficient;
      if (value === 0n) out.delete(key); else out.set(key, value);
    });
    if (out.size > MAX_POLY_TERMS) throw new Error('Expression is too large to check safely.');
    return out;
  }

  function multiplyPoly(left, right) {
    const out = new Map();
    left.forEach((leftCoefficient, leftKey) => {
      const leftPowers = powersFromKey(leftKey);
      right.forEach((rightCoefficient, rightKey) => {
        const rightPowers = powersFromKey(rightKey);
        const powers = Object.assign({}, leftPowers);
        Object.keys(rightPowers).forEach((v) => { powers[v] = (powers[v] || 0) + rightPowers[v]; });
        if (monomialDegree(powers) > MAX_POLY_DEGREE) throw new Error('Expression degree is too large to check safely.');
        const key = keyFromPowers(normalizePowers(powers));
        const value = (out.get(key) || 0n) + leftCoefficient * rightCoefficient;
        if (value === 0n) out.delete(key); else out.set(key, value);
      });
    });
    if (out.size > MAX_POLY_TERMS) throw new Error('Expression is too large to check safely.');
    return out;
  }

  function powerPoly(poly, exponent) {
    let result = constantPoly(1);
    for (let i = 0; i < exponent; i += 1) result = multiplyPoly(result, poly);
    return result;
  }

  function polyEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const [key, coefficient] of a) if (b.get(key) !== coefficient) return false;
    return true;
  }

  function encodePoly(poly) {
    return Array.from(poly.entries()).sort((a, b) => compareMonomials(a[0], b[0])).map(([key, coefficient]) => ({
      powers: powersFromKey(key), coefficient: coefficient.toString()
    }));
  }

  function decodePoly(value) {
    if (value instanceof Map) return new Map(value);
    if (!Array.isArray(value)) throw new Error('Invalid polynomial data.');
    const result = new Map();
    value.forEach((term) => {
      const powers = normalizePowers(term.powers);
      const coefficient = BigInt(term.coefficient);
      const key = keyFromPowers(powers);
      if (coefficient !== 0n) result.set(key, (result.get(key) || 0n) + coefficient);
    });
    for (const [key, coefficient] of result) if (coefficient === 0n) result.delete(key);
    return result;
  }

  function compareMonomials(a, b) {
    const ap = powersFromKey(a); const bp = powersFromKey(b);
    const degreeDiff = monomialDegree(bp) - monomialDegree(ap);
    if (degreeDiff) return degreeDiff;
    for (const v of VARIABLE_ORDER) {
      const diff = (bp[v] || 0) - (ap[v] || 0);
      if (diff) return diff;
    }
    return a.localeCompare(b);
  }

  function formatPoly(value) {
    const poly = decodePoly(value);
    if (!poly.size) return '0';
    const terms = Array.from(poly.entries()).sort((a, b) => compareMonomials(a[0], b[0]));
    let output = '';
    terms.forEach(([key, coefficient], index) => {
      const negative = coefficient < 0n;
      const magnitude = negative ? -coefficient : coefficient;
      const powers = powersFromKey(key);
      const degree = monomialDegree(powers);
      const monomial = Object.keys(powers).map((v) => powers[v] === 1 ? v : v + '^{' + powers[v] + '}').join('');
      const coefficientText = degree && magnitude === 1n ? '' : magnitude.toString();
      const body = coefficientText + monomial;
      if (index === 0) output += negative ? '-' + body : body;
      else output += negative ? ' - ' + body : ' + ' + body;
    });
    return output;
  }

  function signedDisplayTerms(value, multiplier) {
    const poly = decodePoly(value);
    return Array.from(poly.entries()).sort((a, b) => compareMonomials(a[0], b[0])).map(([key, coefficient]) => {
      const signed = coefficient * multiplier;
      const negative = signed < 0n;
      const magnitude = negative ? -signed : signed;
      const powers = powersFromKey(key);
      const degree = monomialDegree(powers);
      const monomial = Object.keys(powers).map((v) => powers[v] === 1 ? v : v + '^{' + powers[v] + '}').join('');
      const coefficientText = degree && magnitude === 1n ? '' : magnitude.toString();
      return { negative, body: coefficientText + monomial };
    }).filter((term) => term.body !== '0');
  }

  function joinDisplayTerms(terms) {
    if (!terms.length) return '0';
    return terms.map((term, index) => {
      if (index === 0) return (term.negative ? '-' : '') + term.body;
      return (term.negative ? ' - ' : ' + ') + term.body;
    }).join('');
  }

  function formatPolyGroups(groups) {
    const terms = [];
    groups.forEach((group) => {
      const multiplier = BigInt(group.sign == null ? 1 : group.sign);
      terms.push.apply(terms, signedDisplayTerms(group.polynomial, multiplier));
    });
    return joinDisplayTerms(terms);
  }

  function polynomialContent(poly) {
    let content = 0n;
    poly.forEach((coefficient) => { content = gcd(content, coefficient); });
    return content;
  }

  function primitivePart(poly) {
    if (!poly.size) return { scalar: 0n, primitive: new Map() };
    const content = polynomialContent(poly);
    const leading = Array.from(poly.entries()).sort((a, b) => compareMonomials(a[0], b[0]))[0][1];
    const sign = leading < 0n ? -1n : 1n;
    const scalar = content * sign;
    const primitive = new Map();
    poly.forEach((coefficient, key) => primitive.set(key, coefficient / scalar));
    return { scalar, primitive };
  }

  function normalizeInput(source) {
    const digits = '０１２３４５６７８９';
    let text = String(source == null ? '' : source).trim();
    if (!text || text.length > MAX_INPUT_LENGTH) throw new Error('請輸入長度不超過 2000 個字元的代數式。');
    text = text.replace(/[０-９]/g, (char) => String(digits.indexOf(char)))
      .replace(/[ｘＸ]/g, 'x').replace(/[ｙＹ]/g, 'y').replace(/[ｍＭ]/g, 'm').replace(/[ｎＮ]/g, 'n')
      .replace(/[X]/g, 'x').replace(/[Y]/g, 'y').replace(/[M]/g, 'm').replace(/[N]/g, 'n')
      .replace(/[（［【]/g, '(').replace(/[）］】]/g, ')')
      .replace(/[＋]/g, '+').replace(/[－−–]/g, '-').replace(/[×·⋅]/g, '*')
      .replace(/²/g, '^2').replace(/\s+/g, '');
    return text;
  }

  function tokenize(source) {
    const text = normalizeInput(source);
    const tokens = [];
    let i = 0;
    while (i < text.length) {
      const char = text[i];
      if (/[0-9]/.test(char)) {
        let end = i + 1;
        while (end < text.length && /[0-9]/.test(text[end])) end += 1;
        const digits = text.slice(i, end);
        if (digits.length > 80) throw new Error('整數太長，無法安全檢查。');
        tokens.push({ type: 'number', value: BigInt(digits) }); i = end; continue;
      }
      if (/[xymn]/.test(char)) { tokens.push({ type: 'variable', value: char }); i += 1; continue; }
      if ('+-*^()'.includes(char)) { tokens.push({ type: char, value: char }); i += 1; continue; }
      throw new Error('含有不支援的符號「' + char + '」。');
    }
    tokens.push({ type: 'eof' });
    return tokens;
  }

  function parseAnswer(source) {
    const tokens = tokenize(source);
    let cursor = 0;
    let nodes = 0;
    const peek = () => tokens[cursor];
    const take = (type) => {
      if (peek().type !== type) throw new Error('缺少「' + type + '」或運算式不完整。');
      return tokens[cursor++];
    };
    const make = (type, fields) => { nodes += 1; if (nodes > 1000) throw new Error('運算式太長。'); return Object.assign({ type }, fields); };
    function primary() {
      const token = peek();
      if (token.type === 'number') { cursor += 1; return make('constant', { value: token.value.toString() }); }
      if (token.type === 'variable') { cursor += 1; return make('variable', { name: token.value }); }
      if (token.type === '(') { cursor += 1; const inside = sum(); take(')'); return inside; }
      throw new Error('此處需要整數、變數或括號。');
    }
    function power() {
      let node = primary();
      if (peek().type === '^') {
        cursor += 1;
        const exponent = take('number').value;
        if (exponent !== 2n) throw new Error('只接受平方次方（^2 或 ²）。');
        node = make('power', { operand: node, exponent: 2 });
        if (peek().type === '^') throw new Error('不支援連續次方。');
      }
      return node;
    }
    function unary() {
      if (peek().type === '+') { cursor += 1; return make('positive', { operand: unary() }); }
      if (peek().type === '-') { cursor += 1; return make('negative', { operand: unary() }); }
      return power();
    }
    function startsFactor(token) { return token.type === 'number' || token.type === 'variable' || token.type === '('; }
    function product() {
      let node = unary();
      while (peek().type === '*' || startsFactor(peek())) {
        if (peek().type === '*') { cursor += 1; if (!startsFactor(peek()) && !['+', '-'].includes(peek().type)) throw new Error('乘號後缺少因式。'); }
        node = make('multiply', { left: node, right: unary() });
      }
      return node;
    }
    function sum() {
      let node = product();
      while (peek().type === '+' || peek().type === '-') {
        const operator = peek().type; cursor += 1;
        node = make(operator === '+' ? 'add' : 'subtract', { left: node, right: product() });
      }
      return node;
    }
    const ast = sum();
    if (peek().type !== 'eof') throw new Error('運算式末端有多餘內容。');
    const polynomial = expandAst(ast);
    return { ast: ast, polynomial: encodePoly(polynomial) };
  }

  function expandAst(node) {
    switch (node.type) {
      case 'constant': return constantPoly(node.value);
      case 'variable': return variablePoly(node.name);
      case 'positive': return expandAst(node.operand);
      case 'negative': return new Map(Array.from(expandAst(node.operand), ([key, coefficient]) => [key, -coefficient]));
      case 'add': return addPoly(expandAst(node.left), expandAst(node.right), 1n);
      case 'subtract': return addPoly(expandAst(node.left), expandAst(node.right), -1n);
      case 'multiply': return multiplyPoly(expandAst(node.left), expandAst(node.right));
      case 'power': return powerPoly(expandAst(node.operand), node.exponent);
      default: throw new Error('Unknown expression node.');
    }
  }

  function expand(expression) {
    if (typeof expression === 'string') return encodePoly(expandAst(parseAnswer(expression).ast));
    if (expression && expression.ast) return encodePoly(expandAst(expression.ast));
    return encodePoly(decodePoly(expression));
  }

  function createRng(seed, index) {
    let text = String(seed == null ? '' : seed) + '#' + String(index == null ? 0 : index);
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    let state = h >>> 0;
    function nextUint32() {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return (t ^ (t >>> 14)) >>> 0;
    }
    const rng = function () { return nextUint32() / 4294967296; };
    rng.int = function (limit) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 4294967296) throw new Error('Invalid random range.');
      const ceiling = Math.floor(4294967296 / limit) * limit;
      let value;
      do { value = nextUint32(); } while (value >= ceiling);
      return value % limit;
    };
    return rng;
  }

  function choose(rng, list) { return list[rng.int ? rng.int(list.length) : Math.floor(rng() * list.length)]; }

  function crossTermData(sample) {
    const b1 = sample.c2 * sample.c3;
    const b2 = sample.c1 * sample.c4;
    if (sample.sign1 === sample.sign2) {
      return { A: sample.c1 * sample.c3, B: b1 + b2, C: sample.c2 * sample.c4, xySign: sample.sign1, ySign: 1, b1, b2 };
    }
    return { A: sample.c1 * sample.c3, B: Math.abs(b1 - b2), C: sample.c2 * sample.c4, xySign: b1 > b2 ? sample.sign1 : sample.sign2, ySign: -1, b1, b2 };
  }

  function crossProductPolynomial(sample, variableX, variableY) {
    const values = crossTermData(sample);
    const poly = new Map();
    poly.set(keyFromPowers({ [variableX]: 2 }), BigInt(values.A));
    if (values.B) {
      const middlePowers = { [variableX]: 1 };
      if (variableY) middlePowers[variableY] = 1;
      poly.set(keyFromPowers(normalizePowers(middlePowers)), BigInt(values.B * values.xySign));
    }
    const constantPowers = variableY ? { [variableY]: 2 } : {};
    const constantKey = keyFromPowers(normalizePowers(constantPowers));
    const constantValue = BigInt(values.C * values.ySign);
    poly.set(constantKey, (poly.get(constantKey) || 0n) + constantValue);
    return { polynomial: poly, values };
  }

  function sampleCoefficients(rng) {
    const c1 = choose(rng, COEFFICIENTS);
    const afterC1 = COEFFICIENTS.filter((n) => n !== c1);
    const c3 = choose(rng, afterC1);
    const c2 = choose(rng, afterC1);
    const afterC3 = afterC1.filter((n) => n !== c3);
    const c4 = choose(rng, afterC3);
    return { c1, c2, c3, c4, sign1: choose(rng, [1, -1]), sign2: choose(rng, [1, -1]) };
  }

  function linear(variable, coefficient, constant, constantSign) {
    return addPoly(new Map([[variable, BigInt(coefficient)]]), constantPoly(BigInt(constant) * BigInt(constantSign)), 1n);
  }

  function binomialTwoVariables(variableA, coefficientA, variableB, coefficientB, signB) {
    const a = new Map([[variableA, BigInt(coefficientA)]]);
    const b = new Map([[variableB, BigInt(coefficientB) * BigInt(signB)]]);
    return addPoly(a, b, 1n);
  }

  function scalarMultiply(poly, scalar) { return multiplyPoly(constantPoly(scalar), poly); }

  function polyProduct(list) { return list.reduce((product, factor) => multiplyPoly(product, factor), constantPoly(1)); }

  function makePart(id, target, factorCandidates, marks, steps, hint) {
    const expectedAtoms = [];
    let answerScalar = 1n;
    factorCandidates.forEach((factor) => {
      const canonical = primitivePart(factor);
      const pieces = factorizeExpected(factor);
      const pieceProduct = polyProduct(pieces);
      const orientation = polyEqual(pieceProduct, canonical.primitive) ? 1n :
        (polyEqual(scalarMultiply(pieceProduct, -1n), canonical.primitive) ? -1n : 0n);
      if (orientation === 0n) throw new Error('Expected factor normalization failed.');
      answerScalar *= canonical.scalar * orientation;
      pieces.forEach((piece) => {
        if (piece.size && !(piece.size === 1 && piece.has(''))) expectedAtoms.push(primitivePart(piece).primitive);
      });
    });
    if (!polyEqual(polyProduct(factorCandidates), target)) throw new Error('Generated factors do not expand to the target polynomial.');
    if (!polyEqual(scalarMultiply(polyProduct(expectedAtoms), answerScalar), target)) throw new Error('Normalized answer factors do not expand to the target polynomial.');
    return {
      id,
      targetPoly: encodePoly(target),
      questionTex: formatPoly(target),
      expectedFactors: expectedAtoms.map(encodePoly),
      marks: marks,
      maxMarks: marks.M + marks.A,
      answerScalar: answerScalar.toString(),
      answerTex: formatScaledFactorProduct(expectedAtoms, answerScalar),
      stepsHtml: steps,
      hintHtml: hint
    };
  }

  function formatFactorProduct(factors) {
    if (!factors.length) return '1';
    return factors.map(formatAnswerFactor).join('');
  }

  function formatAnswerFactor(factor) {
    const poly = decodePoly(factor);
    if (poly.size === 1) {
      const [[key, coefficient]] = poly.entries();
      const powers = powersFromKey(key);
      if (coefficient === 1n && Object.keys(powers).length === 1 && Object.values(powers)[0] === 1) return formatPoly(poly);
    }
    return '\\left(' + formatPoly(poly) + '\\right)';
  }

  function formatScaledFactorProduct(factors, scalar) {
    const value = BigInt(scalar);
    const magnitude = value < 0n ? -value : value;
    const prefix = value < 0n ? (magnitude === 1n ? '-' : '-' + magnitude) : (magnitude === 1n ? '' : magnitude.toString());
    return prefix + formatFactorProduct(factors);
  }

  function texDisplay(expression) { return '<div class="hkdse-math-display">\\[\\displaystyle ' + expression + '\\]</div>'; }
  function texInline(expression) { return '$\\displaystyle ' + expression + '$'; }

  function signedTerm(coefficient, variable) {
    const abs = Math.abs(coefficient);
    return (coefficient < 0 ? '-' : '') + (abs === 1 ? '' : abs) + variable;
  }

  function variableTerm(coefficient, variable) { return (coefficient === 1 ? '' : String(coefficient)) + variable; }

  function constantTerm(coefficient) { return String(coefficient); }

  function twoVariableBinomialTex(sample, first) {
    const coefficientA = first ? sample.c1 : sample.c3;
    const coefficientB = first ? sample.c2 : sample.c4;
    const sign = first ? sample.sign1 : sample.sign2;
    return variableTerm(coefficientA, 'x') + (sign < 0 ? ' - ' : ' + ') + variableTerm(coefficientB, 'y');
  }

  function linearTex(variable, coefficient, constant, sign) {
    const first = signedTerm(coefficient, variable);
    return first + (sign < 0 ? ' - ' : ' + ') + constant;
  }

  function twoVariableFactorTex(sample, first) {
    return '\\left(' + twoVariableBinomialTex(sample, first) + '\\right)';
  }

  function linearFactorTex(variable, coefficient, constant, sign) {
    return '\\left(' + linearTex(variable, coefficient, constant, sign) + '\\right)';
  }

  function constantMinusTwoVariableBinomialTex(constant, coefficientX, coefficientY, signY) {
    return constant + ' - ' + variableTerm(coefficientX, 'x') + (signY < 0 ? ' + ' : ' - ') + variableTerm(coefficientY, 'y');
  }

  function crossTableHtml(sample, variableA, variableB, sameVariable) {
    const s1 = sample.sign1 < 0 ? '-' : '+';
    const s2 = sample.sign2 < 0 ? '-' : '+';
    const f1 = sameVariable ? linearTex(variableA, sample.c1, sample.c2, sample.sign1) : twoVariableBinomialTex(sample, true);
    const f2 = sameVariable ? linearTex(variableA, sample.c3, sample.c4, sample.sign2) : twoVariableBinomialTex(sample, false);
    const cross1 = (sample.c1 * sample.c4) + (sameVariable ? variableA : variableA + variableB);
    const cross2Sign = sample.sign1;
    const cross2 = (sample.c2 * sample.c3) + (sameVariable ? variableA : variableA + variableB);
    const second = cross2Sign < 0 ? '−' + cross2 : '+' + cross2;
    const first = sample.sign2 < 0 ? '−' + cross1 : '+' + cross1;
    return '<table class="cross-table" aria-label="十字相乘表"><tbody>' +
      '<tr><th>二項式 1</th><td>' + texInline(f1) + '</td><th>二項式 2</th><td>' + texInline(f2) + '</td></tr>' +
      '<tr><th>交叉項 1</th><td>' + variableTerm(sample.c1, variableA) + '·' + (sample.sign2 < 0 ? '−' : '') + (sameVariable ? constantTerm(sample.c4) : variableTerm(sample.c4, variableB)) + '</td><td>' + first + '</td><td></td></tr>' +
      '<tr><th>交叉項 2</th><td>' + (sample.sign1 < 0 ? '−' : '') + (sameVariable ? constantTerm(sample.c2) : variableTerm(sample.c2, variableB)) + '·' + variableTerm(sample.c3, variableA) + '</td><td>' + second + '</td><td></td></tr>' +
      '</tbody></table>';
  }

  function sampleFactorTex(sample, first, variables) {
    return linearTex(variables[0], first ? sample.c1 : sample.c3, first ? sample.c2 : sample.c4, first ? sample.sign1 : sample.sign2);
  }

  function generate2021(seed, index, rng) {
    const c = sampleCoefficients(rng);
    const typeB = choose(rng, [1, 2]);
    const k = 2 + rng.int(4);
    const F1 = binomialTwoVariables('x', c.c1, 'y', c.c2, c.sign1);
    const F2 = binomialTwoVariables('x', c.c3, 'y', c.c4, c.sign2);
    const Q = crossProductPolynomial(c, 'x', 'y').polynomial;
    if (!polyEqual(Q, multiplyPoly(F1, F2))) throw new Error('Cross-multiplication sign rule mismatch.');
    const marksA = { M: 0, A: 1 };
    const partA = makePart('a', Q, [F1, F2], marksA,
      '<p>十字相乘配出兩個一次因式：</p>' + crossTableHtml(c, 'x', 'y'),
      '比較首項與常數項的因數，再把兩個交叉乘積相加或相減。');
    partA.stepsHtml += texDisplay(formatPoly(Q) + ' = ' + partA.answerTex);
    const common = typeB === 1 ? F1 : F2;
    const other = typeB === 1 ? F2 : F1;
    const targetB = addPoly(scalarMultiply(common, k), Q, -1n);
    const secondB = addPoly(constantPoly(k), other, -1n);
    const commonTex = twoVariableFactorTex(c, typeB === 1);
    const factor1Tex = twoVariableFactorTex(c, true);
    const factor2Tex = twoVariableFactorTex(c, false);
    const otherTex = twoVariableFactorTex(c, typeB !== 1);
    const secondFactorTex = '\\left(' + constantMinusTwoVariableBinomialTex(k,
      typeB === 1 ? c.c3 : c.c1, typeB === 1 ? c.c4 : c.c2, typeB === 1 ? c.sign2 : c.sign1) + '\\right)';
    const partB = makePart('b', targetB, [common, secondB], { M: 1, A: 1 },
      '<p>沿用 (a) 的十字相乘結果，先提出共同二項因式：</p>',
      '先用 (a) 的因式重寫二次式，再提出共同因式。');
    partB.questionTex = formatPolyGroups([{ polynomial: scalarMultiply(common, k), sign: 1 }, { polynomial: Q, sign: -1 }]);
    partB.answerTex = commonTex + secondFactorTex;
    partB.methodInput = { label: '步驟', sources: ['a'] };
    partB.stepsHtml += texDisplay(partB.questionTex + '=' + k + commonTex + '-' + factor1Tex + factor2Tex) +
      texDisplay(k + commonTex + '-' + factor1Tex + factor2Tex + '=' + commonTex + '\\left[' + k + '-' + otherTex + '\\right]') +
      texDisplay(commonTex + '\\left[' + k + '-' + otherTex + '\\right]=' + partB.answerTex) +
      '<p>檢查括號內沒有可提出的整數公因數。</p>';
    const q = {
      type: '2021', seed: String(seed), index: index,
      parts: [partA, partB], maxMarks: 3,
      sourceMarkNote: '2021 Q3 原卷為 3 分：1A + 1M + 1A。'
    };
    q.questionHtml = renderQuestion(q);
    return q;
  }

  function generate2019(seed, index, rng) {
    const c = sampleCoefficients(rng);
    const typeA = choose(rng, [1, 2]);
    const typeB = choose(rng, [1, 2]);
    const t = typeA === 1 ? 'm' : 'n';
    const r = typeA === 1 ? 'n' : 'm';
    const useFirst = typeB === 1;
    const u = useFirst ? c.c1 : c.c3;
    const v = useFirst ? c.c2 : c.c4;
    const signU = useFirst ? c.sign1 : c.sign2;
    const w = useFirst ? c.c3 : c.c1;
    const z = useFirst ? c.c4 : c.c2;
    const signV = useFirst ? c.sign2 : c.sign1;
    const U = linear(t, u, v, signU);
    const Uop = linear(t, u, v, -signU);
    const V = linear(t, w, z, signV);
    const rPoly = variablePoly(r);
    const selected = Object.assign({}, c, { c1: u, c2: v, c3: w, c4: z, sign1: signU, sign2: signV });
    const targetA = multiplyPoly(U, Uop);
    const crossResult = crossProductPolynomial(selected, t, null);
    const productQ = crossResult.polynomial;
    if (!polyEqual(productQ, multiplyPoly(U, V))) throw new Error('2019 cross-multiplication sign rule mismatch.');
    const targetB = multiplyPoly(rPoly, productQ);
    const R = addPoly(Uop, multiplyPoly(rPoly, V), -1n);
    const targetC = addPoly(targetA, targetB, -1n);
    const commonMarksA = { M: 0, A: 1 };
    const partA = makePart('a', targetA, [linear(t, u, v, signU), Uop], commonMarksA,
      '<p>平方差：</p>' + texDisplay('(' + variableTerm(u, t) + ')^2-' + v + '^2=(' + variableTerm(u, t) + '+' + v + ')(' + variableTerm(u, t) + '-' + v + ')') +
      '<p>把各二項式的整數公因數提出後，可得：</p>',
      '辨認 $A^2-B^2$，用 $(A+B)(A-B)$，並提出括號內的整數公因數。');
    partA.stepsHtml += texDisplay(formatPoly(targetA) + '=' + partA.answerTex);
    const partB = makePart('b', targetB, [rPoly, U, V], { M: 0, A: 1 },
      '<p>先提出外面的公因式 ' + texInline(r) + '，再對括號內的三項式十字相乘：</p>' + crossTableHtml(selected, t, r, true) +
      '',
      '先提出 ' + r + '，再對剩下的三項式十字相乘。');
    partB.stepsHtml += texDisplay(formatPoly(targetB) + '=' + r + '\\left(' + formatPoly(encodePoly(productQ)) + '\\right)=' + partB.answerTex);
    const partC = makePart('c', targetC, [U, R], { M: 1, A: 1 },
      '<p>把 (a)、(b) 的答案代入並分組：</p>',
      '把 (a) 與 (b) 的式子分組，提出相同的二項因式。');
    partC.questionTex = formatPolyGroups([{ polynomial: targetA, sign: 1 }, { polynomial: targetB, sign: -1 }]);
    partC.answerTex = linearFactorTex(t, u, v, signU) + '\\left(' + linearTex(t, u, v, -signU) + ' - ' + r + linearFactorTex(t, w, z, signV) + '\\right)';
    partC.methodInput = { label: '步驟', sources: ['a', 'b'] };
    const expandedR = formatPolyGroups([{ polynomial: Uop, sign: 1 }, { polynomial: multiplyPoly(rPoly, V), sign: -1 }]);
    const factorA = linearFactorTex(t, u, v, signU) + linearFactorTex(t, u, v, -signU);
    const factorB = r + linearFactorTex(t, u, v, signU) + linearFactorTex(t, w, z, signV);
    partC.stepsHtml += texDisplay(partC.questionTex + '=' + factorA + '-' + factorB) +
      texDisplay(factorA + '-' + factorB + '=' + linearFactorTex(t, u, v, signU) + '\\left(' + linearTex(t, u, v, -signU) + '-' + r + linearFactorTex(t, w, z, signV) + '\\right)') +
      texDisplay(linearFactorTex(t, u, v, signU) + '\\left(' + linearTex(t, u, v, -signU) + '-' + r + linearFactorTex(t, w, z, signV) + '\\right)=' + linearFactorTex(t, u, v, signU) + '\\left(' + expandedR + '\\right)') +
      '<p>最後檢查因式內沒有可再提出的整數公因數。</p>';
    const q = {
      type: '2019', seed: String(seed), index: index,
      parts: [partA, partB, partC], maxMarks: 4,
      sourceMarkNote: '2019 Q4 原卷為 4 分：1A + 1A + 1M + 1A。'
    };
    q.questionHtml = renderQuestion(q);
    return q;
  }

  function factorizeExpected(poly) {
    const normalized = primitivePart(poly).primitive;
    const terms = Object.fromEntries(normalized.entries());
    const variables = new Set();
    normalized.forEach((_, key) => Object.keys(powersFromKey(key)).forEach((v) => variables.add(v)));
    if (variables.size === 2) {
      const vars = Array.from(variables).sort((a, b) => VARIABLE_ORDER.indexOf(a) - VARIABLE_ORDER.indexOf(b));
      const aKey = keyFromPowers({ [vars[0]]: 1, [vars[1]]: 1 });
      const bKey = vars[0];
      const cKey = vars[1];
      const A = terms[aKey] || 0n;
      const B = terms[bKey] || 0n;
      const C = terms[cKey] || 0n;
      const D = terms[''] || 0n;
      if (A !== 0n && A * D === B * C) {
        const g = gcd(A, C);
        const p = A / g;
        const q = C / g;
        if (p !== 0n && B % p === 0n) {
          const lambda = B / p;
          if (q * lambda === D) {
            const first = new Map([[vars[0], p]]);
            if (q !== 0n) first.set('', q);
            const second = new Map([[vars[1], g]]);
            if (lambda !== 0n) second.set('', lambda);
            return [primitivePart(first).primitive, primitivePart(second).primitive];
          }
        }
      }
    }
    return [normalized];
  }

  function renderQuestion(question) {
    const parts = question.parts.map((part) => '<div class="p1a1-exam-part"><span>(' + part.id + ')</span><div class="hkdse-math-display">\\[\\displaystyle ' + part.questionTex + '\\]</div></div>').join('');
    return '<div class="p1a1-exam-title">因式分解</div><div class="p1a1-exam-parts">' + parts + '</div>';
  }

  function assertQuestion(question) {
    question.parts.forEach((part) => {
      const expected = decodePoly(part.targetPoly);
      const reconstructed = scalarMultiply(polyProduct(part.expectedFactors.map(decodePoly)), BigInt(part.answerScalar));
      if (!polyEqual(reconstructed, expected)) throw new Error('Generated ' + question.type + ' question failed its polynomial self-check.');
    });
  }

  function topLevelFactors(ast) {
    const factors = [];
    function append(node, repeats) {
      if (node.type === 'positive' || node.type === 'negative') { append(node.operand, repeats); return; }
      if (node.type === 'multiply') { append(node.left, repeats); append(node.right, repeats); return; }
      if (node.type === 'power') {
        if (repeats > MAX_TOP_LEVEL_FACTORS / node.exponent) throw new Error('因式數量超出安全檢查範圍。');
        append(node.operand, repeats * node.exponent);
        return;
      }
      if (repeats > MAX_TOP_LEVEL_FACTORS - factors.length) throw new Error('因式數量超出安全檢查範圍。');
      for (let index = 0; index < repeats; index += 1) factors.push(node);
    }
    append(ast, 1);
    return factors;
  }

  function samePoly(a, b) { return polyEqual(a, b); }

  function matchFactorization(userFactors, expectedFactors) {
    const expected = expectedFactors.map(decodePoly);
    const used = new Set();
    for (const factor of userFactors) {
      const poly = expandAst(factor);
      if (!poly.size) continue;
      if (poly.size === 1 && poly.has('')) continue;
      const content = polynomialContent(poly);
      if (content > 1n) {
        return { complete: false, kind: 'content', factorTex: formatPoly(encodePoly(poly)), divisor: content.toString() };
      }
      const primitive = primitivePart(poly).primitive;
      let matchIndex = -1;
      for (let i = 0; i < expected.length; i += 1) {
        if (!used.has(i) && samePoly(primitive, expected[i])) { matchIndex = i; break; }
      }
      if (matchIndex >= 0) { used.add(matchIndex); continue; }
      const subset = findExpectedProduct(primitive, expected, used);
      if (subset && subset.length > 1) {
        subset.forEach((i) => used.add(i));
        return { complete: false, kind: 'combined', factorTex: formatPoly(encodePoly(poly)), pieces: subset.length };
      }
      return { complete: false, kind: 'unknown', factorTex: formatPoly(encodePoly(poly)) };
    }
    if (used.size !== expected.length) return { complete: false, kind: 'missing', factorTex: '' };
    return { complete: true };
  }

  function findExpectedProduct(actual, expected, used) {
    const available = expected.map((_, i) => i).filter((i) => !used.has(i));
    const combinations = [];
    function walk(start, selected, product) {
      if (selected.length >= 2 && samePoly(primitivePart(product).primitive, actual)) combinations.push(selected.slice());
      if (selected.length >= available.length) return;
      for (let i = start; i < available.length; i += 1) {
        const index = available[i];
        walk(i + 1, selected.concat(index), multiplyPoly(product, expected[index]));
      }
    }
    walk(0, [], constantPoly(1));
    return combinations.length ? combinations[0] : null;
  }

  function negatePoly(poly) {
    return new Map(Array.from(poly, ([key, coefficient]) => [key, -coefficient]));
  }

  function samePolyUpToSign(left, right) {
    return polyEqual(left, right) || polyEqual(left, negatePoly(right));
  }

  function additiveTerms(ast) {
    const terms = [];
    function append(node, sign) {
      if (node.type === 'positive') { append(node.operand, sign); return; }
      if (node.type === 'negative') { append(node.operand, -sign); return; }
      if (node.type === 'add') { append(node.left, sign); append(node.right, sign); return; }
      if (node.type === 'subtract') { append(node.left, sign); append(node.right, -sign); return; }
      terms.push({ node, sign });
    }
    append(ast, 1);
    return terms;
  }

  function hasExplicitFactorProduct(ast) {
    const factors = [];
    function append(node, repeats) {
      if (node.type === 'positive' || node.type === 'negative') { append(node.operand, repeats); return; }
      if (node.type === 'multiply') { append(node.left, repeats); append(node.right, repeats); return; }
      if (node.type === 'power') {
        for (let index = 0; index < node.exponent; index += 1) append(node.operand, repeats);
        return;
      }
      for (let index = 0; index < repeats; index += 1) factors.push(node);
    }
    append(ast, 1);
    let nonconstant = 0;
    for (const factor of factors) {
      const poly = expandAst(factor);
      if (Array.from(poly.keys()).some((key) => key !== '')) nonconstant += 1;
      if (nonconstant >= 2) return true;
    }
    return false;
  }

  function checkMethodStep(part, source, sourceAnswers) {
    if (!part || !part.methodInput) return { status: 'not_applicable', message: '本部分沒有代入步驟。', marks: { M: 0 } };
    try {
      const requiredProducts = [];
      const missingSources = [];
      (part.methodInput.sources || []).forEach((sourceId) => {
        const raw = sourceAnswers && sourceAnswers[sourceId] != null ? String(sourceAnswers[sourceId]).trim() : '';
        if (!raw) { missingSources.push(sourceId); return; }
        try {
          const parsed = parseAnswer(raw);
          if (!hasExplicitFactorProduct(parsed.ast)) { missingSources.push(sourceId); return; }
          requiredProducts.push({ sourceId, polynomial: decodePoly(parsed.polynomial) });
        } catch (_) { missingSources.push(sourceId); }
      });
      if (missingSources.length) {
        const missingLabels = missingSources.map((id) => '(' + id + ')').join('、');
        return {
          status: 'missing_substitution', message: '試把 ' + missingLabels + ' 部的答案代入。請先輸入可辨識的因式乘積。',
          marks: { M: 0 }, missingSources
        };
      }

      if (source == null || String(source).trim() === '') {
        return { status: 'missing_substitution', message: '試把 ' + (part.methodInput.sources || []).map((id) => '(' + id + ')').join('、') + ' 部的答案代入。', marks: { M: 0 }, missingSources: (part.methodInput.sources || []).slice() };
      }

      let parsedStep;
      try { parsedStep = parseAnswer(source); }
      catch (error) {
        return { status: 'format_error', message: error.message || '格式無法辨識。', marks: { M: 0 } };
      }

      const stepPolynomial = decodePoly(parsedStep.polynomial);
      const targetPolynomial = decodePoly(part.targetPoly);
      const terms = additiveTerms(parsedStep.ast);
      const usedTerms = new Set();
      const missingProducts = [];
      requiredProducts.forEach((required) => {
        const found = terms.some((term, index) => {
          if (usedTerms.has(index) || !hasExplicitFactorProduct(term.node)) return false;
          const expanded = expandAst(term.node);
          const signed = term.sign < 0 ? negatePoly(expanded) : expanded;
          if (!samePolyUpToSign(signed, required.polynomial)) return false;
          usedTerms.add(index);
          return true;
        });
        if (!found) missingProducts.push(required.sourceId);
      });
      const expansionMatches = polyEqual(stepPolynomial, targetPolynomial);
      if (missingProducts.length) {
        return {
          status: 'missing_substitution', message: '試把 ' + missingProducts.map((id) => '(' + id + ')').join('、') + ' 部的答案代入，並在步驟中保留因式乘積。',
          marks: { M: 0 }, missingSources: missingProducts, expansionMatches,
          studentExpandTex: formatPoly(parsedStep.polynomial), targetExpandTex: formatPoly(part.targetPoly)
        };
      }
      if (!expansionMatches) {
        return {
          status: 'mismatch', message: '代入步驟展開後與本題不相等。', marks: { M: 0 },
          studentExpandTex: formatPoly(parsedStep.polynomial), targetExpandTex: formatPoly(part.targetPoly)
        };
      }
      if (requiredProducts.length === 1) {
        let remainingTerms = new Map();
        terms.forEach((term, index) => {
          if (usedTerms.has(index)) return;
          const expanded = expandAst(term.node);
          remainingTerms = addPoly(remainingTerms, expanded, term.sign < 0 ? -1n : 1n);
        });
        if (!remainingTerms.size) {
          const sourceId = requiredProducts[0].sourceId;
          return {
            status: 'missing_substitution',
            message: '步驟只有最後的乘積答案；請另寫出含 (' + sourceId + ') 部答案因式乘積及其餘題目項的代入算式。',
            marks: { M: 0 }, missingSources: [sourceId],
            studentExpandTex: formatPoly(parsedStep.polynomial), targetExpandTex: formatPoly(part.targetPoly)
          };
        }
      }
      return { status: 'correct', message: '代入步驟成立，展開後與本題相等。', marks: { M: part.marks.M } };
    } catch (_) {
      return { status: 'format_error', message: '步驟太複雜，無法安全核對；請按因式乘積分項重寫。', marks: { M: 0 } };
    }
  }

  function checkAnswer(part, source) {
    let parsed;
    try { parsed = parseAnswer(source); }
    catch (error) { return { status: 'format_error', message: error.message || '格式無法辨識。', marks: { M: 0, A: 0 }, maxMarks: part.maxMarks }; }
    try {
      const student = decodePoly(parsed.polynomial);
      const target = decodePoly(part.targetPoly);
      if (!polyEqual(student, target)) {
        const marks = { M: 0, A: 0 };
        return {
          status: 'mismatch', message: '展開後與題目不相等。', marks, maxMarks: part.maxMarks,
          marksStr: markString(marks, part), studentExpandTex: formatPoly(parsed.polynomial), targetExpandTex: formatPoly(part.targetPoly)
        };
      }
      const shape = matchFactorization(topLevelFactors(parsed.ast), part.expectedFactors);
      if (shape.complete) {
        const marks = { M: 0, A: part.marks.A };
        return { status: 'correct', message: '正確，且已完全因式分解。', marks, maxMarks: part.maxMarks, marksStr: markString(marks, part) };
      }
      if (shape.kind === 'unknown') {
        return { status: 'format_error', message: '答案雖可展開成題目，但無法安全確認每個因式是否已完全分解，請按基本因式重寫。', marks: { M: 0, A: 0 }, maxMarks: part.maxMarks };
      }
      const marks = { M: 0, A: 0 };
      let message = '因式 ' + texInline(shape.factorTex || formatPoly(part.targetPoly)) + ' 仍可再分解。';
      if (shape.kind === 'content') message = '因式 ' + texInline(shape.factorTex) + ' 含整數公因數 ' + shape.divisor + '；請把公因數提出括號。';
      if (shape.kind === 'combined') message = '因式 ' + texInline(shape.factorTex) + ' 仍可分解成 ' + shape.pieces + ' 個基本因式；請逐個括號列出。';
      if (shape.kind === 'missing') message = '答案中仍有可分解的多項式因式，請把每個基本因式分開寫。';
      return { status: 'incomplete', message, marks, maxMarks: part.maxMarks, marksStr: markString(marks, part) };
    } catch (_) {
      return { status: 'format_error', message: '式子結構過於複雜，無法安全判斷；請用較簡單的因式括號重寫。', marks: { M: 0, A: 0 }, maxMarks: part.maxMarks };
    }
  }

  function markString(marks, part) {
    const chunks = [];
    if (part.marks.M) chunks.push('M ' + marks.M + '/' + part.marks.M);
    if (part.marks.A) chunks.push('A ' + marks.A + '/' + part.marks.A);
    return chunks.join('、') || '0 分';
  }

  function chooseTypes(type, count, seed) {
    if (!Number.isInteger(count) || count < 1 || count > 12) throw new Error('題數須為 1 至 12。');
    if (type === '2021' || type === '2019') return Array(count).fill(type);
    if (type !== 'mixed') throw new Error('Unknown question type.');
    const rng = createRng(seed, 'mixed-question-types');
    return Array.from({ length: count }, () => rng.int(2) === 0 ? '2021' : '2019');
  }

  function generateQuestion(type, seed, index) {
    if (type !== '2021' && type !== '2019') throw new Error('Question type must be 2021 or 2019.');
    if (!Number.isInteger(index) || index < 0) throw new Error('Question index must be a non-negative integer.');
    const rng = createRng(seed, index);
    for (let attempt = 0; attempt < 32; attempt += 1) {
      try {
        const q = type === '2021' ? generate2021(seed, index, rng) : generate2019(seed, index, rng);
        assertQuestion(q);
        return q;
      } catch (error) {
        if (!/cross|factor|polynomial|question/i.test(error.message || '')) throw error;
      }
    }
    throw new Error('Unable to generate a self-checked question after 32 attempts.');
  }

  return Object.freeze({
    createRng,
    generateQuestion,
    chooseTypes,
    parseAnswer,
    expand,
    formatPoly,
    checkAnswer,
    checkMethodStep
  });
});
