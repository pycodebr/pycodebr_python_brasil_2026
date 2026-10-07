'use strict';
(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const frame = document.querySelector('#frame');
  const deck = document.querySelector('#deck');
  const toolbar = document.querySelector('#toolbar');
  const jump = document.querySelector('#jump');
  const overview = document.querySelector('#overview');
  const menu = document.querySelector('#menu');
  const storageKey = 'pycodebr-python-brasil-2026-v3';
  const exportMode = new URLSearchParams(location.search).has('export');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const saved = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* Navigation works without storage. */ } }
  };
  const scenarios = JSON.parse(document.querySelector('#interaction-data').textContent);
  let current = 0;
  let motionOff = reducedMotion.matches || saved.get(storageKey + '-motion') === 'off';
  let timerStart = 0;
  let elapsed = 0;
  let pointerStart = null;
  let layoutFrame = null;
  let reportKind = 'bug';
  let approvalState = 'pending';
  let deploymentTimer = null;
  const svgNs = 'http://www.w3.org/2000/svg';
  if (exportMode) document.body.classList.add('export');

  function paintNetwork(network) {
    if (!network.offsetWidth || !network.offsetHeight) return;
    const svg = network.querySelector('.connections');
    if (!svg) return;
    const rect = network.getBoundingClientRect();
    const sx = network.offsetWidth / rect.width;
    const sy = network.offsetHeight / rect.height;
    svg.setAttribute('viewBox', `0 0 ${network.offsetWidth} ${network.offsetHeight}`);
    svg.replaceChildren();
    const edges = JSON.parse(network.dataset.edges || '[]');
    edges.forEach(([source, target, color, scope, route], index) => {
      const from = network.querySelector(`[data-node-id="${source}"]`);
      const to = network.querySelector(`[data-node-id="${target}"]`);
      if (!from || !to) return;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const sameColumn = Math.abs((a.left + a.width / 2) - (b.left + b.width / 2)) < Math.min(a.width, b.width) * 0.8;
      const vertical = document.body.classList.contains('reading') || sameColumn;
      let x1, y1, x2, y2, d;
      if (vertical) {
        x1 = (a.right - rect.left) * sx;
        y1 = (a.top + a.height / 2 - rect.top) * sy;
        x2 = (b.right - rect.left) * sx;
        y2 = (b.top + b.height / 2 - rect.top) * sy;
        const rail = Math.min(network.offsetWidth - 10, Math.max(x1, x2) + (document.body.classList.contains('reading') ? 12 : 35));
        d = `M ${x1} ${y1} C ${rail} ${y1}, ${rail} ${y2}, ${x2} ${y2}`;
      } else {
        const forward = b.left + b.width / 2 > a.left + a.width / 2;
        x1 = ((forward ? a.right : a.left) - rect.left) * sx;
        y1 = (a.top + a.height / 2 - rect.top) * sy;
        x2 = ((forward ? b.left : b.right) - rect.left) * sx;
        y2 = (b.top + b.height / 2 - rect.top) * sy;
        const bend = (x2 - x1) / 2;
        d = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
        if (route) {
          const sign = forward ? 1 : -1;
          const railY = route === 'above'
            ? Math.max(14, (Math.min(a.top, b.top) - rect.top) * sy - 22)
            : Math.min(network.offsetHeight - 12, (Math.max(a.bottom, b.bottom) - rect.top) * sy + 22);
          d = `M ${x1} ${y1} L ${x1 + sign * 14} ${y1} L ${x1 + sign * 14} ${railY} L ${x2 - sign * 14} ${railY} L ${x2 - sign * 14} ${y2} L ${x2} ${y2}`;
        }
      }
      const path = document.createElementNS(svgNs, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', 'edge');
      if (scope) path.dataset.scope = scope;
      if (color) path.style.setProperty('--edge-color', color);
      path.style.animationDelay = `${index * -0.7}s`;
      svg.append(path);
      const tip = document.createElementNS(svgNs, 'path');
      const direction = vertical || x2 < x1 ? 1 : -1;
      tip.setAttribute('d', `M${x2 + direction * 10} ${y2 - 6}L${x2} ${y2}L${x2 + direction * 10} ${y2 + 6}`);
      tip.setAttribute('fill', 'none');
      tip.setAttribute('stroke', color || 'var(--accent)');
      tip.setAttribute('stroke-width', '2');
      svg.append(tip);
    });
  }
  function layout() {
    layoutFrame = null;
    const reading = !exportMode && (innerWidth < 1024 || innerWidth / innerHeight < 1.25);
    document.body.classList.toggle('reading', reading);
    const toolbarHeight = exportMode ? 0 : Math.ceil(toolbar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--toolbar-h', toolbarHeight + 'px');
    if (!reading) {
      const gutter = exportMode ? 0 : 24;
      const scale = Math.max(0.05, Math.min((innerWidth - gutter) / 1920, (innerHeight - toolbarHeight - gutter) / 1080));
      frame.style.width = `${1920 * scale}px`;
      frame.style.height = `${1080 * scale}px`;
      deck.style.transform = `scale(${scale})`;
    } else {
      frame.style.width = '100%';
      frame.style.height = 'auto';
      deck.style.transform = 'none';
    }
    slides[current]?.querySelectorAll('.network').forEach(paintNetwork);
  }
  function requestLayout() {
    if (layoutFrame === null) layoutFrame = requestAnimationFrame(layout);
  }
  function indexFromHash() {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (/^\d+$/.test(hash)) return Number(hash) - 1;
    const match = slides.findIndex(slide => slide.dataset.id === hash);
    return match >= 0 ? match : null;
  }
  function show(index, updateHash = true) {
    const normalized = Math.max(0, Math.min(slides.length - 1, Math.trunc(Number(index)) || 0));
    current = normalized;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.inert = i !== current;
      slide.setAttribute('aria-hidden', String(i !== current));
    });
    jump.value = String(current);
    document.querySelector('#counter').textContent = `${current + 1} / ${slides.length}`;
    document.querySelector('#previous').disabled = current === 0;
    document.querySelector('#next').disabled = current === slides.length - 1;
    document.querySelector('#progress').style.width = `${(current + 1) / slides.length * 100}%`;
    document.querySelectorAll('#overview-list button').forEach((button, i) => button.setAttribute('aria-current', String(i === current)));
    if (updateHash || /^#\d+$/.test(location.hash) && Number(location.hash.slice(1)) !== current + 1) history.replaceState(null, '', `#${current + 1}`);
    saved.set(storageKey, current);
    document.title = `${current + 1}. ${slides[current].dataset.title} | Python Brasil 2026 · PycodeBR`;
    window.scrollTo({top: 0, behavior: 'auto'});
    requestLayout();
  }
  function setMotion() {
    document.body.classList.toggle('motion-off', motionOff || exportMode);
    const button = document.querySelector('#motion');
    button.textContent = motionOff ? 'Ativar animações' : 'Pausar animações';
    button.setAttribute('aria-pressed', String(!motionOff));
    saved.set(storageKey + '-motion', motionOff ? 'off' : 'on');
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else document.querySelector('#fullscreen-help').hidden = false;
    } catch {
      document.querySelector('#fullscreen-help').hidden = false;
      if (!menu.open) menu.showModal();
    }
    requestLayout();
  }
  function architecture(focus) {
    const target = document.querySelector('[data-scene="architecture"]');
    if (!scenarios.architecture[focus]) return;
    target.querySelectorAll('[data-architecture-focus]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.architectureFocus === focus)));
    target.querySelector('.network').dataset.focus = focus;
    target.querySelector('[data-architecture-explanation]').textContent = scenarios.architecture[focus];
    target.dataset.focus = focus;
    requestLayout();
  }
  function learning(stage) {
    const target = document.querySelector('[data-scene="learning"]');
    if (!scenarios.learning[stage]) return;
    target.querySelectorAll('[data-learning]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.learning === stage)));
    const data = scenarios.learning[stage];
    target.querySelector('[data-learning-message]').textContent = data.message;
    const evidence = target.querySelector('[data-learning-evidence]');
    evidence.replaceChildren();
    data.evidence.forEach((label, index) => {
      if (index) {
        const arrow = document.createElement('i');
        arrow.className = 'step-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        evidence.append(arrow);
      }
      const span = document.createElement('span');
      span.textContent = label;
      evidence.append(span);
    });
    target.dataset.stage = stage;
    requestLayout();
  }
  function workflow(step) {
    const data = scenarios.workflow[Number(step)];
    if (!data) return;
    const target = document.querySelector('[data-scene="workflow"]');
    target.querySelectorAll('[data-workflow-step]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.workflowStep === String(step))));
    target.querySelector('[data-step-number]').textContent = String(Number(step) + 1).padStart(2, '0');
    target.querySelector('[data-step-title]').textContent = data.title;
    target.querySelector('[data-step-body]').textContent = data.body;
    target.querySelector('[data-step-file]').textContent = data.file;
    target.querySelector('[data-step-output]').textContent = data.output;
    target.dataset.step = String(step);
    requestLayout();
  }
  function monitoring(kind) {
    const data = scenarios.monitoring[kind];
    if (!data) return;
    const target = document.querySelector('[data-scene="monitoring"]');
    target.querySelectorAll('[data-signal]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.signal === kind)));
    target.querySelector('[data-signal-title]').textContent = data.title;
    target.querySelector('[data-signal-legend]').textContent = data.legend;
    target.querySelector('[data-log-line]').textContent = data.log;
    target.querySelector('[data-investigation]').textContent = data.investigation;
    target.querySelector('[data-action]').textContent = data.action;
    const plot = target.querySelector('.signal-chart .plot');
    plot.setAttribute('d', data.path);
    plot.style.animation = 'none';
    void plot.getBoundingClientRect();
    plot.style.animation = '';
    target.dataset.signal = kind;
    requestLayout();
  }
  function report(kind) {
    const data = scenarios.reports[kind];
    if (!data) return;
    reportKind = kind;
    const target = document.querySelector('[data-scene="reports"]');
    target.querySelectorAll('[data-report]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.report === kind)));
    target.querySelector('[data-report-title]').textContent = data.title;
    target.querySelector('[data-report-description]').textContent = data.description;
    target.querySelector('[data-report-triage]').textContent = data.triage;
    document.querySelector('[data-pr-title]').textContent = data.pr;
    document.querySelector('[data-private-message]').textContent = data.message;
    target.dataset.report = kind;
    approve('pending');
    requestLayout();
  }
  function approve(state) {
    clearTimeout(deploymentTimer);
    approvalState = state;
    const target = document.querySelector('[data-scene="approval"]');
    const grid = target.querySelector('.approval-grid');
    grid.classList.toggle('approved', state === 'approved');
    grid.classList.toggle('completed', state === 'completed');
    const merge = target.querySelector('[data-merge]');
    merge.disabled = state !== 'approved';
    target.querySelector('[data-approve]').disabled = state === 'completed';
    const status = target.querySelector('[data-approval-state]');
    const messages = {
      pending: 'A PR aguarda sua revisão. Merge e deploy permanecem bloqueados.',
      approved: 'Aprovação registrada para esta revisão. A execução pode continuar.',
      rejected: 'A revisão pediu ajustes. O agente volta ao projeto e a PR continua aberta.',
      executing: 'Executando o percurso ilustrativo de merge, deploy e verificação.',
      completed: 'Percurso ilustrativo concluído. A versão implantada foi conferida no exemplo.'
    };
    status.textContent = messages[state];
    status.classList.toggle('approved', ['approved', 'completed'].includes(state));
    const authorized = ['approved', 'executing', 'completed'].includes(state);
    target.querySelector('[data-merge-label]').textContent = authorized ? 'Merge autorizado' : 'Merge após aprovação';
    target.querySelector('[data-deploy-label]').textContent = state === 'completed' ? 'Deploy conferido' : 'Deploy após o merge';
    target.querySelector('[data-verify-label]').textContent = state === 'completed' ? 'Correção conferida' : 'Verificar a entrega';
    target.dataset.approval = state;
  }
  function mergeDemo() {
    if (approvalState !== 'approved') return;
    approve('executing');
    deploymentTimer = setTimeout(() => approve('completed'), motionOff || exportMode ? 0 : 900);
  }
  slides.forEach((slide, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${String(index + 1).padStart(2, '0')} · ${slide.dataset.title}`;
    jump.append(option);
    const button = document.createElement('button');
    const number = document.createElement('span');
    number.textContent = `${String(index + 1).padStart(2, '0')} / ${slide.dataset.chapter}`;
    button.append(number, document.createTextNode(slide.dataset.title));
    button.addEventListener('click', () => { overview.close(); show(index); });
    document.querySelector('#overview-list').append(button);
  });
  document.querySelector('#previous').addEventListener('click', () => show(current - 1));
  document.querySelector('#next').addEventListener('click', () => show(current + 1));
  jump.addEventListener('change', () => show(jump.value));
  document.querySelector('#open-overview').addEventListener('click', () => overview.showModal());
  document.querySelector('#close-overview').addEventListener('click', () => overview.close());
  document.querySelector('#open-menu').addEventListener('click', () => menu.showModal());
  document.querySelector('#close-menu').addEventListener('click', () => menu.close());
  document.querySelector('#fullscreen').addEventListener('click', fullscreen);
  document.querySelector('#motion').addEventListener('click', () => { motionOff = !motionOff; setMotion(); });
  document.querySelector('#timer').addEventListener('click', () => {
    if (timerStart) { elapsed += Date.now() - timerStart; timerStart = 0; }
    else timerStart = Date.now();
    document.querySelector('#timer').setAttribute('aria-pressed', String(Boolean(timerStart)));
  });
  document.querySelector('#timer').addEventListener('dblclick', () => { timerStart = 0; elapsed = 0; document.querySelector('#timer').setAttribute('aria-pressed', 'false'); });
  setInterval(() => {
    const seconds = Math.floor((elapsed + (timerStart ? Date.now() - timerStart : 0)) / 1000);
    document.querySelector('#timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    document.querySelector('#timer').style.color = seconds >= 2400 ? 'var(--yellow)' : '';
  }, 250);
  deck.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.architectureFocus) architecture(button.dataset.architectureFocus);
    if (button.dataset.learning) learning(button.dataset.learning);
    if (button.dataset.workflowStep !== undefined) workflow(button.dataset.workflowStep);
    if (button.dataset.signal) monitoring(button.dataset.signal);
    if (button.dataset.report) report(button.dataset.report);
    if (button.hasAttribute('data-approve')) approve('approved');
    if (button.hasAttribute('data-reject')) approve('rejected');
    if (button.hasAttribute('data-reset-approval')) approve('pending');
    if (button.hasAttribute('data-merge')) mergeDemo();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.body.classList.remove('blanked');
    if (menu.open || overview.open || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (event.target.closest('input,textarea,select,[contenteditable=true]')) return;
    if (event.target.closest('button,a') && [' ', 'enter'].includes(key)) return;
    if (['arrowright', 'pagedown'].includes(key) || key === ' ' && !document.body.classList.contains('reading')) { event.preventDefault(); show(current + 1); }
    else if (['arrowleft', 'pageup'].includes(key)) { event.preventDefault(); show(current - 1); }
    else if (key === 'home') { event.preventDefault(); show(0); }
    else if (key === 'end') { event.preventDefault(); show(slides.length - 1); }
    else if (key === 'f') fullscreen();
    else if (key === 'o') overview.showModal();
    else if (key === 'b') document.body.classList.toggle('blanked');
    else if (key === '?') menu.showModal();
  });
  deck.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && !event.target.closest('button,a,input')) pointerStart = [event.clientX, event.clientY];
  });
  deck.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart[0];
    const dy = event.clientY - pointerStart[1];
    if (Math.abs(dx) > 85 && Math.abs(dx) > Math.abs(dy) * 2) show(current + (dx < 0 ? 1 : -1));
    pointerStart = null;
  });
  deck.addEventListener('pointercancel', () => { pointerStart = null; });
  window.addEventListener('resize', requestLayout);
  window.visualViewport?.addEventListener('resize', requestLayout);
  window.addEventListener('hashchange', () => show(indexFromHash() ?? current, false));
  document.addEventListener('fullscreenchange', requestLayout);
  new ResizeObserver(requestLayout).observe(toolbar);
  reducedMotion.addEventListener('change', event => { motionOff = event.matches; setMotion(); });
  const exportState = () => {
    document.body.classList.add('motion-off');
    architecture('integrations');
    learning('reuse');
    workflow('4');
    monitoring('latency');
    report('bug');
    approve('completed');
    slides.forEach(slide => {
      const active = slide.classList.contains('active');
      slide.style.display = 'flex';
      slide.querySelectorAll('.network').forEach(paintNetwork);
      slide.style.display = '';
      if (active) slide.classList.add('active');
    });
  };
  window.presentation = {
    show, layout, architecture, workflow, monitoring, report, approve,
    get current() { return current; },
    get count() { return slides.length; },
    get reportKind() { return reportKind; },
    exportState
  };
  window.addEventListener('beforeprint', exportState);
  setMotion();
  architecture('access');
  learning('first');
  workflow('0');
  monitoring('latency');
  report('bug');
  show(indexFromHash() ?? Number(saved.get(storageKey) || 0));
  document.fonts.ready.then(() => { requestLayout(); document.documentElement.dataset.ready = 'true'; });
})();
