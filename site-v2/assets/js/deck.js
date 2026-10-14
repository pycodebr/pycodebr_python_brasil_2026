'use strict';
/* Motor da apresentação: navegação, escala, transições, ciclo de vida das cenas e controles de palco. */
(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const frame = document.querySelector('#frame');
  const deck = document.querySelector('#deck');
  const toolbar = document.querySelector('#toolbar');
  const jump = document.querySelector('#jump');
  const overview = document.querySelector('#overview');
  const menu = document.querySelector('#menu');
  const params = new URLSearchParams(location.search);
  const storageKey = 'pycodebr-python-brasil-2026-v2';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const saved = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, String(v)); } catch { /* sem armazenamento a navegação continua */ } }
  };
  const stillMode = params.has('still');
  if (stillMode) document.body.classList.add('export');
  let motionOff = stillMode || reducedMotion.matches || saved.get(storageKey + '-motion') === 'off';
  let current = -1;
  let scale = 1;
  let layoutFrame = null;
  let timerStart = 0, elapsed = 0;
  let idleTimer = null;
  let pointerStart = null;
  const built = new Map();
  const accents = { cyan: '#7dd3fc', yellow: '#ffd343', lime: '#b7ff06', purple: '#b9a2f8', rose: '#ff5fae', orange: '#ffb56b', green: '#3ee78a' };
  window.SCENES = window.SCENES || {};

  /* ---------- escala ---------- */
  function isReading() { return innerWidth < 1000 || innerWidth / innerHeight < 1.22; }
  function layout() {
    layoutFrame = null;
    const reading = isReading();
    const changed = reading !== document.body.classList.contains('reading');
    document.body.classList.toggle('reading', reading);
    const tb = reading ? Math.ceil(toolbar.getBoundingClientRect().height) + 20 : 0;
    document.documentElement.style.setProperty('--toolbar-h', tb + 'px');
    if (!reading) {
      scale = Math.max(.05, Math.min(innerWidth / 1920, innerHeight / 1080));
      frame.style.width = 1920 * scale + 'px';
      frame.style.height = 1080 * scale + 'px';
      deck.style.transform = `scale(${scale})`;
    } else {
      scale = 1;
      frame.style.width = ''; frame.style.height = '';
      deck.style.transform = 'none';
    }
    FX.repaintWires(slides[current]);
    if (changed) slides.forEach(s => built.get(s)?.layout?.());
    built.get(slides[current])?.layout?.();
  }
  const requestLayout = () => { if (layoutFrame === null) layoutFrame = requestAnimationFrame(layout); };

  /* ---------- HUD ---------- */
  const hud = document.querySelector('#hud');
  const track = hud.querySelector('.track');
  slides.forEach((s, i) => {
    if (s.dataset.tick) { const b = document.createElement('b'); b.style.left = (i / slides.length * 100) + '%'; track.append(b); }
  });
  function paintHud() {
    const s = slides[current];
    const color = accents[s.dataset.accent || 'cyan'];
    document.documentElement.style.setProperty('--hud-accent', color);
    hud.querySelector('.chapter').textContent = s.dataset.chapter || '';
    hud.querySelector('.count').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    track.querySelector('i').style.width = ((current + 1) / slides.length * 100) + '%';
    const rb = document.querySelector('#reading-bar');
    rb.querySelector('.rb-chapter').textContent = s.dataset.chapter || '';
    rb.querySelector('.rb-count').textContent = `${current + 1}/${slides.length}`;
    rb.querySelector('.rb-progress').style.width = ((current + 1) / slides.length * 100) + '%';
    FX.bg.setAccent(color);
    document.querySelector('#bg-glow').style.setProperty('--accent', color);
    document.querySelector('#bg-glow').style.setProperty('--accent-2', accents[s.dataset.accent2 || 'lime'] || '#b7ff06');
  }

  /* ---------- cenas ---------- */
  function scene(slide) {
    if (built.has(slide)) return built.get(slide);
    const factory = window.SCENES[slide.dataset.id];
    let api = {};
    try { api = factory ? (factory(slide, { motion: () => !motionOff, requestLayout }) || {}) : {}; }
    catch (err) { console.error('cena', slide.dataset.id, err); api = {}; }
    built.set(slide, api);
    return api;
  }
  function titleIntro(slide) {
    const words = [];
    slide.querySelectorAll('.slide-title, [data-split]').forEach(el => words.push(...FX.splitWords(el)));
    const all = [...slide.querySelectorAll('.slide-title .w > span, [data-split] .w > span')];
    if (!all.length) return null;
    if (motionOff) { gsap.set(all, { clearProps: 'transform,opacity' }); return null; }
    return gsap.fromTo(all, { yPercent: 115, rotate: 3, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: .9, ease: 'expo.out', stagger: .035, delay: .12 });
  }
  function enterScene(slide) {
    const sc = scene(slide);
    FX.activeSlide = slide;
    requestAnimationFrame(() => FX.repaintWires(slide));
    titleIntro(slide);
    if (sc.intro) { sc.intro.pause(0); }
    if (sc.loop) { sc.loop.pause(0); }
    if (motionOff) {
      if (sc.intro) sc.intro.progress(1).pause();
      if (sc.loop) { sc.loop.labels.still !== undefined ? sc.loop.pause('still') : sc.loop.pause(sc.loop.duration() * .5); }
      sc.still?.();
    } else {
      if (sc.intro) sc.intro.play(0);
      if (sc.loop) {
        const delay = sc.intro ? Math.max(0, sc.intro.duration() - (sc.overlap ?? .3)) : (sc.loopDelay ?? .4);
        sc._delay?.kill();
        sc._delay = gsap.delayedCall(delay, () => sc.loop.play(0));
      }
    }
    sc.enter?.();
  }
  function leaveScene(slide) {
    const sc = built.get(slide);
    if (!sc) return;
    sc._delay?.kill();
    sc.intro?.pause();
    sc.loop?.pause();
    sc.leave?.();
  }
  function replay() {
    const s = slides[current];
    const sc = built.get(s);
    if (!sc) return;
    sc.reset?.();
    leaveScene(s); enterScene(s);
  }

  /* ---------- transição ---------- */
  const glitch = document.querySelector('#glitch');
  const flash = document.querySelector('#flash');
  for (let i = 0; i < 9; i++) glitch.append(document.createElement('i'));
  function transition(from, to, dir) {
    if (!from || motionOff || document.body.classList.contains('reading')) {
      if (from) from.classList.remove('leaving');
      gsap.set(to, { clearProps: 'all' });
      if (document.body.classList.contains('reading') && from && !motionOff) gsap.fromTo(to, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out', clearProps: 'all' });
      return;
    }
    from.classList.add('leaving');
    const kind = to.dataset.transition || 'glitch';
    const tl = gsap.timeline({ onComplete: () => { from.classList.remove('leaving'); gsap.set([from, to], { clearProps: 'opacity,transform,filter,clipPath' }); } });
    if (kind === 'warp') {
      FX.bg.kick(1.4);
      tl.fromTo(from, { opacity: 1, scale: 1 }, { opacity: 0, scale: 1.25, filter: 'blur(10px)', duration: .45, ease: 'power2.in' }, 0)
        .fromTo(to, { opacity: 0, scale: .82, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .8, ease: 'expo.out' }, .28)
        .fromTo(flash, { opacity: 0 }, { opacity: .16, duration: .08, yoyo: true, repeat: 1 }, .3);
    } else if (kind === 'iris') {
      tl.to(from, { opacity: 0, duration: .35 }, 0)
        .fromTo(to, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: .9, ease: 'expo.inOut' }, 0);
    } else {
      const bars = [...glitch.children];
      glitch.style.display = 'block';
      bars.forEach(b => { b.style.top = Math.random() * 1040 + 'px'; b.style.height = (8 + Math.random() * 60) + 'px'; });
      tl.fromTo(bars, { scaleX: 0, opacity: .0 }, { scaleX: 1, opacity: .55, duration: .14, stagger: .015, ease: 'power3.in' }, 0)
        .to(bars, { opacity: 0, x: () => (Math.random() - .5) * 400, duration: .2, stagger: .01 }, .18)
        .to(from, { opacity: 0, x: -dir * 90, skewX: dir * 6, filter: 'hue-rotate(80deg) saturate(3)', duration: .28, ease: 'power2.in' }, 0)
        .fromTo(to, { opacity: 0, x: dir * 120, skewX: -dir * 8, filter: 'blur(8px) saturate(2.5)' }, { opacity: 1, x: 0, skewX: 0, filter: 'blur(0px) saturate(1)', duration: .7, ease: 'expo.out' }, .16)
        .set(glitch, { display: 'none' });
      FX.bg.kick(.35);
    }
  }

  /* ---------- navegação ---------- */
  function indexFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (/^\d+$/.test(h)) return Number(h) - 1;
    const i = slides.findIndex(s => s.dataset.id === h);
    return i >= 0 ? i : null;
  }
  function show(index, updateHash = true) {
    const next = Math.max(0, Math.min(slides.length - 1, Math.trunc(Number(index)) || 0));
    if (next === current) { if (updateHash) history.replaceState(null, '', `#${current + 1}`); return; }
    const prevSlide = slides[current];
    const dir = next > current ? 1 : -1;
    if (prevSlide) leaveScene(prevSlide);
    current = next;
    slides.forEach((s, i) => {
      const on = i === current;
      s.classList.toggle('active', on);
      s.inert = !on;
      s.setAttribute('aria-hidden', String(!on));
    });
    transition(prevSlide, slides[current], dir);
    jump.value = String(current);
    document.querySelector('#counter').textContent = `${current + 1} / ${slides.length}`;
    document.querySelector('#previous').disabled = current === 0;
    document.querySelector('#next').disabled = current === slides.length - 1;
    document.querySelectorAll('#overview-list button').forEach((b, i) => b.setAttribute('aria-current', String(i === current)));
    if (updateHash) history.replaceState(null, '', `#${current + 1}`);
    saved.set(storageKey, current);
    document.title = `${current + 1}. ${slides[current].dataset.title} | Python Brasil 2026 · PycodeBR`;
    paintHud();
    if (document.body.classList.contains('reading')) window.scrollTo({ top: 0, behavior: 'auto' });
    requestLayout();
    enterScene(slides[current]);
  }

  /* ---------- movimento ---------- */
  function setMotion() {
    FX.motion = !motionOff;
    document.body.classList.toggle('motion-off', motionOff);
    const b = document.querySelector('#motion');
    b.textContent = motionOff ? 'Ativar animações' : 'Pausar animações';
    b.setAttribute('aria-pressed', String(!motionOff));
    if (!stillMode) saved.set(storageKey + '-motion', motionOff ? 'off' : 'on');
    if (current >= 0) { leaveScene(slides[current]); enterScene(slides[current]); }
    if (motionOff) gsap.globalTimeline.timeScale(1);
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else document.querySelector('#fullscreen-help').hidden = false;
    } catch { document.querySelector('#fullscreen-help').hidden = false; }
    requestLayout();
  }
  function wake() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (!menu.open && !overview.open) document.body.classList.add('idle'); }, 2600);
  }

  /* ---------- montagem ---------- */
  slides.forEach((s, i) => {
    const o = document.createElement('option');
    o.value = String(i); o.textContent = `${String(i + 1).padStart(2, '0')} · ${s.dataset.title}`;
    jump.append(o);
    const b = document.createElement('button');
    const n = document.createElement('span');
    n.textContent = `${String(i + 1).padStart(2, '0')} · ${s.dataset.chapter || ''}`;
    b.append(n, document.createTextNode(s.dataset.title));
    b.addEventListener('click', () => { overview.close(); show(i); });
    document.querySelector('#overview-list').append(b);
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
  document.querySelector('#replay').addEventListener('click', () => { menu.close(); replay(); });
  const timer = document.querySelector('#timer');
  timer.addEventListener('click', () => {
    if (timerStart) { elapsed += Date.now() - timerStart; timerStart = 0; } else timerStart = Date.now();
    timer.setAttribute('aria-pressed', String(Boolean(timerStart)));
  });
  timer.addEventListener('dblclick', () => { timerStart = 0; elapsed = 0; timer.setAttribute('aria-pressed', 'false'); });
  setInterval(() => {
    const sec = Math.floor((elapsed + (timerStart ? Date.now() - timerStart : 0)) / 1000);
    timer.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    timer.style.color = sec >= 2400 ? 'var(--yellow)' : '';
  }, 250);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.body.classList.remove('blanked');
    if (menu.open || overview.open || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (e.target.closest('input,textarea,select,[contenteditable=true]')) return;
    if (e.target.closest('button,a') && [' ', 'enter'].includes(k)) return;
    const reading = document.body.classList.contains('reading');
    if (['arrowright', 'pagedown'].includes(k) || (k === ' ' && !reading)) { e.preventDefault(); show(current + 1); }
    else if (['arrowleft', 'pageup'].includes(k)) { e.preventDefault(); show(current - 1); }
    else if (k === 'home') { e.preventDefault(); show(0); }
    else if (k === 'end') { e.preventDefault(); show(slides.length - 1); }
    else if (k === 'f') fullscreen();
    else if (k === 'o') overview.showModal();
    else if (k === 'b') document.body.classList.toggle('blanked');
    else if (k === 'r') replay();
    else if (k === 'm') { motionOff = !motionOff; setMotion(); }
    else if (k === 't') timer.click();
    else if (k === '?') menu.showModal();
  });
  deck.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' && !e.target.closest('button,a,input,video')) pointerStart = [e.clientX, e.clientY];
  });
  deck.addEventListener('pointerup', e => {
    if (!pointerStart) return;
    const dx = e.clientX - pointerStart[0], dy = e.clientY - pointerStart[1];
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) show(current + (dx < 0 ? 1 : -1));
    pointerStart = null;
  });
  deck.addEventListener('pointercancel', () => { pointerStart = null; });
  ['mousemove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, wake, { passive: true }));
  addEventListener('resize', requestLayout);
  window.visualViewport?.addEventListener('resize', requestLayout);
  addEventListener('hashchange', () => show(indexFromHash() ?? current, false));
  document.addEventListener('fullscreenchange', requestLayout);
  reducedMotion.addEventListener('change', e => { motionOff = e.matches; setMotion(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) gsap.globalTimeline.pause(); else gsap.globalTimeline.resume(); });

  window.presentation = {
    show, replay, layout,
    get current() { return current; }, get count() { return slides.length; },
    get motion() { return !motionOff; },
    scene: id => built.get(slides.find(s => s.dataset.id === id))
  };

  FX.bg.init(document.querySelector('#bg-canvas'));
  FX.start();
  FX.motion = !motionOff;
  document.body.classList.toggle('motion-off', motionOff);
  const mb = document.querySelector('#motion');
  mb.textContent = motionOff ? 'Ativar animações' : 'Pausar animações';
  mb.setAttribute('aria-pressed', String(!motionOff));
  layout();
  const start = indexFromHash() ?? Number(saved.get(storageKey) || 0);
  show(Number.isFinite(start) ? start : 0);
  wake();
  document.fonts.ready.then(() => { requestLayout(); setTimeout(requestLayout, 300); document.documentElement.dataset.ready = 'true'; });
})();
