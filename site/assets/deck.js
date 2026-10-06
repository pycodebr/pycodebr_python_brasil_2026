'use strict';
(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const frame = document.querySelector('#frame');
  const deck = document.querySelector('#deck');
  const jump = document.querySelector('#jump');
  const overview = document.querySelector('#overview');
  const help = document.querySelector('#help');
  const storageKey = 'pycodebr-python-brasil-2026-v1';
  const exportMode = new URLSearchParams(location.search).has('export');
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* Private browsing remains functional. */ } }
  };
  let current = 0;
  let motionOff = matchMedia('(prefers-reduced-motion: reduce)').matches || storage.get(storageKey + '-motion') === 'off';
  let timerStarted = 0;
  let elapsed = 0;
  let pointerStart = null;
  if (exportMode) document.body.classList.add('export');

  function size() {
    const toolbarHeight = exportMode ? 0 : document.querySelector('#toolbar').getBoundingClientRect().height + 26;
    const scale = Math.min(innerWidth / 1920, Math.max(1, innerHeight - toolbarHeight) / 1080);
    frame.style.width = `${1920 * scale}px`;
    frame.style.height = `${1080 * scale}px`;
    deck.style.transform = `scale(${scale})`;
    document.querySelector('#viewer').style.paddingBottom = `${toolbarHeight}px`;
  }
  function show(index, updateHash = true) {
    current = Math.max(0, Math.min(slides.length - 1, Math.trunc(Number(index)) || 0));
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.inert = i !== current;
    });
    jump.value = String(current);
    document.querySelector('#counter').textContent = `${current + 1} / ${slides.length}`;
    document.querySelector('#previous').disabled = current === 0;
    document.querySelector('#next').disabled = current === slides.length - 1;
    document.querySelector('#progress').style.width = `${(current + 1) / slides.length * 100}%`;
    document.querySelectorAll('#overview-grid button').forEach((b, i) => b.setAttribute('aria-current', String(i === current)));
    if (updateHash) history.replaceState(null, '', `#${current + 1}`);
    storage.set(storageKey, current);
  }
  function fromHash() {
    const match = location.hash.match(/^#(\d+)$/);
    return match ? Number(match[1]) - 1 : null;
  }
  function motion() {
    document.body.classList.toggle('motion-off', motionOff || exportMode);
    const button = document.querySelector('#motion');
    button.setAttribute('aria-pressed', String(!motionOff));
    button.textContent = motionOff ? 'Efeitos: off' : 'Efeitos: on';
    storage.set(storageKey + '-motion', motionOff ? 'off' : 'on');
  }
  async function fullScreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      help.showModal();
    }
  }
  function setFlow(slide, state) {
    const states = JSON.parse(slide.dataset.states || '[]');
    if (!states.length) return;
    const value = Math.max(0, Math.min(states.length - 1, state));
    slide.dataset.step = String(value);
    slide.querySelectorAll('[data-node]').forEach((node, index) => {
      node.classList.toggle('active-step', index === value);
      node.classList.toggle('completed', index < value);
    });
    const text = slide.querySelector('[data-status]');
    if (text) text.textContent = states[value];
    const advance = slide.querySelector('[data-advance]');
    if (advance) advance.textContent = value === states.length - 1 ? 'Recomeçar demonstração' : 'Avançar uma etapa';
  }
  function setTab(slide, name) {
    const content = JSON.parse(slide.dataset.tabs || '{}');
    if (!Object.hasOwn(content, name)) return;
    slide.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === name)));
    const target = slide.querySelector('[data-tab-content]');
    if (target) target.textContent = content[name];
    slide.dataset.selected = name;
    const wave = slide.querySelector('.waveform');
    if (wave) wave.style.display = name === 'audio' ? 'flex' : 'none';
  }
  slides.forEach((slide, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `${String(i + 1).padStart(2, '0')} · ${slide.dataset.title}`;
    jump.append(option);
    const item = document.createElement('button');
    const label = document.createElement('span');
    label.textContent = `${String(i + 1).padStart(2, '0')} / ${slide.dataset.chapter}`;
    item.append(label, document.createTextNode(slide.dataset.title));
    item.addEventListener('click', () => { show(i); overview.close(); });
    document.querySelector('#overview-grid').append(item);
    if (slide.dataset.states) setFlow(slide, 0);
    if (slide.dataset.tabs) setTab(slide, Object.keys(JSON.parse(slide.dataset.tabs))[0]);
  });
  document.querySelector('#previous').addEventListener('click', () => show(current - 1));
  document.querySelector('#next').addEventListener('click', () => show(current + 1));
  jump.addEventListener('change', () => show(jump.value));
  document.querySelector('#fullscreen').addEventListener('click', fullScreen);
  document.querySelector('#motion').addEventListener('click', () => { motionOff = !motionOff; motion(); });
  document.querySelector('#open-overview').addEventListener('click', () => overview.showModal());
  document.querySelector('#close-overview').addEventListener('click', () => overview.close());
  document.querySelector('#open-help').addEventListener('click', () => help.showModal());
  document.querySelector('#close-help').addEventListener('click', () => help.close());
  document.querySelector('#timer').addEventListener('click', () => {
    if (timerStarted) { elapsed += Date.now() - timerStarted; timerStarted = 0; }
    else timerStarted = Date.now();
    document.querySelector('#timer').setAttribute('aria-pressed', String(Boolean(timerStarted)));
  });
  document.querySelector('#timer').addEventListener('dblclick', () => { elapsed = 0; timerStarted = 0; });
  setInterval(() => {
    const seconds = Math.floor((elapsed + (timerStarted ? Date.now() - timerStarted : 0)) / 1000);
    document.querySelector('#timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    document.querySelector('#timer').style.color = seconds >= 2700 ? '#ffada8' : '';
  }, 250);
  deck.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const slide = button.closest('.slide');
    if (button.hasAttribute('data-advance')) {
      const states = JSON.parse(slide.dataset.states);
      setFlow(slide, (Number(slide.dataset.step || 0) + 1) % states.length);
    }
    if (button.dataset.tab) setTab(slide, button.dataset.tab);
    if (button.hasAttribute('data-build-dashboard')) {
      const target = slide.querySelector('.dashboard-preview');
      const built = target.classList.toggle('built');
      button.setAttribute('aria-pressed', String(built));
      button.textContent = built ? 'Rever a solicitação' : 'Montar painel ilustrativo';
      slide.querySelector('[data-dashboard-status]').textContent = built
        ? 'Filtros, gráfico e rastreabilidade compõem a interface. Em produção, os valores vêm das fontes autorizadas.'
        : 'A solicitação define quais fontes, filtros e verificações o painel precisa ter.';
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.body.classList.remove('blanked');
    if (overview.open || help.open || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest('button, select, input, textarea, a, [contenteditable=true]')) return;
    const key = event.key.toLowerCase();
    if (['arrowright', 'pagedown', ' '].includes(key)) { event.preventDefault(); show(current + 1); }
    else if (['arrowleft', 'pageup'].includes(key)) { event.preventDefault(); show(current - 1); }
    else if (key === 'home') { event.preventDefault(); show(0); }
    else if (key === 'end') { event.preventDefault(); show(slides.length - 1); }
    else if (key === 'f') fullScreen();
    else if (key === 'o') overview.showModal();
    else if (key === 'b') document.body.classList.toggle('blanked');
    else if (key === '?') help.showModal();
  });
  frame.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') pointerStart = [event.clientX, event.clientY]; });
  frame.addEventListener('pointerup', event => {
    if (!pointerStart || event.target.closest('button,a')) { pointerStart = null; return; }
    const dx = event.clientX - pointerStart[0];
    const dy = event.clientY - pointerStart[1];
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
    pointerStart = null;
  });
  window.addEventListener('resize', size);
  window.addEventListener('hashchange', () => show(fromHash() ?? current, false));
  window.addEventListener('beforeprint', () => {
    slides.forEach(s => { if (s.dataset.states) setFlow(s, JSON.parse(s.dataset.states).length - 1); });
    document.querySelectorAll('.dashboard-preview').forEach(e => e.classList.add('built'));
  });
  window.addEventListener('afterprint', () => show(current));
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => { motionOff = event.matches; motion(); });
  window.presentation = {
    show,
    get count() { return slides.length; },
    get current() { return current; },
    exportState() {
      document.body.classList.add('motion-off');
      slides.forEach(s => { if (s.dataset.states) setFlow(s, JSON.parse(s.dataset.states).length - 1); });
      document.querySelectorAll('.dashboard-preview').forEach(e => e.classList.add('built'));
    }
  };
  motion();
  show(fromHash() ?? Number(storage.get(storageKey) || 0));
  size();
  document.fonts.ready.then(size);
})();
