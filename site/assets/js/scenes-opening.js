'use strict';
/* Cenas de abertura: capa, palestrante, escola e QR dos slides. */
(() => {
  const S = window.SCENES = window.SCENES || {};
  const q = (root, sel) => root.querySelector(sel);
  const qa = (root, sel) => [...root.querySelectorAll(sel)];
  const splitChars = el => {
    if (el.dataset.chars) return qa(el, '.ch');
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; el.append(s); });
    el.dataset.chars = '1';
    return qa(el, '.ch');
  };

  /* A linha de scanner percorre o QR só na entrada e some, para não atrapalhar a leitura. */
  const scanPass = line => gsap.timeline()
    .set(line, { top: '10%', opacity: 0 })
    .to(line, { opacity: .9, duration: .15 })
    .to(line, { top: '88%', duration: .9, ease: 'sine.inOut' })
    .to(line, { top: '10%', duration: .9, ease: 'sine.inOut' })
    .to(line, { opacity: 0, duration: .25 });

  /* ---------- 01 capa ---------- */
  S.capa = slide => {
    const boot = q(slide, '.boot');
    const lines = qa(slide, '[data-boot]');
    lines.forEach(l => { l.dataset.text = l.dataset.boot; l.textContent = l.dataset.boot; });
    const chars = [...splitChars(q(slide, '.l1')), ...splitChars(q(slide, '.l2'))];
    const intro = gsap.timeline({ paused: true });
    intro.set(boot, { opacity: 1, y: 0 });
    lines.forEach((l, i) => intro.add(FX.type(l, l.dataset.boot, i === 0 ? .9 : .55), i === 0 ? 0 : '>+=.08'));
    intro.to(boot, { opacity: 0, y: -30, duration: .4, ease: 'power2.in' }, '>+=.25')
      .fromTo(q(slide, '.event-logo'), { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, '<')
      .fromTo(chars, { opacity: 0, scale: 2.8, y: -60 }, { opacity: 1, scale: 1, y: 0, duration: .55, ease: 'expo.out', stagger: .045 }, '<+=.1')
      .call(() => FX.bg.kick(1.1), null, '<+=.35')
      .fromTo(q(slide, '.cover-sub'), { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: .8, ease: 'expo.out' }, '>-=.25')
      .fromTo([q(slide, '.cover-desc'), q(slide, '.cover-author')], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, stagger: .12, ease: 'power3.out' }, '<+=.15')
      .fromTo(q(slide, '.orbit3d'), { opacity: 0, scale: .35, rotate: -40 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.6, ease: 'expo.out' }, 1.3);
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 4.5 });
    loop.add('still', 0)
      .fromTo(q(slide, '.l2'), { backgroundPosition: '100% 0%' }, { backgroundPosition: '0% 0%', duration: 1.6, ease: 'power2.inOut' }, 1)
      .to(chars, { x: () => gsap.utils.random(-14, 14), skewX: () => gsap.utils.random(-18, 18), color: '#b7ff06', duration: .06, stagger: { each: .01, from: 'random' } }, .2)
      .to(chars, { x: 0, skewX: 0, clearProps: 'color', duration: .12, stagger: { each: .01, from: 'random' } }, '>')
      .fromTo(q(slide, '.o-core'), { scale: 1 }, { scale: 1.08, duration: .5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0);
    return { intro, loop, still: () => gsap.set(boot, { opacity: 0 }) };
  };

  /* ---------- 02 felipe ---------- */
  S.felipe = slide => {
    const badge = q(slide, '.badge');
    const paths = qa(slide, '.lanyard path');
    paths.forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = 0; });
    const intro = gsap.timeline({ paused: true });
    intro.fromTo(paths, { strokeDashoffset: i => paths[i].getTotalLength() }, { strokeDashoffset: 0, duration: .7, ease: 'power2.out' }, 0)
      .fromTo(badge, { y: -900, rotate: -18, rotateY: 40 }, { y: 0, rotate: 0, rotateY: 0, duration: 1.5, ease: 'elastic.out(1, .55)' }, .15)
      .fromTo(q(slide, '.badge-pop img'), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'back.out(2)' }, 1.0)
      .fromTo(q(slide, '.bio'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, .55)
      .fromTo(qa(slide, '.speaker-chips .chip'), { opacity: 0, y: 20, scale: .8 }, { opacity: 1, y: 0, scale: 1, duration: .5, stagger: .1, ease: 'back.out(2)' }, .9);
    const loop = gsap.timeline({ paused: true, repeat: -1, yoyo: true });
    loop.add('still', 0).fromTo(badge, { rotate: -2.2, rotateY: -9 }, { rotate: 2.2, rotateY: 9, duration: 3.2, ease: 'sine.inOut' });
    return { intro, loop, overlap: 1.2, still: () => gsap.set(badge, { rotate: 0, rotateY: 0 }) };
  };

  /* ---------- 03 pycodebr: globo de pontos ---------- */
  function globe(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 1000, H = canvas.height = 1000;
    const N = 900, pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    const toVec = (lat, lon) => { const la = lat * Math.PI / 180, lo = lon * Math.PI / 180; return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]; };
    const brazil = toVec(-12, -50);
    const cities = [[-23.5, -46.6], [-30, -51.2], [-3.7, -38.5], [-15.8, -47.9], [38.7, -9.1], [40.7, -74], [51.5, -0.1], [35.7, 139.7], [-34.6, -58.4], [19.4, -99.1], [52.5, 13.4]].map(c => toVec(...c));
    let rot = 2.2, raf = null, t0 = 0;
    const tilt = -.32;
    const project = v => {
      const cr = Math.cos(rot), sr = Math.sin(rot);
      let x = v[0] * cr - v[2] * sr, z = v[0] * sr + v[2] * cr, y = v[1];
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const y2 = y * ct - z * st, z2 = y * st + z * ct;
      return [W / 2 + x * 400, H / 2 - y2 * 400, z2];
    };
    const slerp = (a, b, t) => {
      const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const om = Math.acos(dot) || 1e-6, so = Math.sin(om);
      const k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so;
      const lift = 1 + Math.sin(Math.PI * t) * .28;
      return [(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift];
    };
    function draw(ts) {
      const t = (ts - t0) / 1000;
      rot = 2.2 + t * .12;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 470);
      g.addColorStop(0, 'rgba(183,255,6,0.05)'); g.addColorStop(1, 'rgba(183,255,6,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, 470, 0, Math.PI * 2); ctx.fill();
      for (const p of pts) {
        const [x, y, z] = project(p);
        if (z < -.15) continue;
        const near = Math.hypot(p[0] - brazil[0], p[1] - brazil[1], p[2] - brazil[2]) < .45;
        ctx.fillStyle = near ? `rgba(183,255,6,${.35 + z * .6})` : `rgba(125,211,252,${.08 + z * .45})`;
        ctx.beginPath(); ctx.arc(x, y, near ? 2.6 : 1.8, 0, Math.PI * 2); ctx.fill();
      }
      cities.forEach((c, i) => {
        const phase = ((t * .35) + i * .17) % 1;
        ctx.strokeStyle = 'rgba(183,255,6,0.55)'; ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        for (let k = 0; k <= 40; k++) {
          const v = slerp(brazil, c, k / 40); const [x, y, z] = project(v);
          if (z < -.05) { started = false; continue; }
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
        const [hx, hy, hz] = project(slerp(brazil, c, phase));
        if (hz > -.05) { ctx.fillStyle = '#e8ffb0'; ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, Math.PI * 2); ctx.fill(); }
        const [cx, cy, cz] = project(c);
        if (cz > 0) { ctx.strokeStyle = `rgba(125,211,252,${.8 - phase * .8})`; ctx.beginPath(); ctx.arc(cx, cy, 4 + phase * 22, 0, Math.PI * 2); ctx.stroke(); }
      });
      const [bx, by, bz] = project(brazil);
      if (bz > 0) {
        const pulse = (t % 1.6) / 1.6;
        ctx.strokeStyle = `rgba(183,255,6,${1 - pulse})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(bx, by, 10 + pulse * 60, 0, Math.PI * 2); ctx.stroke();
      }
    }
    return {
      start() { if (raf) return; t0 = performance.now(); const f = ts => { draw(ts); raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); },
      stop() { if (raf) cancelAnimationFrame(raf); raf = null; },
      still() { this.stop(); draw(t0 + 2400); }
    };
  }
  S.pycodebr = (slide, ctx) => {
    const g = globe(q(slide, '.globe'));
    const intro = gsap.timeline({ paused: true });
    intro.fromTo(q(slide, '.school-id img'), { opacity: 0, rotate: -180, scale: .3 }, { opacity: 1, rotate: 0, scale: 1, duration: 1.1, ease: 'back.out(1.6)' }, 0)
      .fromTo(q(slide, '.school-quote'), { opacity: 0, y: 40, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .9, ease: 'power3.out' }, .45)
      .fromTo(qa(slide, '.discipline'), { opacity: 0, y: 26, scale: .85 }, { opacity: 1, y: 0, scale: 1, duration: .5, stagger: .1, ease: 'back.out(2)' }, .8)
      .fromTo(q(slide, '.reach-roll'), { yPercent: 0 }, { yPercent: -88.889, duration: 1.8, ease: 'power4.out' }, 1.0)
      .fromTo([q(slide, '.reach-plus'), q(slide, '.reach-mil'), q(slide, '.reach-text')], { opacity: 0 }, { opacity: 1, duration: .5, stagger: .1 }, 1.0)
      .fromTo(q(slide, '.ig-phone'), { opacity: 0, y: 140, rotate: 8 }, { opacity: 1, y: 0, rotate: -3, duration: 1.2, ease: 'expo.out' }, .3)
      .fromTo(qa(slide, '.ig-phone .vf'), { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, stagger: .06, ease: 'back.out(2)' }, 1.1)
      .add(scanPass(q(slide, '.ig-phone .scan-line')), 1.3);
    const loop = gsap.timeline({ paused: true, repeat: -1, yoyo: true });
    loop.add('still', 0).fromTo(q(slide, '.ig-phone'), { y: 0, rotate: -3 }, { y: -16, rotate: -1.5, duration: 2.6, ease: 'sine.inOut' });
    return {
      intro, loop,
      enter() { ctx.motion() ? g.start() : g.still(); },
      leave() { g.stop(); },
      still() { gsap.set(q(slide, '.reach-roll'), { yPercent: -88.889 }); }
    };
  };

  /* ---------- 04 acompanhe ---------- */
  S.acompanhe = slide => {
    const url = q(slide, '.fu-text');
    const intro = gsap.timeline({ paused: true });
    intro.fromTo(q(slide, '.qr-big'), { opacity: 0, scale: .55, rotate: -12 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'back.out(1.5)' }, .1)
      .fromTo(qa(slide, '.qr-stage .vf'), { opacity: 0, x: i => [-80, 80, -80, 80][i], y: i => [-80, -80, 80, 80][i] }, { opacity: 1, x: 0, y: 0, duration: .7, ease: 'expo.out', stagger: .05 }, .5)
      .fromTo(q(slide, '.lead'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .6 }, .6)
      .fromTo(q(slide, '.follow-url'), { opacity: 0, scaleX: .4, transformOrigin: 'left center' }, { opacity: 1, scaleX: 1, duration: .5, ease: 'expo.out' }, .8)
      .add(FX.type(url, 'pycodebr.com.br/python-brasil-2026', 1.3), 1.05)
      .fromTo(q(slide, '.caption'), { opacity: 0 }, { opacity: 1, duration: .5 }, 2.2)
      .add(scanPass(q(slide, '.qr-big .scan-line')), .9);
    return { intro };
  };
})();
