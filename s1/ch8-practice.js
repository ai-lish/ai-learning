(function () {
  'use strict';

  const math = window.Ch8Rounding;
  const methods = { up: '上捨入', down: '下捨入', round: '四捨五入' };
  const targets = { place: '指定位值', decimal: '小數位', significant: '有效數字' };
  const state = {
    methods: Object.keys(methods), targets: Object.keys(targets), way: 'steps',
    right: 0, tried: 0, stats: {}, number: 0, question: null, counted: false
  };
  for (const mode of state.methods) {
    state.stats[mode] = {};
    for (const target of state.targets) {
      state.stats[mode][target] = { right: 0, tried: 0 };
    }
  }
  const statCells = document.querySelectorAll('#type-stats td');
  const main = document.getElementById('exercise');
  main.innerHTML = `
    <section class="ch8-card" aria-labelledby="question">
      <p class="ch8-meta" id="question-type"></p>
      <p class="ch8-meta" id="question-number"></p>
      <h2 class="ch8-question" id="question"></h2>
      <div class="ch8-steps" id="steps">
        <ol class="ch8-progress" aria-label="作答步驟">
          <li>① 找位值</li><li>② 畫間尺</li><li>③ 看下一位</li><li>④ 取值</li>
        </ol>
        <p class="ch8-prompt" id="step-prompt" tabindex="-1"></p>
        <div class="ch8-digits" id="digits" role="group" aria-label="點選數字"></div>
        <div class="ch8-ruler-panel" id="ruler-panel" hidden>
          <div class="ch8-pair">
            <label class="ch8-endpoint" id="low-box"><span>下捨入</span>
              <input class="ch8-number-input" id="low" type="text" inputmode="none" autocomplete="off" maxlength="24" aria-label="下捨入答案" placeholder="？">
            </label>
            <label class="ch8-endpoint" id="high-box"><span>上捨入</span>
              <input class="ch8-number-input" id="high" type="text" inputmode="none" autocomplete="off" maxlength="24" aria-label="上捨入答案" placeholder="？">
            </label>
          </div>
          <div class="ch8-ruler-wrap" id="ruler-wrap" hidden>
            <div class="ch8-ruler" aria-hidden="true"><div class="ch8-ruler-bar"></div><div id="ticks"></div><div class="ch8-marker" id="marker"></div></div>
            <label class="ch8-slide-label" id="slide-label">拉動標記至下一位的數字：<span id="slide-value">0</span>
              <span class="ch8-slider-track"><input id="next-digit" type="range" min="0" max="9" step="1" value="0" aria-label="下一位的數字"></span>
            </label>
            <p class="ch8-half" id="half-note" hidden></p>
          </div>
        </div>
        <div class="ch8-final" id="final" hidden>
          <div class="ch8-pair" role="group" aria-label="最終取值">
            <button type="button" class="ch8-choice value" data-side="low" aria-pressed="false"></button>
            <button type="button" class="ch8-choice value" data-side="high" aria-pressed="false"></button>
          </div>
          <div class="ch8-sentences" role="group" aria-label="答句">
            <button type="button" class="ch8-choice" data-sentence="down" aria-pressed="false"></button>
            <button type="button" class="ch8-choice" data-sentence="round" aria-pressed="false"></button>
            <button type="button" class="ch8-choice" data-sentence="up" aria-pressed="false"></button>
          </div>
          <p class="ch8-final-line" id="final-line" aria-live="polite"></p>
        </div>
      </div>
      <div class="ch8-direct" id="direct" hidden>
        <span id="direct-number"></span>
        <label><span class="ch8-sr-only">答案</span><input class="ch8-number-input" id="answer" type="text" inputmode="none" autocomplete="off" maxlength="24" aria-label="答案"></label>
      </div>
      <p class="feedback ch8-feedback" id="feedback" role="status" aria-live="polite"></p>
      <div class="practice-keypad-grid ch8-keypad" id="keypad" role="group" aria-label="數字鍵盤" hidden></div>
      <div class="ch8-actions">
        <button class="practice-button" type="button" id="reset">重做此題</button>
        <button class="practice-button primary" type="button" id="check">核對</button>
      </div>
    </section>`;

  const get = id => document.getElementById(id);
  const fmt = value => math.formatNumber(value);
  const inputs = ['low', 'high', 'answer'];
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'backspace', 'clear'];
  keys.forEach(key => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'practice-keypad-key' + (key === 'clear' ? ' ch8-clear' : '');
    button.dataset.key = key;
    button.textContent = key === 'backspace' ? '⌫' : key === 'clear' ? '清除' : key;
    button.setAttribute('aria-label', key === 'backspace' ? '刪除一位' : key === '.' ? '小數點' : button.textContent);
    get('keypad').appendChild(button);
  });
  for (let n = 0; n <= 10; n += 1) {
    const tick = document.createElement('span');
    tick.className = 'ch8-tick' + (n === 0 || n === 10 ? ' end' : n === 5 ? ' middle' : '');
    tick.style.left = n * 10 + '%';
    get('ticks').appendChild(tick);
    if (n > 0 && n < 10) {
      const label = document.createElement('span');
      label.className = 'ch8-tick-label';
      label.style.left = n * 10 + '%';
      label.textContent = n === 5 ? '5 一半' : String(n);
      get('ticks').appendChild(label);
    }
  }

  function resetWork() {
    // A retry or a change of answer method stays on the same scored question.
    Object.assign(state, { step: 1, field: 'low', low: '', high: '', answer: '', slide: 0,
      side: null, sentence: null, done: false, message: '', feedback: '' });
  }

  function nextQuestion() {
    state.question = math.generateQuestion({ methods: state.methods, targets: state.targets });
    state.number += 1;
    state.counted = false;
    resetWork();
    renderDigits();
    renderTypeStats();
    render();
  }

  function targetName() {
    const q = state.question;
    return q.targetType === 'significant' ? `第 ${q.significant} 個有效數字` : math.placeName(q.targetPlace);
  }

  function digitDetails() {
    const q = state.question;
    const point = q.number.includes('.') ? q.number.indexOf('.') : q.number.length;
    let count = 0;
    return Array.from(q.number, (ch, index) => {
      if (ch === '.') return { ch, index, point: true };
      if (count || ch !== '0') count += 1;
      return { ch, index, count, place: index < point ? point - index - 1 : point - index };
    });
  }

  function renderDigits() {
    get('digits').replaceChildren();
    const q = state.question;
    let rawIndex = 0;
    let grouped = false;
    const details = digitDetails();
    Array.from(fmt(q.number)).forEach(ch => {
      if (ch === ' ') { grouped = true; return; }
      const detail = details[rawIndex];
      const cell = document.createElement('div');
      cell.className = 'ch8-digit' + (detail.point ? ' point' : '') + (grouped ? ' group-start' : '');
      cell.dataset.index = rawIndex;
      grouped = false;
      const badge = document.createElement('span');
      badge.className = 'ch8-sig-badge';
      badge.setAttribute('aria-hidden', 'true');
      cell.appendChild(badge);
      const digit = document.createElement(detail.point ? 'span' : 'button');
      digit.textContent = ch;
      if (detail.point) digit.className = 'ch8-point';
      else {
        digit.type = 'button';
        digit.dataset.digit = rawIndex;
        digit.setAttribute('aria-label', `數字 ${ch}，${math.placeName(detail.place)}`);
      }
      cell.appendChild(digit);
      const note = document.createElement('span');
      note.className = 'ch8-digit-note';
      cell.appendChild(note);
      get('digits').appendChild(cell);
      rawIndex += 1;
    });
  }

  function updateDigits() {
    const q = state.question;
    const found = state.step > 1;
    const isSf = q.targetType === 'significant';
    const details = digitDetails();
    const nextIndex = details.find(d => d.index > q.targetIndex && !d.point).index;
    get('digits').querySelectorAll('.ch8-digit').forEach(cell => {
      const d = details[Number(cell.dataset.index)];
      let role = '';
      if (found && !d.point) {
        if (d.index > q.targetIndex) role = d.index === nextIndex && state.step >= 3 ? 'next' : 'after';
        else if (isSf) role = d.count === 0 ? 'lead' : 'sig';
        else if (d.index === q.targetIndex) role = 'target';
      }
      ['target', 'sig', 'lead', 'next', 'after'].forEach(name => cell.classList.toggle(name, role === name));
      cell.querySelector('.ch8-sig-badge').textContent = role === 'sig' ? d.count : '';
      cell.querySelector('.ch8-digit-note').textContent = role === 'lead' ? '不計' : role === 'next' ? '下一位' : role === 'target' ? targetName() : '';
      cell.querySelector('.ch8-sig-badge').hidden = !isSf;
      const button = cell.querySelector('button');
      if (button) button.disabled = found;
    });
  }

  function renderTypeStats() {
    for (const cell of statCells) {
      const { mode, target } = cell.dataset;
      const { right, tried } = state.stats[mode][target];
      cell.textContent = tried ? `${right}/${tried}` : '—';
      cell.setAttribute('aria-label', `${methods[mode]}・${targets[target]}：答對 ${right} 題，已答 ${tried} 題`);
      if (mode === state.question.mode && target === state.question.targetType) {
        cell.setAttribute('aria-current', 'true');
      } else {
        cell.removeAttribute('aria-current');
      }
      cell.classList.toggle('is-filtered', !state.methods.includes(mode) || !state.targets.includes(target));
    }
  }

  function sentenceVerb(mode) {
    return mode === 'round' ? '捨入' : methods[mode];
  }

  function answerSentence(q, mode) {
    const to = q.targetType === 'significant' ? ` ${q.significant} 個有效數字` :
      q.targetType === 'decimal' ? `${['', '一', '二', '三'][-q.targetPlace]}位小數` : `最接近的${math.placeName(q.targetPlace)}`;
    return `${sentenceVerb(mode)}至${to}`;
  }

  function render() {
    const q = state.question;
    const steps = state.way === 'steps';
    get('question-type').textContent = `${methods[q.mode]} · ${targets[q.targetType]}`;
    get('question-number').textContent = `第 ${state.number} 題`;
    get('question').textContent = `把 ${fmt(q.number)} ${answerSentence(q, q.mode)}。`;
    get('score').textContent = `分數 ${state.right} / ${state.tried}`;
    get('score').setAttribute('aria-label', `分數：答對 ${state.right} 題，已答 ${state.tried} 題`);
    document.querySelectorAll('[data-way]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.way === state.way)));
    get('steps').hidden = !steps;
    get('direct').hidden = steps;
    main.querySelectorAll('.ch8-progress li').forEach((li, i) => {
      li.classList.toggle('current', i + 1 === state.step && !state.done);
      li.classList.toggle('past', i + 1 < state.step || state.done);
      if (i + 1 === state.step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    const prompts = ['', `點擊${targetName()}${q.targetType === 'significant' ? '，即要保留的最後一位' : ''}。`,
      '畫間尺：在兩端輸入下捨入及上捨入的答案。', '拉動標記至下一位的數字，看看有沒有過半。',
      '點選最終取值，再選擇配合題目要求的答句。'];
    get('step-prompt').textContent = state.done ? '完成！' : prompts[state.step];
    updateDigits();
    get('ruler-panel').hidden = state.step < 2;
    get('ruler-wrap').hidden = state.step < 3;
    get('slide-label').hidden = state.step !== 3;
    get('next-digit').value = state.slide;
    get('next-digit').setAttribute('aria-valuetext', `標記在 ${state.slide}`);
    get('slide-value').textContent = state.slide;
    get('marker').style.left = state.slide * 10 + '%';
    get('half-note').hidden = state.step < 4;
    get('half-note').textContent = `下一位是 ${q.nextDigit}：${q.nextDigit >= 5 ? '已過半（≥ 5）' : '未過半（< 5）'}`;
    ['low', 'high'].forEach(side => {
      get(side).value = state.step >= 3 ? fmt(q[side]) : state[side];
      get(side).readOnly = state.step !== 2;
      get(side + '-box').classList.toggle('active', state.step === 2 && state.field === side);
    });
    get('final').hidden = state.step < 4;
    main.querySelectorAll('[data-side]').forEach(button => {
      button.textContent = fmt(q[button.dataset.side]);
      button.setAttribute('aria-pressed', String(button.dataset.side === state.side));
      button.classList.toggle('is-correct', state.done && button.dataset.side === q.expectedSide);
      button.disabled = state.done;
    });
    main.querySelectorAll('[data-sentence]').forEach(button => {
      button.textContent = answerSentence(q, button.dataset.sentence);
      button.setAttribute('aria-pressed', String(button.dataset.sentence === state.sentence));
      button.disabled = state.done || !state.side;
    });
    get('final-line').textContent = `${fmt(q.number)} ≈ ${state.side ? fmt(q[state.side]) : '＿＿'}（${state.sentence ? answerSentence(q, state.sentence) : '＿＿'}）`;
    get('direct-number').textContent = fmt(q.number) + ' ≈';
    get('answer').value = state.answer;
    get('answer').readOnly = state.done;
    get('keypad').hidden = state.done || (steps && state.step !== 2);
    // Direct mode already has its clear action beside Check.
    main.querySelector('[data-key="clear"]').hidden = !steps;
    get('feedback').textContent = state.message;
    get('feedback').className = 'feedback ch8-feedback ' + (state.message ? state.feedback : '');
    get('check').textContent = state.done ? '下一題' : '核對';
    get('reset').textContent = steps ? '重做此題' : '清除';
    get('reset').disabled = !steps && state.done;
  }

  function say(message, kind) {
    state.message = message;
    state.feedback = kind;
    render();
  }

  function score(correct) {
    if (state.counted) return;
    const { mode, targetType } = state.question;
    const record = state.stats[mode][targetType];
    state.counted = true;
    state.tried += 1;
    record.tried += 1;
    if (correct) {
      state.right += 1;
      record.right += 1;
    }
    renderTypeStats();
  }

  function precisionMessage(expected) {
    return `數值相同，但書寫精確度不符。請保留所需的尾部 0，寫成 ${fmt(expected)}。本次不計分，請再作答。`;
  }

  function check() {
    const q = state.question;
    if (state.done) { nextQuestion(); get('question').scrollIntoView({ block: 'nearest' }); return; }
    if (state.way === 'direct') {
      const result = math.inspectAnswer(state.answer, q.answer).status;
      if (result === 'empty') { say('請先輸入答案。', 'neutral'); return; }
      if (result === 'precision') { say(precisionMessage(q.answer), 'neutral'); return; }
      score(result === 'correct');
      if (result === 'correct') { state.done = true; say(`答對！${fmt(q.number)} ≈ ${fmt(q.answer)}`, 'success'); }
      else say('答案不正確，請再試一次；或改用「互動步驟」逐步完成。', 'error');
      return;
    }
    if (state.step === 1) { say(`請先點擊${targetName()}。`, 'neutral'); return; }
    if (state.step === 2) {
      for (const side of ['low', 'high']) {
        const result = math.inspectAnswer(state[side], q[side]).status;
        if (result === 'correct') continue;
        state.field = side;
        if (result === 'empty') say('間尺兩端都要輸入。', 'neutral');
        else if (result === 'precision') say(precisionMessage(q[side]), 'neutral');
        else say(`${side === 'low' ? '下捨入' : '上捨入'}的答案不正確，請檢查要保留的位值及右方的數字。`, 'error');
        return;
      }
      state.step = 3;
      say(`間尺畫好了：${fmt(q.low)} 至 ${fmt(q.high)}。`, 'success');
      get('next-digit').focus();
      return;
    }
    if (state.step === 3) {
      if (state.slide !== q.nextDigit) { say('標記要停在下一位的數字（黃色那一位）。', 'error'); return; }
      state.step = 4;
      say(`正確：下一位是 ${q.nextDigit}。`, 'success');
      get('step-prompt').focus();
      return;
    }
    if (!state.side || !state.sentence) { say('請先點選取值，再選擇答句。', 'neutral'); return; }
    const correct = state.side === q.expectedSide && state.sentence === q.mode;
    score(correct);
    if (correct) {
      state.done = true;
      say(`答對！${fmt(q.number)} ≈ ${fmt(q.answer)}（${answerSentence(q, q.mode)}）`, 'success');
    } else if (state.side !== q.expectedSide) {
      const why = q.mode === 'round' ? (q.nextDigit >= 5 ? '下一位已過半，要取較大的值。' : '下一位未過半，要取較小的值。') : `題目要求${methods[q.mode]}。`;
      say('取值不正確：' + why, 'error');
    } else say(`取值正確，但答句要配合題目要求：題目要求${methods[q.mode]}，應寫「${sentenceVerb(q.mode)}至…」。`, 'error');
  }

  document.querySelectorAll('input[type="checkbox"]').forEach(box => box.addEventListener('change', () => {
    const group = box.name;
    const result = math.toggleSelection(state[group], box.value);
    if (result.rejected) {
      box.checked = true;
      get('filter-note').textContent = '每組最少要剔選一項。';
      return;
    }
    state[group] = result.values;
    get('filter-note').textContent = '';
    state.number = 0;
    nextQuestion();
  }));
  document.querySelectorAll('[data-way]').forEach(button => button.addEventListener('click', () => {
    if (state.way === button.dataset.way) return;
    state.way = button.dataset.way;
    resetWork();
    render();
  }));
  get('digits').addEventListener('click', event => {
    const button = event.target.closest('[data-digit]');
    if (!button || state.step !== 1 || state.way !== 'steps') return;
    const index = Number(button.dataset.digit);
    if (index === state.question.targetIndex) {
      state.step = 2;
      say(`正確：這是${targetName()}。`, 'success');
      get('low').focus();
      return;
    }
    const d = digitDetails()[index];
    if (state.question.targetType === 'significant') {
      say(d.count === 0 ? '前面的 0 只作定位，不是有效數字。' : `這是第 ${d.count} 個有效數字，請再找${targetName()}。`, 'error');
    } else say(`這是${math.placeName(d.place)}，請再找${targetName()}。`, 'error');
  });
  inputs.forEach(id => {
    get(id).addEventListener('focus', () => {
      if (id !== 'answer' && state.step === 2) {
        state.field = id;
        ['low', 'high'].forEach(side => get(side + '-box').classList.toggle('active', side === id));
      }
    });
    get(id).addEventListener('input', () => {
      state[id] = get(id).value;
      state.message = '';
      get('feedback').textContent = '';
      get('feedback').className = 'feedback ch8-feedback';
    });
    get(id).addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); check(); } });
  });
  get('keypad').addEventListener('click', event => {
    const button = event.target.closest('[data-key]');
    if (!button || state.done) return;
    const id = state.way === 'direct' ? 'answer' : state.step === 2 ? state.field : null;
    if (!id) return;
    const key = button.dataset.key;
    let value = state[id].replace(/\s/g, '');
    if (key === 'clear') value = '';
    else if (key === 'backspace') value = value.slice(0, -1);
    else if (key === '.') { if (!value.includes('.')) value = (value || '0') + '.'; }
    else if (value.length < 24) value += key;
    state[id] = value;
    state.message = '';
    render();
  });
  get('next-digit').addEventListener('input', event => {
    state.slide = Number(event.target.value);
    state.message = '';
    render();
  });
  main.querySelectorAll('[data-side], [data-sentence]').forEach(button => button.addEventListener('click', () => {
    if (state.done || state.step !== 4) return;
    if (button.dataset.side) state.side = button.dataset.side;
    else if (state.side) state.sentence = button.dataset.sentence;
    state.message = '';
    render();
  }));
  get('reset').addEventListener('click', () => {
    if (state.way === 'steps') resetWork();
    else { state.answer = ''; state.message = ''; }
    render();
  });
  get('check').addEventListener('click', check);
  nextQuestion();
}());
