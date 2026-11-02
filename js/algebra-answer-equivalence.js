function normalizeAlgebraAnswer(value) {
    const superscripts = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\\left|\\right/g, '')
        .replace(/\\times|\\cdot|×|·/g, '*')
        .replace(/\\div|÷/g, '/')
        .replace(/[−–]/g, '-')
        .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (character) => '^' + superscripts[character])
        .replace(/\\[(),]/g, '')
        .replace(/\\,/g, '')
        .replace(/\s+/g, '');
}

function algebraAnswersEquivalent(leftInput, rightInput) {
    const text = normalizeAlgebraAnswer(leftInput);
    const otherText = normalizeAlgebraAnswer(rightInput);
    if (!text || !otherText || text.length > 256 || otherText.length > 256) return false;

    const rational = (numerator, denominator = 1n) => {
        if (denominator === 0n) return null;
        let n = numerator;
        let d = denominator;
        if (d < 0n) { n = -n; d = -d; }
        let a = n < 0n ? -n : n;
        let b = d;
        while (b !== 0n) [a, b] = [b, a % b];
        const divisor = a || 1n;
        return { n: n / divisor, d: d / divisor };
    };
    const addRational = (left, right) => rational(left.n * right.d + right.n * left.d, left.d * right.d);
    const multiplyRational = (left, right) => rational(left.n * right.n, left.d * right.d);
    const negateRational = (value) => ({ n: -value.n, d: value.d });
    const isZeroRational = (value) => value.n === 0n;

    const zeroPolynomial = () => new Map();
    const constantPolynomial = (value) => isZeroRational(value) ? zeroPolynomial() : new Map([['', value]]);
    const variablePolynomial = (name) => new Map([[`${name}^1`, rational(1n)]]);
    const addPolynomial = (left, right, rightSign = 1n) => {
        const result = new Map(left);
        for (const [monomial, coefficient] of right) {
            const signed = rightSign === 1n ? coefficient : negateRational(coefficient);
            const sum = result.has(monomial) ? addRational(result.get(monomial), signed) : signed;
            if (isZeroRational(sum)) result.delete(monomial);
            else result.set(monomial, sum);
        }
        return result;
    };
    const multiplyMonomials = (left, right) => {
        const powers = Object.create(null);
        for (const monomial of [left, right]) {
            if (!monomial) continue;
            for (const factor of monomial.split('*')) {
                const match = /^([a-z])\^(\d+)$/.exec(factor);
                if (!match) return null;
                powers[match[1]] = (powers[match[1]] || 0) + Number(match[2]);
            }
        }
        return Object.keys(powers).sort().map((name) => `${name}^${powers[name]}`).join('*');
    };
    const multiplyPolynomial = (left, right) => {
        const result = zeroPolynomial();
        for (const [leftMonomial, leftCoefficient] of left) {
            for (const [rightMonomial, rightCoefficient] of right) {
                const monomial = multiplyMonomials(leftMonomial, rightMonomial);
                if (monomial === null) return null;
                const product = multiplyRational(leftCoefficient, rightCoefficient);
                const sum = result.has(monomial) ? addRational(result.get(monomial), product) : product;
                if (isZeroRational(sum)) result.delete(monomial);
                else result.set(monomial, sum);
                if (result.size > 256) return null;
            }
        }
        return result;
    };
    const zeroFunction = () => ({ numerator: zeroPolynomial(), denominator: constantPolynomial(rational(1n)) });
    const constantFunction = (value) => ({ numerator: constantPolynomial(value), denominator: constantPolynomial(rational(1n)) });
    const variableFunction = (name) => ({ numerator: variablePolynomial(name), denominator: constantPolynomial(rational(1n)) });
    const addFunction = (left, right, subtract = false) => {
        const leftPart = multiplyPolynomial(left.numerator, right.denominator);
        const rightPart = multiplyPolynomial(right.numerator, left.denominator);
        const denominator = multiplyPolynomial(left.denominator, right.denominator);
        if (!leftPart || !rightPart || !denominator) return null;
        return { numerator: addPolynomial(leftPart, rightPart, subtract ? -1n : 1n), denominator };
    };
    const multiplyFunction = (left, right) => {
        const numerator = multiplyPolynomial(left.numerator, right.numerator);
        const denominator = multiplyPolynomial(left.denominator, right.denominator);
        return numerator && denominator ? { numerator, denominator } : null;
    };
    const divideFunction = (left, right) => {
        if (right.numerator.size === 0) return null;
        const numerator = multiplyPolynomial(left.numerator, right.denominator);
        const denominator = multiplyPolynomial(left.denominator, right.numerator);
        return numerator && denominator ? { numerator, denominator } : null;
    };
    const negateFunction = (value) => ({
        numerator: new Map([...value.numerator].map(([monomial, coefficient]) => [monomial, negateRational(coefficient)])),
        denominator: value.denominator
    });
    const powerFunction = (value, power) => {
        if (!Number.isInteger(power) || power < 0 || power > 12) return null;
        let result = constantFunction(rational(1n));
        for (let index = 0; index < power; index += 1) {
            result = multiplyFunction(result, value);
            if (!result) return null;
        }
        return result;
    };

    function parseFunction(sourceText) {
        const tokens = [];
        for (let index = 0; index < sourceText.length;) {
            const rest = sourceText.slice(index);
            const number = /^\d+(?:\.\d+)?|^\.\d+/.exec(rest);
            if (number) {
                tokens.push({ type: 'number', value: number[0] });
                index += number[0].length;
            } else if (/[a-z]/.test(sourceText[index])) {
                tokens.push({ type: 'variable', value: sourceText[index] });
                index += 1;
            } else if ('()+-*/^'.includes(sourceText[index])) {
                tokens.push({ type: sourceText[index], value: sourceText[index] });
                index += 1;
            } else {
                return null;
            }
            if (tokens.length > 256) return null;
        }
        if (!tokens.length) return null;

        let cursor = 0;
        const current = () => tokens[cursor];
        const parseDecimal = (value) => {
            const [whole, fractional = ''] = value.split('.');
            const denominator = 10n ** BigInt(fractional.length);
            return rational(BigInt((whole || '0') + fractional), denominator);
        };
        const startsPrimary = (token) => token && (token.type === 'number' || token.type === 'variable' || token.type === '(');

        function parsePrimary() {
            const token = current();
            if (!token) return null;
            if (token.type === 'number') {
                cursor += 1;
                const value = parseDecimal(token.value);
                return value ? constantFunction(value) : null;
            }
            if (token.type === 'variable') {
                cursor += 1;
                return variableFunction(token.value);
            }
            if (token.type === '(') {
                cursor += 1;
                const value = parseExpression();
                if (!value || !current() || current().type !== ')') return null;
                cursor += 1;
                return value;
            }
            return null;
        }

        function parsePower() {
            let value = parsePrimary();
            if (!value) return null;
            if (current() && current().type === '^') {
                cursor += 1;
                const exponent = current();
                if (!exponent || exponent.type !== 'number' || !/^\d+$/.test(exponent.value)) return null;
                cursor += 1;
                value = powerFunction(value, Number(exponent.value));
            }
            return value;
        }

        function parseUnary() {
            const token = current();
            if (token && (token.type === '+' || token.type === '-')) {
                cursor += 1;
                const value = parseUnary();
                return value && token.type === '-' ? negateFunction(value) : value;
            }
            return parsePower();
        }

        function parseTerm() {
            let value = parseUnary();
            if (!value) return null;
            while (current()) {
                const token = current();
                if (token.type === '*' || token.type === '/') {
                    cursor += 1;
                    const right = parseUnary();
                    if (!right) return null;
                    value = token.type === '*' ? multiplyFunction(value, right) : divideFunction(value, right);
                    if (!value) return null;
                } else if (startsPrimary(token)) {
                    if (tokens[cursor - 1] && tokens[cursor - 1].type === 'number' && token.type === 'number') return null;
                    const right = parseUnary();
                    if (!right) return null;
                    value = multiplyFunction(value, right);
                    if (!value) return null;
                } else {
                    break;
                }
            }
            return value;
        }

        function parseExpression() {
            let value = parseTerm();
            if (!value) return null;
            while (current() && (current().type === '+' || current().type === '-')) {
                const subtract = current().type === '-';
                cursor += 1;
                const right = parseTerm();
                if (!right) return null;
                value = addFunction(value, right, subtract);
                if (!value) return null;
            }
            return value;
        }

        const value = parseExpression();
        return value && cursor === tokens.length ? value : null;
    }

    const left = parseFunction(text);
    const right = parseFunction(otherText);
    if (!left || !right) return false;
    const leftCrossProduct = multiplyPolynomial(left.numerator, right.denominator);
    const rightCrossProduct = multiplyPolynomial(right.numerator, left.denominator);
    if (!leftCrossProduct || !rightCrossProduct) return false;
    return addPolynomial(leftCrossProduct, rightCrossProduct, -1n).size === 0;
}

