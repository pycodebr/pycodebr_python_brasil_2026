'use strict';
/* Linha do tempo 2022–2026: trilho de anos, ano gigante e cenas animadas de cada marco. */
(() => {
  const S = window.SCENES = window.SCENES || {};
  const q = (r, s) => r.querySelector(s);
  const qa = (r, s) => [...r.querySelectorAll(s)];
  const years = [2022, 2023, 2024, 2025, 2026];
  const lit = (els, on = true) => () => [].concat(els).forEach(e => e && e.classList.toggle('lit', on));

  function yearChrome(slide) {
    const year = Number(slide.dataset.year);
    const digit = year % 10;
    const roll = q(slide, '.yg-roll');
    const rail = q(slide, '.year-rail');
    const marks = qa(rail, '.yr');
    const traveler = q(rail, '.traveler');
    marks.forEach(m => { const y = Number(m.dataset.y); m.classList.toggle('on', y === year); m.classList.toggle('past', y < year); });
    const center = el => el.offsetLeft + el.offsetWidth / 2;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(roll, { yPercent: -(digit - 1) * 10 }, { yPercent: -digit * 10, duration: 1.1, ease: 'expo.inOut' }, 0)
      .fromTo(q(slide, '.year-giant'), { x: 120, opacity: 0 }, { x: 0, opacity: .5, duration: 1.2, ease: 'expo.out' }, 0);
    const idx = years.indexOf(year);
    tl.add(() => {
      if (document.body.classList.contains('reading')) return;
      const from = marks[Math.max(0, idx - 1)], to = marks[idx];
      gsap.fromTo(traveler, { left: center(from), opacity: 1 }, { left: center(to), duration: .9, ease: 'power3.inOut', onComplete: () => gsap.to(traveler, { opacity: 0, duration: .4 }) });
    }, .1);
    tl.fromTo(qa(slide, '.year-stage > *'), { opacity: 0, y: 60, rotateX: -12 }, { opacity: 1, y: 0, rotateX: 0, duration: .9, stagger: .14, ease: 'expo.out' }, .35)
      .fromTo(q(slide, '.foot-note'), { opacity: 0 }, { opacity: 1, duration: .6 }, 1);
    return { tl, still: () => gsap.set(roll, { yPercent: -digit * 10 }) };
  }
  function typeTargets(slide) { qa(slide, '.t[data-t]').forEach(el => { el.textContent = el.dataset.t; }); }

  /* ---------- 2022 ---------- */
  S['ano-2022'] = slide => {
    typeTargets(slide);
    const chrome = yearChrome(slide);
    const flow = q(slide, '.chain-flow');
    const wires = FX.wires(flow, [
      { from: 'app', to: 'model', color: '#7dd3fc', mode: 'h', readingMode: 'v' },
      { from: 'model', to: 'data', color: '#b7ff06', mode: 'h', readingMode: 'v' }
    ], { packets: 2, speed: 160 });
    const msgs = qa(slide, '.chatgpt .msg');
    const intro = chrome.tl;
    intro.add(FX.type(q(slide, '.chain .term-line .t'), 'pip install langchain', .9), 1.1);
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.4 });
    const t = (sel) => q(slide, sel);
    loop.set(msgs, { opacity: 0, y: 20 })
      .to(msgs[0], { opacity: 1, y: 0, duration: .4 }, .1)
      .add(FX.type(t('.msg.user .t'), null, 1.1), .2)
      .fromTo(t('.msg.user code'), { opacity: 0 }, { opacity: 1, duration: .3 }, 1.2)
      .to(msgs[1], { opacity: 1, y: 0, duration: .4 }, 1.8)
      .add(FX.type(t('.msg.bot .t'), null, 2.1), 1.9)
      .add('still', 4.2)
      .to(msgs[2], { opacity: 1, y: 0, duration: .4 }, 4.4)
      .add(FX.type(t('.msg.u2 .t'), null, 1.1), 4.5)
      .call(lit(q(flow, '[data-node="app"]')), null, .3)
      .call(() => wires.burst('app', 'model', '#ffffff', .8), null, .6)
      .call(lit(q(flow, '[data-node="model"]')), null, 1.4)
      .call(() => wires.burst('model', 'data', '#ffffff', .8), null, 1.7)
      .call(lit(q(flow, '[data-node="data"]')), null, 2.5)
      .call(lit(qa(flow, '.node'), false), null, 5.5)
      .to({}, { duration: .4 }, 6.2);
    return { intro, loop, still: () => { chrome.still(); gsap.set(msgs, { opacity: 1, y: 0 }); typeTargets(slide); } };
  };

  /* ---------- 2023 ---------- */
  S['ano-2023'] = slide => {
    const chrome = yearChrome(slide);
    const grid = q(slide, '.canvas-grid');
    const wires = FX.wires(grid, [
      { from: 'in', to: 'llm', color: '#ffd343', mode: 'h', readingMode: 'v' },
      { from: 'llm', to: 'out', color: '#7dd3fc', mode: 'h', readingMode: 'v' }
    ], { packets: 2, speed: 150 });
    const nodes = qa(grid, '.fnode');
    const glow = q(slide, '.loop-glow');
    const stations = qa(slide, '.station');
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    gsap.set(glow, { rotation: -90, svgOrigin: '210 210' });
    loop.set(glow, { rotation: -100, svgOrigin: '210 210' });
    const order = [0, 1, 2, 3];
    order.forEach((st, i) => {
      loop.call(() => { stations.forEach(s => s.classList.remove('lit')); stations[st].classList.add('lit'); }, null, i * 1.25)
        .to(glow, { rotation: `+=90`, duration: 1.1, ease: 'power2.inOut' }, i * 1.25 + .1);
    });
    loop.add('still', 1.3);
    nodes.forEach((n, i) => {
      loop.call(() => nodes.forEach((m, j) => m.classList.toggle('lit', j === i)), null, i * 1.6);
      if (i < nodes.length - 1) loop.call(() => wires.burst(nodes[i].dataset.node, nodes[i + 1].dataset.node, '#ffffff', .9), null, i * 1.6 + .5);
    });
    loop.to({}, { duration: .2 }, 5);
    return { intro: chrome.tl, loop, still: () => { chrome.still(); stations[1].classList.add('lit'); nodes[1].classList.add('lit'); } };
  };

  /* ---------- 2024 ---------- */
  S['ano-2024'] = slide => {
    const chrome = yearChrome(slide);
    const sm = q(slide, '.state-machine');
    const [state, decide, end] = ['state', 'decide', 'end'].map(id => q(sm, `[data-node="${id}"]`));
    const smw = FX.wires(sm, [
      { from: 'state', to: 'decide', color: '#b7ff06', mode: 'h', packets: 0 },
      { from: 'decide', to: 'state', color: '#7dd3fc', mode: 'over', packets: 0 },
      { from: 'decide', to: 'end', color: '#ffd343', mode: 'v', packets: 0 }
    ]);
    const lf = q(slide, '.lf-canvas');
    const lfw = FX.wires(lf, [
      { from: 'lin', to: 'lmodel', color: '#b9a2f8', mode: 'v' },
      { from: 'lmodel', to: 'ltool', color: '#b7ff06', mode: 'v' }
    ], { packets: 2, speed: 120 });
    const mcp = q(slide, '.mcp');
    const head = q(slide, '.plug-head');
    const cord = q(slide, '.cord');
    const gapEl = q(slide, '.gap');
    const spark = q(slide, '.spark');
    const chips = qa(slide, '.tool-chips span');
    const reach = () => gapEl.offsetWidth + 2;
    const connect = on => {
      mcp.classList.toggle('connected', on);
      gsap.set(head, { x: on ? reach() : 0 });
      gsap.set(cord, { scaleX: on ? (cord.offsetWidth + reach()) / Math.max(1, cord.offsetWidth) : 1 });
    };
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: .6 });
    const hop = (a, b, at, color) => loop.call(() => smw.burst(a, b, color, .65), null, at);
    loop.call(lit(state), null, 0);
    for (let round = 0; round < 2; round++) {
      const t0 = .2 + round * 1.7;
      hop('state', 'decide', t0, '#ffffff');
      loop.call(lit(decide), null, t0 + .65).call(lit(state, false), null, t0 + .65);
      hop('decide', 'state', t0 + .9, '#ffffff');
      loop.call(lit(state), null, t0 + 1.55).call(lit(decide, false), null, t0 + 1.55);
    }
    hop('state', 'decide', 3.7, '#ffffff');
    loop.call(lit(decide), null, 4.35).call(lit(state, false), null, 4.35);
    hop('decide', 'end', 4.6, '#ffd343');
    loop.call(lit(end), null, 5.25).call(lit(decide, false), null, 5.25)
      .add('still', 5.4)
      .call(lit([state, decide, end], false), null, 7.6);
    const blocks = qa(lf, '.lf-block');
    loop.fromTo(blocks, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .35, ease: 'bounce.out' }, .2)
      .call(() => lfw.burst('lin', 'lmodel', '#fff', .8), null, 1.6)
      .call(() => lfw.burst('lmodel', 'ltool', '#fff', .8), null, 2.5);
    loop.call(() => { connect(false); chips.forEach(ch => ch.classList.remove('lit')); }, null, 0)
      .to(head, { x: () => reach(), duration: .8, ease: 'back.in(1.6)' }, 2.6)
      .to(cord, { scaleX: () => (cord.offsetWidth + reach()) / Math.max(1, cord.offsetWidth), duration: .8, ease: 'back.in(1.6)' }, 2.6)
      .call(() => mcp.classList.add('connected'), null, 3.4)
      .fromTo(spark, { opacity: 0, scale: .2 }, { opacity: 1, scale: 1.6, duration: .2, yoyo: true, repeat: 1 }, 3.4);
    chips.forEach((ch, i) => loop.call(() => ch.classList.add('lit'), null, 3.7 + i * .35));
    loop.to({}, { duration: .1 }, 7.6);
    return {
      intro: chrome.tl, loop,
      still: () => { chrome.still(); gsap.set(blocks, { opacity: 1, y: 0 }); connect(true); chips.forEach(ch => ch.classList.add('lit')); [decide, end].forEach(n => n.classList.add('lit')); }
    };
  };

  /* ---------- 2025 ---------- */
  S['ano-2025'] = slide => {
    typeTargets(slide);
    const chrome = yearChrome(slide);
    const files = Object.fromEntries(qa(slide, '.tree li').map(li => [li.dataset.f, li]));
    const out = q(slide, '.term-out');
    const lines = [q(out, '.l-read'), q(out, '.diff'), q(out, '.l-test'), q(out, '.l-rev')];
    const cards = qa(slide, '.cli-card');
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.6 });
    loop.set(lines, { opacity: 0, x: -14 })
      .call(() => Object.values(files).forEach(f => f.classList.remove('lit')), null, 0)
      .add(FX.type(q(out, '.cmd .t'), null, 1.2), .1)
      .call(() => files.src.classList.add('lit'), null, 1.5)
      .to(lines[0], { opacity: 1, x: 0, duration: .3 }, 1.5)
      .to(lines[1], { opacity: 1, x: 0, duration: .3 }, 2.3)
      .fromTo(q(out, '.minus'), { backgroundColor: 'rgba(255,90,95,.0)' }, { backgroundColor: 'rgba(255,90,95,.18)', duration: .3, yoyo: true, repeat: 1 }, 2.4)
      .fromTo(q(out, '.plus'), { backgroundColor: 'rgba(62,231,138,.0)' }, { backgroundColor: 'rgba(62,231,138,.2)', duration: .3, yoyo: true, repeat: 1 }, 2.8)
      .call(() => { files.src.classList.remove('lit'); files.tests.classList.add('lit'); }, null, 3.4)
      .to(lines[2], { opacity: 1, x: 0, duration: .3 }, 3.6)
      .fromTo(q(out, '.l-test b'), { scale: .6 }, { scale: 1, duration: .4, ease: 'back.out(3)' }, 3.6)
      .call(() => { files.tests.classList.remove('lit'); files.skill.classList.add('lit'); }, null, 4.4)
      .to(lines[3], { opacity: 1, x: 0, duration: .3 }, 4.6)
      .add('still', 5);
    cards.forEach((card, i) => loop.fromTo(card, { boxShadow: '0 0 0 0 rgba(185,162,248,0)' }, { boxShadow: '0 0 0 2px rgba(185,162,248,.8), 0 0 40px rgba(185,162,248,.35)', duration: .4, yoyo: true, repeat: 1 }, 5.4 + i * .6));
    return { intro: chrome.tl, loop, still: () => { chrome.still(); gsap.set(lines, { opacity: 1, x: 0 }); typeTargets(slide); } };
  };

  /* ---------- 2026 ---------- */
  S['ano-2026'] = slide => {
    const chrome = yearChrome(slide);
    const [r1, r2, r3] = qa(slide, '.rn');
    const arrows = qa(slide, '.rn-arrow');
    const hermes = q(slide, '.hermes');
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 4 });
    loop.set([r1, r2, r3, ...arrows], { opacity: 0 })
      .call(() => { r1.classList.remove('struck'); r2.classList.remove('struck'); }, null, 0)
      .to(r1, { opacity: 1, duration: .3 }, .2)
      .add(FX.scramble(r1, 'Clawdbot', .7), .2)
      .call(() => r1.classList.add('struck'), null, 1.2)
      .to(arrows[0], { opacity: 1, duration: .2 }, 1.3)
      .to(r2, { opacity: 1, duration: .3 }, 1.4)
      .add(FX.scramble(r2, 'Moltbot', .7), 1.4)
      .call(() => r2.classList.add('struck'), null, 2.4)
      .to(arrows[1], { opacity: 1, duration: .2 }, 2.5)
      .to(r3, { opacity: 1, duration: .3 }, 2.6)
      .add(FX.scramble(r3, 'OpenClaw', .9), 2.6)
      .fromTo(q(slide, '.openclaw .era-mascot'), { rotate: -20, scale: .8 }, { rotate: 0, scale: 1, duration: .8, ease: 'elastic.out(1,.5)' }, 3.4)
      .fromTo(q(hermes, '.bolt'), { opacity: 0, scale: .4 }, { opacity: 1, scale: 1.3, duration: .25, yoyo: true, repeat: 1 }, 4.4)
      .fromTo(q(hermes, '.era-mascot'), { scale: .3, opacity: 0, rotate: -30 }, { scale: 1, opacity: 1, rotate: 0, duration: 1, ease: 'expo.out' }, 4.5)
      .add(FX.scramble(q(hermes, '.hermes-name'), 'Hermes Agent', 1), 4.5)
      .fromTo(qa(hermes, '.chip'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: .12, duration: .4 }, 5.2)
      .add('still', 6.5)
      .call(() => FX.bg.kick(.6), null, 4.5);
    return {
      intro: chrome.tl, loop,
      still: () => { chrome.still(); gsap.set([r1, r2, r3, ...arrows], { opacity: 1 }); r1.classList.add('struck'); r2.classList.add('struck'); }
    };
  };
})();
