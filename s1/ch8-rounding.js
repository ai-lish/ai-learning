(function (root, factory) {
  'use strict';

  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Ch8Rounding = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const METHODS = ['up', 'down', 'round'];
  const TARGETS = ['place', 'decimal', 'significant'];
  const TEN = 10n;

  function powerOfTen(exponent) {
    if (!Number.isInteger(exponent) || exponent < 0) throw new RangeError('A non-negative integer exponent is required.');
    return TEN ** BigInt(exponent);
  }

  function cleanNumber(value) {
    if (typeof value !== 'string') throw new TypeError('Numbers must be supplied as strings for exact arithmetic.');
    const raw = value.replace(/\s+/g, '');
    if (!/^\d+(?:\.\d+)?$/.test(raw)) throw new TypeError('Expected a positive decimal number written with digits and an optional decimal point.');
    return raw;
  }

  function parseParts(rawValue) {
    const raw = cleanNumber(rawValue);
    const point = raw.indexOf('.');
    const scale = point < 0 ? 0 : raw.length - point - 1;
    const digits = point < 0 ? raw : raw.slice(0, point) + raw.slice(point + 1);
    const coefficient = BigInt(digits);
    return { raw, coefficient, scale };
  }

  function parseNumber(rawValue) {
    const parsed = parseParts(rawValue);
    const { raw, coefficient, scale } = parsed;
    if (coefficient === 0n) throw new RangeError('The number must be greater than zero.');
    return { raw, coefficient, scale };
  }

  function formatNumber(value) {
    const compact = String(value).replace(/\s+/g, '');
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(compact);
    if (!match) return String(value);
    const sign = match[1];
    let integer = match[2];
    const fraction = match[3];
    if (integer.length >= 5) integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    let groupedFraction = '';
    if (fraction !== undefined) {
      for (let i = 0; i < fraction.length; i += 3) {
        groupedFraction += (i ? ' ' : '') + fraction.slice(i, i + 3);
      }
    }
    return sign + integer + (fraction === undefined ? '' : '.' + groupedFraction);
  }

  function placeName(exponent) {
    if (!Number.isInteger(exponent)) throw new TypeError('The place exponent must be an integer.');
    const integerNames = ['個位', '十位', '百位', '千位', '萬位', '十萬位', '百萬位', '千萬位', '億位', '十億位'];
    if (exponent >= 0 && exponent < integerNames.length) return integerNames[exponent];
    if (exponent >= integerNames.length) return '10^' + exponent + ' 位';
    const decimalNames = ['第一位小數', '第二位小數', '第三位小數', '第四位小數', '第五位小數', '第六位小數', '第七位小數', '第八位小數', '第九位小數', '第十位小數'];
    const places = -exponent;
    return places <= decimalNames.length ? decimalNames[places - 1] : '小數點後第 ' + places + ' 位';
  }

  function digitInfo(number, options) {
    const raw = cleanNumber(number);
    const point = raw.indexOf('.') < 0 ? raw.length : raw.indexOf('.');
    const byPlace = new Map();
    const significantIndices = [];
    let firstNonzeroFound = false;
    const chars = Array.from(raw, (char, index) => {
      if (char === '.') return { char, index, kind: 'point', place: null, significantIndex: null };
      const place = index < point ? point - index - 1 : point - index;
      byPlace.set(place, index);
      if (!firstNonzeroFound && char !== '0') firstNonzeroFound = true;
      if (firstNonzeroFound) significantIndices.push(index);
      return { char, index, kind: 'digit', place, significantIndex: firstNonzeroFound ? significantIndices.length : 0 };
    });

    let targetPlace = null;
    let targetIndex = null;
    let nextIndex = null;
    let nextDigit = null;
    const opts = options || {};
    if (Object.prototype.hasOwnProperty.call(opts, 'place')) {
      if (!Number.isInteger(opts.place)) throw new TypeError('The place exponent must be an integer.');
      targetPlace = opts.place;
      targetIndex = byPlace.has(targetPlace) ? byPlace.get(targetPlace) : null;
    } else if (Object.prototype.hasOwnProperty.call(opts, 'significant')) {
      if (!Number.isInteger(opts.significant) || opts.significant < 1 || opts.significant > 4) {
        throw new RangeError('Significant figures must be an integer from 1 to 4.');
      }
      if (significantIndices.length < opts.significant) throw new RangeError('The number does not contain enough written significant digits.');
      targetIndex = significantIndices[opts.significant - 1];
      targetPlace = chars[targetIndex].place;
    }
    if (targetPlace !== null && byPlace.has(targetPlace - 1)) {
      nextIndex = byPlace.get(targetPlace - 1);
      nextDigit = Number(raw[nextIndex]);
    }
    return {
      raw,
      chars,
      decimalIndex: point,
      significantIndices,
      targetPlace,
      targetIndex,
      nextIndex,
      nextDigit
    };
  }

  function fixedAtPlace(units, place) {
    if (place >= 0) return (units * powerOfTen(place)).toString();
    const scale = -place;
    let digits = units.toString().padStart(scale + 1, '0');
    return digits.slice(0, -scale) + '.' + digits.slice(-scale);
  }

  function topExponent(value) {
    const parts = value.split('.');
    const integer = parts[0].replace(/^0+/, '');
    if (integer) return integer.length - 1;
    const fraction = parts[1] || '';
    const first = fraction.search(/[1-9]/);
    return first < 0 ? null : -(first + 1);
  }

  function fixedSignificantAtPlace(units, place, significant) {
    const fixed = fixedAtPlace(units, place);
    const exponent = topExponent(fixed);
    if (exponent === null) throw new RangeError('A rounded endpoint cannot be zero for significant figures.');
    const outputPlace = exponent - significant + 1;
    if (outputPlace < place) throw new Error('The endpoint cannot be represented at the requested significant precision.');
    const divisor = powerOfTen(outputPlace - place);
    if (units % divisor !== 0n) throw new Error('The endpoint is not exact at the requested significant precision.');
    return fixedAtPlace(units / divisor, outputPlace);
  }

  function makeQuestion(options) {
    if (!options || typeof options !== 'object') throw new TypeError('Question options are required.');
    const mode = options.mode;
    if (!METHODS.includes(mode)) throw new TypeError('Mode must be up, down, or round.');
    const requestedPlace = options.targetPlace === undefined ? options.place : options.targetPlace;
    const targetType = options.targetType || (Object.prototype.hasOwnProperty.call(options, 'significant') ? 'significant' : (requestedPlace < 0 ? 'decimal' : 'place'));
    if (!TARGETS.includes(targetType)) throw new TypeError('Target type must be place, decimal, or significant.');

    const raw = cleanNumber(options.number);
    const parsed = parseNumber(raw);
    let targetPlace;
    let significant;
    let info;
    if (targetType === 'significant') {
      significant = options.significant;
      info = digitInfo(raw, { significant });
      targetPlace = info.targetPlace;
    } else {
      targetPlace = requestedPlace;
      if (!Number.isInteger(targetPlace)) throw new TypeError('A target place exponent is required.');
      if (targetType === 'decimal' && targetPlace >= 0) throw new RangeError('Decimal-place targets must use a negative exponent.');
      if (targetType === 'place' && targetPlace < 0) throw new RangeError('Place-value targets must use zero or a positive exponent.');
      info = digitInfo(raw, { place: targetPlace });
    }

    if (info.targetIndex === null) throw new RangeError('The target digit is not written in the number.');
    if (info.nextIndex === null) throw new RangeError('The number must include a digit to the right of its target digit.');
    const divisorPower = parsed.scale + targetPlace;
    if (divisorPower < 0) throw new RangeError('The target place is finer than the written number.');
    const divisor = powerOfTen(divisorPower);
    const quotient = parsed.coefficient / divisor;
    const remainder = parsed.coefficient % divisor;
    if (remainder === 0n) throw new RangeError('The source number must not be an exact endpoint.');
    const nextDigit = info.nextDigit;
    const expectedSide = mode === 'up' ? 'high' : mode === 'down' ? 'low' : nextDigit >= 5 ? 'high' : 'low';
    const low = targetType === 'significant'
      ? fixedSignificantAtPlace(quotient, targetPlace, significant)
      : fixedAtPlace(quotient, targetPlace);
    const highUnits = quotient + 1n;
    const high = targetType === 'significant'
      ? fixedSignificantAtPlace(highUnits, targetPlace, significant)
      : fixedAtPlace(highUnits, targetPlace);
    const answer = expectedSide === 'high' ? high : low;
    const question = {
      number: raw,
      mode,
      targetType,
      targetIndex: info.targetIndex,
      nextDigit,
      low,
      high,
      answer,
      expectedSide,
      targetPlace
    };
    if (significant !== undefined) question.significant = significant;
    return question;
  }

  function randomInt(rng, minimum, maximum) {
    const sample = rng();
    if (typeof sample !== 'number' || !Number.isFinite(sample)) throw new TypeError('The random source must return a finite number.');
    const clamped = Math.max(0, Math.min(0.9999999999999999, sample));
    return minimum + Math.floor(clamped * (maximum - minimum + 1));
  }

  function randomDigits(rng, length, firstNonzero) {
    let result = '';
    for (let i = 0; i < length; i += 1) result += String(randomInt(rng, i === 0 && firstNonzero ? 1 : 0, 9));
    return result;
  }

  function generatePlaceNumber(rng) {
    const length = randomInt(rng, 3, 7);
    return randomDigits(rng, length, true);
  }

  function generateDecimalNumber(rng) {
    const integer = String(randomInt(rng, 0, 999));
    const targetDigits = randomInt(rng, 1, 3);
    const extraDigits = randomInt(rng, 1, 3);
    let fraction = randomDigits(rng, targetDigits + extraDigits, false);
    if (!/[1-9]/.test(fraction.slice(targetDigits))) {
      fraction = fraction.slice(0, -1) + '1';
    }
    return { number: integer + '.' + fraction, targetPlace: -targetDigits };
  }

  function nonzeroTail(rng, length, firstDigit) {
    let tail = firstDigit === undefined ? '' : String(firstDigit);
    for (let i = tail.length; i < length; i += 1) tail += String(randomInt(rng, 0, 9));
    if (tail && !/[1-9]/.test(tail)) tail = tail.slice(0, -1) + '1';
    return tail;
  }

  function generateSignificantNumber(rng, significant, decimal) {
    if (significant === 4 && decimal && randomInt(rng, 0, 7) === 0) {
      const next = String(randomInt(rng, 5, 9));
      const extraCount = randomInt(rng, 0, 2);
      return '209.9' + nonzeroTail(rng, 1 + extraCount, next);
    }
    const carries = randomInt(rng, 0, 4) === 0;
    const kept = randomDigits(rng, significant, true).split('');
    if (carries) kept[kept.length - 1] = '9';
    const next = carries ? String(randomInt(rng, 5, 9)) : String(randomInt(rng, 0, 9));
    const extraCount = randomInt(rng, 0, 2);
    const tail = nonzeroTail(rng, 1 + extraCount, next);
    const meaningful = kept.join('') + tail;

    if (!decimal) return meaningful;

    if (randomInt(rng, 0, 1) === 0) {
      const leadingZeros = randomInt(rng, 0, 3);
      return '0.' + '0'.repeat(leadingZeros) + meaningful;
    }
    const wholeLength = randomInt(rng, 1, Math.min(significant, 3));
    const whole = meaningful.slice(0, wholeLength);
    const fractional = meaningful.slice(wholeLength);
    return whole + '.' + fractional;
  }

  function generateFor(method, target, rng) {
    if (!METHODS.includes(method)) throw new TypeError('Method must be up, down, or round.');
    if (!TARGETS.includes(target)) throw new TypeError('Target must be place, decimal, or significant.');
    const random = rng === undefined ? Math.random : rng;
    if (typeof random !== 'function') throw new TypeError('The random source must be a function.');

    if (target === 'place') {
      let number;
      let place;
      do {
        number = generatePlaceNumber(random);
        place = randomInt(random, 1, Math.min(5, number.length - 1));
        if (BigInt(number) % powerOfTen(place) === 0n) {
          number = number.slice(0, -1) + '1';
        }
      } while (BigInt(number) % powerOfTen(place) === 0n);
      return makeQuestion({ number, mode: method, targetType: target, targetPlace: place });
    }

    if (target === 'decimal') {
      let question;
      do {
        const generated = generateDecimalNumber(random);
        question = makeQuestion({ number: generated.number, mode: method, targetType: target, targetPlace: generated.targetPlace });
      } while (parseParts(question.low).coefficient === 0n);
      return question;
    }

    const significant = randomInt(random, 1, 4);
    const decimal = randomInt(random, 0, 1) === 1;
    const number = generateSignificantNumber(random, significant, decimal);
    return makeQuestion({ number, mode: method, targetType: target, significant });
  }

  function selectedKeys(value, allowed, label) {
    if (!Array.isArray(value) || value.length === 0) throw new TypeError('At least one ' + label + ' must be selected.');
    const selected = Array.from(new Set(value));
    if (selected.some(item => !allowed.includes(item))) throw new TypeError('Unknown ' + label + ' selection.');
    return selected;
  }

  function choose(rng, values) {
    return values[randomInt(rng, 0, values.length - 1)];
  }

  function generateQuestion(selection, rng) {
    const options = selection || { methods: METHODS, targets: TARGETS };
    if (typeof options !== 'object') throw new TypeError('Selections must be supplied as an object.');
    const methods = selectedKeys(options.methods || METHODS, METHODS, 'method');
    const targets = selectedKeys(options.targets || TARGETS, TARGETS, 'target');
    const random = rng === undefined ? Math.random : rng;
    if (typeof random !== 'function') throw new TypeError('The random source must be a function.');
    const method = choose(random, methods);
    const target = choose(random, targets);
    return generateFor(method, target, random);
  }

  function toggleSelection(currentArray, value) {
    if (!Array.isArray(currentArray)) throw new TypeError('The current selection must be an array.');
    const values = currentArray.slice();
    const index = values.indexOf(value);
    if (index < 0) {
      values.push(value);
      return { values, rejected: false };
    }
    if (values.length <= 1) return { values, rejected: true };
    values.splice(index, 1);
    return { values, rejected: false };
  }

  function compareDecimalValues(left, right) {
    const a = parseParts(left);
    const b = parseParts(right);
    const scale = Math.max(a.scale, b.scale);
    return a.coefficient * powerOfTen(scale - a.scale) === b.coefficient * powerOfTen(scale - b.scale);
  }

  function inspectAnswer(input, expected) {
    const value = String(input === null || input === undefined ? '' : input).replace(/\s+/g, '');
    if (!value) return { status: 'empty' };
    const expectedValue = expected && typeof expected === 'object'
      ? (expected.answerRaw || expected.answer)
      : expected;
    let wanted;
    try {
      wanted = cleanNumber(String(expectedValue));
      cleanNumber(value);
    } catch (error) {
      return { status: 'wrong' };
    }
    if (value === wanted) return { status: 'correct' };
    try {
      if (compareDecimalValues(value, wanted)) return { status: 'precision' };
    } catch (error) {
      return { status: 'wrong' };
    }
    return { status: 'wrong' };
  }

  return {
    METHODS: METHODS.slice(),
    TARGETS: TARGETS.slice(),
    digitInfo,
    formatNumber,
    generateFor,
    generateQuestion,
    inspectAnswer,
    makeQuestion,
    placeName,
    toggleSelection
  };
}));