function isCollectedExpandedPolynomial(value) {
    const text = normalizeAlgebraAnswer(value);
    if (!text || text.length > 256) return false;
    if (text === '0' || text === '-0') return true;
    if (/[()*/]/.test(text)) return false;

    const monomials = new Set();
    let cursor = 0;
    while (cursor < text.length) {
        let sign = '';
        if (text[cursor] === '+' || text[cursor] === '-') sign = text[cursor++];
        if (cursor >= text.length) return false;
        const start = cursor;
        while (cursor < text.length && text[cursor] !== '+' && text[cursor] !== '-') cursor += 1;
        const term = text.slice(start, cursor);
        if (!term) return false;
        if (/^\d+(?:\.\d+)?$/.test(term)) {
            if (Number(term) === 0) return false;
            if (monomials.has('')) return false;
            monomials.add('');
            continue;
        }

        const coefficientMatch = /^(\d+)?/.exec(term);
        const coefficientText = coefficientMatch ? coefficientMatch[0] : '';
        const variablesText = term.slice(coefficientText.length);
        if (coefficientText && Number(coefficientText) <= 1) return false;
        const powers = Object.create(null);
        let consumed = 0;
        const variablePattern = /([a-z])(?:\^(\d+))?/g;
        let match;
        while ((match = variablePattern.exec(variablesText))) {
            if (match.index !== consumed) return false;
            const power = Number(match[2] || '1');
            if (!Number.isInteger(power) || power < 1 || power > 12 || powers[match[1]]) return false;
            powers[match[1]] = power;
            consumed = variablePattern.lastIndex;
        }
        if (!Object.keys(powers).length || consumed !== variablesText.length) return false;
        const monomial = Object.keys(powers).sort().map((name) => `${name}^${powers[name]}`).join('*');
        if (monomials.has(monomial)) return false;
        monomials.add(monomial);
        if (!sign && start === 0 && term === '') return false;
    }
    return true;
}
