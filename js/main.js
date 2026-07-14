/* ============================================================
 * WORDLOOM — UI, second weaving.
 * title → weaver select → world doors → battle / camp / event /
 * elder → rewards → next world → the Illiterate.
 * ============================================================ */
(function () {
  const $screen = document.getElementById('screen');
  const $hud = document.getElementById('hud');
  const $toast = document.getElementById('toast');

  let meta = LoomSave.load();
  let run = null;
  let battle = null;
  let picked = [];

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
    const notes = meta.parts.size;
    const readable = Morph.readableCount(Loom.knowSet(meta));
    $hud.innerHTML = run
      ? `<span>${run.cls.icon}</span><span>🖋 ink <b>${run.hp}/${run.maxHp}</b></span><span>✒️ notes <b>${notes}</b>/${Morph.PART_IDS.length}</span><span title="words your knowledge can read">📖 reads <b>${readable}</b>/${Morph.VISIBLE.length}</span><span>🪡 loom <b>${run.traySize}</b></span>`
      : `<span>✒️ notes <b>${notes}</b>/${Morph.PART_IDS.length}</span><span title="words your knowledge can read">📖 reads <b>${readable}</b>/${Morph.VISIBLE.length}</span><span>🏆 wins <b>${meta.wins}</b>/${meta.runs} runs</span>`;
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
        <div class="small" style="margin-top:6px">🖋 ${c.hp} · 🪡 ${c.tray} tiles · chips to ${c.chipMax > 12 ? 'ANY' : c.chipMax + 'L'}${c.power !== 1 ? ' · words ×' + c.power : ''}</div>`);
      if (!locked) card.onclick = () => startRun(c.id);
      row.appendChild(card);
    });
    $screen.appendChild(row);
    const back = el('button', 'quiet', '← the title page');
    back.style.cssText = 'display:block;margin:14px auto 0';
    back.onclick = renderTitle;
    $screen.appendChild(back);
  }

  function startRun(clsId) {
    meta.runs++;
    LoomSave.save(meta);
    run = Loom.newRun((Date.now() % 2147483647) | 0, meta, clsId);
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
  }

  function enterNode(node) {
    if (node.type === 'camp') { flipScreen(renderCamp); return; }
    if (node.type === 'event') { flipScreen(renderEvent); return; }
    if (node.type === 'elder') { flipScreen(() => renderElder(node.event)); return; }
    battle = Loom.battleForNode(run, node);
    battle._node = node;
    picked = [];
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
    b.tray.forEach(t => {
      const tile = el('div', 'tile' + ('AEIOU'.includes(t.ch) ? ' vowel' : '') + (t.frozen ? ' frozen' : '') + (picked.includes(t.id) ? ' used' : ''), t.ch);
      if (!t.frozen) tile.onclick = () => {
        if (!picked.includes(t.id)) {
          picked.push(t.id);
          tile.classList.remove('pop'); void tile.offsetWidth; tile.classList.add('pop');
          refreshBuild();
        }
      };
      tile.dataset.id = t.id;
      trayEl.appendChild(tile);
    });
    loom.appendChild(trayEl);
    loom.appendChild(el('div', 'spell-build', ''));
    loom.appendChild(el('div', 'build-hint', ''));
    const btns = el('div', 'loom-btns');
    const castBtn = el('button', 'arcane', '🗣 Speak');
    castBtn.id = 'cast-btn';
    castBtn.onclick = castBuilt;
    const clearBtn = el('button', null, '⌫ Unpick');
    clearBtn.onclick = () => { picked.pop(); refreshBuild(); };
    const mullBtn = el('button', null, `♻ Sweep (${b.mulligans})`);
    mullBtn.disabled = !b.mulligans;
    mullBtn.onclick = () => { if (Loom.mulligan(b)) { picked = []; renderBattle(); } };
    const guideBtn = el('button', null, '🪡 Notes');
    guideBtn.onclick = toggleGuideOverlay;
    const endBtn = el('button', null, '⌛ End Turn');
    endBtn.id = 'end-turn';
    endBtn.onclick = () => { Loom.endTurn(b); picked = []; afterAction(); };
    btns.append(castBtn, clearBtn, mullBtn, guideBtn, endBtn);
    loom.appendChild(btns);

    const speak = el('div', 'speakable');
    const spellable = Loom.spellableWords(b);
    const cap = Loom.chipMax(run);
    if (spellable.length) {
      speak.appendChild(el('div', 'small dim', `the loom suggests (to ${cap > 12 ? 'any length' : cap + ' runes'} — longer words must be spelled by hand):`));
      spellable.forEach(e => {
        const c = el('button', 'cast-chip', `${Morph.EL_BY_ID[e.el].icon} ${e.word}`);
        c.title = `${e.name} — ${e.desc}`;
        c.onclick = () => { const r = Loom.castWord(b, e.word); if (r.ok) { picked = []; afterAction(); } };
        speak.appendChild(c);
      });
    } else {
      speak.appendChild(el('div', 'small dim', 'no suggestion fits this loom — deduce, improvise, spell by hand, or sweep'));
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
    for (let len = 4; len <= 12; len++) {
      const ok = lens.includes(len);
      const pill = el('button', 'len-pill' + (ok ? '' : ' locked') + (m && m.len === len ? ' selected' : ''), String(len));
      pill.title = ok ? `ask the loom for a ${len}-rune mystery` : 'its form note is not in your grimoire';
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
    const suf = (e, sz, txt) => P.has('suf:' + e.id + ':' + sz) ? '-' + txt : '·';
    const g = el('div', 'guide');
    g.innerHTML = `<div class="small" style="margin-bottom:4px"><b>🪡 Loom guide</b> — notes in your grimoire</div>
      <table>
      ${Morph.ELEMENTS.map(e => {
        const root = P.has('root:' + e.id);
        const conn = P.has('conn:' + e.id);
        const alt = P.has('alt:' + e.id);
        return `<tr class="${root ? '' : 'unk'}"><td>${e.icon}</td><td class="mono">${root ? e.root : '???'}</td>
          <td class="mono">${root ? [suf(e, 'small', e.small), suf(e, 'medium', e.medium), suf(e, 'large', e.large)].join(' ') : '· · ·'}</td>
          <td class="mono">${conn ? (e.longRoot ? '→' + e.longRoot : '+' + e.conn) : '·'}</td>
          <td class="mono">${alt ? '⋯' + e.alt : '·'}</td>
          <td>${root ? e.name : 'unknown'}</td></tr>`;
      }).join('')}
      </table>
      <div style="margin-top:5px">centers: ${Morph.CENTERS.map(c => P.has('center:' + c.id)
        ? `<span class="mono" title="${c.shape}">${c.seq}</span>` : '<span class="dim">··</span>').join(' ')}</div>
      <div>forms: ${Morph.FORM_IDS.map(f => P.has('form:' + f)
        ? `<span class="mono" title="${Morph.FORMS[f].note}">${Morph.FORMS[f].name}</span>` : '<span class="dim">···</span>').join(' · ')}</div>
      <div>${P.has('join:et') ? '<span class="mono" title="weds two elements">ET</span> · ' : ''}${P.has('rule:elision') ? '<span class="mono" title="twin vowels: the second transmutes">✒️elision</span> · ' : ''}${P.has('rule:easing') ? '<span class="mono" title="consonant joints eased by the small vowel">🫧easing</span>' : ''}</div>`;
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
    inner.appendChild(el('div', 'small dim', 'Only what your grimoire already holds. The loom explains nothing.'));
    const GROUPS = [['roots', '🌳 Roots'], ['suffixes', '✂️ Suffixes'], ['binders', '🧵 Binders'], ['centers', '🌀 Centers'], ['joiners', '💍 Joiners'], ['forms', '𝔏 Forms'], ['rules', '✒️ Rules']];
    for (const [gid, gname] of GROUPS) {
      const known = Morph.PART_IDS.filter(pid => Morph.PARTS[pid].group === gid && meta.parts.has(pid));
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
    return picked.map(id => battle.tray.find(t => t.id === id)).filter(Boolean).map(t => t.ch).join('');
  }

  function refreshBuild() {
    const b = battle;
    const word = builtWord();
    document.querySelectorAll('.tile').forEach(t => {
      t.classList.toggle('used', picked.includes(Number(t.dataset.id)));
    });
    const build = document.querySelector('.spell-build');
    const hint = document.querySelector('.build-hint');
    const castBtn = document.getElementById('cast-btn');
    if (!build) return;
    const entry = Morph.WORDS[word];
    const know = Loom.knowSet(meta, b.sealedNotes);
    const readable = entry && Morph.canRead(know, entry);
    build.innerHTML = word
      ? `<span class="${entry ? (readable ? 'ok' : 'improv') : 'no'}">${word}</span>`
      : '<span class="no dim">— pick tiles to weave a word —</span>';
    // NEVER hint at hidden words: an unreadable hidden word looks identical
    // to an unreadable ordinary word.
    hint.innerHTML = entry
      ? (readable ? `✓ ${entry.hidden ? entry.name : entry.name + ' — ' + entry.desc}`
        : `<span class="improv">its grammar is not in your notes — improvised at half power</span>`)
      : (word.length >= 3 ? 'not a word of the loom-tongue' : '');
    if (castBtn) castBtn.disabled = !entry;
  }

  function castBuilt() {
    const b = battle;
    const word = builtWord();
    if (!Morph.WORDS[word]) return;
    const r = Loom.castWord(b, word);
    if (!r.ok) { toast('The loom refuses.'); return; }
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
    const notes = b.stats.notes;
    flipScreen(() => battleWonScreen(b, notes));
  }

  function battleWonScreen(b, notes) {
    $screen.innerHTML = runStrip() + worldBanner() + `
      <h2 class="center">🏆 The page is yours</h2>
      <p class="small center">${notes.length
        ? `Notes inscribed: <b>${notes.map(pid => Morph.PARTS[pid].title.split(' — ')[0]).join(' · ')}</b> — yours forever.`
        : 'No new grammar this time — the grimoire waits.'}</p>
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
    $screen.innerHTML = `<h2>📖 The Grimoire — ${meta.parts.size}/${Morph.PART_IDS.length} notes</h2>
      <p class="small dim">You do not collect words — you collect the grammar. Your knowledge currently reads <b>${readable}/${Morph.VISIBLE.length}</b> words of the loom-tongue.</p>`;
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
          : `<span class="note-icon">·</span><b>— an unturned page —</b>`));
      }
      sec.appendChild(list);
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
      <p class="small" style="margin-top:10px"><b>The nine forms:</b> IGNA → IGNUS → IGNIUS → IGNIORA (center-woven) →
      IGNIAROS (mirror) → IGNIORUSA (verse) → IGNIORARIS (sovereign) → and the weddings: IGNIETUNDUS (Union, fire-and-water), IGNIETUNDRIS (Grand Union).</p>
      <p class="small" style="margin-top:6px"><b>Centers</b> come short, standard, and grand:
      ${Morph.CENTERS.map(c => `<span class="mono">${c.seq}</span> ${c.name}`).join(' · ')}.</p>
      <p class="small" style="margin-top:6px"><b>The Scribe's Elision:</b> twin vowels never touch — the second transmutes (A→E, E→A, I→E, O→U, U→O).
      <b>The Easing Vowel:</b> when a binder's consonant strikes another consonant, the element's small vowel eases the joint.</p>
      <p class="small dim" style="margin-top:6px">Your grimoire records <b>notes</b> — these rules and parts — not words.
      A word casts at full strength once every part it uses is in your notes; otherwise it can be improvised at half power.
      The loom only <b>suggests</b> short words (your Weaver decides how short) — long words must be spelled by hand.
      Deep lengths must be unlocked before the mystery word will come that long. And the road-books say the grammar keeps
      older secrets than any of this.</p>`;
    const back = el('button', null, '← Back');
    back.style.marginTop = '14px';
    back.onclick = renderTitle;
    $screen.appendChild(back);
  }

  /* Some words are older than the grammar. */
  const SECRETS = {
    WORDSMITH: () => {
      Morph.PART_IDS.forEach(pid => meta.parts.add(pid));
      LoomSave.save(meta);
      return `✒️ The whole grammar unfurls — every note inscribes itself. ${Morph.PART_IDS.length}/${Morph.PART_IDS.length}.`;
    },
    RESETTIA: () => {
      const blank = LoomSave.fresh();
      meta.parts = blank.parts;
      meta.solved = blank.solved;
      meta.secrets = blank.secrets;
      LoomSave.save(meta);
      return '🕯 The ink lifts from every page. Only the first stitches remain — 5/' + Morph.PART_IDS.length + '.';
    },
  };

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
    const gained = meta.parts.size - run.startNotes;
    const secretsGained = meta.secrets.size - run.startSecrets;
    const readable = Morph.readableCount(Loom.knowSet(meta));
    $screen.innerHTML = `
      <div class="title-wrap">
        <h1>${victory ? '🏆 THE ILLITERATE IS UNWRITTEN' : '🕯 Your ink runs dry'}</h1>
        <p class="title-sub">${victory ? 'Three worlds read. The loom hums your name.' : 'But nothing learned is ever lost.'}</p>
        <p><b>${gained}</b> new note${gained === 1 ? '' : 's'} inscribed · <b>${meta.parts.size}</b>/${Morph.PART_IDS.length} notes, reading <b>${readable}</b>/${Morph.VISIBLE.length} words</p>
        ${secretsGained > 0 ? `<p class="small" style="color:var(--arc)">…and ${secretsGained} thing${secretsGained > 1 ? 's' : ''} the grimoire does not speak of.</p>` : ''}
        <p class="small dim" style="margin-top:6px">Every note makes the next run stronger — and the mystery words longer.</p>
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
      const t = battle.tray.find(x => x.ch === ch && !x.frozen && !picked.includes(x.id));
      if (t) {
        picked.push(t.id);
        const tileEl = document.querySelector(`.tile[data-id="${t.id}"]`);
        if (tileEl) { tileEl.classList.remove('pop'); void tileEl.offsetWidth; tileEl.classList.add('pop'); }
        refreshBuild();
      }
    } else if (ev.key === 'Backspace') { picked.pop(); refreshBuild(); }
    else if (ev.key === 'Enter') castBuilt();
  });

  /* ---- debug hook ---- */
  if (/[?&]debug=1/.test(location.search)) {
    window.LoomDebug = {
      get run() { return run; },
      get battle() { return battle; },
      get meta() { return meta; },
      learnAll() { Morph.PART_IDS.forEach(pid => meta.parts.add(pid)); LoomSave.save(meta); hud(); },
      learnSome(n) { Morph.PART_IDS.slice(0, n).forEach(pid => meta.parts.add(pid)); LoomSave.save(meta); hud(); },
      teachSecrets() { Morph.SECRET_IDS.forEach(id => meta.secrets.add(id)); LoomSave.save(meta); hud(); },
      winBattle() { if (battle) { battle.foes.forEach(f => f.hp = 0); battle.over = true; battle.won = true; battleWon(); } },
      rerender() { if (battle) renderBattle(); },
    };
  }

  renderTitle();
  $screen.dataset.booted = '1'; // boot failsafe in index.html watches for this
})();
