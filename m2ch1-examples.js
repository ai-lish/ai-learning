(() => {
  const examples = [
    {
      id: 'ex-1-1',
      label: '例 1.1',
      topic: '1.1 求和記法',
      question: '求下列各式的值。',
      questionLatex: "\\begin{aligned}(a)&\\;\\sum_{r=1}^{3}3r\\\\[2pt](b)&\\;\\sum_{r=0}^{3}r(2r-3)\\\\[2pt](c)&\\;\\sum_{r=5}^{7}\\left(\\frac{1}{2}\\right)^r\\\\[2pt](d)&\\;\\sum_{k=1}^{2}(k+1)+\\sum_{k=3}^{5}(k+1)\\end{aligned}",
      questionFallback: '(a) Σ₍ᵣ₌₁₎³3r；(b) Σ₍ᵣ₌₀₎³r(2r−3)；(c) Σ₍ᵣ₌₅₎⁷(1/2)ʳ；(d) Σ₍ₖ₌₁₎²(k+1)+Σ₍ₖ₌₃₎⁵(k+1)',
      answer: '答案依次為 18、10、7/128、20。',
      answerLatex: "18,\\qquad 10,\\qquad \\frac{7}{128},\\qquad 20",
      answerFallback: '18；10；7/128；20',
      source: '來源：NotebookLM「2025-26 M2」→ C01 數學歸納法；原書 p.1.4。',
      steps: [
        { title: '小題 (a)', latex: "\\sum_{r=1}^{3}3r=3(1)+3(2)+3(3)=3+6+9=18", fallback: '把 r = 1、2、3 逐項代入，得到 18。', note: '下標由 1 到 3，包括兩端。' },
        { title: '小題 (b)', latex: "\\sum_{r=0}^{3}r(2r-3)=0(-3)+1(-1)+2(1)+3(3)=10", fallback: '把 r = 0、1、2、3 逐項代入，總和是 10。', note: '先計算每一項，再相加；不要漏掉 r = 0。' },
        { title: '小題 (c)', latex: "\\sum_{r=5}^{7}\\left(\\frac12\\right)^r=\\frac1{32}+\\frac1{64}+\\frac1{128}=\\frac7{128}", fallback: '展開三項，再通分，得到 7/128。', note: '項數是 7 − 5 + 1 = 3。' },
        { title: '小題 (d)｜最後答案', latex: "\\sum_{k=1}^{2}(k+1)+\\sum_{k=3}^{5}(k+1)=2+3+4+5+6=20", fallback: '兩個求和範圍接合後，逐項相加得到 20。', note: '兩個範圍合起來是 k = 1 至 5。', final: true }
      ]
    },
    {
      id: 'ex-1-2',
      label: '例 1.2',
      topic: '1.1 求和記法的性質',
      question: '求下列各式的值。',
      questionLatex: "\\begin{aligned}(a)&\\;\\sum_{i=4}^{22}3\\\\[2pt](b)&\\;\\sum_{j=1}^{4}(7j+2)\\end{aligned}",
      questionFallback: '(a) Σ₍ᵢ₌₄₎²²3；(b) Σ₍ⱼ₌₁₎⁴(7j+2)',
      answer: '答案依次為 57、78。',
      answerLatex: "57,\\qquad 78",
      answerFallback: '57；78',
      source: '來源：NotebookLM「2025-26 M2」→ C01 數學歸納法；原書 p.1.5，解答見 p.1.6。',
      steps: [
        { title: '小題 (a)', latex: "\\sum_{i=4}^{22}3=(22-4+1)\\times3=19\\times3=57", fallback: '常數 3 出現 22 − 4 + 1 = 19 次，所以答案是 57。', note: '常數求和：常數 × 項數。' },
        { title: '小題 (b)｜最後答案', latex: "\\sum_{j=1}^{4}(7j+2)=7(1+2+3+4)+4(2)=70+8=78", fallback: '利用可拆分性質，提出 7，再把常數 2 加四次，答案是 78。', note: 'Σ(7j+2) = 7Σj + Σ2。', final: true }
      ]
    },
    {
      id: 'ex-1-3',
      label: '例 1.3',
      topic: '1.1 求和記法的性質',
      question: '已知 Σ₍ₖ₌₃₎⁸ aₖ = 12，求下列各式的值。',
      questionLatex: "\\begin{aligned}(a)&\\;\\sum_{k=3}^{8}(a_k-2)\\\\[2pt](b)&\\;\\sum_{k=3}^{5}(a_k+1)-\\sum_{k=6}^{8}(3-a_k)\\end{aligned}",
      questionFallback: '(a) Σ₍ₖ₌₃₎⁸(aₖ−2)；(b) Σ₍ₖ₌₃₎⁵(aₖ+1)−Σ₍ₖ₌₆₎⁸(3−aₖ)',
      answer: '答案依次為 0、6。',
      answerLatex: "0,\\qquad 6",
      answerFallback: '0；6',
      source: '來源：NotebookLM「2025-26 M2」→ C01 數學歸納法；原書 p.1.6。',
      steps: [
        { title: '小題 (a)', latex: "\\sum_{k=3}^{8}(a_k-2)=\\sum_{k=3}^{8}a_k+6(-2)=12-12=0", fallback: '共有 8 − 3 + 1 = 6 項，所以要減去 6 個 2，答案是 0。', note: '先數清楚常數 −2 出現幾多次。' },
        { title: '小題 (b)｜最後答案', latex: "\\begin{aligned}\\sum_{k=3}^{5}(a_k+1)-\\sum_{k=6}^{8}(3-a_k)&=\\sum_{k=3}^{8}a_k+3-9\\\\&=12+3-9=6\\end{aligned}", fallback: '拆開兩個求和後，aₖ 各項合共是 12；常數部分是 3 − 9，答案是 6。', note: '減去 (3 − aₖ) 時，aₖ 會變成正號。', final: true }
      ]
    },
    {
      id: 'ex-1-4',
      label: '例 1.4',
      topic: '1.3 數學歸納法證明',
      question: '以數學歸納法證明：對所有正整數 n，1 + 2 + 3 + ··· + n = n(n+1)/2。',
      questionLatex: "1+2+3+\\cdots+n=\\frac{n(n+1)}{2}",
      questionFallback: '1 + 2 + 3 + ··· + n = n(n+1)/2',
      answer: '命題對所有正整數 n 成立。',
      answerLatex: "\\boxed{1+2+3+\\cdots+n=\\frac{n(n+1)}{2}\\quad(n\\in\\mathbb Z^+)}",
      answerFallback: '∴ 對所有正整數 n，1 + 2 + 3 + ··· + n = n(n+1)/2。',
      source: '來源：NotebookLM「2025-26 M2」→ C01 數學歸納法；原書 p.1.12。',
      steps: [
        { title: '第一步｜定義命題及驗證 P(1)', latex: "P(n):1+2+\\cdots+n=\\frac{n(n+1)}2;\\qquad n=1:\\;1=\\frac{1(2)}2=1", fallback: '令 P(n) 為題目命題。當 n = 1，左右兩邊都等於 1，所以 P(1) 成立。', note: '先寫清楚 P(n)，再完成 base case。' },
        { title: '第二步｜假設 P(k) 成立', latex: "1+2+\\cdots+k=\\frac{k(k+1)}2", fallback: '假設對某個任意正整數 k，P(k) 成立。', note: 'k 代表任意一個目前成立的正整數，不是指定某一個數。' },
        { title: '第三步｜由 P(k) 推出 P(k+1)', latex: "\\begin{aligned}1+\\cdots+k+(k+1)&=\\frac{k(k+1)}2+(k+1)\\\\&=\\frac{(k+1)(k+2)}2\\end{aligned}", fallback: '在 P(k) 左方加上下一項 k + 1，利用假設整理，得到右方的形式。', note: '這一步要明確指出使用了 P(k) 的假設。' },
        { title: '第四步｜寫出結論', latex: "P(1)\\text{ 成立，且 }P(k)\\Rightarrow P(k+1)\\;\\therefore\\;P(n)\\text{ 對所有正整數 }n\\text{ 成立}", fallback: '因為 base case 成立，而且 P(k) 能推出 P(k+1)，根據數學歸納法，命題對所有正整數成立。', note: '最後一定要寫出「對所有正整數 n 成立」。', final: true }
      ]
    },
    {
      id: 'ex-1-5',
      label: '例 1.5',
      topic: '1.3 數學歸納法證明',
      question: '以數學歸納法證明：對所有正整數 n，1/(1×2) + 1/(2×3) + ··· + 1/[n(n+1)] = n/(n+1)。',
      questionLatex: "\\frac1{1\\times2}+\\frac1{2\\times3}+\\cdots+\\frac1{n(n+1)}=\\frac{n}{n+1}",
      questionFallback: '1/(1×2) + 1/(2×3) + ··· + 1/[n(n+1)] = n/(n+1)',
      answer: '命題對所有正整數 n 成立。',
      answerLatex: "\\boxed{\\frac1{1\\cdot2}+\\frac1{2\\cdot3}+\\cdots+\\frac1{n(n+1)}=\\frac n{n+1}}",
      answerFallback: '∴ 對所有正整數 n，左式 = n/(n+1)。',
      source: '來源：NotebookLM「2025-26 M2」→ C01 數學歸納法；原書 p.1.13。',
      steps: [
        { title: '第一步｜驗證 P(1)', latex: "n=1:\\qquad\\frac1{1\\times2}=\\frac12=\\frac1{1+1}", fallback: '當 n = 1，左方和右方都等於 1/2，所以 P(1) 成立。', note: '分母是 1×2，不要誤寫成 1+2。' },
        { title: '第二步｜假設 P(k) 成立', latex: "\\frac1{1\\cdot2}+\\frac1{2\\cdot3}+\\cdots+\\frac1{k(k+1)}=\\frac{k}{k+1}", fallback: '假設對某個任意正整數 k，P(k) 成立。', note: '保留原來的分式結構，方便下一步加入新項。' },
        { title: '第三步｜化簡 P(k+1)', latex: "\\begin{aligned}\\frac{k}{k+1}+\\frac1{(k+1)(k+2)}&=\\frac{k(k+2)+1}{(k+1)(k+2)}\\\\&=\\frac{(k+1)^2}{(k+1)(k+2)}=\\frac{k+1}{k+2}\\end{aligned}", fallback: '加入下一項後通分，分子變成 (k+1)²，再約去一個 (k+1)。', note: '關鍵是 k(k+2)+1 = (k+1)²。' },
        { title: '第四步｜寫出結論', latex: "P(1)\\text{ 成立，且 }P(k)\\Rightarrow P(k+1)\\;\\therefore\\;P(n)\\text{ 對所有正整數 }n\\text{ 成立}", fallback: '完成 base case 和 inductive step，所以命題對所有正整數成立。', note: '結論要包括數學歸納法原理。', final: true }
      ]
    },
    {
      id: 'ex-1-6',
      label: '例 1.6',
      topic: '1.3 數列通項的證明',
      question: '已知 a₁ = 2，且 aᵣ₊₁ = 3aᵣ + 2。以數學歸納法證明 aₙ = 3ⁿ − 1。',
      questionLatex: "a_1=2,\\qquad a_{r+1}=3a_r+2\\quad\\therefore\\quad a_n=3^n-1",
      questionFallback: 'a₁ = 2，aᵣ₊₁ = 3aᵣ + 2；證明 aₙ = 3ⁿ − 1。',
      answer: 'aₙ = 3ⁿ − 1 對所有正整數 n 成立。',
      answerLatex: "\\boxed{a_n=3^n-1\\quad(n\\in\\mathbb Z^+)}",
      answerFallback: '∴ aₙ = 3ⁿ − 1（對所有正整數 n）。',
      source: '來源：NotebookLM「2025-26 M2」→ C01 數學歸納法；原書 p.1.14。',
      steps: [
        { title: '第一步｜驗證 P(1)', latex: "a_1=2=3^1-1", fallback: '由已知 a₁ = 2，而 3¹ − 1 = 2，所以 P(1) 成立。', note: 'base case 必須使用題目給出的 a₁。' },
        { title: '第二步｜假設 P(k) 成立', latex: "a_k=3^k-1", fallback: '假設對某個任意正整數 k，aₖ = 3ᵏ − 1。', note: '這個假設只用來推導下一項。' },
        { title: '第三步｜由遞歸式推到下一項', latex: "a_{k+1}=3a_k+2=3(3^k-1)+2=3^{k+1}-1", fallback: '把遞歸式和歸納假設依次代入，得到 aₖ₊₁ = 3ᵏ⁺¹ − 1。', note: '先用定義，再用 P(k) 假設。', final: true }
      ]
    },
    {
      id: 'ex-1-7',
      label: '例 1.7',
      topic: '1.3 數列求和的證明',
      question: '設 Tₙ = (n+2)²。以數學歸納法證明 T₁ + T₂ + ··· + Tₙ + 5 = (n+2)(n+3)(2n+5)/6。',
      questionLatex: "T_n=(n+2)^2,\\qquad T_1+T_2+\\cdots+T_n+5=\\frac{(n+2)(n+3)(2n+5)}6",
      questionFallback: 'Tₙ = (n+2)²；證明 T₁ + ··· + Tₙ + 5 = (n+2)(n+3)(2n+5)/6。',
      answer: '命題對所有正整數 n 成立。',
      answerLatex: "\\boxed{T_1+\\cdots+T_n+5=\\frac{(n+2)(n+3)(2n+5)}6}",
      answerFallback: '∴ 對所有正整數 n，T₁ + ··· + Tₙ + 5 = (n+2)(n+3)(2n+5)/6。',
      source: '來源：NotebookLM「2025-26 M2」→ C01 數學歸納法；原書 p.1.15。',
      steps: [
        { title: '第一步｜驗證 P(1)', latex: "T_1+5=(1+2)^2+5=14=\\frac{(1+2)(1+3)(2+5)}6", fallback: '當 n = 1，左方和右方都等於 14，所以 P(1) 成立。', note: '左右兩方都要代入 n = 1 核對。' },
        { title: '第二步｜假設 P(k) 成立', latex: "T_1+\\cdots+T_k+5=\\frac{(k+2)(k+3)(2k+5)}6", fallback: '假設對某個任意正整數 k，原命題成立。', note: '將歸納假設保留為一整個已知總和。' },
        { title: '第三步｜加入下一項並因式分解', latex: "\\begin{aligned}\\frac{(k+2)(k+3)(2k+5)}6+(k+3)^2&=\\frac{k+3}{6}(2k^2+15k+28)\\\\&=\\frac{(k+3)(k+4)(2k+7)}6\\end{aligned}", fallback: '加入 Tₖ₊₁ = (k+3)²，通分及因式分解後，得到 k+1 的右方形式。', note: '2k² + 15k + 28 = (k+4)(2k+7)。' },
        { title: '第四步｜寫出結論', latex: "P(1)\\text{ 成立，且 }P(k)\\Rightarrow P(k+1)\\;\\therefore\\;P(n)\\text{ 對所有正整數 }n\\text{ 成立}", fallback: '因此命題對所有正整數 n 成立。', note: '完成 base case 和 inductive step 後才可下結論。', final: true }
      ]
    },
    {
      id: 'ex-1-8',
      label: '例 1.8',
      topic: '1.3 數學歸納法的應用',
      question: '先以數學歸納法證明平方和公式，再求 Σ₍ᵣ₌₁₎¹⁹r² 及 1²+3²+5²+···+19²。',
      questionLatex: "\\sum_{r=1}^{n}r^2=\\frac{n(n+1)(2n+1)}6,\\qquad \\sum_{r=1}^{19}r^2,\\qquad 1^2+3^2+\\cdots+19^2",
      questionFallback: '證明 Σ₍ᵣ₌₁₎ⁿr² = n(n+1)(2n+1)/6，再求 Σ₍ᵣ₌₁₎¹⁹r² 及奇數平方和。',
      answer: 'Σ₍ᵣ₌₁₎¹⁹r² = 2470；1²+3²+···+19² = 1330。',
      answerLatex: "\\sum_{r=1}^{19}r^2=2470,\\qquad 1^2+3^2+\\cdots+19^2=1330",
      answerFallback: '2470；1330',
      source: '來源：NotebookLM「2025-26 M2」→ C01 數學歸納法；原書 p.1.16–1.17。',
      steps: [
        { title: '第一步｜證明平方和公式', latex: "\\sum_{r=1}^{n}r^2=\\frac{n(n+1)(2n+1)}6", fallback: '先用數學歸納法證明平方和公式：base case n = 1 成立。', note: '這個公式之後會用來計算數值。' },
        { title: '第二步｜歸納步驟', latex: "\\begin{aligned}\\sum_{r=1}^{k+1}r^2&=\\frac{k(k+1)(2k+1)}6+(k+1)^2\\\\&=\\frac{(k+1)(k+2)(2k+3)}6\\end{aligned}", fallback: '由 P(k) 加上下一項 (k+1)²，整理後得到 P(k+1)。', note: '最後一行正是把 n 換成 k+1 後的右方。' },
        { title: '第三步｜代入 n = 19', latex: "\\sum_{r=1}^{19}r^2=\\frac{19(20)(39)}6=2470", fallback: '把 n = 19 代入平方和公式，得到 2470。', note: '先約分或按次序計算，可減少算術錯誤。' },
        { title: '第四步｜求奇數平方和｜最後答案', latex: "\\begin{aligned}1^2+3^2+\\cdots+19^2&=2470-4(1^2+2^2+\\cdots+9^2)\\\\&=2470-4(285)=1330\\end{aligned}", fallback: '用全部平方和減去偶數平方和；偶數平方和 = 4(1²+···+9²)，答案是 1330。', note: '偶數 2、4、···、18 都可以寫成 2×1、2×2、···、2×9。', final: true }
      ]
    }
  ];

  const root = document.getElementById('examples-panel');
  if (!root) return;
  const picker = document.getElementById('m2-example-picker');
  const topic = document.getElementById('m2-example-topic');
  const question = document.getElementById('m2-example-question');
  const questionFormula = document.getElementById('m2-example-question-formula');
  const answer = document.getElementById('m2-example-answer');
  const answerFormula = document.getElementById('m2-example-answer-formula');
  const details = document.getElementById('m2-example-details');
  const steps = document.getElementById('m2-example-steps');
  const complete = document.getElementById('m2-example-complete');
  const source = document.getElementById('m2-example-source');
  const nextButton = document.getElementById('m2-example-next');
  const fullButton = document.getElementById('m2-example-full');
  const resetButton = document.getElementById('m2-example-reset');
  const progress = document.getElementById('m2-example-progress');
  const playButton = document.getElementById('m2-example-play');
  const pauseButton = document.getElementById('m2-example-pause');
  const replayButton = document.getElementById('m2-example-replay');
  const language = document.getElementById('m2-example-language');
  const speed = document.getElementById('m2-example-speed');
  const voiceStatus = document.getElementById('m2-example-voice-status');
  const voiceLabels = { yue: '粵語', zh: '普通話', en: 'English' };
  const state = { item: examples[0], revealed: 0, queue: [], index: 0, playing: false, paused: false, token: 0, audio: null, timer: null };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setFormula(node, latex, fallback, display = false) {
    node.dataset.latex = latex || '';
    node.dataset.fallback = fallback || latex || '';
    node.dataset.display = display ? 'true' : 'false';
    node.textContent = fallback || latex || '';
  }

  function typeset() {
    const nodes = [...root.querySelectorAll('[data-latex]')];
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') return;
    nodes.forEach((node) => {
      node.textContent = node.dataset.display === 'true' ? '\\[' + node.dataset.latex + '\\]' : '\\(' + node.dataset.latex + '\\)';
    });
    window.MathJax.typesetPromise(nodes).catch(() => nodes.forEach((node) => { node.textContent = node.dataset.fallback || ''; }));
  }

  function setVoiceStatus(text) { voiceStatus.textContent = text; }

  function cancelVoice(silent = true) {
    if (state.timer) { clearTimeout(state.timer); state.timer = null; }
    if (state.audio) {
      state.audio.pause();
      state.audio.removeAttribute('src');
      state.audio.load();
      state.audio = null;
    }
    state.token += 1;
    state.queue = [];
    state.index = 0;
    state.playing = false;
    state.paused = false;
    if (!silent) setVoiceStatus('語音已停止；按「播放全部」重新開始。');
  }

  function renderComplete() {
    complete.innerHTML = '<h4>考試完整答案（步驟連答案）</h4><ol class=\"m2-example-complete-list\">' +
      state.item.steps.map((step) => '<li><strong>' + escapeHtml(step.title) + '</strong><div class=\"m2-example-step-formula\" data-latex data-display=\"false\"></div></li>').join('') +
      '</ol>';
    [...complete.querySelectorAll('[data-latex]')].forEach((node, index) => setFormula(node, state.item.steps[index].latex, state.item.steps[index].fallback));
  }

  function renderSteps() {
    steps.innerHTML = state.item.steps.map((step, index) =>
      '<article class=\"m2-example-step ' + (step.final ? 'final' : '') + '\" data-step=\"' + index + '\" hidden>' +
        '<div class=\"m2-example-step-head\"><strong>' + escapeHtml(step.title) + '</strong><button class=\"m2-example-speak\" type=\"button\" data-speak-step=\"' + index + '\">🔊 聽解說</button></div>' +
        '<span class=\"m2-example-step-label\">考試作答步驟</span>' +
        '<div class=\"m2-example-step-formula\" data-latex></div>' +
        '<div class=\"m2-example-step-note\"><strong>解說重點</strong>' + escapeHtml(step.note) + '</div>' +
      '</article>'
    ).join('');
    [...steps.querySelectorAll('[data-latex]')].forEach((node, index) => setFormula(node, state.item.steps[index].latex, state.item.steps[index].fallback));
  }

  function reveal(count) {
    state.revealed = Math.max(0, Math.min(count, state.item.steps.length));
    [...steps.children].forEach((node, index) => { node.hidden = index >= state.revealed; });
    complete.hidden = state.revealed < state.item.steps.length;
    nextButton.disabled = state.revealed >= state.item.steps.length;
    fullButton.disabled = state.revealed >= state.item.steps.length;
    nextButton.textContent = nextButton.disabled ? '已顯示完整答案' : '顯示下一步';
    progress.textContent = state.revealed + ' / ' + state.item.steps.length + ' 步已顯示';
    typeset();
  }

  function render() {
    cancelVoice(true);
    topic.textContent = state.item.label + ' · ' + state.item.topic;
    question.textContent = state.item.question;
    answer.textContent = state.item.answer;
    setFormula(questionFormula, state.item.questionLatex, state.item.questionFallback, true);
    setFormula(answerFormula, state.item.answerLatex, state.item.answerFallback, true);
    source.textContent = state.item.source;
    picker.innerHTML = examples.map((item) => '<button class=\"m2-example-pick ' + (item.id === state.item.id ? 'active' : '') + '\" type=\"button\" data-example-id=\"' + item.id + '\">' + item.label + '</button>').join('');
    renderSteps();
    renderComplete();
    details.open = false;
    reveal(0);
    setVoiceStatus('MiniMax TTS 已準備；展開補充後按「播放全部」。');
    typeset();
  }

  function voicePath(stepIndex) {
    return 'assets/m2ch1-tts/' + state.item.id + '/' + language.value + '/segment-' + stepIndex + '.mp3';
  }

  function voiceNext(token) {
    if (token !== state.token || !state.playing || state.paused) return;
    if (state.index >= state.queue.length) {
      state.playing = false;
      state.audio = null;
      setVoiceStatus(voiceLabels[language.value] + '講解完成；可以按「重聽」再次播放。');
      return;
    }
    const stepIndex = state.queue[state.index++];
    details.open = true;
    reveal(Math.max(state.revealed, stepIndex + 1));
    const audio = new Audio(voicePath(stepIndex));
    state.audio = audio;
    audio.preload = 'auto';
    audio.playbackRate = Number(speed.value) || 1;
    setVoiceStatus(voiceLabels[language.value] + '：正在播放第 ' + (stepIndex + 1) + ' 步；可隨時暫停。');
    audio.onended = () => {
      if (token !== state.token) return;
      state.audio = null;
      state.timer = setTimeout(() => { state.timer = null; voiceNext(token); }, 160);
    };
    audio.onerror = () => {
      if (token === state.token) { state.playing = false; state.audio = null; setVoiceStatus('音訊未能播放；請重新整理頁面或稍後再試。'); }
    };
    audio.play().catch(() => {
      if (token === state.token) { state.playing = false; state.audio = null; setVoiceStatus('音訊未能播放；請重新整理頁面或稍後再試。'); }
    });
  }

  function speak(queue, reset) {
    cancelVoice(true);
    state.queue = queue.slice();
    state.index = 0;
    state.playing = true;
    state.paused = false;
    state.token += 1;
    if (reset) reveal(0);
    voiceNext(state.token);
  }

  picker.addEventListener('click', (event) => {
    const button = event.target.closest('[data-example-id]');
    if (!button) return;
    const item = examples.find((example) => example.id === button.dataset.exampleId);
    if (item) { state.item = item; render(); }
  });
  nextButton.addEventListener('click', () => reveal(state.revealed + 1));
  fullButton.addEventListener('click', () => reveal(state.item.steps.length));
  resetButton.addEventListener('click', render);
  steps.addEventListener('click', (event) => {
    const button = event.target.closest('[data-speak-step]');
    if (button) speak([Number(button.dataset.speakStep)], false);
  });
  details.addEventListener('toggle', () => {
    if (!details.open && state.playing) cancelVoice(false);
  });
  playButton.addEventListener('click', () => speak(state.item.steps.map((_, index) => index), true));
  replayButton.addEventListener('click', () => speak(state.item.steps.map((_, index) => index), true));
  pauseButton.addEventListener('click', () => {
    if (!state.playing) { setVoiceStatus('尚未開始語音；按「播放全部」開始。'); return; }
    if (state.paused) {
      state.paused = false;
      setVoiceStatus('繼續播放；可再按一次暫停。');
      if (state.audio) state.audio.play().catch(() => {});
      else voiceNext(state.token);
    } else {
      state.paused = true;
      if (state.timer) { clearTimeout(state.timer); state.timer = null; }
      if (state.audio) state.audio.pause();
      setVoiceStatus('已暫停；按「暫停／繼續」接著聽。');
    }
  });
  language.addEventListener('change', () => {
    cancelVoice(true);
    setVoiceStatus('已切換至 ' + voiceLabels[language.value] + '；按「播放全部」開始。');
  });

  render();
  window.addEventListener('load', typeset);
  const mathTimer = setInterval(() => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      clearInterval(mathTimer);
      typeset();
    }
  }, 250);
  setTimeout(() => clearInterval(mathTimer), 8000);
})();
