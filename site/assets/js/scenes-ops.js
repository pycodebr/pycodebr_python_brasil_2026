'use strict';
/* Cenas da operação: movimentos, execução, memória, arquitetura, rotinas e casos da PycodeBR. */
(() => {
  const S = window.SCENES = window.SCENES || {};
  const q = (r, s) => r.querySelector(s);
  const qa = (r, s) => [...r.querySelectorAll(s)];
  const setText = el => { if (el && el.dataset.t) el.textContent = el.dataset.t; };

  /* ---------- 10 três movimentos ---------- */
  S['tres-movimentos'] = slide => {
    const stage = q(slide, '.fronts-stage');
    const w = FX.wires(stage, [
      { from: 'cli', to: 'merge', color: '#7dd3fc', mode: 'v', packets: 3 },
      { from: 'skills', to: 'merge', color: '#ffd343', mode: 'v', packets: 3 },
      { from: 'agents', to: 'merge', color: '#b7ff06', mode: 'v', packets: 3 }
    ], { speed: 170 });
    const merge = q(slide, '.merge');
    const fronts = qa(slide, '.front');
    const t = q(slide, '.mini-term .t');
    setText(t);
    const intro = gsap.timeline({ paused: true });
    intro.fromTo(fronts, { opacity: 0, y: (i) => [80, -60, 80][i], rotate: (i) => [-6, 0, 6][i] }, { opacity: 1, y: 0, rotate: 0, duration: .9, stagger: .12, ease: 'expo.out' }, .1)
      .fromTo(merge, { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .8, ease: 'back.out(1.6)' }, .6);
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: .8 });
    loop.add(FX.type(t, null, 1.1), 0)
      .fromTo(q(slide, '.mini-term .t2'), { opacity: 0 }, { opacity: 1, duration: .3 }, 1.2)
      .to(q(slide, '.skill-stack .s2'), { x: -40, rotate: -8, duration: .6, ease: 'power2.inOut', yoyo: true, repeat: 1 }, .6)
      .to(qa(slide, '.agent-orbit .ch'), { y: -10, duration: .5, stagger: .15, yoyo: true, repeat: 1, ease: 'sine.inOut' }, .8)
      .add('still', 2);
    ['cli', 'skills', 'agents'].forEach((id, i) => {
      loop.call(() => w.burst(id, 'merge', '#ffffff', .8), null, 2 + i * .45)
        .call(() => merge.classList.add('hit'), null, 2.8 + i * .45)
        .call(() => merge.classList.remove('hit'), null, 3.05 + i * .45);
    });
    loop.to({}, { duration: .5 }, 4.4);
    return { intro, loop };
  };

  /* ---------- 11 pedido → execução ---------- */
  S['pedido-execucao'] = slide => {
    const stage = q(slide, '.exec-stage');
    const w = FX.wires(stage, [
      { from: 'req', to: 'core', color: '#7dd3fc', mode: 'h', packets: 1 },
      { from: 'core', to: 'trace', color: '#b7ff06', mode: 'h', packets: 1 }
    ], { speed: 120 });
    const req = q(slide, '.req-text .t');
    setText(req);
    const arc = q(slide, '.core-ring .arc');
    const phases = qa(slide, '.phase');
    const lines = qa(slide, '.trace-lines li');
    const legend = Object.fromEntries(qa(slide, '.tool-legend span').map(s => [s.dataset.r, s]));
    const angles = [-135, -45, 45, 135];
    const phase = (i, tl, at) => {
      tl.call(() => phases.forEach((p, j) => p.classList.toggle('lit', j === i)), null, at)
        .to(arc, { rotation: angles[i] - 36, svgOrigin: '200 200', duration: .45, ease: 'power2.inOut' }, at);
    };
    const status = (li, kind, text) => { const st = q(li, '.st'); st.className = 'st ' + kind; st.textContent = text; };
    const legendFor = k => (k === 'files' ? 'files' : k === 'check' ? 'check' : 'term');
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2.2 });
    loop.call(() => {
      lines.forEach(li => { li.classList.remove('fail'); status(li, '', ''); });
      Object.values(legend).forEach(s => s.classList.remove('lit'));
      phases.forEach(p => p.classList.remove('lit'));
    }, null, 0)
      .set(lines, { opacity: .32, x: 0 }, 0)
      .add(FX.type(req, null, 2), .1)
      .call(() => w.burst('req', 'core', '#ffffff', .7), null, 2.2);
    phase(0, loop, 2.6);
    phase(1, loop, 3.2);
    loop.call(() => w.burst('core', 'trace', '#ffffff', .7), null, 3.6);
    phase(2, loop, 3.8);
    let t0 = 4.2;
    lines.forEach(li => {
      const fail = li.dataset.fail === '1';
      const k = li.dataset.k;
      loop.fromTo(li, { opacity: .32, x: 24 }, { opacity: 1, x: 0, duration: .3, ease: 'power2.out' }, t0)
        .call(() => { status(li, 'run', 'executando'); Object.values(legend).forEach(s => s.classList.remove('lit')); legend[legendFor(k)]?.classList.add('lit'); }, null, t0);
      if (k === 'check') phase(3, loop, t0);
      if (fail) {
        loop.call(() => { status(li, 'err', 'falhou'); li.classList.add('fail'); }, null, t0 + .55)
          .fromTo(li, { x: -10 }, { x: 0, duration: .4, ease: 'elastic.out(1, .3)' }, t0 + .55);
        phase(0, loop, t0 + .7);
        phase(1, loop, t0 + 1.1);
        phase(2, loop, t0 + 1.45);
        t0 += 1.8;
      } else {
        loop.call(() => status(li, 'ok', k === 'check' ? 'conferido' : 'ok'), null, t0 + .55);
        t0 += .85;
      }
    });
    loop.add('still', t0 + .2).to({}, { duration: .1 }, t0 + .3);
    return {
      loop,
      still: () => {
        setText(req);
        gsap.set(lines, { opacity: 1, x: 0 });
        lines.forEach(li => { if (li.dataset.fail === '1') { status(li, 'err', 'falhou'); li.classList.add('fail'); } else status(li, 'ok', li.dataset.k === 'check' ? 'conferido' : 'ok'); });
        phases.forEach((p, j) => p.classList.toggle('lit', j === 3));
        gsap.set(arc, { rotation: 135 - 36, svgOrigin: '200 200' });
        legend.check?.classList.add('lit');
      }
    };
  };

  /* ---------- 12 memória ---------- */
  const learning = {
    first: {
      message: 'A página serviu o arquivo antigo. O Hermes investiga, corrige e registra a conferência do endereço final em uma skill.',
      steps: [['Publicar a apresentação', 'ok'], ['A página serviu o arquivo antigo', 'bad'], ['Investigar, corrigir e testar', 'ok'], ['Registrar a conferência na SKILL.md', 'skill']]
    },
    reuse: {
      message: 'Na próxima publicação, o Hermes consulta essa skill e compara a versão servida com o arquivo local antes de concluir.',
      steps: [['Publicar a atualização', 'ok'], ['Recuperar a skill de publicação', 'skill'], ['Comparar a versão servida com o arquivo local', 'ok'], ['Entrega conferida', 'ok']]
    }
  };
  S.memoria = (slide, ctx) => {
    const stage = q(slide, '.mem-stage');
    const w = FX.wires(stage, [
      { from: 'mem', to: 'agent', color: '#b9a2f8', mode: 'h', packets: 0 },
      { from: 'ctx', to: 'agent', color: '#7dd3fc', mode: 'h', packets: 0 },
      { from: 'skill', to: 'agent', color: '#b7ff06', mode: 'h', packets: 0 }
    ]);
    const steps = q(slide, '.steps');
    const msg = q(slide, '.story-msg');
    const buttons = qa(slide, '[data-phase]');
    const newLine = q(slide, '.skill-doc .new-line');
    const newText = q(slide, '.skill-doc .new-line .t');
    const stores = Object.fromEntries(qa(slide, '.store').map(s => [s.dataset.node, s]));
    let manual = null;
    const render = phase => {
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.phase === phase)));
      steps.replaceChildren(...learning[phase].steps.map(([text, kind]) => { const li = document.createElement('li'); li.className = kind; li.innerHTML = '<i aria-hidden="true"></i>'; li.append(document.createTextNode(text)); return li; }));
      msg.textContent = learning[phase].message;
    };
    const phaseTl = phase => {
      const tl = gsap.timeline();
      tl.call(() => { render(phase); gsap.set(qa(steps, 'li'), { opacity: .18, x: 0 }); Object.values(stores).forEach(s => s.classList.remove('glow')); }, null, 0)
        .call(() => { w.burst('mem', 'agent', '#fff', .6); w.burst('ctx', 'agent', '#fff', .7); }, null, .1);
      if (phase === 'first') tl.call(() => { newLine.style.visibility = 'hidden'; }, null, 0);
      else tl.call(() => { newLine.style.visibility = 'visible'; setText(newText); }, null, 0);
      const items = () => qa(steps, 'li');
      [0, 1, 2, 3].forEach(i => tl.call(() => gsap.fromTo(items()[i], { opacity: .18, x: 24 }, { opacity: 1, x: 0, duration: .35, ease: 'power2.out' }), null, .5 + i * .95));
      if (phase === 'first') {
        tl.call(() => gsap.fromTo(items()[1], { x: -12 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' }), null, 1.5)
          .call(() => { stores.skill.classList.add('glow'); newLine.style.visibility = 'visible'; newLine.classList.add('flash'); w.burst('agent', 'skill', '#b7ff06', .6); }, null, 3.4)
          .add(FX.type(newText, 'Conferir a versão servida antes de concluir', 1.3), 3.5)
          .call(() => newLine.classList.remove('flash'), null, 5.2);
      } else {
        tl.call(() => { stores.skill.classList.add('glow'); w.burst('skill', 'agent', '#b7ff06', .8); newLine.classList.add('flash'); }, null, 1.4)
          .call(() => newLine.classList.remove('flash'), null, 3);
      }
      tl.to({}, { duration: 1.2 }, 5.2);
      return tl;
    };
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    loop.add(phaseTl('first'), 0).add(phaseTl('reuse'), 6.8).add('still', 12.5).to({}, { duration: .2 }, 13.2);
    const choose = phase => {
      loop.pause();
      manual?.kill();
      manual = phaseTl(phase);
      if (!ctx.motion()) manual.progress(1);
    };
    buttons.forEach(b => b.addEventListener('click', () => choose(b.dataset.phase)));
    render('first');
    return {
      loop,
      reset: () => { manual?.kill(); manual = null; },
      leave: () => { manual?.pause(); },
      still: () => { render('reuse'); gsap.set(qa(steps, 'li'), { opacity: 1, x: 0 }); newLine.style.visibility = 'visible'; setText(newText); stores.skill.classList.add('glow'); }
    };
  };

  /* ---------- 13 arquitetura ---------- */
  const archText = {
    access: 'Você conversa com o mesmo núcleo operacional por interfaces e canais autorizados. SSH, VPN e mensageria têm funções diferentes.',
    context: 'A memória guarda fatos selecionados; a base conserva documentos; as skills registram procedimentos. Projetos e estado operacional ficam separados.',
    integrations: 'O Hermes usa modelos e consulta serviços por APIs, MCPs ou Composio. Cada conexão precisa de autenticação e permissões próprias.',
    outputs: 'A execução produz arquivos, código e entregas para a Central de Operações. A publicação usa HTTPS e acesso conforme o tipo de material.'
  };
  S['arquitetura-operacao'] = slide => {
    const map = q(slide, '.arch-map');
    const edges = [
      ['ssh', 'hermes', '#7dd3fc', 'access'], ['desktop', 'hermes', '#7dd3fc', 'access'], ['mobile', 'hermes', '#7dd3fc', 'access'],
      ['chat', 'gateway', '#7dd3fc', 'access'], ['gateway', 'hermes', '#7dd3fc', 'access'],
      ['context', 'hermes', '#b9a2f8', 'context'], ['hermes', 'projects', '#b9a2f8', 'context'], ['hermes', 'state', '#b9a2f8', 'context'],
      ['hermes', 'models', '#ff5fae', 'integrations'], ['hermes', 'integration', '#ffd343', 'integrations'],
      ['hermes', 'execution', '#b7ff06', 'outputs'], ['execution', 'central', '#b7ff06', 'outputs']
    ].map(([from, to, color, scope]) => ({ from, to, color, scope, mode: (['context', 'gateway'].includes(from) || (from === 'hermes' && ['projects', 'state', 'execution'].includes(to))) ? 'v' : 'h' }));
    const w = FX.wires(map, edges, { packets: 2, speed: 150 });
    const explain = q(slide, '.arch-explain');
    const buttons = qa(slide, '[data-focus]');
    const order = ['access', 'context', 'integrations', 'outputs'];
    const focus = f => {
      if (f) slide.dataset.focus = f; else delete slide.dataset.focus;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.focus === f)));
      w.setFocus(f || null);
      explain.textContent = f ? archText[f] : 'Acessos, contexto, integrações e entregas em volta do mesmo núcleo operacional.';
    };
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    loop.call(() => focus(null), null, 0);
    order.forEach((f, i) => {
      const at = 3 + i * 5;
      loop.call(() => focus(f), null, at);
      edges.filter(e => e.scope === f).forEach((e, j) => loop.call(() => w.burst(e.from, e.to, '#ffffff', .8), null, at + .3 + j * .25));
    });
    loop.add('still', 13.5).to({}, { duration: .1 }, 23);
    buttons.forEach(b => b.addEventListener('click', () => { loop.pause(); focus(b.dataset.focus); edges.filter(e => e.scope === b.dataset.focus).forEach((e, j) => setTimeout(() => w.burst(e.from, e.to, '#fff', .8), j * 200)); }));
    focus(null);
    const intro = gsap.timeline({ paused: true });
    intro.fromTo(qa(slide, '.col-access .anode'), { opacity: 0, x: -50 }, { opacity: 1, x: 0, stagger: .08, duration: .6, ease: 'expo.out' }, .1)
      .fromTo(q(slide, '.hermes-node'), { scale: .3, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.5)' }, .3)
      .fromTo(qa(slide, '.vps-grid .anode'), { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, stagger: .06, duration: .5 }, .5)
      .fromTo(qa(slide, '.col-out .anode'), { opacity: 0, x: 50 }, { opacity: 1, x: 0, stagger: .08, duration: .6, ease: 'expo.out' }, .7);
    return { intro, loop, still: () => focus('integrations') };
  };

  /* ---------- 14 rotinas ---------- */
  const routines = [
    { h: 3.5, type: 'agenda', label: 'Aprendizado do WhatsApp', out: 'notas novas na base de contexto' },
    { h: 7, type: 'agenda', label: 'Ideias de carrosséis', out: 'relatório na Central de Operações' },
    { h: 8, type: 'agenda', label: 'Notícias de IA do dia', out: 'posts e legendas para revisão' },
    { h: 8.5, type: 'agenda', label: 'Relatório de vendas e anúncios', out: 'fontes conferidas antes de publicar' },
    { h: 9, type: 'agenda', label: 'Triagem de acessos', out: 'aprovação ou revisão manual' },
    { h: 11.3, type: 'evento', label: 'Mensagem de voz recebida', out: 'guardada e transcrita no servidor' },
    { h: 13, type: 'agenda', label: 'Pendências da equipe no ClickUp', out: 'resumo para o time' },
    { h: 14.5, type: 'pedido', label: 'Pedido no WhatsApp: cortes do encontro', out: 'vídeos na pasta do Drive' },
    { h: 15, type: 'agenda', label: 'Publicação aprovada', out: 'post no horário definido' },
    { h: 17.4, type: 'pedido', label: 'Pedido no Slack: criativos da campanha', out: 'propostas para revisão' },
    { h: 19.2, type: 'evento', label: 'Alerta de falhas nas rotinas', out: 'aviso no canal da operação' },
    { h: 22, type: 'agenda', label: 'Reconciliação de vendas', out: 'divergências sinalizadas' },
    { h: 23, type: 'agenda', label: 'Sincronização da base', out: 'commit e push no repositório' }
  ];
  const ringR = { agenda: 300, pedido: 220, evento: 150 };
  const fmt = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  S.rotinas = slide => {
    const dial = q(slide, '.dial');
    const ns = 'http://www.w3.org/2000/svg';
    [330, 300, 220, 150].forEach(r => { const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', 400); c.setAttribute('cy', 400); c.setAttribute('r', r); dial.append(c); });
    for (let h = 0; h < 24; h++) {
      const a = h / 24 * Math.PI * 2;
      const l = document.createElementNS(ns, 'line');
      const r1 = h % 3 ? 340 : 330, r2 = 352;
      l.setAttribute('x1', 400 + Math.sin(a) * r1); l.setAttribute('y1', 400 - Math.cos(a) * r1);
      l.setAttribute('x2', 400 + Math.sin(a) * r2); l.setAttribute('y2', 400 - Math.cos(a) * r2);
      dial.append(l);
      if (h % 3 === 0) {
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', 400 + Math.sin(a) * 375); t.setAttribute('y', 400 - Math.cos(a) * 375);
        t.textContent = String(h).padStart(2, '0');
        dial.append(t);
      }
    }
    const blipsBox = q(slide, '.blips');
    const blips = routines.map(r => {
      const a = r.h / 24 * Math.PI * 2, rr = ringR[r.type];
      const b = document.createElement('i');
      b.className = 'blip ' + r.type;
      b.style.left = (50 + Math.sin(a) * rr / 8) + '%';
      b.style.top = (50 - Math.cos(a) * rr / 8) + '%';
      blipsBox.append(b);
      return b;
    });
    const sweep = q(slide, '.sweep');
    sweep.style.background = 'conic-gradient(from 0deg, transparent 0 82%, rgba(62,231,138,.06) 88%, rgba(62,231,138,.5) 100%)';
    const list = q(slide, '.feed-list');
    const clock = q(slide, '.clock');
    const core = q(slide, '.radar-core');
    const push = (r, animate = true) => {
      const li = document.createElement('li');
      li.className = r.type;
      li.innerHTML = '<span class="ft"></span><b></b><span></span>';
      li.children[0].textContent = fmt(r.h); li.children[1].textContent = r.label; li.children[2].textContent = r.out;
      list.prepend(li);
      if (animate) gsap.fromTo(li, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: .45, ease: 'power2.out' });
      while (list.children.length > 5) list.lastElementChild.remove();
    };
    const D = 18;
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    const clockState = { h: 0 };
    loop.call(() => { list.replaceChildren(); routines.slice(-3).forEach(r => push(r, false)); gsap.set(list.children, { opacity: .35 }); }, null, 0)
      .fromTo(sweep, { rotation: 0 }, { rotation: 360, duration: D, ease: 'none' }, 0)
      .fromTo(clockState, { h: 0 }, { h: 23.99, duration: D, ease: 'none', onUpdate: () => { clock.textContent = fmt(clockState.h); } }, 0);
    routines.forEach((r, i) => {
      loop.call(() => {
        blips[i].classList.add('hit'); setTimeout(() => blips[i].classList.remove('hit'), 380);
        push(r);
        if (r.type === 'evento') { core.classList.add('ping'); setTimeout(() => core.classList.remove('ping'), 500); }
      }, null, r.h / 24 * D);
    });
    loop.add('still', D * .97);
    return {
      loop,
      still: () => { list.replaceChildren(); routines.slice(-5).forEach(r => push(r, false)); gsap.set(sweep, { rotation: 352 }); clock.textContent = '23:30'; }
    };
  };

  /* ---------- 15 conteúdo ---------- */
  const posts = [
    ['assets/img/posts/news-python-315.webp', 'Post publicado pela PycodeBR: Python 3.15 muda como aplicações carregam módulos'],
    ['assets/img/posts/news-foresight.webp', 'Post publicado pela PycodeBR: Google lança Foresight, um app local de notas para Mac'],
    ['assets/img/posts/news-genkit-dart.webp', 'Post publicado pela PycodeBR: Genkit Dart 1.0 chega com agentes e aprovação humana'],
    ['assets/img/posts/news-cloudflare.webp', 'Post publicado pela PycodeBR sobre um modelo multimodal na Cloudflare']
  ];
  S.conteudo = slide => {
    const pipe = q(slide, '.pipe');
    const ids = ['research', 'sources', 'copy', 'art', 'review', 'publish'];
    const w = FX.wires(pipe, ids.slice(0, -1).map((id, i) => ({ from: id, to: ids[i + 1], color: '#ffd343', mode: 'h', packets: 1 })), { speed: 110 });
    const stations = Object.fromEntries(qa(pipe, '.pstation').map(s => [s.dataset.node, s]));
    const post = q(slide, '.forge-post');
    const frame = q(slide, '.forge-frame');
    const src = qa(slide, '.sk-src i');
    const lines = qa(slide, '.sk-lines i');
    const stamp = q(slide, '.stamp');
    const lanes = qa(slide, '.lane');
    const counts = [0, 0];
    const view = q(slide, '.browser-view img');
    const light = id => () => Object.entries(stations).forEach(([k, s]) => s.classList.toggle('lit', k === id));
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    const per = 6.4;
    posts.forEach(([file, alt], n) => {
      const b = n * per;
      const laneIdx = n % 2;
      loop.call(() => { post.src = file; post.alt = alt; lanes.forEach(l => l.classList.remove('lit')); if (n === 0) { counts[0] = 0; counts[1] = 0; lanes.forEach(l => { q(l, '.lane-count').textContent = '0'; }); } }, null, b)
        .set(post, { opacity: 0, clipPath: 'inset(100% 0 0 0)' }, b)
        .set([...src, ...lines], { opacity: 0, x: -10 }, b)
        .set(stamp, { opacity: 0, scale: 2 }, b)
        .call(light('research'), null, b + .1)
        .call(() => w.burst('research', 'sources', '#fff', .5), null, b + .6)
        .call(light('sources'), null, b + 1.1)
        .to(src, { opacity: 1, x: 0, stagger: .12, duration: .3 }, b + 1.1)
        .call(() => w.burst('sources', 'copy', '#fff', .5), null, b + 1.6)
        .call(light('copy'), null, b + 2.1)
        .to(lines, { opacity: 1, x: 0, stagger: .1, duration: .3 }, b + 2.1)
        .call(() => w.burst('copy', 'art', '#fff', .5), null, b + 2.6)
        .call(light('art'), null, b + 3.1)
        .to(post, { opacity: 1, clipPath: 'inset(0% 0 0 0)', duration: .7, ease: 'power3.out' }, b + 3.1)
        .call(() => w.burst('art', 'review', '#fff', .5), null, b + 3.7)
        .call(light('review'), null, b + 4.2)
        .to(stamp, { opacity: 1, scale: 1, duration: .35, ease: 'back.out(3)' }, b + 4.2)
        .call(() => w.burst('review', 'publish', '#fff', .5), null, b + 4.7)
        .call(light('publish'), null, b + 5.2)
        .call(() => {
          const lane = lanes[laneIdx];
          const done = () => { counts[laneIdx]++; q(lane, '.lane-count').textContent = String(counts[laneIdx]); lane.classList.add('lit'); };
          if (document.body.classList.contains('reading')) { done(); return; }
          const fly = document.createElement('div'); fly.className = 'fly-post';
          const img = document.createElement('img'); img.src = file; img.alt = ''; fly.append(img);
          slide.append(fly);
          const s = slide.getBoundingClientRect(), sc = s.width / slide.offsetWidth || 1;
          const a = frame.getBoundingClientRect(), z = lane.getBoundingClientRect();
          gsap.fromTo(fly, { left: (a.left - s.left) / sc + 120, top: (a.top - s.top) / sc + 150, scale: 1, opacity: 1 },
            { left: (z.left - s.left) / sc + 20, top: (z.top - s.top) / sc + 10, scale: .5, duration: .7, ease: 'power2.in', onComplete: () => { fly.remove(); done(); } });
        }, null, b + 5.3);
    });
    loop.add('still', per * 3 + 5.9).to({}, { duration: .4 }, per * 4);
    const scroll = gsap.timeline({ paused: true, repeat: -1, yoyo: true }).fromTo(view, { y: 0 }, { y: -260, duration: 9, ease: 'sine.inOut' });
    return {
      loop,
      enter: () => { if (!document.body.classList.contains('motion-off')) scroll.play(0); },
      leave: () => { scroll.pause(); qa(slide, '.fly-post').forEach(f => f.remove()); },
      still: () => { gsap.set([...src, ...lines], { opacity: 1, x: 0 }); gsap.set(post, { opacity: 1, clipPath: 'inset(0% 0 0 0)' }); gsap.set(stamp, { opacity: 1, scale: 1 }); q(lanes[0], '.lane-count').textContent = '2'; q(lanes[1], '.lane-count').textContent = '2'; }
    };
  };

  /* ---------- 16 painéis ---------- */
  S.paineis = slide => {
    const ask = q(slide, '.ask .t');
    setText(ask);
    const bars = qa(slide, '.bar i');
    const fail = q(slide, '.bar.fail');
    const tag = q(slide, '.fail-tag');
    const warn = q(slide, '.hb.warn');
    const lesson = q(slide, '.dash-lesson');
    const checks = qa(slide, '.art-info li');
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2 });
    loop.call(() => { fail.classList.remove('down'); checks.forEach(c => c.classList.remove('ok')); }, null, 0)
      .set(bars, { scaleY: 0 }, 0).set([tag, warn], { opacity: 0 }, 0).set(lesson, { opacity: .25 }, 0)
      .add(FX.type(ask, null, 1.6), .1)
      .to(bars, { scaleY: 1, duration: .8, stagger: .15, ease: 'expo.out' }, 1.9)
      .call(() => fail.classList.add('down'), null, 3.4)
      .to(tag, { opacity: 1, duration: .3 }, 3.5)
      .to(warn, { opacity: 1, duration: .3 }, 3.8)
      .to(lesson, { opacity: 1, duration: .4 }, 4.1)
      .add('still', 6.5);
    checks.forEach((c, i) => loop.call(() => c.classList.add('ok'), null, 1 + i * .55));
    loop.to({}, { duration: .1 }, 7);
    return { loop, still: () => { setText(ask); checks.forEach(c => c.classList.add('ok')); } };
  };

  /* ---------- 17 canais ---------- */
  S.canais = slide => {
    const stage = q(slide, '.channels-stage');
    const w = FX.wires(stage, [
      { from: 'phone', to: 'event', color: '#3ee78a', mode: 'h', packets: 0, readingMode: 'v' },
      { from: 'event', to: 'db', color: '#3ee78a', mode: 'v', packets: 1 },
      { from: 'db', to: 'media', color: '#3ee78a', mode: 'v', packets: 1 },
      { from: 'media', to: 'select', color: '#7dd3fc', mode: 'v', packets: 1 },
      { from: 'select', to: 'model', color: '#b9a2f8', mode: 'v', packets: 1 }
    ], { speed: 90 });
    const msgs = qa(slide, '.wa-msg');
    const steps = Object.fromEntries(qa(slide, '.ig-step').map(s => [s.dataset.node, s]));
    const lit = (...ids) => () => Object.entries(steps).forEach(([k, s]) => s.classList.toggle('lit', ids.includes(k)));
    const tc = qa(slide, '.tc-msg');
    const creatives = qa(slide, '.creatives i');
    const stamp = q(slide, '.review-stamp');
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.5 });
    loop.set(msgs, { opacity: 0, y: 14 }, 0).set(tc, { opacity: .2, y: 0 }, 0).set(creatives, { opacity: .12, scale: .9 }, 0).set(stamp, { opacity: 0, scale: 1.8 }, 0)
      .call(lit(), null, 0)
      .to(msgs[0], { opacity: 1, y: 0, duration: .35 }, .3)
      .call(() => w.burst('phone', 'event', '#fff', .6), null, .5)
      .call(lit('event', 'db'), null, 1.1)
      .to(msgs[1], { opacity: 1, y: 0, duration: .35 }, 1.6)
      .to(msgs[2], { opacity: 1, y: 0, duration: .35 }, 2.6)
      .call(() => w.burst('phone', 'event', '#fff', .6), null, 2.8)
      .call(lit('event', 'db', 'media'), null, 3.4)
      .to(msgs[3], { opacity: 1, y: 0, duration: .35 }, 4)
      .to(msgs[4], { opacity: 1, y: 0, duration: .35 }, 4.8)
      .call(() => w.burst('phone', 'event', '#fff', .6), null, 5)
      .call(lit('event', 'db', 'select', 'model'), null, 5.6)
      .fromTo(tc[0], { opacity: .2, y: 10 }, { opacity: 1, y: 0, duration: .35 }, 6.4)
      .fromTo(tc[1], { opacity: .2, y: 10 }, { opacity: 1, y: 0, duration: .35 }, 7.2)
      .to(creatives, { opacity: 1, scale: 1, duration: .35, stagger: .07, ease: 'back.out(2)' }, 7.6)
      .to(stamp, { opacity: 1, scale: 1, duration: .35, ease: 'back.out(3)' }, 8.6)
      .add('still', 9.2);
    return { loop };
  };

  /* ---------- 18 cortes de vídeo ---------- */
  const reelStyles = ['Aeroporto', 'Game', 'Podcast', 'IDE', 'Chat', 'Thriller', 'Documentário', 'Cinema', 'Game', 'Aeroporto'];
  S['cortes-video'] = (slide, ctx) => {
    const belt = q(slide, '.belt');
    const ids = ['rec', 'drivein', 'hermes', 'cuts', 'edit', 'qa', 'driveout', 'wa'];
    const w = FX.wires(belt, ids.slice(0, -1).map((id, i) => ({ from: id, to: ids[i + 1], color: '#ff5fae', mode: 'h', packets: 1 })), { speed: 90 });
    const stations = qa(belt, '.bstation');
    const panes = qa(slide, '.pane');
    const video = q(slide, 'video.reel');
    const styleTag = q(slide, '.reel-style');
    const wave = q(slide, '.wave-big');
    for (let i = 0; i < 64; i++) { const b = document.createElement('i'); b.style.height = (12 + Math.abs(Math.sin(i * .7) * 70) + (i % 5) * 4) + '%'; wave.append(b); }
    const marks = q(slide, '.tl-marks');
    const markData = [.06, .13, .21, .29, .38, .47, .58, .66, .78, .88];
    markData.forEach((x, i) => { const m = document.createElement('span'); m.className = 'tl-mark'; m.style.left = (x * 100) + '%'; m.style.width = '1.6%'; m.innerHTML = `<b>R${String(i + 1).padStart(2, '0')}</b>`; marks.append(m); });
    const show = i => () => {
      panes.forEach((p, j) => p.classList.toggle('on', j === i));
      stations.forEach((s, j) => { s.classList.toggle('lit', j === i); s.classList.toggle('done', j < i); });
    };
    const tc = q(slide, '.tc');
    const tcState = { s: 0 };
    const fmtTc = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = Math.floor(s % 60); return [h, m, x].map(v => String(v).padStart(2, '0')).join(':'); };
    const D = 2.6;
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    ids.forEach((id, i) => {
      loop.call(show(i), null, i * D);
      if (i < ids.length - 1) loop.call(() => w.burst(id, ids[i + 1], '#ffffff', .7), null, i * D + D - .7);
    });
    loop.fromTo(tcState, { s: 0 }, { s: 8528, duration: 2.2, ease: 'power1.in', onUpdate: () => { tc.textContent = fmtTc(tcState.s); } }, .1)
      .fromTo(qa(slide, '.du-file .bar i'), { width: '0%' }, { width: '100%', duration: 1.6, stagger: .3, ease: 'power2.inOut' }, D + .2)
      .fromTo(qa(wave, 'i'), { scaleY: .2 }, { scaleY: 1, duration: .25, stagger: { each: .015, repeat: 1, yoyo: true }, ease: 'sine.inOut' }, D * 2)
      .call(() => qa(slide, '.words b').forEach(b => b.classList.remove('on')), null, D * 2);
    qa(slide, '.words b').forEach((b, i) => loop.call(() => b.classList.add('on'), null, D * 2 + .3 + i * .22));
    loop.fromTo(qa(marks, '.tl-mark'), { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: .25, stagger: .12, ease: 'back.out(2)' }, D * 3 + .1)
      .fromTo(qa(slide, '.cut-cards span'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .3, stagger: .15 }, D * 3 + 1.3);
    const styleEls = qa(slide, '.styles span');
    styleEls.forEach((s, i) => loop.call(() => styleEls.forEach((x, j) => x.classList.toggle('on', j === i)), null, D * 4 + .1 + i * .26));
    qa(slide, '.qa-list li').forEach((li, i) => {
      loop.call(() => li.classList.remove('ok'), null, D * 5).call(() => li.classList.add('ok'), null, D * 5 + .25 + i * .4);
    });
    loop.fromTo(qa(slide, '.vf-file'), { opacity: 0, scale: .8 }, { opacity: 1, scale: 1, duration: .3, stagger: .25, ease: 'back.out(2)' }, D * 6 + .2)
      .fromTo(q(slide, '.toast'), { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'back.out(1.8)' }, D * 7 + .3)
      .add('still', D * 4 + 1.6)
      .to({}, { duration: .4 }, D * 8);
    const sync = () => { const i = Math.min(reelStyles.length - 1, Math.floor((video.currentTime || 0) / 1.6)); styleTag.textContent = reelStyles[i]; };
    video.addEventListener('timeupdate', sync);
    return {
      loop,
      enter: () => { if (ctx.motion()) video.play().catch(() => {}); else video.pause(); },
      leave: () => { video.pause(); },
      still: () => { show(4)(); styleEls.forEach((x, j) => x.classList.toggle('on', j === 0)); }
    };
  };
})();
