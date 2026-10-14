'use strict';
/* Cenas de desenvolvimento: workflow, harness, stack, monitoria, reports, aprovação, permissões e fechamento. */
(() => {
  const S = window.SCENES = window.SCENES || {};
  const q = (r, s) => r.querySelector(s);
  const qa = (r, s) => [...r.querySelectorAll(s)];
  const setText = el => { if (el && el.dataset.t) el.textContent = el.dataset.t; };

  /* ---------- 19 workflow ---------- */
  const wf = [
    { title: 'Prompt bruto → Prompt refinado', body: 'Organize objetivo, usuários, regras e restrições antes de implementar.', file: 'Prompt refinado', output: 'A demanda estruturada.' },
    { title: 'Prompt refinado → PRD.md', body: 'Especifique o produto e organize o trabalho em sprints.', file: 'PRD.md', output: 'Requisitos e critérios de aceite.' },
    { title: 'PRD.md → Start Template', body: 'Prepare o projeto, as dependências e o design system.', file: 'Start Template', output: 'Uma base pronta para a sprint.' },
    { title: 'Start Template → Sprint', body: 'Implemente um recorte por vez no contexto do projeto.', file: 'Sprint implementada', output: 'Mudanças disponíveis para revisão.' },
    { title: 'Sprint → Review, Correções e Commit', body: 'Revise, teste e corrija antes do commit e do push. Depois, avance à próxima sprint.', file: 'Commit validado', output: 'O ciclo retorna à próxima sprint.' }
  ];
  S.workflow = (slide, ctx) => {
    const buttons = qa(slide, '[data-step]');
    const arts = qa(slide, '.art');
    const fill = q(slide, '.wf-fill');
    const num = q(slide, '[data-step-number]'), title = q(slide, '[data-step-title]'), body = q(slide, '[data-step-body]');
    const file = q(slide, '[data-step-file]'), output = q(slide, '[data-step-output]');
    let manual = null;
    const set = i => {
      buttons.forEach((b, j) => { b.setAttribute('aria-pressed', String(j === i)); b.classList.toggle('done', j < i); });
      arts.forEach((a, j) => a.classList.toggle('on', j === i));
      num.textContent = String(i + 1).padStart(2, '0');
      title.textContent = wf[i].title; body.textContent = wf[i].body; file.textContent = wf[i].file; output.textContent = wf[i].output;
      gsap.to(fill, { width: (i / 4 * 100) + '%', duration: .6, ease: 'power2.out' });
    };
    const artAnim = i => {
      const a = arts[i];
      const tl = gsap.timeline();
      tl.fromTo([num, title, body, q(slide, '.artifact-card')], { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: .08, duration: .4 }, 0);
      if (i === 0) {
        tl.fromTo(q(a, '.raw'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: .4 }, .1)
          .fromTo(qa(a, '.refined p'), { opacity: 0, x: 40 }, { opacity: 1, x: 0, stagger: .25, duration: .4, ease: 'power2.out' }, .9);
      } else if (i === 4) {
        tl.fromTo(qa(a, 'p'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: .35, duration: .3 }, .2)
          .fromTo(q(a, '.next'), { scale: 1 }, { scale: 1.12, duration: .3, yoyo: true, repeat: 3 }, 2.4);
      } else {
        tl.fromTo(qa(a, 'p'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: i === 3 ? .3 : .18, duration: .3 }, .2);
      }
      return tl;
    };
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    wf.forEach((_, i) => loop.call(() => { set(i); manual?.kill(); manual = null; artAnim(i); }, null, i * 5.2));
    loop.add('still', 4 * 5.2 + 3).to({}, { duration: .2 }, 5 * 5.2);
    buttons.forEach(b => b.addEventListener('click', () => {
      loop.pause(); const i = Number(b.dataset.step); set(i); manual?.kill(); manual = artAnim(i); if (!ctx.motion()) manual.progress(1);
    }));
    set(0);
    return { loop, reset: () => { manual?.kill(); manual = null; }, still: () => { set(4); artAnim(4).progress(1); gsap.set(fill, { width: '100%' }); } };
  };

  /* ---------- 20 harness ---------- */
  S.harness = slide => {
    const stage = q(slide, '.harness-stage');
    const w = FX.wires(stage, [
      { from: 'main', to: 'w1', color: '#b9a2f8', mode: 'h' }, { from: 'main', to: 'w2', color: '#7dd3fc', mode: 'h' }, { from: 'main', to: 'w3', color: '#e8f4ba', mode: 'h' },
      { from: 'w1', to: 'review', color: '#b9a2f8', mode: 'h' }, { from: 'w2', to: 'review', color: '#7dd3fc', mode: 'h' }, { from: 'w3', to: 'review', color: '#e8f4ba', mode: 'h' }
    ], { packets: 1, speed: 120 });
    const main = q(slide, '.h-main');
    const workers = qa(slide, '.worker');
    const checks = qa(slide, '.checks li');
    qa(slide, '.w-term .t').forEach(setText);
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.5 });
    loop.call(() => { checks.forEach(c => c.classList.remove('ok')); workers.forEach(x => x.classList.remove('busy')); }, null, 0)
      .set(qa(slide, '.w-term .o'), { opacity: 0 }, 0)
      .call(() => main.classList.add('pulse'), null, .1)
      .call(() => main.classList.remove('pulse'), null, 1.1);
    workers.forEach((wk, i) => {
      const at = .5 + i * .25;
      loop.call(() => w.burst('main', wk.dataset.node, '#fff', .7), null, at)
        .call(() => wk.classList.add('busy'), null, at + .7)
        .add(FX.type(q(wk, '.w-term .t'), null, 1.4), at + .7)
        .to(qa(wk, '.w-term .o'), { opacity: 1, stagger: .5, duration: .2 }, at + 2.4)
        .call(() => { wk.classList.remove('busy'); w.burst(wk.dataset.node, 'review', '#fff', .7); }, null, at + 4);
    });
    checks.forEach((c, i) => loop.call(() => c.classList.add('ok'), null, 5.2 + i * .35));
    loop.fromTo(q(slide, '.rv-icon'), { scale: 1 }, { scale: 1.2, duration: .25, yoyo: true, repeat: 1 }, 6.2).add('still', 6.8);
    return { loop, still: () => { qa(slide, '.w-term .t').forEach(setText); gsap.set(qa(slide, '.w-term .o'), { opacity: 1 }); checks.forEach(c => c.classList.add('ok')); } };
  };

  /* ---------- 21 stack ---------- */
  S.stack = slide => {
    const stage = q(slide, '.stack-stage');
    const w = FX.wires(stage, [
      { from: 'code', to: 'app', color: '#7dd3fc', mode: 'over', packets: 1 },
      { from: 'users', to: 'edge', color: '#7dd3fc', mode: 'h', packets: 2 },
      { from: 'edge', to: 'app', color: '#7dd3fc', mode: 'h', packets: 2 },
      { from: 'app', to: 'prom', color: '#e8f4ba', mode: 'h', packets: 2 },
      { from: 'app', to: 'loki', color: '#ffb56b', mode: 'h', packets: 2 },
      { from: 'prom', to: 'grafana', color: '#e8f4ba', mode: 'h', packets: 1 },
      { from: 'loki', to: 'grafana', color: '#ffb56b', mode: 'h', packets: 1 }
    ], { speed: 120 });
    const gl = qa(slide, '.gf-line');
    gl.forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; });
    const svcs = qa(slide, '.svc');
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: .6 });
    loop.fromTo(gl, { strokeDashoffset: i => gl[i].getTotalLength() }, { strokeDashoffset: 0, duration: 2.4, stagger: .4, ease: 'none' }, 0)
      .fromTo(qa(slide, '.gf-logs i'), { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, stagger: .3, duration: .3 }, .4)
      .call(() => w.burst('code', 'app', '#ffffff', 1), null, .2);
    svcs.forEach((s, i) => loop.call(() => svcs.forEach((x, j) => x.classList.toggle('hot', j === i)), null, .4 + i * .7));
    loop.call(() => svcs.forEach(x => x.classList.remove('hot')), null, 4.2).add('still', 3.2).to({}, { duration: .3 }, 4.6);
    return { loop };
  };

  /* ---------- 22 monitoria ---------- */
  const signals = {
    latency: { title: 'Latência em alta', legend: 'Tempo de resposta · curva ilustrativa', log: 'request_duration: aumento\nserviço: aplicação de exemplo', investigation: 'Cruzar requisições, consultas e a janela de logs.', action: 'Preparar hipótese, teste e proposta de correção.', path: 'M5 178L50 173L95 179L140 150L185 144L230 117L275 105L320 80L365 62L410 47L515 20' },
    queue: { title: 'Fila acumulando', legend: 'Trabalho pendente · curva ilustrativa', log: 'queue_depth: aumento\nworker: cenário de exemplo', investigation: 'Conferir chegada de tarefas, workers e falhas.', action: 'Avaliar capacidade e o runbook autorizado.', path: 'M5 187L50 187L95 168L140 164L185 139L230 139L275 97L320 96L365 55L410 54L515 16' },
    errors: { title: 'Erros após uma mudança', legend: 'Ocorrências por janela · curva ilustrativa', log: 'http_errors: aumento\nversão: revisão de exemplo', investigation: 'Relacionar o comportamento à versão e reproduzir.', action: 'Propor patch ou recuperação sob a política do projeto.', path: 'M5 180L50 183L95 178L140 180L185 172L230 30L275 108L320 25L365 87L410 37L515 68' }
  };
  S.monitoria = (slide, ctx) => {
    const stage = q(slide, '.mon-stage');
    const w = FX.wires(stage, [
      { from: 'grafana', to: 'trigger', color: '#ffb56b', mode: 'h', packets: 0 },
      { from: 'trigger', to: 'queue', color: '#b9a2f8', mode: 'h', packets: 0 },
      { from: 'queue', to: 'observer', color: '#b9a2f8', mode: 'v', packets: 0 },
      { from: 'observer', to: 'gmcp', color: '#ffd343', mode: 'h', packets: 0 },
      { from: 'observer', to: 'domain', color: '#7dd3fc', mode: 'h', packets: 0 },
      { from: 'observer', to: 'investigate', color: '#ffd343', mode: 'v', packets: 0 },
      { from: 'investigate', to: 'act', color: '#ffd343', mode: 'h', packets: 0 },
      { from: 'act', to: 'notify', color: '#b7ff06', mode: 'h', packets: 0 }
    ]);
    const plot = q(slide, '.plot');
    const dot = q(slide, '.alert-dot');
    const tabs = qa(slide, '[data-signal]');
    const nodes = Object.fromEntries(qa(slide, '[data-node]').map(n => [n.dataset.node, n]));
    const lit = (...ids) => () => Object.entries(nodes).forEach(([k, n]) => n.classList.toggle('lit', ids.includes(k)));
    const set = kind => {
      const d = signals[kind];
      tabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.signal === kind)));
      q(slide, '[data-sig-title]').textContent = d.title;
      q(slide, '[data-sig-legend]').textContent = d.legend;
      q(slide, '[data-sig-log]').textContent = d.log;
      q(slide, '[data-investigation]').textContent = d.investigation;
      q(slide, '[data-action]').textContent = d.action;
      plot.setAttribute('d', d.path);
      const len = plot.getTotalLength();
      let cross = null;
      for (let s = 0; s <= len; s += 4) { const p = plot.getPointAtLength(s); if (p.y < 70) { cross = p; break; } }
      if (cross) { dot.setAttribute('cx', cross.x); dot.setAttribute('cy', cross.y); }
      return len;
    };
    const cycle = (kind, tl, b) => {
      tl.call(() => { const len = set(kind); plot.style.strokeDasharray = len; gsap.fromTo(plot, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'none' }); }, null, b)
        .call(lit(), null, b)
        .set(dot, { opacity: 0 }, b)
        .to(dot, { opacity: 1, duration: .2, yoyo: true, repeat: 3 }, b + 1.2)
        .call(lit('grafana'), null, b + 1.2)
        .call(() => w.burst('grafana', 'trigger', '#ff5a5f', .6), null, b + 1.5)
        .call(lit('trigger'), null, b + 2.1)
        .call(() => w.burst('trigger', 'queue', '#fff', .5), null, b + 2.2)
        .call(lit('queue'), null, b + 2.7)
        .call(() => w.burst('queue', 'observer', '#fff', .5), null, b + 2.8)
        .call(lit('observer'), null, b + 3.3)
        .call(() => { w.burst('observer', 'gmcp', '#ffd343', .6); w.burst('observer', 'domain', '#7dd3fc', .8); }, null, b + 3.5)
        .call(lit('observer', 'gmcp', 'domain'), null, b + 4)
        .call(() => w.burst('observer', 'investigate', '#fff', .5), null, b + 4.6)
        .call(lit('investigate'), null, b + 5.1)
        .call(() => w.burst('investigate', 'act', '#fff', .5), null, b + 5.6)
        .call(lit('act'), null, b + 6.1)
        .call(() => w.burst('act', 'notify', '#b7ff06', .5), null, b + 6.6)
        .call(lit('notify'), null, b + 7.1);
    };
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    ['latency', 'queue', 'errors'].forEach((k, i) => cycle(k, loop, i * 8.4));
    loop.add('still', 7.3).to({}, { duration: .1 }, 25.2);
    tabs.forEach(t => t.addEventListener('click', () => { loop.pause(); const tl = gsap.timeline(); cycle(t.dataset.signal, tl, 0); if (!ctx.motion()) tl.progress(1); }));
    set('latency');
    return { loop, still: () => { set('latency'); plot.style.strokeDasharray = 'none'; gsap.set(dot, { opacity: 1 }); lit('observer', 'gmcp', 'domain')(); } };
  };

  /* ---------- 23 reports ---------- */
  const reports = {
    bug: { title: 'A busca falha com filtros combinados.', description: 'Uma pessoa descreve o comportamento e o resultado esperado.', triage: 'Bug → conferir contexto e reproduzir.', pr: 'PR: corrigir a combinação de filtros · diff, testes e riscos' },
    feature: { title: 'Salvar um filtro para reutilizar depois.', description: 'Uma sugestão propõe reduzir uma tarefa repetida no sistema.', triage: 'Melhoria → avaliar relevância e critérios de aceite.', pr: 'PR: adicionar filtros salvos · critérios e testes' }
  };
  S.reports = (slide, ctx) => {
    const stage = q(slide, '.rep-stage');
    const ids = ['report', 'entry', 'maint', 'branch', 'tests', 'pr'];
    const w = FX.wires(stage, [
      { from: 'report', to: 'entry', color: '#ff5fae', mode: 'h', packets: 1 },
      { from: 'entry', to: 'maint', color: '#7dd3fc', mode: 'h', packets: 1 },
      { from: 'maint', to: 'branch', color: '#b9a2f8', mode: 'v', packets: 1 },
      { from: 'branch', to: 'tests', color: '#ffd343', mode: 'h', packets: 1 },
      { from: 'tests', to: 'pr', color: '#b7ff06', mode: 'h', packets: 1 }
    ], { speed: 100 });
    const nodes = Object.fromEntries(qa(slide, '.rnode').map(n => [n.dataset.node, n]));
    const tabs = qa(slide, '[data-report]');
    const dots = qa(slide, '.test-dots i');
    const set = kind => {
      const d = reports[kind];
      tabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.report === kind)));
      q(slide, '[data-report-title]').textContent = d.title;
      q(slide, '[data-report-description]').textContent = d.description;
      q(slide, '[data-report-triage]').textContent = d.triage;
      q(slide, '[data-pr-line]').textContent = d.pr;
    };
    const run = (kind, tl, b) => {
      tl.call(() => { set(kind); Object.values(nodes).forEach(n => n.classList.remove('lit')); dots.forEach(d => { d.className = ''; }); }, null, b)
        .fromTo(q(slide, '.rep-card'), { scale: .96 }, { scale: 1, duration: .4, ease: 'back.out(2)' }, b);
      ids.slice(0, -1).forEach((id, i) => {
        tl.call(() => w.burst(id, ids[i + 1], '#fff', .55), null, b + .6 + i * .9)
          .call(() => nodes[ids[i + 1]]?.classList.add('lit'), null, b + 1.15 + i * .9);
      });
      dots.forEach((d, i) => tl.call(() => { d.className = kind === 'bug' && i % 4 === 1 ? 'red' : 'green'; }, null, b + 3.6 + i * .05));
      if (kind === 'bug') dots.forEach((d, i) => tl.call(() => { d.className = 'green'; }, null, b + 4.4 + i * .04));
    };
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    run('bug', loop, 0); run('feature', loop, 7.5);
    loop.add('still', 6.4).to({}, { duration: .2 }, 14.8);
    tabs.forEach(t => t.addEventListener('click', () => { loop.pause(); const tl = gsap.timeline(); run(t.dataset.report, tl, 0); if (!ctx.motion()) tl.progress(1); }));
    set('bug');
    return { loop };
  };

  /* ---------- 24 aprovação ---------- */
  const approvalText = {
    pending: 'A PR aguarda sua revisão. Merge e deploy permanecem bloqueados.',
    approved: 'Aprovação registrada para esta revisão. A execução pode continuar.',
    rejected: 'A revisão pediu ajustes. O agente volta ao projeto e a PR continua aberta.',
    executing: 'Executando o percurso ilustrativo de merge, deploy e verificação.',
    completed: 'Percurso ilustrativo concluído. A versão implantada foi conferida no exemplo.'
  };
  S.aprovacao = (slide, ctx) => {
    const status = q(slide, '[data-approval-state]');
    const approveBtn = q(slide, '[data-approve]'), rejectBtn = q(slide, '[data-reject]');
    const mergeBtn = q(slide, '[data-merge]'), resetBtn = q(slide, '[data-reset-approval]');
    const answer = q(slide, '.ap-answer');
    const prState = q(slide, '.pr-state');
    const steps = Object.fromEntries(qa(slide, '.dstep').map(d => [d.dataset.d, d]));
    const labels = { merge: q(slide, '[data-merge-label]'), deploy: q(slide, '[data-deploy-label]'), verify: q(slide, '[data-verify-label]') };
    let state = 'pending';
    let manual = null;
    const apply = s => {
      state = s;
      status.textContent = approvalText[s];
      status.classList.toggle('good', ['approved', 'completed'].includes(s));
      const authorized = ['approved', 'executing', 'completed'].includes(s);
      mergeBtn.disabled = s !== 'approved';
      Object.values(steps).forEach(d => d.classList.toggle('open', authorized));
      labels.merge.textContent = authorized ? 'Merge autorizado' : 'Merge após aprovação';
      labels.deploy.textContent = s === 'completed' ? 'Deploy conferido' : 'Deploy após o merge';
      labels.verify.textContent = s === 'completed' ? 'Correção conferida' : 'Verificar a entrega';
      answer.textContent = s === 'rejected' ? 'Peça ajustes nos testes de borda.' : authorized ? 'Aprovado.' : '';
      rejectBtn.disabled = s !== 'pending';
      approveBtn.disabled = s !== 'pending';
      prState.textContent = s === 'completed' ? 'Merged' : 'Aberta';
      prState.classList.toggle('merged', s === 'completed');
      if (s === 'pending' || s === 'rejected' || s === 'approved') Object.values(steps).forEach(d => d.classList.remove('run', 'done'));
    };
    const press = btn => gsap.timeline().call(() => btn.classList.add('pressed')).call(() => btn.classList.remove('pressed'), null, .25);
    const deliver = () => {
      const tl = gsap.timeline();
      tl.call(() => apply('executing'), null, 0);
      ['merge', 'deploy', 'verify'].forEach((k, i) => {
        tl.call(() => steps[k].classList.add('run'), null, .2 + i * .9)
          .call(() => { steps[k].classList.remove('run'); steps[k].classList.add('done'); }, null, .9 + i * .9);
      });
      tl.call(() => apply('completed'), null, 3);
      return tl;
    };
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.5 });
    loop.call(() => apply('pending'), null, 0)
      .fromTo(q(slide, '.ap-msg'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .4 }, .3)
      .add(press(rejectBtn), 2.2)
      .call(() => apply('rejected'), null, 2.5)
      .call(() => apply('pending'), null, 5)
      .add(press(approveBtn), 6.3)
      .call(() => apply('approved'), null, 6.6)
      .add(press(mergeBtn), 8)
      .add(() => deliver(), 8.2)
      .add('still', 11.6)
      .to({}, { duration: .1 }, 13.5);
    const take = () => { loop.pause(); manual?.kill(); };
    approveBtn.addEventListener('click', () => { take(); apply('approved'); });
    rejectBtn.addEventListener('click', () => { take(); apply('rejected'); });
    resetBtn.addEventListener('click', () => { take(); apply('pending'); });
    mergeBtn.addEventListener('click', () => { if (state !== 'approved') return; take(); manual = deliver(); if (!ctx.motion()) manual.progress(1); });
    apply('pending');
    return { loop, reset: () => { manual?.kill(); }, still: () => { apply('completed'); Object.values(steps).forEach(d => d.classList.add('done')); gsap.set(q(slide, '.ap-msg'), { opacity: 1, y: 0 }); } };
  };

  /* ---------- 25 permissões ---------- */
  S.permissoes = slide => {
    const stage = q(slide, '.perm-stage');
    const items = qa(slide, '.pitem');
    const gate = q(slide, '.gate');
    const arm = q(slide, '.gate-arm');
    const key = q(slide, '.key');
    const tks = qa(slide, '.tk');
    const pos = el => {
      const s = stage.getBoundingClientRect(), sc = s.width / stage.offsetWidth || 1, r = el.getBoundingClientRect();
      return { x: (r.left - s.left) / sc + 24, y: (r.top - s.top) / sc + r.height / sc / 2 };
    };
    const lit = (i, on) => () => items[i].classList.toggle('lit', on);
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1 });
    loop.call(() => { items.forEach(i => i.classList.remove('lit')); gate.classList.remove('open'); }, null, 0)
      .set(arm, { rotation: 0 }, 0).set(key, { opacity: 0, y: -20 }, 0).set(tks, { opacity: 0 }, 0);
    [0, 1, 2].forEach(i => {
      const at = .3 + i * .8;
      loop.set(tks[0], { opacity: 1, x: () => pos(items[i]).x - 60, y: () => pos(items[i]).y }, at)
        .to(tks[0], { x: () => pos(items[i]).x + 330, duration: .6, ease: 'power2.inOut' }, at)
        .call(lit(i, true), null, at + .3);
    });
    loop.set(tks[0], { opacity: 0 }, 2.8)
      .set(tks[1], { opacity: 1, x: () => pos(items[2]).x + 380, y: () => pos(items[2]).y }, 3)
      .to(tks[1], { x: () => pos(gate).x + 40, y: () => pos(gate).y + 80, duration: .7, ease: 'power2.inOut' }, 3)
      .to(tks[1], { x: '+=8', duration: .08, yoyo: true, repeat: 5 }, 3.75)
      .to(key, { opacity: 1, y: 0, duration: .4, ease: 'back.out(2)' }, 4.4)
      .call(() => gate.classList.add('open'), null, 4.9)
      .to(arm, { rotation: -80, duration: .5, ease: 'power2.out' }, 4.9);
    [3, 4, 5].forEach((i, k) => {
      const at = 5.5 + k * .8;
      loop.to(tks[1], { x: () => pos(items[i]).x, y: () => pos(items[i]).y, duration: .5, ease: 'power2.inOut' }, at)
        .call(lit(i, true), null, at + .45);
    });
    loop.to(tks[1], { opacity: 0, duration: .3 }, 8.2)
      .add('still', 8.3)
      .to(arm, { rotation: 0, duration: .5 }, 9.2).call(() => gate.classList.remove('open'), null, 9.2).to(key, { opacity: 0, duration: .3 }, 9.2);
    return { loop, still: () => { gsap.set(tks, { opacity: 0 }); items.forEach(i => i.classList.add('lit')); gate.classList.add('open'); gsap.set(arm, { rotation: -80 }); gsap.set(key, { opacity: 1, y: 0 }); } };
  };

  /* ---------- 26 materiais ---------- */
  S.materiais = slide => {
    const t = q(slide, '.term-card .t');
    setText(t);
    const intro = gsap.timeline({ paused: true });
    intro.fromTo(qa(slide, '.mat-list li'), { opacity: 0, x: -40 }, { opacity: 1, x: 0, stagger: .12, duration: .6, ease: 'expo.out' }, .4)
      .fromTo(q(slide, '.repo-btn'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .5 }, 1)
      .fromTo(q(slide, '.term-card'), { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .5 }, .3)
      .add(FX.type(t, null, 1.6), .6)
      .fromTo(q(slide, '.close-qr .qr-card'), { opacity: 0, scale: .6, rotate: 10 }, { opacity: 1, scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.5)' }, .5)
      .fromTo(qa(slide, '.close-qr .vf'), { opacity: 0, scale: 2 }, { opacity: 1, scale: 1, stagger: .06, duration: .4 }, 1.2)
      .call(() => FX.bg.kick(.8), null, .2);
    const loop = gsap.timeline({ paused: true, repeat: -1, yoyo: true });
    loop.add('still', 0).fromTo(q(slide, '.thanks'), { opacity: .35, letterSpacing: '.5em' }, { opacity: .9, letterSpacing: '.62em', duration: 2.4, ease: 'sine.inOut' });
    return { intro, loop };
  };
})();
