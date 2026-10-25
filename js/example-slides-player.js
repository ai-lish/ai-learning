(() => {
  'use strict';

  const root = document.querySelector('[data-example-slides-player]');
  const panel = document.getElementById('examples-panel');
  if (!root || !panel) return;

  const q = name => root.querySelector(`[data-slide-${name}]`);
  const frame = q('frame');
  const stage = q('stage');
  const theater = q('theater');
  const controls = root.querySelector('.example-slide-controls');
  const hideControlsButton = document.createElement('button');
  hideControlsButton.type = 'button';
  hideControlsButton.dataset.slideHideControls = '';
  hideControlsButton.dataset.slidesLabel = 'hideControls';
  hideControlsButton.className = 'example-slide-hide-controls';
  hideControlsButton.hidden = true;
  controls.insertBefore(hideControlsButton, q('next-prompt'));
  const showControlsButton = document.createElement('button');
  showControlsButton.type = 'button';
  showControlsButton.dataset.slideShowControls = '';
  showControlsButton.dataset.slidesLabel = 'showControls';
  showControlsButton.className = 'example-slide-show-controls';
  showControlsButton.hidden = true;
  theater.append(showControlsButton);
  const dictionaries = {
    zh: {
      heading: '例題投影片', intro: '已製作例題可完整播放，也可下載 HTML 離線使用。', choose: '選擇例題',
      open: '開啟完整投影片', download: '下載 HTML（離線）', fullscreen: '全螢幕上堂',
      previous: '‹ 上一步', next: '下一步 ›', restart: '⟲ 由頭再講', nextQuestion: '下一題 ›',
      error: '投影片未能載入，請重試或開啟完整投影片。', retry: '重試',
      blackout: '黑屏中；按任意鍵或點一下繼續',
      help: '→／空格／PageDown：下一步 · ←／PageUp：上一步 · F：全螢幕 · 全螢幕 H：顯示／隱藏控制列 · B：黑屏 · N：下一題；手機可左右掃。下載後用 Chrome／Edge 開啟 HTML。',
      loading: '載入完整投影片…', page: (n, total) => `第 ${n} 步，共 ${total} 步`,
      example: '例', workInProgress: '製作中', nextPrompt: '講完？下一題：', chapterDone: '已完成目前所有可播放例題', fullscreenHint: 'Esc 離開全螢幕 · H 控制列 · B 黑屏',
      hideControls: '隱藏控制列', showControls: '顯示控制列'
    },
    en: {
      heading: 'Worked-example slides', intro: 'Play each completed example in full, or download its HTML for offline use.', choose: 'Choose an example',
      open: 'Open complete slides', download: 'Download HTML (offline)', fullscreen: 'Present fullscreen',
      previous: '‹ Previous', next: 'Next ›', restart: '⟲ Restart', nextQuestion: 'Next example ›',
      error: 'Slides could not load. Retry or open the complete slides.', retry: 'Retry',
      blackout: 'Blackout: press any key or tap to continue',
      help: '→ / Space / PageDown: next · ← / PageUp: previous · F: fullscreen · fullscreen H: show / hide controls · B: blackout · N: next example. Swipe on mobile. Open downloaded HTML in Chrome / Edge.',
      loading: 'Loading complete slides…', page: (n, total) => `Step ${n} of ${total}`,
      example: 'Example', workInProgress: 'In production', nextPrompt: 'Finished? Next example: ', chapterDone: 'All currently available examples completed', fullscreenHint: 'Esc to exit fullscreen · H controls · B blackout',
      hideControls: 'Hide controls', showControls: 'Show controls'
    }
  };
  const language = () => document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'zh';
  const t = () => dictionaries[language()];
  const local = value => typeof value === 'string' ? value : value?.[language()] || value?.zh || '';

  let items = [];
  let selected = null;
  let deck = null;
  let mediaObserver = null;
  let pending = null;
  let loadTimer = null;
  let idleTimer = null;
  let loadToken = 0;
  let loading = false;
  let controlsManuallyHidden = false;

  function fullscreenActive() {
    return document.fullscreenElement === theater || theater.classList.contains('is-fullscreen');
  }

  function playable(item) {
    return Boolean(item && typeof item.slidePath === 'string');
  }

  function validate(data) {
    if (data.version !== 2 || data.format !== 'offline-html' || data.chapter !== root.dataset.chapter || !Array.isArray(data.items) || !data.items.length) {
      throw new Error('Invalid example-slide catalog');
    }
    const seen = new Set();
    for (const item of data.items) {
      if (!/^[0-9]+(?:\.[0-9]+)?[a-z]?$/.test(item.id) || seen.has(item.id) || !item.title || !item.summary || !item.section || !item.questionNumber) {
        throw new Error('Invalid example-slide entry');
      }
      seen.add(item.id);
      if (!playable(item)) {
        if (item.slidePath !== null) throw new Error('A production placeholder must have a null slidePath');
        continue;
      }
      const pathPrefix = `slides/${data.chapter}/`;
      if (!item.slidePath.startsWith(pathPrefix) || item.slidePath.includes('..') || item.slidePath.includes('?') || item.slidePath.includes('#') ||
          !/^slides\/(S1Ch4|M2Ch3|S4Ch3|S4Revision)\/Ex[\d.]+[a-z]?-[A-Za-z0-9-]+\.html$/.test(item.slidePath) ||
          !/^[a-f0-9]{64}$/.test(item.sha256) || !/^[a-f0-9]{64}$/.test(item.sourceSha256) ||
          !Number.isSafeInteger(item.pages) || item.pages < 1 || !Number.isSafeInteger(item.bytes) || item.bytes <= 0) {
        throw new Error(`Invalid slide asset for ${item.id}`);
      }
    }
    if (!data.items.some(item => item.id === data.defaultItem && playable(item))) throw new Error('Catalog default must identify a playable example');
    return data;
  }

  function sectionLabel(item) {
    const code = typeof item.section === 'object' ? item.section.code : '';
    const label = local(item.section);
    return code && !label.startsWith(code) ? `${code} ${label}` : label;
  }

  function slideUrl(item) {
    const base = root.dataset.slideBase ? new URL(root.dataset.slideBase, document.baseURI) : document.baseURI;
    return new URL(item.slidePath, base).href;
  }

  function nextPlayableItem() {
    const index = items.indexOf(selected);
    return items.slice(index + 1).find(playable) || null;
  }

  function currentStep() {
    if (!deck) return 0;
    try {
      const sections = [...frame.contentDocument.querySelectorAll('.slides section')];
      if (sections.length === deck.getTotalSlides()) {
        const activeIndex = sections.findIndex(section => section.classList.contains('present'));
        if (activeIndex >= 0) return activeIndex;
      }
    } catch { /* use Reveal's index when the frame is navigating */ }
    const indices = deck.getIndices();
    return typeof deck.getSlidePastCount === 'function' ? deck.getSlidePastCount() : (indices.h || 0);
  }

  function renderProgress(total, current) {
    const progress = q('progress');
    progress.replaceChildren();
    for (let index = 0; index < total; index += 1) {
      const dot = document.createElement('span');
      dot.className = 'example-slide-progress-dot';
      dot.setAttribute('aria-hidden', 'true');
      if (index === current) dot.setAttribute('aria-current', 'step');
      progress.append(dot);
    }
  }

  function updateStatus() {
    const step = deck ? currentStep() : 0;
    const total = deck ? deck.getTotalSlides() : 0;
    const atEnd = Boolean(deck && step >= total - 1);
    q('status').textContent = deck ? t().page(step + 1, total) : t().loading;
    q('previous').disabled = !deck || step === 0;
    q('next').disabled = !deck || atEnd;
    q('restart').disabled = !deck;
    renderProgress(total, step);

    const next = nextPlayableItem();
    q('next-prompt').hidden = !atEnd;
    const langSuffix = language() === 'en' ? 'En' : 'Zh';
    const completionText = root.dataset[`slidesComplete${langSuffix}`] || t().chapterDone;
    q('next-text').textContent = next
      ? `${t().nextPrompt}${next.questionNumber} ${local(next.title)}`
      : completionText;
    q('next-question').hidden = !next;
  }

  function render() {
    panel.querySelectorAll('[data-slides-label]').forEach(element => {
      const key = element.dataset.slidesLabel;
      const langSuffix = language() === 'en' ? 'En' : 'Zh';
      const override = root.dataset[`slides${key[0].toUpperCase()}${key.slice(1)}${langSuffix}`];
      if (typeof t()[key] === 'string') element.textContent = override || t()[key];
    });
    q('select').setAttribute('aria-label', t().choose);
    hideControlsButton.setAttribute('aria-label', t().hideControls);
    showControlsButton.setAttribute('aria-label', t().showControls);
    frame.title = selected ? `${selected.questionNumber} — ${local(selected.title)}` : t().heading;
    q('list').replaceChildren();
    q('select').replaceChildren();

    let previousGroup = null;
    let group = null;
    let optgroup = null;
    for (const item of items) {
      const groupTitle = sectionLabel(item);
      if (groupTitle !== previousGroup) {
        previousGroup = groupTitle;
        group = document.createElement('div');
        group.className = 'example-slide-list-group';
        const heading = document.createElement('h4');
        heading.textContent = groupTitle;
        group.append(heading);
        q('list').append(group);
        optgroup = document.createElement('optgroup');
        optgroup.label = groupTitle;
        q('select').append(optgroup);
      }

      const available = playable(item);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'example-slide-list-item';
      button.disabled = !available;
      button.setAttribute('aria-current', String(item === selected));
      const title = document.createElement('span');
      title.className = 'example-slide-list-title';
      title.textContent = `${item.questionNumber} · ${local(item.title)}`;
      const summary = document.createElement('span');
      summary.className = 'example-slide-list-summary';
      summary.textContent = local(item.summary);
      button.append(title, summary);
      if (!available) {
        const label = document.createElement('span');
        label.className = 'example-slide-production-label';
        label.textContent = t().workInProgress;
        button.append(label);
      } else {
        button.addEventListener('click', () => select(item));
      }
      group.append(button);

      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.questionNumber} · ${local(item.title)}${available ? '' : ` (${t().workInProgress})`}`;
      option.disabled = !available;
      option.selected = item === selected;
      optgroup.append(option);
    }

    if (selected) {
      q('title').textContent = `${selected.questionNumber} · ${local(selected.title)}`;
      q('page').textContent = selected.textbookPage || '';
      q('summary').textContent = local(selected.summary);
      q('new-tab').href = slideUrl(selected);
      q('download').href = slideUrl(selected);
      q('download').download = selected.slidePath.split('/').pop();
      q('download').setAttribute('aria-label', `${t().download}: ${selected.slidePath.split('/').pop()}`);
    }
    updateStatus();
  }

  function hideLoading() {
    q('loading').hidden = true;
    stage.removeAttribute('data-loading');
  }

  function showError() {
    clearTimeout(loadTimer);
    loading = false;
    hideLoading();
    q('error').hidden = false;
    updateStatus();
  }

  function repairBase64Video(video) {
    const existing = video.getAttribute('src') || '';
    if (/^data:video\/[a-z0-9.+-]+;base64,[a-z0-9+/]+=*$/i.test(existing)) return false;

    const sources = [...video.querySelectorAll('source')];
    for (let index = 0; index < sources.length - 1; index += 1) {
      const prefix = sources[index].getAttribute('src') || '';
      const payload = sources[index + 1].getAttribute('src') || '';
      if (/^data:video\/[a-z0-9.+-]+;base64$/i.test(prefix) && /^[a-z0-9+/]+=*$/i.test(payload)) {
        video.src = `${prefix},${payload}`;
        video.load();
        return true;
      }
    }
    return false;
  }

  function repairFrameVideos() {
    try {
      frame.contentDocument?.querySelectorAll('.slide-background video').forEach(repairBase64Video);
    } catch { /* the iframe may be navigating */ }
  }

  function watchFrameVideos() {
    mediaObserver?.disconnect();
    try {
      const backgrounds = frame.contentWindow?.Reveal?.getBackgroundsElement?.();
      if (!backgrounds) return;
      mediaObserver = new MutationObserver(repairFrameVideos);
      mediaObserver.observe(backgrounds, { childList: true, subtree: true });
      repairFrameVideos();
    } catch { /* the iframe may be navigating */ }
  }

  function pause() {
    try {
      frame.contentDocument?.querySelectorAll('video').forEach(video => video.pause());
      deck?.pause?.();
    } catch { /* the iframe may be navigating */ }
  }

  function resume() {
    if (!panel.hidden) {
      try {
        repairFrameVideos();
        frame.contentDocument?.querySelectorAll('.slide-background.present video').forEach(video => video.play().catch(() => {}));
        deck?.resume?.();
      } catch { /* the iframe may be navigating */ }
    }
  }

  function showControls() {
    clearTimeout(idleTimer);
    if (controlsManuallyHidden || !fullscreenActive()) return;
    theater.classList.remove('controls-idle');
    idleTimer = setTimeout(() => theater.classList.add('controls-idle'), 3000);
  }

  function setManualControlsHidden(hidden, restoreFocus = true) {
    if (!fullscreenActive()) return;
    controlsManuallyHidden = hidden;
    clearTimeout(idleTimer);
    theater.classList.remove('controls-idle');
    controls.hidden = hidden;
    controls.inert = hidden;
    theater.classList.toggle('controls-manually-hidden', hidden);
    showControlsButton.hidden = !hidden;
    if (hidden) {
      if (restoreFocus) showControlsButton.focus();
      return;
    }
    showControls();
    if (restoreFocus) hideControlsButton.focus();
  }

  function toggleManualControls() {
    if (fullscreenActive()) setManualControlsHidden(!controlsManuallyHidden);
  }

  function handleFullscreenChange() {
    if (!fullscreenActive()) {
      controlsManuallyHidden = false;
      controls.hidden = false;
      controls.inert = false;
      hideControlsButton.hidden = true;
      showControlsButton.hidden = true;
      theater.classList.remove('controls-manually-hidden', 'controls-idle', 'is-fullscreen');
      clearTimeout(idleTimer);
      return;
    }
    hideControlsButton.hidden = false;
    showControls();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement === theater) {
      document.exitFullscreen().catch(() => {});
    } else if (theater.requestFullscreen) {
      theater.requestFullscreen().catch(() => q('new-tab').focus());
    }
  }

  function nextQuestion() {
    const next = nextPlayableItem();
    if (next) select(next);
  }

  function closest(target, selector) {
    return target && typeof target.closest === 'function' ? target.closest(selector) : null;
  }

  function isFormTarget(target) {
    return Boolean(closest(target, 'input,textarea,select,[contenteditable="true"],[role="tab"]')) || Boolean(target?.isContentEditable);
  }

  function keyboard(event) {
    if (panel.hidden || event.ctrlKey || event.metaKey || event.altKey || isFormTarget(event.target)) return;
    if (!q('blackout').hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      q('blackout').hidden = true;
      theater.classList.remove('is-blackout');
      resume();
      return;
    }
    const key = event.key.toLowerCase();
    const isShowControlsButton = Boolean(closest(event.target, '[data-slide-show-controls]'));
    const isButtonOrLink = Boolean(closest(event.target, 'button,a'));
    const spaceAdvancesFromShowButton = key === ' ' && isShowControlsButton;
    if ((key === ' ' || key === 'enter') && isButtonOrLink && !spaceAdvancesFromShowButton) return;
    const actions = {
      arrowright: () => deck?.next(), ' ': () => deck?.next(), pagedown: () => deck?.next(),
      arrowleft: () => deck?.prev(), pageup: () => deck?.prev(),
      f: toggleFullscreen,
      h: toggleManualControls,
      b: () => { q('blackout').hidden = false; theater.classList.add('is-blackout'); pause(); q('blackout').focus(); },
      n: nextQuestion
    };
    if (actions[key]) {
      event.preventDefault();
      event.stopImmediatePropagation();
      actions[key]();
      showControls();
    }
  }

  function enableSwipe(documentInFrame, presentation) {
    let start = null;
    try { presentation.configure({ touch: false, keyboard: false }); } catch { /* reveal may not expose runtime config */ }
    documentInFrame.addEventListener('touchstart', event => {
      if (event.touches.length !== 1) { start = null; return; }
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    documentInFrame.addEventListener('touchend', event => {
      if (!start || event.changedTouches.length !== 1) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      if (dx < 0) presentation.next(); else presentation.prev();
      showControls();
    }, { passive: true });
  }

  function frameMatches(item) {
    try {
      const actual = new URL(frame.contentWindow.location.href);
      const expected = new URL(slideUrl(item));
      return actual.origin === expected.origin && actual.pathname === expected.pathname;
    } catch {
      return frame.getAttribute('src') === slideUrl(item);
    }
  }

  function load(forceReload = false) {
    if (!selected || panel.hidden || loading) return;
    const current = selected;
    const token = ++loadToken;
    loading = true;
    deck = null;
    q('loading').hidden = false;
    q('error').hidden = true;
    stage.dataset.loading = 'true';
    updateStatus();
    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => { if (token === loadToken) showError(); }, 30000);

    const target = slideUrl(current);
    if (forceReload || frame.getAttribute('src') === target) {
      frame.src = 'about:blank';
      requestAnimationFrame(() => {
        if (token === loadToken && !panel.hidden) frame.src = target;
      });
    } else {
      frame.src = target;
    }
  }

  frame.addEventListener('load', () => {
    const current = selected;
    const token = loadToken;
    if (panel.hidden) {
      pause();
      return;
    }
    if (!current || !loading || !frameMatches(current)) return;
    const ready = () => {
      if (panel.hidden) {
        pause();
        return;
      }
      if (token !== loadToken || current !== selected) return;
      const presentation = frame.contentWindow?.Reveal;
      if (!presentation?.isReady()) return;
      clearTimeout(loadTimer);
      loading = false;
      hideLoading();
      deck = presentation;
      if (deck.getTotalSlides() !== current.pages) {
        deck = null;
        showError();
        return;
      }
      q('error').hidden = true;
      watchFrameVideos();
      deck.on('slidechanged', () => {
        repairFrameVideos();
        updateStatus();
        resume();
      });
      enableSwipe(frame.contentDocument, deck);
      frame.contentDocument.addEventListener('keydown', keyboard, true);
      frame.contentDocument.addEventListener('pointermove', showControls);
      frame.contentDocument.addEventListener('pointerdown', showControls);
      updateStatus();
      if (panel.hidden) pause();
      else resume();
    };
    const presentation = frame.contentWindow?.Reveal;
    if (presentation?.isReady()) ready();
    else if (presentation) presentation.on('ready', ready);
    else showError();
  });

  function select(item, updateHash = true) {
    if (!item || !playable(item)) return;
    pause();
    clearTimeout(loadTimer);
    loadToken += 1;
    loading = false;
    deck = null;
    selected = item;
    q('blackout').hidden = true;
    theater.classList.remove('is-blackout');
    if (updateHash) history.replaceState(null, '', `#examples-${item.id}`);
    render();
    load();
  }

  async function initialize(retry = false) {
    if (items.length) {
      if (!deck && !loading) load(retry);
      else resume();
      return;
    }
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetch(root.dataset.manifest, { cache: retry ? 'reload' : 'default' });
        if (!response.ok) throw new Error('Catalog request failed');
        const data = validate(await response.json());
        const requestedIds = root.dataset.items ? root.dataset.items.split(',').map(id => id.trim()).filter(Boolean) : null;
        items = requestedIds ? requestedIds.map(id => data.items.find(item => item.id === id)).filter(playable) : data.items;
        if (!items.length || (requestedIds && items.length !== requestedIds.length)) throw new Error('Requested examples are missing from the catalog');
        const id = location.hash.replace(/^#examples-/, '');
        const defaultItem = root.dataset.defaultItem || data.defaultItem;
        const first = items.find(item => item.id === id && playable(item)) ||
          items.find(item => item.id === defaultItem && playable(item)) || items.find(playable);
        select(first, false);
      } catch {
        showError();
      } finally {
        pending = null;
      }
    })();
    return pending;
  }

  function restart() {
    if (!deck) return;
    pause();
    deck.slide(0);
    requestAnimationFrame(() => {
      const firstVideo = frame.contentDocument?.querySelector('.slide-background.present video');
      if (firstVideo) {
        firstVideo.currentTime = 0;
        firstVideo.play().catch(() => {});
      }
      updateStatus();
    });
  }

  q('select').addEventListener('change', event => select(items.find(item => item.id === event.target.value)));
  q('previous').addEventListener('click', () => { deck?.prev(); updateStatus(); });
  q('next').addEventListener('click', () => { deck?.next(); updateStatus(); });
  q('restart').addEventListener('click', restart);
  q('next-question').addEventListener('click', nextQuestion);
  q('fullscreen').addEventListener('click', toggleFullscreen);
  hideControlsButton.addEventListener('click', () => setManualControlsHidden(true));
  showControlsButton.addEventListener('click', () => setManualControlsHidden(false));
  q('retry').addEventListener('click', () => initialize(true));
  q('blackout').addEventListener('click', () => {
    q('blackout').hidden = true;
    theater.classList.remove('is-blackout');
    resume();
  });
  document.addEventListener('keydown', keyboard, true);
  theater.addEventListener('pointermove', showControls);
  theater.addEventListener('pointerdown', showControls);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  if (!theater.requestFullscreen) q('fullscreen').hidden = true;

  new MutationObserver(() => {
    if (panel.hidden) {
      pause();
      clearTimeout(loadTimer);
      if (loading) { loadToken += 1; loading = false; deck = null; }
      if (document.fullscreenElement === theater) document.exitFullscreen().catch(() => {});
    } else {
      initialize();
    }
  }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.addEventListener('hashchange', () => {
    const item = items.find(entry => `#examples-${entry.id}` === location.hash && playable(entry));
    if (item && item !== selected) select(item, false);
  });

  render();
  if (!panel.hidden) initialize();
})();
