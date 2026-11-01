(function (global) {
  'use strict';

  const DIGIT_LIMIT = 4;
  const DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'cosec', 'sec', 'cot']);

  function snapshot(value) {
    return { neg: value.neg, frac: value.frac, a: value.a, b: value.b, cur: value.cur };
  }

  function commonDivisor(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  function integerCell(value) {
    return typeof value === 'string' && /^\d{1,4}$/.test(value);
  }

  function parseExpectedFraction(key) {
    const match = /^(-?\d+)\/(\d+)$/.exec(String(key));
    if (!match || Number(match[2]) === 0) return null;
    return { numerator: Number(match[1]), denominator: Number(match[2]) };
  }

  function gradeReference(quadrant, keypadValue, expectedQuadrant, expectedAngle) {
    if (!quadrant || !keypadValue || keypadValue.frac || !integerCell(keypadValue.a)) {
      return { complete: false, correct: false, reason: 'incomplete' };
    }
    return {
      complete: true,
      correct: !keypadValue.neg && Number(quadrant) === expectedQuadrant && Number(keypadValue.a) === expectedAngle,
      reason: null
    };
  }

  function gradeIdentity(sign, fn, correctKey) {
    if ((sign !== '+' && sign !== '-') || !FUNCTIONS.has(fn)) {
      return { complete: false, correct: false, reason: 'incomplete' };
    }
    return { complete: true, correct: sign + ':' + fn === correctKey, reason: null };
  }

  function gradeApplication(keypadValue, correctKey) {
    const expected = parseExpectedFraction(correctKey);
    if (!expected || !keypadValue || !integerCell(keypadValue.a)) {
      return { complete: false, correct: false, reason: 'incomplete' };
    }

    const numerator = (keypadValue.neg ? -1 : 1) * Number(keypadValue.a);
    if (!keypadValue.frac) {
      const correct = expected.denominator === 1 && numerator === expected.numerator;
      return { complete: true, correct, reason: null };
    }

    if (!integerCell(keypadValue.b) || Number(keypadValue.b) === 0) {
      return { complete: false, correct: false, reason: 'incomplete' };
    }
    const denominator = Number(keypadValue.b);
    const equivalent = numerator * expected.denominator === expected.numerator * denominator;
    const simplified = commonDivisor(numerator, denominator) === 1;
    if (equivalent && (denominator === 1 || !simplified)) {
      return { complete: true, correct: false, reason: 'not-simplified' };
    }
    return { complete: true, correct: equivalent && simplified && expected.denominator > 1, reason: null };
  }

  function createCalculator(root, options) {
    if (!root) throw new TypeError('A calculator root element is required.');
    const config = Object.assign({ fractions: true, arrows: true, onChange: function () {} }, options || {});
    const value = { neg: false, frac: false, a: '', b: '', cur: 'a' };
    let disabled = false;
    const keyRows = [
      [['7', '7'], ['8', '8'], ['9', '9'], ['backspace', '⌫']],
      [['4', '4'], ['5', '5'], ['6', '6'], ['clear', 'AC']],
      [['1', '1'], ['2', '2'], ['3', '3'], ['fraction', 'a/b']],
      [['negative', '(−)'], ['0', '0'], ['up', '↑'], ['down', '↓']]
    ];

    root.classList.add('practice-keypad');
    root.innerHTML = '<div class="practice-calculator-display" role="textbox" aria-readonly="true" tabindex="0"></div>' +
      '<div class="practice-keypad-grid" role="group"></div>';
    const display = root.querySelector('.practice-calculator-display');
    const grid = root.querySelector('.practice-keypad-grid');
    grid.setAttribute('aria-label', config.ariaLabel || 'Calculator keypad / 計算機鍵盤');

    keyRows.forEach(function (row) {
      row.forEach(function (item) {
        const key = item[0];
        const label = item[1];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'practice-keypad-key';
        button.dataset.practiceKey = key;
        button.textContent = label;
        if (key === 'fraction' && !config.fractions) button.disabled = true;
        if ((key === 'up' || key === 'down') && !config.arrows) button.disabled = true;
        const accessible = {
          backspace: ['Backspace', '刪除'],
          clear: ['Clear all', '全部清除'],
          fraction: ['Fraction a over b', '輸入分數 a 除 b'],
          negative: ['Toggle negative sign', '切換負號'],
          up: ['Move to numerator', '移至分子'],
          down: ['Move to denominator', '移至分母']
        }[key];
        button.setAttribute('aria-label', accessible ? accessible[0] + ' / ' + accessible[1] : label);
        grid.appendChild(button);
      });
    });

    function render() {
      display.replaceChildren();
      if (value.neg) {
        const sign = document.createElement('span');
        sign.className = 'practice-calculator-sign';
        sign.textContent = '−';
        display.appendChild(sign);
      }
      if (value.frac) {
        appendCell('a', value.a, 'practice-fraction-numerator');
        const fraction = document.createElement('span');
        fraction.className = 'practice-fraction-divider';
        fraction.setAttribute('aria-hidden', 'true');
        display.appendChild(fraction);
        appendCell('b', value.b, 'practice-fraction-denominator');
      } else {
        appendCell('a', value.a, 'practice-integer-cell');
      }
      const currentLabel = value.cur === 'a' ? 'numerator / integer' : 'denominator';
      display.setAttribute('aria-label', (value.neg ? 'negative / 負 ' : '') + (value.frac ? 'fraction / 分數 ' : 'integer / 整數 ') + currentLabel + ' / ' + (value.cur === 'a' ? '分子或整數' : '分母'));
      const empty = 'blank / 空白';
      display.setAttribute('aria-valuetext', (value.neg ? '−' : '') + (value.frac ? (value.a || empty) + ' over / 除 ' + (value.b || empty) : (value.a || empty)));
      config.onChange(snapshot(value));
    }

    function appendCell(which, text, className) {
      const cell = document.createElement('span');
      cell.className = className + (value.cur === which ? ' is-current' : '') + (text ? '' : ' is-empty');
      cell.textContent = text || '　';
      display.appendChild(cell);
    }

    function press(key) {
      if (disabled) return snapshot(value);
      if (DIGITS.has(String(key))) {
        const property = value.frac && value.cur === 'b' ? 'b' : 'a';
        if (value[property].length < DIGIT_LIMIT) value[property] += String(key);
      } else if (key === 'negative') {
        value.neg = !value.neg;
      } else if (key === 'fraction' && config.fractions) {
        if (!value.frac) {
          value.frac = true;
          value.cur = value.a ? 'b' : 'a';
        }
      } else if (key === 'up' && config.arrows && value.frac) {
        value.cur = 'a';
      } else if (key === 'down' && config.arrows && value.frac) {
        value.cur = 'b';
      } else if (key === 'backspace') {
        const property = value.frac && value.cur === 'b' ? 'b' : 'a';
        if (value[property]) value[property] = value[property].slice(0, -1);
        else if (value.frac && value.cur === 'b') value.cur = 'a';
        else if (value.frac && value.cur === 'a') {
          value.frac = false;
          value.b = '';
          value.cur = 'a';
        } else if (value.neg) value.neg = false;
      } else if (key === 'clear') {
        value.neg = false;
        value.frac = false;
        value.a = '';
        value.b = '';
        value.cur = 'a';
      }
      render();
      return snapshot(value);
    }

    grid.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-practice-key]');
      if (button && !button.disabled) press(button.dataset.practiceKey);
    });
    display.addEventListener('click', function (event) {
      if (!value.frac || disabled) return;
      const cell = event.target.closest('.practice-fraction-numerator, .practice-fraction-denominator');
      if (!cell || !display.contains(cell)) return;
      value.cur = cell.classList.contains('practice-fraction-numerator') ? 'a' : 'b';
      render();
    });

    function setDisabled(nextDisabled) {
      disabled = Boolean(nextDisabled);
      grid.querySelectorAll('button').forEach(function (button) { button.disabled = disabled ||
        (button.dataset.practiceKey === 'fraction' && !config.fractions) ||
        (['up', 'down'].includes(button.dataset.practiceKey) && !config.arrows); });
      display.setAttribute('aria-disabled', String(disabled));
    }

    render();
    return {
      getValue: function () { return snapshot(value); },
      setDisabled: setDisabled,
      press: press,
      focus: function () { display.focus(); },
      display: display
    };
  }

  function createModalController(dialog, options) {
    const config = Object.assign({ background: [], onClose: function () {} }, options || {});
    let previousFocus = null;
    function focusables() {
      return Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter(function (element) { return !element.closest('[hidden]') && !element.closest('[inert]'); });
    }
    function setBackgroundInert(inert) {
      config.background.forEach(function (element) {
        if (!element) return;
        element.inert = inert;
        if (inert) element.setAttribute('aria-hidden', 'true');
        else element.removeAttribute('aria-hidden');
      });
    }
    function open(trigger, target) {
      previousFocus = trigger || document.activeElement;
      dialog.hidden = false;
      setBackgroundInert(true);
      const initial = target || dialog.querySelector('[autofocus]') || focusables()[0];
      if (initial) initial.focus();
    }
    function close() {
      if (dialog.hidden) return;
      dialog.hidden = true;
      setBackgroundInert(false);
      config.onClose();
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    }
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) close();
    });
    return { open: open, close: close, isOpen: function () { return !dialog.hidden; } };
  }

  function bindPhysicalKeyboard(options) {
    const config = options;
    function onKeydown(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (config.isModalOpen()) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const tab = target.closest && target.closest('.mode-tab');
        if (tab) {
          event.preventDefault();
          config.onModeArrow(event.key === 'ArrowRight' ? 1 : -1, tab);
          return;
        }
      }
      if ((target.matches && target.matches('input, select, textarea, [contenteditable="true"]')) || target.isContentEditable) return;
      const isButton = Boolean(target.closest && target.closest('button, a, summary'));
      const key = event.key;
      const mode = config.getMode();
      if (/^\d$/.test(key)) {
        if (config.getKeypad() && mode !== 'formula') {
          event.preventDefault();
          config.getKeypad().press(key);
        }
        return;
      }
      if (key === 'Backspace' && config.getKeypad() && mode !== 'formula') {
        event.preventDefault();
        config.getKeypad().press('backspace');
        return;
      }
      if (key === 'Backspace' && mode === 'formula') {
        event.preventDefault();
        config.onFormulaBackspace();
        return;
      }
      if (key === '/' && config.getKeypad() && mode === 'application') {
        event.preventDefault();
        config.getKeypad().press('fraction');
        return;
      }
      if (key === '-' || key === '+') {
        if (mode === 'formula') {
          event.preventDefault();
          config.onFormulaKey(key);
        } else if (key === '-' && config.getKeypad()) {
          event.preventDefault();
          config.getKeypad().press('negative');
        }
        return;
      }
      if ((key === 'ArrowUp' || key === 'ArrowDown') && target.closest && target.closest('#quadrant-group[role="radiogroup"]')) {
        config.onQuadrantArrow(key === 'ArrowUp' ? -1 : 1, target);
        event.preventDefault();
        return;
      }
      if ((key === 'ArrowUp' || key === 'ArrowDown') && config.getKeypad()) {
        event.preventDefault();
        config.getKeypad().press(key === 'ArrowUp' ? 'up' : 'down');
        return;
      }
      if (key === 'Enter' && !isButton) {
        event.preventDefault();
        config.onCheck();
        return;
      }
      if (key.toLowerCase() === 'n') {
        event.preventDefault();
        config.onNext();
      }
    }
    document.addEventListener('keydown', onKeydown);
    return function () { document.removeEventListener('keydown', onKeydown); };
  }

  global.PracticeUI = Object.freeze({
    bindPhysicalKeyboard: bindPhysicalKeyboard,
    createCalculator: createCalculator,
    createModalController: createModalController,
    gradeApplication: gradeApplication,
    gradeIdentity: gradeIdentity,
    gradeReference: gradeReference,
    parseExpectedFraction: parseExpectedFraction
  });
})(window);
