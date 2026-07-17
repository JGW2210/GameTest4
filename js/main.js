/* ============================================================
 * WORDLOOM — UI, second weaving.
 * title → weaver select → world doors → battle / camp / event /
 * elder → rewards → next world → the Illiterate.
 * ============================================================ */
(function () {
  const $screen = document.getElementById('screen');
  const $hud = document.getElementById('hud');
  const $toast = document.getElementById('toast');

  let meta = Loom.syncMeta(LoomSave.load());
  let run = null;
  let battle = null;
  let picked = [];
  let blankAssign = {}; // uncut runes: tileId → the letter it is shaped into

  /* a picked id may live in the tray, ride the shuttle, or be a bobbin */
  function tileById(id) {
    let t = battle && battle.tray.find(x => x.id === id);
    if (!t && run && run.shuttle) t = run.shuttle.find(x => x.id === id);
    if (!t && run && run.bobbins) t = run.bobbins.find(x => x.id === id);
    return t;
  }

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  function toast(msg, ms) {
    $toast.innerHTML = msg;
    $toast.classList.add('show');
    clearTimeout($toast._t);
    $toast._t = setTimeout(() => $toast.classList.remove('show'), ms || 2400);
  }

  /* ================= V5 visual layer plumbing ================= */
  const rnd2 = (a, b) => a + Math.random() * (b - a);
  function centerOf(elem) {
    if (!elem) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = elem.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function floatText(x, y, txt, color) {
    const f = el('div', 'float-txt', txt);
    f.style.left = (x - 20) + 'px'; f.style.top = (y - 20) + 'px';
    f.style.color = color || '#fff';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }
  function shakeScreen() {
    const s = $screen;
    s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
  }
  // weave-thread transition between screens (WebGL); instant otherwise
  function flipScreen(renderFn) {
    if (window.GLFX && GLFX.weaveTransition(renderFn)) return;
    renderFn();
  }

  /* per-element particle palettes for the loom-tongue */
  const ELEM_FX = {
    ign: { colors: ['#ff9a3c', '#ff5c2c', '#ffd700'], head: '#ffb347', ink: '#ff7a3c' },
    gel: { colors: ['#9adcff', '#5ab0ff', '#e8f6ff'], head: '#bfe6ff', ink: '#7ec4ff' },
    ter: { colors: ['#c9a227', '#8a6a3a', '#e8d9b0'], head: '#d9b96a', ink: '#b08d4a' },
    aer: { colors: ['#d6fff7', '#8fe8d8', '#ffffff'], head: '#c8f4ea', ink: '#8fe8d8' },
    ven: { colors: ['#9fce6a', '#4a7a34', '#d6ff9a'], head: '#9fce6a', ink: '#7fbf5f' },
    ful: { colors: ['#ffe95c', '#a887ff', '#ffffff'], head: '#ffee9a', ink: '#ffd75c' },
    aqu: { colors: ['#6db6ff', '#2a6fd0', '#bfe0ff'], head: '#8ac4ff', ink: '#6db6ff' },
    umb: { colors: ['#7b5fd0', '#3a2a66', '#b49aff'], head: '#8a6fd8', ink: '#a887ff' },
    lum: { colors: ['#fff3b0', '#ffd700', '#ffffff'], head: '#fff3b0', ink: '#ffd700' },
    san: { colors: ['#7fdf8f', '#3f7d47', '#d6ffda'], head: '#8fe89a', ink: '#5fbf6d' },
    nih: { colors: ['#b49aff', '#2a2233', '#6a5f8a'], head: '#9a8fc0', ink: '#8a7fb0' },
    cru: { colors: ['#ff6b5c', '#8c1218', '#ffb3a0'], head: '#ff8a7a', ink: '#e05a4a' },
  };

  /* play the engine's fx-event queue against the freshly rendered DOM */
  function playFx(evts) {
    if (!evts || !evts.length || !window.FX) return;
    let delay = 0;
    const later = (fn, add) => { setTimeout(fn, delay); delay += (add == null ? 110 : add); };
    const foeP = (idx) => centerOf(document.getElementById('foe-art-' + idx) || document.querySelector('.foe-row'));
    const meP = () => centerOf(document.querySelector('.hpbar.mine') || document.querySelector('.you'));
    const loomP = () => centerOf(document.querySelector('.spell-build') || document.querySelector('.tray'));
    const castInBatch = evts.some(ev => ev.type === 'cast');
    evts.forEach(ev => {
      switch (ev.type) {
        case 'cast':
          later(() => {
            const pal = ELEM_FX[ev.el] || {};
            const from = loomP(), to = foeP(battle ? battle.target : 0);
            const color = ev.how === 'improvised' ? '#9a8fc0' : (pal.ink || '#a887ff');
            if (FX.wordVolley) {
              FX.wordVolley(from.x, from.y, to.x, to.y, ev.word, { color });
              FX.shockwave(from.x, from.y, { color, r: 90 });
            } else FX.runes(from.x, from.y - 20, ev.word, { color });
          }, 240);
          break;
        case 'foeHit':
          later(() => {
            const p = foeP(ev.idx);
            const pal = ELEM_FX[ev.el];
            const impact = () => {
              floatText(p.x + rnd2(-18, 18), p.y - 18,
                '-' + ev.amount + (ev.rel === 'weak' ? ' !' : ev.rel === 'resist' ? ' ·' : ''),
                ev.rel === 'weak' ? '#ffd75c' : ev.rel === 'resist' ? '#b7ac97' : '#ff8a5c');
              const art = document.getElementById('foe-art-' + ev.idx);
              if (art) { art.classList.remove('hit'); void art.offsetWidth; art.classList.add('hit'); }
            };
            if (castInBatch) {
              // the word volley is already in flight — land the numbers with it
              setTimeout(impact, 620);
            } else if (pal && FX.projectile) {
              const from = loomP();
              FX.projectile(from.x, from.y, p.x, p.y, pal, impact);
            } else {
              FX.slash(p.x, p.y, { color: pal ? pal.head : '#fff' });
              impact();
            }
          }, 150);
          break;
        case 'dot':
          later(() => {
            const p = foeP(ev.idx);
            const cols = ev.kind === 'poison' ? ['#9fce6a', '#4a7a34'] : ['#ff9a3c', '#ff5c2c'];
            FX.burst(p.x, p.y, { count: 12, colors: cols, speed: 3, size: 3 });
            floatText(p.x, p.y - 12, `-${ev.amount} ${ev.kind === 'poison' ? '☠' : '🔥'}`, cols[0]);
          }, 160);
          break;
        case 'foeDown':
          later(() => {
            const p = foeP(ev.idx);
            if (FX.dissolve) FX.dissolve(p.x, p.y);
            else FX.burst(p.x, p.y, { count: 30, colors: ['#8a8578', '#3a2c1a', '#c9a227'], speed: 6 });
            const art = document.getElementById('foe-art-' + ev.idx);
            if (art) art.classList.add('dissolving');
          }, 260);
          break;
        case 'playerHit':
          later(() => {
            const p = meP();
            if (ev.loss > 0) {
              floatText(p.x, p.y - 12, '-' + ev.loss, '#ff5c5c');
              FX.burst(p.x, p.y, { count: 12, colors: ['#a2352c', '#ff8a5c'], speed: 4 });
              shakeScreen();
              if (FX.pulse) FX.pulse('#a2352c', Math.min(1, 0.3 + ev.loss / 20));
            } else FX.shield(p.x, p.y);
          }, 200);
          break;
        case 'block':
          later(() => { const p = meP(); FX.shield(p.x, p.y); });
          break;
        case 'discard':
          later(() => {
            const p = centerOf(document.querySelector('.tray'));
            FX.burst(p.x, p.y, { count: Math.min(40, 8 * ev.n), colors: ['#8a744c', '#c9a227', '#5a4a30'], speed: 4, size: 3.5 });
          });
          break;
        case 'heal':
          later(() => { const p = meP(); FX.heal(p.x, p.y); floatText(p.x, p.y - 10, '+' + ev.amount, '#5fbf6d'); });
          break;
        case 'solved':
          later(() => {
            const g = centerOf(document.querySelector('.mystery-panel'));
            FX.powerNova(g.x, g.y);
            if (ev.notes) FX.runes(g.x, g.y - 44, '✒✒', { color: '#ffd700', size: 22 });
          }, 260);
          break;
        case 'blank':
          later(() => {
            const p = loomP();
            FX.runes(p.x, p.y - 24, '★', { color: '#c9a2ff', size: 24 });
            FX.burst(p.x, p.y, { count: 14, colors: ['#c9a2ff', '#8a6fd8', '#fff3b0'], speed: 3.5, size: 3 });
          }, 200);
          break;
        case 'wind':
          later(() => {
            const p = centerOf(document.querySelector('.bobbin-rack') || document.querySelector('.tray'));
            FX.burst(p.x, p.y, { count: Math.min(24, 6 * ev.n), colors: ['#c9a227', '#a97e1e', '#f4e6d0'], speed: 3, size: 3 });
          }, 150);
          break;
        case 'foeAct':
          later(() => {
            const art = document.getElementById('foe-art-' + ev.idx);
            if (art) { art.classList.remove('acting'); void art.offsetWidth; art.classList.add('acting'); }
          }, 230);
          break;
        case 'victory':
          later(() => {
            FX.confetti();
            if (FX.pulse) FX.pulse('#c9a227', 0.6);
            if (window.GLBG) GLBG.setMood('victory');
          }, 300);
          break;
        case 'defeat':
          later(() => {
            shakeScreen();
            if (FX.pulse) FX.pulse('#3a0f0a', 0.9);
            if (window.GLBG) GLBG.setMood('title');
          }, 300);
          break;
      }
    });
  }

  /* 3D tilt & sheen on offers/doors toward the cursor (fine pointers) */
  if (window.matchMedia && matchMedia('(pointer: fine)').matches) {
    document.addEventListener('pointermove', (e) => {
      const o = e.target && e.target.closest ? e.target.closest('.offer') : null;
      if (!o) return;
      const r = o.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      o.style.setProperty('--ry', (nx * 10).toFixed(1) + 'deg');
      o.style.setProperty('--rx', (-ny * 8).toFixed(1) + 'deg');
      o.style.setProperty('--mx', ((nx + 0.5) * 100).toFixed(1) + '%');
      o.style.setProperty('--my', ((ny + 0.5) * 100).toFixed(1) + '%');
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const o = e.target && e.target.closest ? e.target.closest('.offer') : null;
      if (o) { o.style.setProperty('--rx', '0deg'); o.style.setProperty('--ry', '0deg'); }
    }, { passive: true });
  }

  /* the needle-and-thread title sigil, drawn on in three passes */
  const TITLE_SIGIL = `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="tsig-draw" d="M18 64 C40 30 70 24 96 34 L128 16 L134 22 L104 42 C86 70 48 78 18 64 Z"
      stroke="#a97e1e" stroke-width="3"/>
    <path class="tsig-draw d2" d="M128 16 L134 22 M124 24 L129 28"
      stroke="#6b5326" stroke-width="2.4"/>
    <path class="tsig-draw d3" d="M18 64 C10 70 8 78 14 84 C26 88 34 80 30 70 M30 70 C48 62 66 58 84 60 C102 62 118 58 130 48"
      stroke="#7b4fd8" stroke-width="2.2"/>
    <circle class="tsig-gem" cx="130" cy="19" r="3.4" fill="#7b4fd8" stroke="#a97e1e" stroke-width="1.2"/>
  </svg>`;

  function hud() {
    if (run) {
      const d = Loom.DIFF_BY_ID[run.difficulty];
      const attuned = Array.from(run.elements).map(id => Morph.EL_BY_ID[id].icon).join('');
      const readable = Morph.readableCount(Loom.runKnow(run));
      $hud.innerHTML = `<span>${run.cls.icon}</span><span title="${d.name} — words open to ${d.cap} runes">${d.icon} <b>${d.name}</b></span>` +
        `<span>🖋 ink <b>${run.hp}/${run.maxHp}</b></span>` +
        `<span title="the elements attuned this run">${attuned}</span>` +
        `<span title="words this run can read">📖 reads <b>${readable}</b>/${Morph.VISIBLE.length}</span><span>🪡 loom <b>${run.traySize}</b></span>`;
    } else {
      const els = meta.elements.size;
      $hud.innerHTML = `<span title="elements in your grimoire">🌳 elements <b>${els}</b>/${Morph.ELEMENTS.length}</span>` +
        `<span title="the loom-school">${Loom.DIFF_BY_ID[meta.diff].icon} tier <b>${meta.diff}</b>/4</span>` +
        `<span>🏆 wins <b>${meta.wins}</b>/${meta.runs} runs</span>`;
    }
  }

  /* ================= title ================= */
  function renderTitle() {
    run = null; battle = null;
    hud();
    if (window.GLBG) GLBG.setMood('title');
    $screen.innerHTML = '';
    const w = el('div', 'title-wrap');
    w.appendChild(el('div', 'title-sigil', TITLE_SIGIL));
    w.appendChild(el('h1', null, 'WORDLOOM'));
    w.appendChild(el('div', 'title-sub', 'Deduce the words you do not know. Spell the words you do.<br>Everything you learn is yours forever.'));
    w.appendChild(el('div', 'ladder', 'IGNA · IGNUS · IGNIUS · IGNIORA · IGNIAROS · IGNIORUSA · IGNIORARIS · <b>IGNIETUNDUS</b>'));
    const start = el('button', 'arcane', meta.runs ? '⚔ Weave a new run' : '⚔ Take up the needle');
    start.style.cssText = 'font-size:19px;padding:12px 34px;margin-top:24px';
    start.onclick = renderClassSelect;
    w.appendChild(start);
    const row = el('div', null, '');
    row.style.marginTop = '16px';
    const g = el('button', 'quiet', '📖 Open the grimoire');
    g.onclick = () => renderGrimoire(renderTitle);
    row.appendChild(g);
    const guide = el('button', 'quiet', '🪡 How the language works');
    guide.onclick = renderPrimer;
    row.appendChild(guide);
    const wh = el('button', 'quiet', '🌬 whisper to the loom');
    wh.onclick = renderWhisper;
    row.appendChild(wh);
    const th = el('button', 'quiet', '🧵 the weaver\'s thread');
    th.onclick = renderThread;
    row.appendChild(th);
    if (meta.runs) {
      const wipe = el('button', 'quiet', '⚠ forget everything');
      wipe.onclick = () => { if (confirm('Unlearn every word? This cannot be undone.')) { LoomSave.wipe(); meta = LoomSave.load(); renderTitle(); } };
      row.appendChild(wipe);
    }
    w.appendChild(row);
    $screen.appendChild(w);
  }

  /* ================= weaver select ================= */
  function renderClassSelect() {
    $screen.innerHTML = '<h2 class="center">Choose your Weaver</h2>';
    const row = el('div', 'offers');
    Weavers.CLASSES.forEach(c => {
      const locked = !Weavers.classUnlocked(c, meta);
      const card = el('div', 'offer weaver' + (locked ? ' locked' : ''), `
        <div style="font-size:34px;text-align:center">${c.icon}</div>
        <b>${c.name}</b>
        <div class="small" style="margin-top:6px">${locked ? '🔒 ' + c.unlockText : c.tagline}</div>
        <div class="small dim" style="margin-top:6px">${locked ? '' : c.desc}</div>
        <div class="small" style="margin-top:6px">🖋 ${c.hp} · 🪡 ${c.tray} tiles · sense to ${c.chipMax > 12 ? 'ANY' : c.chipMax + 'L'}${c.power !== 1 ? ' · words ×' + c.power : ''}</div>`);
      if (!locked) card.onclick = () => renderRunPrep(c.id);
      row.appendChild(card);
    });
    $screen.appendChild(row);
    const back = el('button', 'quiet', '← the title page');
    back.style.cssText = 'display:block;margin:14px auto 0';
    back.onclick = renderTitle;
    $screen.appendChild(back);
  }

  /* ================= run prep: difficulty & the three elements ================= */
  let lastPrep = null; // remember the player's last choices
  function renderRunPrep(clsId) {
    const cls = Weavers.BY_ID[clsId];
    let diff = lastPrep && lastPrep.diff <= meta.diff ? lastPrep.diff : meta.diff;
    let chosen = (lastPrep ? lastPrep.els.filter(id => meta.elements.has(id)) : []).slice(0, Loom.RUN_ELEMENTS);
    if (chosen.length < Loom.RUN_ELEMENTS) {
      for (const id of meta.elements) {
        if (chosen.length >= Loom.RUN_ELEMENTS) break;
        if (!chosen.includes(id)) chosen.push(id);
      }
    }
    const draw = () => {
      $screen.innerHTML = `<h2 class="center">${cls.icon} ${cls.name} — prepare the run</h2>`;
      $screen.appendChild(el('div', 'small center', 'The loom-school — beat a tier to open the next:'));
      const dRow = el('div', 'len-row');
      Loom.DIFFICULTIES.forEach(d => {
        const locked = d.id > meta.diff;
        const pill = el('button', 'len-pill diff-pill' + (locked ? ' locked' : '') + (d.id === diff ? ' selected' : ''), `${d.icon} ${d.name}`);
        pill.title = locked ? 'Beat the tier below to unlock it' : d.desc;
        if (!locked) pill.onclick = () => { diff = d.id; draw(); };
        dRow.appendChild(pill);
      });
      $screen.appendChild(dRow);
      $screen.appendChild(el('div', 'small center dim', Loom.DIFF_BY_ID[diff].desc));
      $screen.appendChild(el('div', 'small center', `<br>Attune <b>${Loom.RUN_ELEMENTS}</b> of your <b>${meta.elements.size}</b> discovered elements — they seed your loom, and their root vessels ride out wound:`));
      const eRow = el('div', 'offers');
      Array.from(meta.elements).forEach(id => {
        const e = Morph.EL_BY_ID[id];
        const on = chosen.includes(id);
        const card = el('div', 'offer element-pick' + (on ? ' picked-el' : ''), `
          <div style="font-size:26px;text-align:center">${e.icon}</div>
          <b>${e.name}</b>
          <div class="small" style="margin-top:4px">${e.identity}</div>
          <div class="small dim" style="margin-top:4px;font-family:'Courier New',monospace">${e.root} · -${e.small} -${e.medium} -${e.large}</div>`);
        card.onclick = () => {
          if (on) { if (chosen.length > 1) chosen = chosen.filter(x => x !== id); }
          else { chosen.push(id); if (chosen.length > Loom.RUN_ELEMENTS) chosen.shift(); }
          draw();
        };
        eRow.appendChild(card);
      });
      $screen.appendChild(eRow);
      // the pouch preview: exactly the letters this trio brings
      const letters = Loom.pouchLetters(chosen);
      $screen.appendChild(el('div', 'pouch-preview',
        `👝 your rune pouch: <span class="mono">${letters.join(' ')}</span> — ${letters.length} letters` +
        ' <span class="dim">(centers are threaded in as spoils on the road' +
        (Loom.DIFF_BY_ID[diff].cap >= 11 ? '; the wedding spellings are won from elites' : '') + ')</span>'));
      const start = el('button', 'arcane', '⚔ Begin the run');
      start.style.cssText = 'display:block;margin:16px auto 0;font-size:17px;padding:10px 28px';
      start.disabled = chosen.length !== Loom.RUN_ELEMENTS;
      start.onclick = () => { lastPrep = { diff, els: chosen.slice() }; startRun(clsId, diff, chosen); };
      $screen.appendChild(start);
      const back = el('button', 'quiet', '← choose another weaver');
      back.style.cssText = 'display:block;margin:10px auto 0';
      back.onclick = renderClassSelect;
      $screen.appendChild(back);
    };
    draw();
  }

  function startRun(clsId, diff, elements) {
    meta.runs++;
    LoomSave.save(meta);
    run = Loom.newRun((Date.now() % 2147483647) | 0, meta, clsId, { difficulty: diff, elements });
    renderStageChoice(true);
  }

  /* ================= world map: doors ================= */
  function worldBanner() {
    const w = run.worlds[run.worldIdx].def;
    return `<div class="world-banner">${w.icon} <b>${w.name}</b> — stage ${run.stageIdx + 1}/4 <span class="dim small">· ${w.flavor}</span></div>`;
  }

  function runStrip() {
    let html = '<div class="nodes">';
    run.worlds.forEach((w, wi) => {
      w.stages.forEach((stage, si) => {
        const gi = wi * 4 + si;
        const cur = wi === run.worldIdx && si === run.stageIdx;
        const done = gi < Loom.globalStageIdx(run);
        const icon = si === 3 ? '⬛' : stage.length > 1 ? '⑂' : '⚔️';
        html += `<div class="node ${done ? 'done' : cur ? 'here' : ''}" title="${w.def.name}">${si === 3 ? w.def.icon : icon}</div>`;
      });
      if (wi < 2) html += '<div class="node-gap">·</div>';
    });
    return html + '</div>';
  }

  const NODE_META = {
    battle: { icon: '⚔️', title: 'A Battle', desc: 'Something between you and the next page.' },
    elite: { icon: '☠️', title: 'A Perilous Road', desc: 'A stronger foe — and richer spoils, perhaps a deep form note.' },
    camp: { icon: '🏕', title: 'A Quiet Margin', desc: 'Rest, or reflect on the grammar.' },
    event: { icon: '❔', title: 'Something Strange', desc: 'The road offers a choice.' },
    elder: { icon: '🕯', title: 'An Elder Page', desc: 'Something old is written here. It wants reading.' },
    boss: { icon: '⬛', title: 'The Warden', desc: 'The world\'s keeper bars the way.' },
  };

  function renderStageChoice(isFirst) {
    hud();
    if (run.over) { endRun(run.victory); return; }
    const stage = Loom.currentStage(run);
    const w = run.worlds[run.worldIdx].def;
    if (window.GLBG) { GLBG.setMood('map'); GLBG.setWorld(w.id || w.name); }
    $screen.innerHTML = runStrip() + worldBanner();
    if (isFirst === 'world') {
      $screen.innerHTML += `<p class="small center" style="color:var(--good)">You cross into ${w.name} — the crossing mends half your missing ink.</p>`;
    }
    $screen.innerHTML += `<p class="small center dim">${stage.length > 1 ? 'Two doors. Choose one — the other closes forever.' : 'One door.'}</p>`;
    const row = el('div', 'offers');
    stage.forEach(node => {
      const nm = NODE_META[node.type];
      const bossName = node.type === 'boss' ? Foes.FOES[w.boss].name : '';
      const card = el('div', 'offer door' + (node.type === 'elder' ? ' elder-door' : node.type === 'elite' ? ' risky' : ''), `
        <div style="font-size:30px;text-align:center">${node.type === 'boss' ? Foes.FOES[w.boss].icon : nm.icon}</div>
        <b>${node.type === 'boss' ? bossName : nm.title}</b>
        <div class="small" style="margin-top:6px">${node.type === 'boss' ? Foes.FOES[w.boss].gimmick : nm.desc}</div>`);
      card.onclick = () => enterNode(node);
      row.appendChild(card);
    });
    $screen.appendChild(row);
    const vesBtn = el('button', 'quiet', '🪢 vessels & loadout');
    vesBtn.style.cssText = 'display:block;margin:14px auto 0';
    vesBtn.onclick = renderVessels;
    $screen.appendChild(vesBtn);
  }

  function enterNode(node) {
    if (node.type === 'camp') { flipScreen(renderCamp); return; }
    if (node.type === 'event') { flipScreen(renderEvent); return; }
    if (node.type === 'elder') { flipScreen(() => renderElder(node.event)); return; }
    battle = Loom.battleForNode(run, node);
    battle._node = node;
    picked = [];
    blankAssign = {};
    if (window.GLBG) GLBG.setMood('battle');
    flipScreen(() => {
      renderBattle();
      // the foes materialize from swirling ink
      document.querySelectorAll('.foe .art').forEach((art, i) => {
        art.classList.add('spawn');
        if (FX.inkSwirl) setTimeout(() => { const p = centerOf(art); FX.inkSwirl(p.x, p.y); }, i * 120);
      });
    });
  }

  /* ================= battle ================= */
  function renderBattle() {
    hud();
    const b = battle;
    $screen.innerHTML = runStrip() + worldBanner();
    const wrap = el('div', 'battle');

    const left = el('div');
    const foeRow = el('div', 'foe-row');
    b.foes.forEach((f, i) => {
      const weakEl = f.weakTo ? Morph.EL_BY_ID[f.weakTo] : null;
      const resEl = f.resist ? Morph.EL_BY_ID[f.resist] : null;
      const it = f.hp > 0 ? Loom.describeIntent(b, f) : { icon: '✝', text: 'felled' };
      const box = el('div', 'foe' + (f.hp <= 0 ? ' dead' : (b.foes.length > 1 && i === b.target ? ' targeted' : '')), `
        <div class="fname">${f.name}${f.elite ? ' · ELITE' : ''}${f.boss ? ' · WARDEN' : ''}</div>
        <div class="art" id="foe-art-${i}">${f.icon}</div>
        <div class="hpbar"><div class="fill" style="width:${100 * f.hp / f.maxHp}%"></div><div class="txt">${f.hp}/${f.maxHp}</div></div>
        <div class="intent" title="its next move">${it.icon} ${it.text}</div>
        <div class="affin">
          ${weakEl ? `<span class="wk" title="Takes ×1.5 from ${weakEl.name} (${weakEl.root}-words)">${weakEl.icon} fears</span>` : ''}
          ${resEl ? `<span title="Takes ×0.5 from ${resEl.name}${f.adaptive ? ' (it adapts to whatever last struck it)' : ''}">${resEl.icon} shrugs</span>` : ''}
          ${f.burn ? `<span>🔥${f.burn}×${f.burnTurns}</span>` : ''}${f.poison ? `<span>☠${f.poison}</span>` : ''}
          ${f.chill ? '<span>❄</span>' : ''}${f.scald ? '<span>♨️</span>' : ''}${f.blind ? '<span>🌫</span>' : ''}${f.hushed ? '<span>🤫</span>' : ''}${f.stun ? '<span>💫</span>' : ''}${f.str ? `<span>💪+${f.str}</span>` : ''}
        </div>
        <div class="gimmick">${f.gimmick}</div>`);
      box.onclick = () => { if (f.hp > 0 && b.foes.length > 1) { b.target = i; renderBattle(); } };
      foeRow.appendChild(box);
    });
    left.appendChild(foeRow);

    const sealed = Array.from(b.sealedNotes);
    const you = el('div', 'you', `
      <div class="you-row"><b>You</b>
        <span>${b.player.block ? `<span class="chip">🛡 ${b.player.block}</span>` : ''}
        ${b.player.blooms.map(x => `<span class="chip">🌱 ${x.word}×${x.turns}</span>`).join('')}
        ${b.cursedLetter ? `<span class="chip" style="color:var(--bad)">🚫 ${b.cursedLetter} inked out</span>` : ''}
        ${sealed.map(pid => `<span class="chip" style="color:var(--bad)" title="sealed until the sealer is unwritten">🔒 ${(Morph.PARTS[pid] || { title: pid }).title.split(' — ')[0]}</span>`).join('')}</span>
      </div>
      <div class="hpbar mine" style="margin-top:5px"><div class="fill" style="width:${100 * b.player.hp / b.player.maxHp}%"></div>
      <div class="txt">${b.player.hp}/${b.player.maxHp}</div></div>`);
    left.appendChild(you);

    const loom = el('div', 'loom-zone');
    loom.appendChild(el('div', 'small center', `— your loom · turn ${b.turn} —`));
    const trayEl = el('div', 'tray');
    const tileEl = (t) => {
      const shown = t.blank ? (picked.includes(t.id) && blankAssign[t.id] ? blankAssign[t.id] : '★') : t.ch;
      const tile = el('div', 'tile' + ('AEIOU'.includes(t.ch) ? ' vowel' : '') + (t.frozen ? ' frozen' : '')
        + (t.blank ? ' blank' : '') + (picked.includes(t.id) ? ' used' : ''), shown);
      tile.dataset.id = t.id;
      if (t.blank) { tile.dataset.blank = '1'; tile.title = 'An uncut rune — shaped into any letter when spoken, spent forever.'; }
      if (!t.frozen) tile.onclick = () => {
        if (picked.includes(t.id)) return;
        if (t.blank) { pickBlankLetter(t, tile); return; }
        picked.push(t.id);
        tile.classList.remove('pop'); void tile.offsetWidth; tile.classList.add('pop');
        refreshBuild();
      };
      return tile;
    };
    b.tray.forEach(t => trayEl.appendChild(tileEl(t)));
    loom.appendChild(trayEl);

    // the shuttle: tiles riding across turns and battles
    const rack = el('div', 'shuttle-rack');
    rack.appendChild(el('span', 'shuttle-label', '🧺 shuttle'));
    run.shuttle.forEach(t => {
      const tile = tileEl(t);
      tile.classList.add('shuttled');
      tile.title = (t.blank ? 'An uncut rune, riding the shuttle. ' : '') + 'Click to weave it in · shift-click to return it to the tray.';
      const base = tile.onclick;
      tile.onclick = (ev) => {
        if (ev.shiftKey) {
          if (Loom.unshuttleTile(b, t.id)) { picked = picked.filter(i => i !== t.id); renderBattle(); }
          return;
        }
        if (base) base(ev);
      };
      rack.appendChild(tile);
    });
    for (let i = run.shuttle.length; i < Loom.shuttleCap(run); i++) rack.appendChild(el('div', 'tile slot-empty', '·'));
    loom.appendChild(rack);

    // vessels riding the frame: wound ones speak; empty ones eat letters
    const riding = Loom.activeVessels(run);
    if (riding.length) {
      const brack = el('div', 'bobbin-rack');
      brack.appendChild(el('span', 'shuttle-label', '🪢 vessels'));
      riding.forEach(v => brack.appendChild(vesselNode(v)));
      loom.appendChild(brack);
    }
    loom.appendChild(el('div', 'spell-build', ''));
    loom.appendChild(el('div', 'build-hint', ''));
    const btns = el('div', 'loom-btns');
    const castBtn = el('button', 'arcane', '🗣 Speak');
    castBtn.id = 'cast-btn';
    castBtn.onclick = castBuilt;
    const clearBtn = el('button', null, '⌫ Unpick');
    clearBtn.onclick = () => { picked.pop(); refreshBuild(); };
    const discBtn = el('button', null, b.tileDiscardUsed ? '🗑 Discarded' : '🗑 Discard');
    discBtn.id = 'discard-btn';
    discBtn.title = `Once per turn: pick up to ${Loom.DISCARD_MAX} tiles and cast them back for as many fresh draws`;
    discBtn.onclick = () => {
      if (!picked.length) { toast(`Pick up to ${Loom.DISCARD_MAX} tiles first, then discard them.`); return; }
      if (picked.length > Loom.DISCARD_MAX) { toast(`Only ${Loom.DISCARD_MAX} tiles may go back at once.`); return; }
      const r = Loom.discardTiles(b, picked);
      if (!r.ok) { toast(r.reason === 'used' ? 'The bag accepts returns once a turn.' : 'The loom refuses.'); return; }
      picked = [];
      afterAction();
    };
    const shutBtn = el('button', null, b.shuttleUsed ? '🧺 Set (used)' : '🧺 Set aside');
    shutBtn.id = 'shuttle-btn';
    shutBtn.title = 'Once per turn: set one picked tray tile aside on the shuttle — it rides with you across turns and battles until spoken.';
    shutBtn.onclick = () => {
      const trayPicked = picked.filter(id => b.tray.some(t => t.id === id));
      if (trayPicked.length !== 1) { toast('Pick exactly one tray tile, then set it aside.'); return; }
      const r = Loom.shuttleTile(b, trayPicked[0]);
      if (!r.ok) {
        toast(r.reason === 'used' ? 'The shuttle takes one tile a turn.' : r.reason === 'full' ? 'The shuttle is full.' : 'The loom refuses.');
        return;
      }
      picked = picked.filter(id => id !== trayPicked[0]);
      delete blankAssign[trayPicked[0]];
      renderBattle();
    };
    const mullBtn = el('button', null, `♻ Sweep (${b.mulligans})`);
    mullBtn.disabled = !b.mulligans;
    mullBtn.onclick = () => { if (Loom.mulligan(b)) { picked = []; renderBattle(); } };
    const guideBtn = el('button', null, '🪡 Notes');
    guideBtn.onclick = toggleGuideOverlay;
    const vesBtn = el('button', null, '🪢 Vessels');
    vesBtn.onclick = renderVessels;
    const endBtn = el('button', null, '⌛ End Turn');
    endBtn.id = 'end-turn';
    endBtn.onclick = () => { Loom.endTurn(b); picked = []; afterAction(); };
    btns.append(castBtn, clearBtn, discBtn, shutBtn, mullBtn, guideBtn, vesBtn, endBtn);
    loom.appendChild(btns);

    // the breath: every word spoken this turn tires the next one
    if (!b.over && b.fatigue > 0) {
      loom.appendChild(el('div', 'breath-note',
        `🌬 breath: the next word carries ×${Loom.spokenMult(b)} — living speech tires it less, and it returns at turn's end`));
    }

    const speak = el('div', 'speakable');
    // stale loom: not one word of the tongue — readable, improvised, at
    // any length — can be woven from these tiles
    const stale = !b.over && !Loom.anySpellable(b);
    if (stale) {
      const outs = [];
      if (!b.tileDiscardUsed) outs.push(`discard up to ${Loom.DISCARD_MAX} tiles`);
      if (b.mulligans) outs.push('sweep the loom');
      outs.push('guess the mystery');
      speak.appendChild(el('div', 'stale-note',
        `🕸 <b>The loom is stale</b> — no word of the loom-tongue can be woven from these tiles, at any length. ` +
        `You can still ${outs.join(', ')}.`));
      if (b._staleToastTurn !== b.turn) {
        b._staleToastTurn = b.turn;
        toast('🕸 The loom is stale — no word can be woven from these tiles.', 3200);
      }
    } else if (!b.over) {
      // the loom-sense: it feels the length of what waits, never the word
      const s = Loom.loomSense(b);
      if (s.best) {
        speak.appendChild(el('div', 'sense-note',
          `🪡 The loom senses a word of <b>${s.best} runes</b> waiting in these tiles` +
          `${s.beyond ? ' — and something longer still, beyond its reach' : ''}.` +
          ` <span class="dim">(your sense feels ${s.cap >= Loom.MAX_LEN ? 'any length' : 'to ' + s.cap + ' runes'})</span>`));
      } else {
        speak.appendChild(el('div', 'sense-note faint',
          `🪡 The loom senses nothing within ${s.cap} runes — yet something longer stirs in these tiles.`));
      }
    }
    loom.appendChild(speak);
    left.appendChild(loom);
    left.appendChild(el('div', null, `<div id="battle-log">${b.log.map(x => `<div>${x}</div>`).join('')}</div>`));
    wrap.appendChild(left);
    wrap.appendChild(mysteryPanel());
    $screen.appendChild(wrap);
    refreshBuild();
    scrollLog();
  }

  function mysteryPanel() {
    const b = battle;
    const m = b.mystery;
    const pane = el('div', 'mystery-panel');
    pane.appendChild(el('h2', null, '🕯 The Mystery Word'));

    // length picker — the grammar itself gates the deep lengths
    const lens = Loom.guessableLengths(run);
    const lr = el('div', 'len-row');
    for (let len = 4; len <= Loom.MAX_LEN; len++) {
      const ok = lens.includes(len);
      const pill = el('button', 'len-pill' + (ok ? '' : ' locked') + (m && m.len === len ? ' selected' : ''), String(len));
      pill.title = ok ? `ask the loom for a ${len}-rune mystery`
        : len > Loom.diffCap(run) ? 'beyond this tier of the loom-school — win to climb'
        : 'no readable word of this length in your notes';
      if (ok && !b.over) pill.onclick = () => {
        if (m && m.len === len) return;
        if (m && m.guesses.length && !confirm(`Abandon the current ${m.len}-rune word and its clues?`)) return;
        Loom.chooseLength(b, len);
        renderBattle();
      };
      lr.appendChild(pill);
    }
    pane.appendChild(lr);
    pane.appendChild(el('div', 'small', `solve it to cast it at ×1.5 <b>and</b> inscribe its grammar, forever`));

    const grid = el('div');
    if (m.revealed.length) {
      const rrow = el('div', 'mrow');
      for (let i = 0; i < m.len; i++) {
        const r = m.revealed.find(x => x.i === i);
        rrow.appendChild(el('div', 'mtile sm' + (r ? ' revealed' : ''), r ? r.c : '·'));
      }
      grid.appendChild(rrow);
    }
    const sm = m.len > 7 ? ' sm' : '';
    // freshly-spoken guesses ripple in with a staggered flip
    const prevShown = b._shownGuesses == null ? m.guesses.length : b._shownGuesses;
    m.guesses.forEach((g, gi) => {
      const row = el('div', 'mrow');
      for (let i = 0; i < m.len; i++) {
        const t = el('div', 'mtile' + sm + ' ' + g.marks[i], g.word[i]);
        if (gi >= prevShown) { t.classList.add('flip'); t.style.animationDelay = (i * 70) + 'ms'; }
        row.appendChild(t);
      }
      grid.appendChild(row);
    });
    b._shownGuesses = m.guesses.length;
    pane.appendChild(grid);

    const gz = el('div', 'guess-zone');
    if (Loom.canGuess(b)) {
      const input = el('input');
      input.id = 'guess-input';
      input.maxLength = m.len;
      input.placeholder = '·'.repeat(m.len);
      input.autocomplete = 'off';
      input.onkeydown = (ev) => { if (ev.key === 'Enter') submitGuess(); };
      gz.appendChild(input);
      const go = el('button', 'arcane', 'Guess');
      go.id = 'guess-btn';
      go.style.marginLeft = '6px';
      go.onclick = submitGuess;
      gz.appendChild(go);
      if (b.cursedLetter) gz.appendChild(el('div', 'cursed-note', `the letter ${b.cursedLetter} is inked out this turn`));
      gz.appendChild(el('div', 'small dim', 'one guess per turn — it costs nothing but nerve'));
    } else if (!b.over) {
      gz.appendChild(el('div', 'small dim', 'your guess is spent — end the turn to earn another'));
      if (run.perks.quill && !b.quillUsed) {
        const q = el('button', null, '🪶 Quill of Second Thoughts');
        q.onclick = () => { if (Loom.useQuill(b)) renderBattle(); };
        gz.appendChild(q);
      }
    }
    pane.appendChild(gz);
    pane.appendChild(loomGuide());
    return pane;
  }

  /* the loom guide — same esoteric notes, compact */
  function loomGuide() {
    const P = meta.parts;
    const S = meta.secrets;
    const suf = (e, sz, txt) => P.has('suf:' + e.id + ':' + sz) ? '-' + txt : '·';
    const attuned = (e) => run && run.elements.has(e.id);
    const dormant = Morph.ELEMENTS.filter(e => meta.elements.has(e.id) && run && !run.elements.has(e.id));
    const g = el('div', 'guide');
    g.innerHTML = `<div class="small" style="margin-bottom:4px"><b>🪡 Loom guide</b> — the elements attuned this run</div>
      <table>
      ${Morph.ELEMENTS.filter(e => attuned(e)).map(e => {
        const elder = S.has('sroot:' + e.id);
        const wed = run && run.altUnlocked.has(e.id);
        return `<tr><td>${e.icon}</td><td class="mono">${e.root}${elder ? `<span class="elder" title="the elder spelling — half again as hot">·${e.secret}</span>` : ''}</td>
          <td class="mono">${[suf(e, 'small', e.small), suf(e, 'medium', e.medium), suf(e, 'large', e.large)].join(' ')}</td>
          <td class="mono">${e.longRoot ? '→' + e.longRoot : '+' + e.conn}</td>
          <td class="mono">${wed ? `<span title="the wedding spelling — won this run">⋯${e.alt}</span>` : '<span class="dim" title="its wedding spelling is not yet won">·</span>'}</td>
          <td>${e.name}</td></tr>`;
      }).join('')}
      ${Morph.SECRET_ELEMENTS.filter(e => S.has('selem:' + e.id)).map(e =>
        `<tr class="apoc-row"><td>${e.icon}</td><td class="mono">${e.root}</td>
          <td class="mono">${['-' + e.small, '-' + e.medium, '-' + e.large].join(' ')}</td>
          <td class="mono">+${e.conn}</td>
          <td class="mono">⋯${e.alt}</td>
          <td title="${e.identity}">${e.name}</td></tr>`).join('')}
      </table>
      ${dormant.length ? `<div class="small dim">dormant this run: ${dormant.map(e => e.icon + ' ' + e.name).join(' · ')}</div>` : ''}
      <div style="margin-top:5px">centers: ${Morph.CENTERS.map(c => P.has('center:' + c.id)
        ? `<span class="mono" title="${c.shape}">${c.seq}</span>` : '<span class="dim">··</span>').join(' ')}${Morph.SECRET_CENTERS.filter(c => S.has('scenter:' + c.id)).map(c =>
        ` <span class="mono elder" title="${c.shape}">${c.seq}</span>`).join('')}</div>
      <div>forms: ${Morph.FORM_IDS.map(f => P.has('form:' + f)
        ? `<span class="mono" title="${Morph.FORMS[f].note}">${Morph.FORMS[f].name}</span>` : '<span class="dim">···</span>').join(' · ')}${S.has('sform:selfsame')
        ? ` · <span class="mono elder" title="${Morph.SECRET_FORMS.selfsame.note}">${Morph.SECRET_FORMS.selfsame.name}</span>` : ''}</div>
      <div>${P.has('join:et') ? '<span class="mono" title="weds two elements">ET</span> · ' : ''}${S.has('sjoin:ac') ? '<span class="mono elder" title="the elder wedding — closer and hotter">AC</span> · ' : ''}${P.has('rule:elision') ? '<span class="mono" title="twin vowels: the second transmutes">✒️elision</span> · ' : ''}${P.has('rule:easing') ? '<span class="mono" title="consonant joints eased by the small vowel">🫧easing</span>' : ''}</div>`;
    return g;
  }

  /* in-battle overlay: the grimoire's notes without leaving the fight */
  function toggleGuideOverlay() {
    const existing = document.getElementById('guide-overlay');
    if (existing) { existing.remove(); return; }
    const ov = el('div', null, '');
    ov.id = 'guide-overlay';
    const inner = el('div', 'guide-inner');
    inner.appendChild(el('h2', null, '🪡 The Notes, at hand'));
    inner.appendChild(el('div', 'small dim', 'Only what this run can speak. The loom explains nothing.'));
    // during a run, the overlay shows RUN knowledge: attuned elements
    // and the wedding spellings actually won — not the whole codex
    const knowNow = run ? Loom.runKnow(run) : Loom.knowSet(meta);
    const GROUPS = [['roots', '🌳 Roots'], ['suffixes', '✂️ Suffixes'], ['binders', '🧵 Binders'], ['centers', '🌀 Centers'], ['joiners', '💍 Joiners'], ['forms', '𝔏 Forms'], ['rules', '✒️ Rules']];
    for (const [gid, gname] of GROUPS) {
      const known = Morph.PART_IDS.filter(pid => Morph.PARTS[pid].group === gid && knowNow.has(pid));
      const all = Morph.PART_IDS.filter(pid => Morph.PARTS[pid].group === gid);
      const sec = el('div', 'note-group', `<h3>${gname} <span class="small dim">${known.length}/${all.length}</span></h3>`);
      if (known.length) {
        const list = el('div', 'note-list compact');
        known.forEach(pid => {
          const part = Morph.PARTS[pid];
          list.appendChild(el('div', 'note', `<span class="note-icon">${part.icon}</span><b>${part.title}</b><div class="small dim">${part.note}</div>`));
        });
        sec.appendChild(list);
      } else sec.appendChild(el('div', 'small dim', '— nothing yet —'));
      inner.appendChild(sec);
    }
    // secrets appear only once held; the overlay stays silent otherwise
    const secretsKnown = Morph.SECRET_IDS.filter(id => meta.secrets.has(id));
    if (secretsKnown.length) {
      const sec = el('div', 'note-group apocrypha', `<h3>🕯 Apocrypha <span class="small dim">${secretsKnown.length}/${Morph.SECRET_IDS.length}</span></h3>`);
      const list = el('div', 'note-list compact');
      secretsKnown.forEach(id => {
        const info = Morph.SECRET_INFO[id];
        list.appendChild(el('div', 'note secret-note', `<span class="note-icon">${info.icon}</span><b>${info.title}</b><div class="small dim">${info.note}</div>`));
      });
      sec.appendChild(list);
      inner.appendChild(sec);
    }
    const close = el('button', 'arcane', 'Back to the loom');
    close.style.cssText = 'display:block;margin:14px auto 0';
    close.onclick = () => ov.remove();
    inner.appendChild(close);
    ov.appendChild(inner);
    ov.onclick = (ev) => { if (ev.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  }

  /* ---- spell building ---- */
  function builtWord() {
    return picked.map(id => tileById(id)).filter(Boolean)
      .map(t => t.blank ? (blankAssign[t.id] || '') : (t.seq || t.ch)).join('');
  }

  /* shaping an uncut rune: a small picker chooses its letter */
  function pickBlankLetter(t, tileNode) {
    const old = document.getElementById('blank-picker');
    if (old) old.remove();
    const ov = el('div', null, '');
    ov.id = 'blank-picker';
    const inner = el('div', 'blank-picker-inner');
    inner.appendChild(el('div', 'small center', '★ Shape the uncut rune:'));
    const grid = el('div', 'blank-grid');
    for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      const btn = el('button', 'blank-letter', L);
      btn.onclick = () => {
        blankAssign[t.id] = L;
        picked.push(t.id);
        ov.remove();
        if (tileNode) { tileNode.classList.remove('pop'); void tileNode.offsetWidth; tileNode.classList.add('pop'); }
        refreshBuild();
      };
      grid.appendChild(btn);
    }
    inner.appendChild(grid);
    ov.appendChild(inner);
    ov.onclick = (ev) => { if (ev.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  }

  /* ---- vessels: rack nodes, feeding, capture aiming, inventory ---- */
  // seq letters with the still-needed ones hollowed out
  function windProgress(v) {
    const seq = Loom.windingSeq(v);
    if (!seq) return '?';
    let left = v.left;
    return seq.split('').map(ch => {
      const i = left.indexOf(ch);
      if (i >= 0) { left = left.slice(0, i) + left.slice(i + 1); return `<span class="need">${ch}</span>`; }
      return `<span class="won">${ch}</span>`;
    }).join('');
  }

  function vesselNode(v) {
    const b = battle;
    let cls = 'tile bobbin', html, title;
    if (v.wound) {
      html = v.seq;
      title = `${v.icon} Wound: speaks ${v.seq} as one block. Speaking empties it.`;
      if (picked.includes(v.id)) cls += ' used';
    } else if (Loom.windingSeq(v)) {
      cls += ' winding' + (v.capSeq ? ' capturing' : '');
      html = windProgress(v) + (v.capSeq ? `<span class="pass">${v.winds + 1}/${Loom.CAPTURE_WINDS}</span>` : '');
      title = v.capSeq
        ? `Capturing ${v.capSeq} — wind pass ${v.winds + 1} of ${Loom.CAPTURE_WINDS}. Pick letters, then click to feed it.`
        : `Empty: feed it the hollow letters to wind ${v.seq} anew. Pick letters, then click it.`;
    } else {
      cls += ' blank-vessel';
      html = '?';
      title = 'A blank vessel. Click to aim it at any part you know — then wind its letters thrice to capture it.';
    }
    const node = el('div', cls, html);
    node.dataset.id = v.id;
    node.title = title;
    if (b && !b.over) node.onclick = () => {
      if (v.wound) {
        if (picked.includes(v.id)) return;
        picked.push(v.id);
        node.classList.remove('pop'); void node.offsetWidth; node.classList.add('pop');
        refreshBuild();
      } else if (Loom.windingSeq(v)) {
        const ids = picked.filter(id => { const t = tileById(id); return t && !t.seq; });
        if (!ids.length) { toast('Pick letters from your loom first, then click the vessel to feed it.'); return; }
        const r = Loom.feedVessel(b, v.id, ids);
        if (!r.ok) { toast(r.reason === 'no-fit' ? 'None of those letters fit its hollow slots.' : 'The vessel refuses.'); return; }
        picked = [];
        afterAction();
      } else {
        renderPartPicker(v);
      }
    };
    return node;
  }

  /* choose a part (from the notes — secrets included) for a vessel to capture */
  function renderPartPicker(v) {
    const old = document.getElementById('part-picker');
    if (old) old.remove();
    const parts = Loom.windableParts(meta, run);
    const ov = el('div', null, '');
    ov.id = 'part-picker';
    const inner = el('div', 'blank-picker-inner');
    inner.appendChild(el('div', 'small center', `🪢 Aim the vessel — wind the part's letters ${Loom.CAPTURE_WINDS} full times to capture it:`));
    const grid = el('div', 'part-grid');
    parts.forEach(p => {
      const btn = el('button', 'part-btn' + (p.elder ? ' elder-part' : ''), `<span class="mono">${p.seq}</span> <span class="small">${p.icon} ${p.title}</span>`);
      btn.onclick = () => {
        Loom.startCapture(run, v.id, p.seq, p.icon);
        ov.remove();
        toast(`🪢 The vessel is aimed at <b>${p.seq}</b> — wind its letters ${Loom.CAPTURE_WINDS} times over.`, 3200);
        if (battle) renderBattle(); else renderVessels();
      };
      grid.appendChild(btn);
    });
    if (!parts.length) inner.appendChild(el('div', 'small dim center', 'No windable parts in your notes yet.'));
    inner.appendChild(grid);
    const close = el('button', 'quiet', 'never mind');
    close.style.cssText = 'display:block;margin:10px auto 0';
    close.onclick = () => ov.remove();
    inner.appendChild(close);
    ov.appendChild(inner);
    ov.onclick = (ev) => { if (ev.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  }

  /* the vessel inventory: loadout (locked mid-battle), captures, unspooling */
  function renderVessels() {
    const old = document.getElementById('vessel-overlay');
    if (old) old.remove();
    const inBattle = !!(battle && !battle.over);
    const ov = el('div', null, '');
    ov.id = 'vessel-overlay';
    const inner = el('div', 'guide-inner');
    inner.appendChild(el('h2', null, '🪢 Your Vessels'));
    inner.appendChild(el('div', 'small dim', `${Loom.activeVessels(run).length}/${Loom.BOBBIN_ACTIVE} riding the frame · ${run.bobbins.length}/${Loom.BOBBIN_INVENTORY} owned` +
      (inBattle ? ' · the loadout is locked while the page is hostile' : ' · click ⚡ to choose which ride')));
    const list = el('div', 'vessel-list');
    run.bobbins.forEach(v => {
      const state = v.wound ? `wound — <b>${v.seq}</b> ready to speak`
        : v.capSeq ? `capturing <b>${v.capSeq}</b> — pass ${v.winds + 1}/${Loom.CAPTURE_WINDS}, needs ${windProgress(v)}`
        : v.seq ? `empty — winding <b>${v.seq}</b>, needs ${windProgress(v)}`
        : 'a blank vessel — aim it at a part you know';
      const row = el('div', 'vessel-row' + (v.active ? ' riding' : ''), `
        <span class="v-icon">${v.icon}</span>
        <span class="v-state">${state}</span>`);
      const btns = el('span', 'v-btns');
      const act = el('button', 'quiet', v.active ? '⚡ riding' : '· in the bag');
      act.title = inBattle ? 'The loadout is locked during battle.' : (v.active ? 'Click to stow it' : 'Click to set it riding');
      act.disabled = inBattle;
      act.onclick = () => {
        const r = Loom.setVesselActive(run, v.id, !v.active);
        if (!r.ok && r.reason === 'full') { toast(`Only ${Loom.BOBBIN_ACTIVE} vessels may ride the frame.`); return; }
        renderVessels();
      };
      btns.appendChild(act);
      if (!v.wound) {
        const aim = el('button', 'quiet', '🎯 aim');
        aim.title = 'Capture a different part onto this vessel (secrets included). Resets its winding.';
        aim.onclick = () => { ov.remove(); renderPartPicker(v); };
        btns.appendChild(aim);
      }
      row.appendChild(btns);
      list.appendChild(row);
    });
    if (!run.bobbins.length) list.appendChild(el('div', 'small dim', '— none yet —'));
    inner.appendChild(list);
    const canUnspool = Loom.shuttleCap(run) > run.shuttle.length && Loom.shuttleCap(run) > 0 && run.bobbins.length < Loom.BOBBIN_INVENTORY;
    const un = el('button', null, '🧺→🪢 Unspool a shuttle notch into a spare vessel');
    un.title = 'One-way: a free shuttle notch becomes an empty vessel to capture with.';
    un.disabled = !canUnspool || inBattle;
    un.style.cssText = 'display:block;margin:12px auto 0';
    un.onclick = () => {
      const r = Loom.unspoolShuttle(run);
      if (!r.ok) { toast('No free notch to unspool.'); return; }
      LoomSave.save(meta);
      toast('🪢 The notch unspools into an empty vessel.');
      renderVessels();
    };
    inner.appendChild(un);
    const close = el('button', 'arcane', 'Back');
    close.style.cssText = 'display:block;margin:12px auto 0';
    close.onclick = () => { ov.remove(); if (battle) renderBattle(); };
    inner.appendChild(close);
    ov.appendChild(inner);
    ov.onclick = (ev) => { if (ev.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  }

  function refreshBuild() {
    const b = battle;
    const word = builtWord();
    document.querySelectorAll('.tile[data-id]').forEach(tEl => {
      const id = Number(tEl.dataset.id);
      tEl.classList.toggle('used', picked.includes(id));
      if (tEl.dataset.blank) tEl.textContent = picked.includes(id) && blankAssign[id] ? blankAssign[id] : '★';
    });
    const build = document.querySelector('.spell-build');
    const hint = document.querySelector('.build-hint');
    const castBtn = document.getElementById('cast-btn');
    if (!build) return;
    let entry = Morph.WORDS[word];
    const know = Loom.runKnow(run, b.sealedNotes);
    // a hidden word admits nothing until its secret is held — to every
    // probe it reads as gibberish, not as a word you cannot speak
    if (entry && entry.hidden && !Morph.canRead(know, entry)) entry = null;
    const readable = entry && Morph.canRead(know, entry);
    const within = entry && entry.len <= Loom.diffCap(run);
    const usesBlank = picked.some(id => { const t = tileById(id); return t && t.blank; });
    const bobbinCount = picked.filter(id => { const t = tileById(id); return t && t.seq; }).length;
    // an elder word may only be spelled with true letters
    const blankBarred = entry && entry.hidden && usesBlank && !Loom.canSpell(b, word, { noBlanks: true });
    build.innerHTML = word
      ? `<span class="${entry && readable ? (within && !blankBarred ? 'ok' : 'improv') : 'no'}">${word}</span>`
      : '<span class="no dim">— pick tiles to weave a word —</span>';
    // NEVER hint at hidden words: an unreadable hidden word looks identical
    // to an unreadable ordinary word.
    hint.innerHTML = bobbinCount > 1
      ? '<span class="improv">🪢 two pre-wound blocks tangle the thread — one bobbin per word</span>'
      : blankBarred
        ? '<span class="improv">★ this word must be spelled true — the uncut rune cannot shape it</span>'
        : entry
          ? (readable
            ? (within
              ? `✓ ${entry.hidden ? entry.name : entry.name + ' — ' + entry.desc}`
              : `<span class="improv">overreach — longer than your tier's ${Loom.diffCap(run)} runes, spoken at improvised power</span>`)
            : 'this word is not in your notes — its element is not attuned')
          : (word.length >= 3 ? 'not a word of the loom-tongue' : '');
    if (castBtn) castBtn.disabled = !entry || !readable || !!blankBarred || bobbinCount > 1;
    const discBtn = document.getElementById('discard-btn');
    if (discBtn) discBtn.disabled = b.over || b.tileDiscardUsed || !picked.length || picked.length > Loom.DISCARD_MAX;
  }

  function castBuilt() {
    const b = battle;
    const word = builtWord();
    if (!Morph.WORDS[word]) return;
    // pass the exact picks: the engine honors them to the tile, so no
    // bobbin or banked letter is ever spent uninvited
    const r = Loom.castWord(b, word, picked);
    if (!r.ok) {
      toast(r.reason === 'true-spelling'
        ? '★ This word must be spelled true — the uncut rune cannot shape it.'
        : r.reason === 'unread'
          ? 'That word is not in your notes — its element is not attuned to this run.'
          : 'The loom refuses.');
      return;
    }
    picked = [];
    afterAction();
  }

  function submitGuess() {
    const b = battle;
    const input = document.getElementById('guess-input');
    if (!input) return;
    const g = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (g.length !== b.mystery.len) { toast(`It must be ${b.mystery.len} runes.`); return; }
    const res = Loom.guess(b, g);
    if (!res.ok) {
      toast(res.reason === 'cursed' ? `The letter ${b.cursedLetter} is inked out.` : 'The loom refuses.');
      return;
    }
    if (res.correct) toast(res.notes && res.notes.length
      ? `🌟 <b>${g}</b> — ${res.notes.length} new note${res.notes.length > 1 ? 's' : ''}!`
      : `🌟 <b>${g}</b> — spoken true!`, 3000);
    afterAction();
  }

  function afterAction() {
    const b = battle;
    blankAssign = {};
    LoomSave.save(meta);
    const evts = Loom.drainFx ? Loom.drainFx(b) : [];
    renderBattle();
    playFx(evts);
    if (b.over) setTimeout(() => b.won ? battleWon() : endRun(false), 1400);
  }

  function scrollLog() {
    const lg = document.getElementById('battle-log');
    if (lg) lg.scrollTop = lg.scrollHeight;
  }

  /* ================= rewards / camp / events ================= */
  function battleWon() {
    const b = battle;
    meta.bestNode = Math.max(meta.bestNode, Loom.globalStageIdx(run) + 1);
    LoomSave.save(meta);
    flipScreen(() => battleWonScreen(b));
  }

  function battleWonScreen(b) {
    $screen.innerHTML = runStrip() + worldBanner() + `
      <h2 class="center">🏆 The page is yours</h2>
      <p class="small center dim">Choose a spoil:</p>`;
    const offers = Loom.rollRewards(run, b._node || { type: 'battle' });
    const row = el('div', 'offers');
    offers.forEach(o => {
      const card = el('div', 'offer' + (o.rare ? ' rare-offer' : ''), `<b>${o.rare ? '𝔏 ' : ''}${o.title}</b><div class="small" style="margin-top:6px">${o.desc}</div>`);
      card.onclick = () => {
        const msg = Loom.applyReward(run, o);
        LoomSave.save(meta);
        toast(msg);
        stepOn();
      };
      row.appendChild(card);
    });
    $screen.appendChild(row);
    hud();
  }

  function stepOn() {
    const what = Loom.advance(run);
    battle = null;
    if (what === 'victory') { endRun(true); return; }
    flipScreen(() => renderStageChoice(what === 'world' ? 'world' : false));
  }

  function renderCamp() {
    $screen.innerHTML = runStrip() + worldBanner() + `
      <h2 class="center">🏕 A quiet margin</h2>
      <p class="small center dim">The needle rests. Choose:</p>`;
    const row = el('div', 'offers');
    Loom.campChoices(run).forEach(c => {
      const card = el('div', 'offer', `<b>${c.title}</b><div class="small" style="margin-top:6px">${c.desc}</div>`);
      card.onclick = () => {
        const msg = Loom.applyCamp(run, c);
        LoomSave.save(meta);
        toast(msg);
        stepOn();
      };
      row.appendChild(card);
    });
    $screen.appendChild(row);
    hud();
  }

  function renderEvent() {
    const ev = Loom.rollEvent(run);
    $screen.innerHTML = runStrip() + worldBanner() + `
      <h2 class="center">${ev.icon} ${ev.title}</h2>
      <p class="center" style="max-width:560px;margin:10px auto;font-style:italic">${ev.text}</p>`;
    const row = el('div', 'offers');
    ev.choices.forEach(c => {
      const card = el('div', 'offer', `<b>${c.label}</b><div class="small" style="margin-top:6px">${c.desc}</div>`);
      card.onclick = () => {
        const msg = Loom.applyEventChoice(run, ev, c);
        LoomSave.save(meta);
        toast(msg, 3000);
        stepOn();
      };
      row.appendChild(card);
    });
    $screen.appendChild(row);
    hud();
  }

  /* elder pages teach the hidden grammar — once, quietly, permanently */
  function renderElder(ev) {
    $screen.innerHTML = runStrip() + worldBanner();
    const w = el('div', 'elder-wrap');
    w.appendChild(el('h2', 'center', `${ev.icon} ${ev.title}`));
    const txt = el('p', 'elder-text', ev.text);
    w.appendChild(txt);
    const btn = el('button', 'arcane', 'Commit it to memory');
    btn.style.cssText = 'display:block;margin:18px auto 0';
    btn.onclick = () => {
      Loom.applyElder(run, ev);
      LoomSave.save(meta);
      toast('🕯 It is yours now. It is written nowhere but in you.', 3600);
      stepOn();
    };
    w.appendChild(btn);
    $screen.appendChild(w);
    hud();
  }

  /* ================= grimoire / primer / whisper ================= */
  function renderGrimoire(backTo) {
    const readable = Morph.readableCount(Loom.knowSet(meta));
    $screen.innerHTML = `<h2>📖 The Grimoire — ${meta.elements.size}/${Morph.ELEMENTS.length} elements</h2>
      <p class="small dim">Every element you discover brings its grammar whole — no note left to hunt.
      The grimoire reads <b>${readable}/${Morph.VISIBLE.length}</b> words of the loom-tongue
      (${meta.parts.size}/${Morph.PART_IDS.length} notes); each run attunes ${Loom.RUN_ELEMENTS} elements at the loom.</p>`;
    const GROUPS = [
      ['roots', '🌳 Roots'], ['suffixes', '✂️ Suffixes'], ['binders', '🧵 Binders'],
      ['centers', '🌀 Centers'], ['joiners', '💍 Joiners'], ['forms', '𝔏 Forms'], ['rules', '✒️ Rules'],
    ];
    for (const [gid, gname] of GROUPS) {
      const all = Morph.PART_IDS.filter(pid => Morph.PARTS[pid].group === gid);
      const have = all.filter(pid => meta.parts.has(pid));
      const sec = el('div', 'note-group', `<h3>${gname} <span class="small dim">${have.length}/${all.length}</span></h3>`);
      const list = el('div', 'note-list');
      for (const pid of all) {
        const part = Morph.PARTS[pid];
        const known = meta.parts.has(pid);
        list.appendChild(el('div', 'note' + (known ? '' : ' unknown'), known
          ? `<span class="note-icon">${part.icon}</span><b>${part.title}</b><div class="small dim">${part.note}</div>`
          : pid.startsWith('alt:')
            ? '<span class="note-icon">💍</span><b>— a wedding spelling —</b><div class="small dim">Won in battle, at Artisan and above. It opens the element\'s marriages for that run.</div>'
            : `<span class="note-icon">·</span><b>— an unturned page —</b>`));
      }
      sec.appendChild(list);
      $screen.appendChild(sec);
    }
    // the apocrypha: secret knowledge only shows itself once you hold it
    if (meta.secrets.size) {
      const known = Morph.SECRET_IDS.filter(id => meta.secrets.has(id));
      const left = Morph.SECRET_IDS.length - known.length;
      const sec = el('div', 'note-group apocrypha', `<h3>🕯 Apocrypha <span class="small dim">${known.length}/${Morph.SECRET_IDS.length}</span></h3>`);
      const list = el('div', 'note-list');
      known.forEach(id => {
        const info = Morph.SECRET_INFO[id];
        list.appendChild(el('div', 'note secret-note',
          `<span class="note-icon">${info.icon}</span><b>${info.title}</b><div class="small dim">${info.note}</div>`));
      });
      sec.appendChild(list);
      if (left) {
        const KINDS = [
          ['sroot:', 'elder spellings'], ['selem:', 'unspoken elements'],
          ['scenter:', 'secret centers'], ['sjoin:', 'secret joiners'],
          ['sform:', 'secret forms'], ['srule:', 'secret rules'],
        ];
        const hunt = KINDS.map(([pre, label]) => {
          const all = Morph.SECRET_IDS.filter(id => id.startsWith(pre));
          const have = all.filter(id => meta.secrets.has(id));
          return `${label} <b>${have.length}/${all.length}</b>`;
        }).join(' · ');
        sec.appendChild(el('div', 'small dim', `…and ${left} page${left > 1 ? 's' : ''} that still deny${left > 1 ? '' : 's'} being written: ${hunt}.`));
      }
      $screen.appendChild(sec);
    }
    const back = el('button', null, '← Back');
    back.style.marginTop = '14px';
    back.onclick = backTo;
    $screen.appendChild(back);
  }

  function renderPrimer() {
    $screen.innerHTML = `
      <h2>🪡 The Loom-Tongue, briefly</h2>
      <p class="small" style="margin-top:8px">Every spell is a word assembled by rule. Learn the parts and you can read words you have never seen.</p>
      <div class="guide" style="margin-top:10px"><table>
        <tr><th></th><th>root</th><th>small</th><th>medium</th><th>large</th><th>binds with</th><th>late spelling</th></tr>
        ${Morph.ELEMENTS.map(e => `<tr><td>${e.icon} ${e.name}</td><td class="mono">${e.root}</td><td class="mono">-${e.small}</td><td class="mono">-${e.medium}</td><td class="mono">-${e.large}</td><td class="mono">${e.longRoot ? e.root + '→' + e.longRoot : e.root + '+' + e.conn}</td><td class="mono">${e.alt}</td></tr>`).join('')}
      </table></div>
      <p class="small" style="margin-top:10px"><b>The ten forms:</b> IGNA → IGNUS → IGNIUS → IGNIORA (center-woven) →
      IGNIAROS (mirror) → IGNIORUSA (verse) → IGNIORARIS (sovereign) → and the weddings: IGNIETUNDUS (Union, fire-and-water), IGNIETUNDRIS (Grand Union), IGNIETUNDORA (Woven Union — a center in the blend, to 13 runes).</p>
      <p class="small" style="margin-top:6px"><b>Centers</b> come short, standard, and grand:
      ${Morph.CENTERS.map(c => `<span class="mono">${c.seq}</span> ${c.name}`).join(' · ')}.</p>
      <p class="small" style="margin-top:6px"><b>The Scribe's Elision:</b> twin vowels never touch — the second transmutes (A→E, E→A, I→E, O→U, U→O).
      <b>The Easing Vowel:</b> when a binder's consonant strikes another consonant, the element's small vowel eases the joint.</p>
      <p class="small" style="margin-top:6px"><b>The breath:</b> every word spoken in a turn tires the voice — <b>living
      speech</b> (a word spelled purely from letter tiles) costs a tenth of your force; a word leaning on a blank or a
      vessel costs a fifth. The breath returns when the turn ends. <b>Uncut runes:</b> solving a mystery leaves a
      blank tile ★ on your loom — shaped into any letter when spoken, spent forever, and never for the elder words.
      <b>The shuttle:</b> once per turn, set one tile aside — it rides with you across turns and battles until spoken.</p>
      <p class="small" style="margin-top:6px"><b>Elements & the loom-school:</b> your grimoire holds <b>elements</b>, and
      each arrives whole — root, suffixes, binder, late spelling, all inscribed the moment it is discovered. Five are known
      from the first stitch; the rest are met on the road, as spoils and strange encounters. Each run <b>attunes three</b>
      of your discovered elements, and only attuned words speak. <b>The pouch speaks their letters:</b> your rune pouch
      holds only the attuned elements' letters (a trio is ~9 runes of alphabet), and every element gained on the road pours
      its letters in. The shaped centers' letters are in no kit: <b>thread a center</b> as a spoil of battle and its
      letters join the pouch (until then, the woven words are reached through center vessels and uncut runes). The
      <b>wedding spellings</b> — how an element is written when wedded second — are won from battles at Artisan and above:
      each opens that element's marriages, pours its letters in, and arrives wound on a vessel. The school has <b>four tiers</b> — Apprentice (words to 8
      runes), Journeyman (10), Artisan (12, and the elder roads), Loomwright (13, and the deepest secrets) — each unlocked
      by beating the one below. A readable word longer than your tier can still be <b>overreached</b>, at improvised power.</p>
      <p class="small" style="margin-top:6px"><b>Vessels (bobbins):</b> your three attuned elements' root vessels set out
      wound and riding. A wound vessel speaks its part as one block; speaking <b>empties</b> it, and you wind it anew by
      feeding it letters from your pile — any pace, across turns and battles. An empty vessel can instead be
      <b>aimed at any part you know</b> (the apocrypha included, if you hold them) and captures it once you wind its letters
      three full times. You own up to ${Loom.BOBBIN_INVENTORY}; ${Loom.BOBBIN_ACTIVE} ride the frame at once, chosen between
      battles. Battles and road events offer more vessels and shuttle notches — and a free notch can be unspooled into a
      spare vessel. Foes cannot touch them.</p>
      <p class="small dim" style="margin-top:6px">This is a school of <b>mastery, not archaeology</b>: the mystery word is
      always drawn from your own notes, so solving it is craft — a ×1.5 casting and an uncut rune — never a blind hunt.
      The loom never points at words: it only <b>senses</b> the length of the longest word waiting in your tiles
      (your Weaver decides how far that sense reaches, and the Ribbon Index stretches it). Every word is spelled by hand.
      And the road-books say the grammar keeps older secrets than any of this — the elder roads open at Artisan.</p>`;
    const back = el('button', null, '← Back');
    back.style.marginTop = '14px';
    back.onclick = renderTitle;
    $screen.appendChild(back);
  }

  /* Some words are older than the grammar. */
  const SECRETS = {
    WORDSMITH: () => {
      Morph.ELEMENTS.forEach(e => meta.elements.add(e.id));
      Loom.syncMeta(meta);
      LoomSave.save(meta);
      return '✒️ Every element unfurls — all ten sing in your grimoire, every part of them.';
    },
    LOOMWRIGHT: () => {
      meta.diff = 4;
      LoomSave.save(meta);
      return '🪡 The loom-school opens every door — all four tiers stand unlocked.';
    },
    APOCRYPHA: () => {
      Morph.SECRET_IDS.forEach(id => meta.secrets.add(id));
      LoomSave.save(meta);
      if (window.FX && FX.powerNova) FX.powerNova(window.innerWidth / 2, window.innerHeight / 2.6);
      return `🕯 The apocrypha unfold — every elder spelling and both unspoken elements, ` +
        `${Morph.SECRET_IDS.length} secrets inscribed. The grimoire now admits they exist.`;
    },
    RESETTIA: () => {
      const blank = LoomSave.fresh();
      meta.elements = blank.elements;
      meta.diff = 1;
      meta.parts = blank.parts;
      meta.solved = blank.solved;
      meta.secrets = blank.secrets;
      Loom.syncMeta(meta);
      LoomSave.save(meta);
      return '🕯 The ink lifts from every page. The five first elements remain, and the school begins again.';
    },
  };

  /* the weaver's thread: progress as a copyable seed. Spin one here,
   * carry it to any device, and weave it back in on the title page. */
  function renderThread() {
    $screen.innerHTML = '';
    const w = el('div', 'thread-wrap');
    w.appendChild(el('h2', null, '🧵 The Weaver\'s Thread'));
    w.appendChild(el('div', 'title-sub',
      'Your whole grimoire, spun into a single thread.<br>Copy it somewhere safe, or carry it to another loom.'));

    w.appendChild(el('div', 'small', '<b>Your thread</b> — everything you know, as of this moment:'));
    const mine = el('textarea');
    mine.readOnly = true;
    mine.value = Loom.threadEncode(meta);
    mine.onclick = () => mine.select();
    w.appendChild(mine);
    const row1 = el('div', 'thread-row');
    const copy = el('button', 'arcane', '📋 Copy the thread');
    copy.onclick = () => {
      mine.select();
      const done = () => toast('🧵 Copied. Keep it somewhere it cannot fray.');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mine.value).then(done, () => { document.execCommand('copy'); done(); });
      } else { document.execCommand('copy'); done(); }
    };
    row1.appendChild(copy);
    w.appendChild(row1);

    w.appendChild(el('div', 'small', '<br><b>Weave a thread in</b> — knowledge is only ever gained, never lost:'));
    const paste = el('textarea');
    paste.placeholder = 'paste a thread here…';
    w.appendChild(paste);
    const row2 = el('div', 'thread-row');
    const weave = el('button', 'arcane', '🪡 Weave it in');
    weave.onclick = () => {
      const t = Loom.threadDecode(paste.value);
      if (!t.ok) {
        toast(t.error === 'frayed'
          ? '🕸 The thread is frayed — a character is wrong or missing. Copy it whole and try again.'
          : '🕸 That is not a weaver\'s thread.', 3200);
        return;
      }
      const gain = Loom.threadMerge(meta, t);
      LoomSave.save(meta);
      hud();
      const bits = [];
      if (gain.elements) bits.push(`<b>${gain.elements}</b> element${gain.elements > 1 ? 's' : ''}`);
      if (gain.secrets) bits.push(`<b>${gain.secrets}</b> secret${gain.secrets > 1 ? 's' : ''}`);
      if (gain.diff) bits.push(`the <b>${Loom.DIFF_BY_ID[gain.diff].name}</b> tier`);
      toast((bits.length
        ? `🧵 The thread weaves in: ${bits.join(' and ')} join your grimoire.`
        : '🧵 The thread held nothing you did not already know.')
        + (t.version === 1 ? '<br><span class="small">An elder thread — its secrets and solved words carry; its notes belong to a loom that no longer exists.</span>' : '')
        + (t.warn ? '<br><span class="small">It was spun on an older loom — some stitches may sit differently.</span>' : ''), 3600);
      renderThread();
    };
    row2.appendChild(weave);
    w.appendChild(row2);

    w.appendChild(el('div', 'small dim',
      '<br>Weaving a thread in <b>merges</b> it with what you hold — notes, secrets, solved words and tallies all keep their best. Nothing is ever unlearned.'));
    const back = el('button', 'quiet', '← the title page');
    back.style.cssText = 'display:block;margin:16px auto 0';
    back.onclick = renderTitle;
    w.appendChild(back);
    $screen.appendChild(w);
  }

  function renderWhisper() {
    $screen.innerHTML = '';
    const w = el('div', 'title-wrap');
    w.appendChild(el('h2', null, '🌬 Whisper to the Loom'));
    w.appendChild(el('div', 'title-sub', 'Some words are older than the grammar.<br>Speak one, if you know it.'));
    const gz = el('div', 'guess-zone');
    const input = el('input');
    input.id = 'whisper-input';
    input.maxLength = 16;
    input.placeholder = '············';
    input.autocomplete = 'off';
    gz.appendChild(input);
    const speak = el('button', 'arcane', 'Whisper');
    speak.id = 'whisper-btn';
    speak.style.marginLeft = '6px';
    const submit = () => {
      const word = input.value.toUpperCase().replace(/[^A-Z]/g, '');
      const secret = SECRETS[word];
      if (secret) {
        const msg = secret();
        hud();
        toast(msg, 3600);
        renderTitle();
      } else {
        toast('The loom does not stir.');
        input.value = '';
      }
    };
    speak.onclick = submit;
    input.onkeydown = (ev) => { if (ev.key === 'Enter') submit(); };
    gz.appendChild(speak);
    w.appendChild(gz);
    const back = el('button', 'quiet', '← the title page');
    back.style.cssText = 'display:block;margin:16px auto 0';
    back.onclick = renderTitle;
    w.appendChild(back);
    $screen.appendChild(w);
    input.focus();
  }

  /* ================= run end ================= */
  function endRun(victory) {
    if (victory) { meta.wins++; }
    LoomSave.save(meta);
    if (window.GLBG) GLBG.setMood(victory ? 'victory' : 'title');
    if (victory && window.FX && FX.confetti) FX.confetti();
    const discovered = run.discovered.map(id => Morph.EL_BY_ID[id]);
    const secretsGained = meta.secrets.size - run.startSecrets;
    $screen.innerHTML = `
      <div class="title-wrap">
        <h1>${victory ? '🏆 THE ILLITERATE IS UNWRITTEN' : '🕯 Your ink runs dry'}</h1>
        <p class="title-sub">${victory ? 'Three worlds read. The loom hums your name.' : 'But nothing discovered is ever lost.'}</p>
        ${discovered.length ? `<p>Elements discovered: <b>${discovered.map(e => e.icon + ' ' + e.name).join(' · ')}</b> — in your grimoire forever, every part of them.</p>` : ''}
        <p class="small">🌳 <b>${meta.elements.size}</b>/${Morph.ELEMENTS.length} elements in the grimoire</p>
        ${secretsGained > 0 ? `<p class="small" style="color:var(--arc)">…and ${secretsGained} thing${secretsGained > 1 ? 's' : ''} the grimoire does not speak of.</p>` : ''}
        ${victory && run.unlockedDiff ? `<p style="color:var(--good)">🪡 A new tier of the loom-school opens: <b>${Loom.DIFF_BY_ID[run.unlockedDiff].icon} ${Loom.DIFF_BY_ID[run.unlockedDiff].name}</b>.</p>` : ''}
      </div>`;
    const again = el('button', 'arcane', '⚔ Weave again');
    again.style.cssText = 'display:block;margin:0 auto;font-size:17px;padding:10px 28px';
    again.onclick = renderClassSelect;
    $screen.appendChild(again);
    const home = el('button', 'quiet', '← the title page');
    home.style.cssText = 'display:block;margin:10px auto 0';
    home.onclick = renderTitle;
    $screen.appendChild(home);
    run = null; battle = null;
    hud();
  }

  /* ---- physical keyboard ---- */
  document.addEventListener('keydown', (ev) => {
    if (!battle || battle.over) return;
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT') return;
    const ch = ev.key.toUpperCase();
    if (/^[A-Z]$/.test(ch)) {
      let t = battle.tray.find(x => x.ch === ch && !x.frozen && !picked.includes(x.id))
        || (run && run.shuttle || []).find(x => x.ch === ch && !picked.includes(x.id));
      if (!t) {
        // no such letter — an uncut rune can be shaped into it
        const bl = battle.tray.find(x => x.blank && !x.frozen && !picked.includes(x.id))
          || (run && run.shuttle || []).find(x => x.blank && !picked.includes(x.id));
        if (bl) { blankAssign[bl.id] = ch; t = bl; }
      }
      if (t) {
        picked.push(t.id);
        const tileEl = document.querySelector(`.tile[data-id="${t.id}"]`);
        if (tileEl) { tileEl.classList.remove('pop'); void tileEl.offsetWidth; tileEl.classList.add('pop'); }
        refreshBuild();
      }
    } else if (ev.key === 'Backspace') {
      const popped = picked.pop();
      if (popped != null) delete blankAssign[popped];
      refreshBuild();
    }
    else if (ev.key === 'Enter') castBuilt();
  });

  /* ---- debug hook ---- */
  if (/[?&]debug=1/.test(location.search)) {
    window.LoomDebug = {
      get run() { return run; },
      get battle() { return battle; },
      get meta() { return meta; },
      learnAll() { Morph.ELEMENTS.forEach(e => meta.elements.add(e.id)); Loom.syncMeta(meta); if (run) Morph.ELEMENTS.forEach(e => run.elements.add(e.id)); LoomSave.save(meta); hud(); },
      setDiff(n) { meta.diff = Math.min(4, Math.max(1, n)); LoomSave.save(meta); hud(); },
      teachSecrets() { Morph.SECRET_IDS.forEach(id => meta.secrets.add(id)); LoomSave.save(meta); hud(); },
      winBattle() { if (battle) { battle.foes.forEach(f => f.hp = 0); battle.over = true; battle.won = true; battleWon(); } },
      rerender() { if (battle) renderBattle(); },
    };
  }

  renderTitle();
  $screen.dataset.booted = '1'; // boot failsafe in index.html watches for this
})();
