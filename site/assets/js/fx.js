'use strict';
/* Efeitos compartilhados: fundo animado, texto cinético, contadores e fios entre nós. */
(() => {
  const FX = {};
  const svgNs = 'http://www.w3.org/2000/svg';
  const rand = (a, b) => a + Math.random() * (b - a);
  FX.motion = true;

  /* ---------------- fundo: constelação 3D com modo warp ---------------- */
  const bg = { canvas: null, ctx: null, w: 0, h: 0, dpr: 1, pts: [], color: [125, 211, 252], target: [125, 211, 252], warp: 0, warpTarget: 0, running: false };
  function hexToRgb(hex) {
    const v = hex.trim().replace('#', '');
    const n = parseInt(v.length === 3 ? v.split('').map(c => c + c).join('') : v, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  bg.resize = () => {
    if (!bg.canvas) return;
    bg.dpr = Math.min(1.25, window.devicePixelRatio || 1);
    bg.w = innerWidth; bg.h = innerHeight;
    bg.canvas.width = Math.round(bg.w * bg.dpr); bg.canvas.height = Math.round(bg.h * bg.dpr);
    bg.ctx.setTransform(bg.dpr, 0, 0, bg.dpr, 0, 0);
  };
  bg.init = canvas => {
    bg.canvas = canvas; bg.ctx = canvas.getContext('2d');
    bg.resize();
    const count = innerWidth < 700 ? 60 : 105;
    bg.pts = Array.from({ length: count }, () => ({ x: rand(-1, 1), y: rand(-1, 1), z: rand(.2, 1), vx: rand(-.00025, .00025), vy: rand(-.00025, .00025) }));
    addEventListener('resize', bg.resize);
  };
  bg.setAccent = hex => { try { bg.target = hexToRgb(hex); } catch { /* cor inválida mantém a anterior */ } };
  bg.kick = (amount = 1) => { bg.warpTarget = amount; setTimeout(() => { bg.warpTarget = 0; }, 520); };
  bg.frame = () => {
    const { ctx, w, h } = bg;
    if (!ctx) return;
    for (let i = 0; i < 3; i++) bg.color[i] += (bg.target[i] - bg.color[i]) * .04;
    bg.warp += (bg.warpTarget - bg.warp) * .12;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, f = Math.max(w, h) * .55;
    const [r, g, b] = bg.color.map(Math.round);
    const proj = [];
    for (const p of bg.pts) {
      p.x += p.vx; p.y += p.vy;
      p.z -= .0009 + bg.warp * .03;
      if (p.z <= .08) { p.z = 1; p.x = rand(-1, 1); p.y = rand(-1, 1); }
      if (p.x < -1.2 || p.x > 1.2) p.vx *= -1;
      if (p.y < -1.2 || p.y > 1.2) p.vy *= -1;
      const sx = cx + (p.x / p.z) * f * .55, sy = cy + (p.y / p.z) * f * .55;
      proj.push([sx, sy, p.z]);
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < proj.length; i++) {
      const a = proj[i];
      for (let j = i + 1; j < proj.length; j++) {
        const c = proj[j];
        const dx = a[0] - c[0], dy = a[1] - c[1];
        const d2 = dx * dx + dy * dy;
        if (d2 < 21000) {
          const alpha = (1 - d2 / 21000) * .16 * (1.2 - (a[2] + c[2]) / 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
        }
      }
    }
    for (const [sx, sy, z] of proj) {
      const size = (1.2 - z) * 2.6 + .4;
      const alpha = Math.min(.85, (1.15 - z) * .8);
      if (bg.warp > .05) {
        const len = bg.warp * 40 * (1.2 - z);
        const ang = Math.atan2(sy - cy, sx - cx);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = size * .8;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - Math.cos(ang) * len, sy - Math.sin(ang) * len); ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();
      }
    }
  };
  FX.bg = bg;

  /* ---------------- texto ---------------- */
  FX.splitWords = el => {
    if (!el || el.dataset.split === 'done') return [];
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part;
            w.append(inner); frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR' && !child.classList.contains('w')) walk(child);
      });
    };
    walk(el);
    el.dataset.split = 'done';
    return [...el.querySelectorAll('.w > span')];
  };
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@/<>{}[]=+*';
  FX.scramble = (el, finalText, duration = 1.1) => {
    const text = finalText ?? el.dataset.text ?? el.textContent;
    el.dataset.text = text;
    const state = { p: 0 };
    return gsap.to(state, {
      p: 1, duration, ease: 'none',
      onUpdate() {
        const reveal = Math.floor(state.p * text.length);
        let out = '';
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (i < reveal || ch === ' ' || ch === '\n') out += ch;
          else out += glyphs[(Math.random() * glyphs.length) | 0];
        }
        el.textContent = out;
      },
      onComplete() { el.textContent = text; }
    });
  };
  FX.type = (el, text, duration) => {
    const full = text ?? el.dataset.text ?? el.textContent;
    el.dataset.text = full;
    const state = { n: 0 };
    return gsap.to(state, {
      n: full.length, duration: duration ?? Math.max(.4, full.length * .028), ease: 'none',
      onStart() { el.textContent = ''; el.classList.add('typing'); },
      onUpdate() { el.textContent = full.slice(0, Math.round(state.n)); },
      onComplete() { el.textContent = full; el.classList.remove('typing'); }
    });
  };
  FX.count = (el, to, duration = 1.6, format = v => Math.round(v).toLocaleString('pt-BR')) => {
    const state = { v: 0 };
    return gsap.to(state, { v: to, duration, ease: 'power3.out', onUpdate() { el.textContent = format(state.v); }, onComplete() { el.textContent = format(to); } });
  };

  /* ---------------- fios entre nós ---------------- */
  const wireSets = new Set();
  class Wires {
    constructor(host, edges, options = {}) {
      this.host = host; this.edges = edges; this.options = options; this.packets = []; this.paths = new Map();
      this.svg = document.createElementNS(svgNs, 'svg');
      this.svg.setAttribute('class', 'wires'); this.svg.setAttribute('aria-hidden', 'true');
      host.classList.add('has-wires');
      host.prepend(this.svg);
      this.focus = null;
      wireSets.add(this);
    }
    node(id) { return this.host.querySelector(`[data-node="${id}"]`); }
    geometry(el) {
      const hr = this.host.getBoundingClientRect();
      const s = hr.width / (this.host.offsetWidth || 1) || 1;
      const r = el.getBoundingClientRect();
      return { x: (r.left - hr.left) / s, y: (r.top - hr.top) / s, w: r.width / s, h: r.height / s };
    }
    route(a, b, edge) {
      const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      const dx = bc.x - ac.x, dy = bc.y - ac.y;
      let mode = edge.mode || this.options.mode || 'auto';
      if (mode === 'auto') mode = Math.abs(dx) > Math.abs(dy) * .9 ? 'h' : 'v';
      if (document.body.classList.contains('reading') && edge.readingMode) mode = edge.readingMode;
      let x1, y1, x2, y2, d;
      if (mode === 'h') {
        const fwd = dx >= 0;
        x1 = fwd ? a.x + a.w : a.x; y1 = ac.y; x2 = fwd ? b.x : b.x + b.w; y2 = bc.y;
        const k = Math.max(30, Math.abs(x2 - x1) * .5);
        d = `M${x1} ${y1}C${x1 + (fwd ? k : -k)} ${y1},${x2 - (fwd ? k : -k)} ${y2},${x2} ${y2}`;
      } else if (mode === 'v') {
        const down = dy >= 0;
        x1 = ac.x; y1 = down ? a.y + a.h : a.y; x2 = bc.x; y2 = down ? b.y : b.y + b.h;
        const k = Math.max(24, Math.abs(y2 - y1) * .5);
        d = `M${x1} ${y1}C${x1} ${y1 + (down ? k : -k)},${x2} ${y2 - (down ? k : -k)},${x2} ${y2}`;
      } else if (mode === 'over') {
        x1 = ac.x; y1 = a.y; x2 = bc.x; y2 = b.y;
        const lift = Math.max(60, Math.abs(x2 - x1) * .35);
        d = `M${x1} ${y1}C${x1} ${y1 - lift},${x2} ${y2 - lift},${x2} ${y2}`;
      } else if (mode === 'side') {
        x1 = a.x + a.w; y1 = ac.y; x2 = b.x + b.w; y2 = bc.y;
        const rail = Math.max(x1, x2) + 46;
        d = `M${x1} ${y1}C${rail} ${y1},${rail} ${y2},${x2} ${y2}`;
      }
      return { d, x2, y2, x1, y1 };
    }
    paint() {
      if (!this.host.offsetWidth) return;
      this.svg.setAttribute('viewBox', `0 0 ${this.host.offsetWidth} ${this.host.offsetHeight}`);
      this.svg.replaceChildren(); this.paths.clear(); this.packets = [];
      this.edges.forEach((edge, index) => {
        const from = this.node(edge.from), to = this.node(edge.to);
        if (!from || !to || !from.offsetParent || !to.offsetParent) return;
        const geo = this.route(this.geometry(from), this.geometry(to), edge);
        const path = document.createElementNS(svgNs, 'path');
        path.setAttribute('d', geo.d); path.setAttribute('class', 'wire' + (edge.solid ? ' solid' : ''));
        path.style.setProperty('--c', edge.color || 'var(--accent)');
        if (edge.scope) path.dataset.scope = edge.scope;
        this.svg.append(path);
        const len = path.getTotalLength();
        if (edge.tip !== false && len > 20) {
          const end = path.getPointAtLength(len), prev = path.getPointAtLength(len - 8);
          const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
          const s = 9, tip = document.createElementNS(svgNs, 'path');
          const p1 = [end.x - Math.cos(ang - .5) * s * 1.6, end.y - Math.sin(ang - .5) * s * 1.6];
          const p2 = [end.x - Math.cos(ang + .5) * s * 1.6, end.y - Math.sin(ang + .5) * s * 1.6];
          tip.setAttribute('d', `M${end.x} ${end.y}L${p1[0]} ${p1[1]}L${p2[0]} ${p2[1]}Z`);
          tip.setAttribute('class', 'tip'); tip.style.setProperty('--c', edge.color || 'var(--accent)');
          if (edge.scope) tip.dataset.scope = edge.scope;
          this.svg.append(tip);
        }
        const key = edge.from + '>' + edge.to;
        this.paths.set(key, { path, len, edge });
        const n = edge.packets ?? this.options.packets ?? 2;
        for (let i = 0; i < n; i++) {
          const c = document.createElementNS(svgNs, 'circle');
          c.setAttribute('r', edge.r || this.options.r || 5); c.setAttribute('class', 'packet');
          c.style.setProperty('--c', edge.color || 'var(--accent)');
          if (edge.scope) c.dataset.scope = edge.scope;
          this.svg.append(c);
          this.packets.push({ c, path, len, t: (i / n) + index * .13, speed: (edge.speed || this.options.speed || 140) / Math.max(len, 1), reverse: !!edge.reverse });
        }
      });
      this.applyFocus();
      this.tick(0);
    }
    setFocus(scope) { this.focus = scope; this.applyFocus(); }
    applyFocus() {
      const f = this.focus;
      this.svg.querySelectorAll('[data-scope], .wire, .packet, .tip').forEach(el => {
        const dim = f && el.dataset.scope !== f;
        el.classList.toggle('dim', !!dim);
        if (el.classList.contains('wire')) el.classList.toggle('hot', !!f && el.dataset.scope === f);
      });
    }
    tick(dt) {
      for (const p of this.packets) {
        p.t = (p.t + p.speed * dt) % 1;
        const pt = p.path.getPointAtLength((p.reverse ? 1 - p.t : p.t) * p.len);
        p.c.setAttribute('cx', pt.x.toFixed(1)); p.c.setAttribute('cy', pt.y.toFixed(1));
      }
    }
    burst(from, to, color, duration = .9) {
      let entry = this.paths.get(from + '>' + to), reverse = false;
      if (!entry) { entry = this.paths.get(to + '>' + from); reverse = true; }
      if (!entry) return;
      const c = document.createElementNS(svgNs, 'circle');
      c.setAttribute('r', 10); c.setAttribute('class', 'packet');
      c.style.setProperty('--c', color || entry.edge.color || 'var(--accent)');
      this.svg.append(c);
      const s = { t: 0 };
      gsap.to(s, { t: 1, duration, ease: 'power2.inOut', onUpdate: () => {
        const pt = entry.path.getPointAtLength((reverse ? 1 - s.t : s.t) * entry.len);
        c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
      }, onComplete: () => c.remove() });
      entry.path.classList.add('hot');
      setTimeout(() => entry.path.classList.remove('hot'), duration * 1000 + 200);
    }
    activeIn(slide) { return slide && slide.contains(this.host); }
  }
  FX.wires = (host, edges, options) => new Wires(host, edges, options);
  FX.wireSets = wireSets;

  /* ---------------- loop global ---------------- */
  let last = 0;
  FX.activeSlide = null;
  function loop(ts) {
    const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
    if (FX.motion && !document.hidden) {
      bg.frame();
      for (const ws of wireSets) if (ws.activeIn(FX.activeSlide)) ws.tick(dt);
    }
    requestAnimationFrame(loop);
  }
  FX.start = () => requestAnimationFrame(loop);
  FX.repaintWires = slide => { for (const ws of wireSets) if (!slide || ws.activeIn(slide)) ws.paint(); };
  window.FX = FX;
})();
