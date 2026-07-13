/* ============================================================
 * LEXICON ARCANUM — game controller & tome UI (v2)
 * Energy, multi-foe targeting, scry, relics, events, schools,
 * attunement, daily challenge, bestiary art, soundscape.
 * ============================================================ */
(function () {
  const $L = document.getElementById('page-left');
  const $R = document.getElementById('page-right');
  const $hand = document.getElementById('hand-zone');
  const $endTurn = document.getElementById('end-turn');
  const $bhud = document.getElementById('battle-hud');
  const $marks = document.getElementById('bookmarks');
  const $toast = document.getElementById('toast');

  /* ---------- stage scaling ---------- */
  function isPortrait() {
    return window.innerWidth / window.innerHeight < 0.9 || window.innerWidth < 700;
  }
  function fitStage() {
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
    document.getElementById('stage').style.setProperty('--stage-scale', isPortrait() ? 1 : s);
  }
  window.addEventListener('resize', fitStage); fitStage();

  /* ---------- state ---------- */
  let meta = SaveSystem.loadMeta();
  let run = null;
  let battle = null;
  let currentGuess = '';
  let screen = 'title';
  let modalOpen = false;
  let selClass = 'scribe', selDiff = 0;

  function metaForEngine() {
    return {
      learnedWords: new Set(meta.learnedWords),
      discoveredPower: new Set(meta.discoveredPower),
      totalWins: meta.totalWins, bestDifficultyWin: meta.bestDifficultyWin,
      firstGuessCasts: meta.firstGuessCasts, classWins: meta.classWins, bestWorld: meta.bestWorld,
    };
  }
  function absorbBattleMeta(b) {
    meta.learnedWords = Array.from(b.meta.learnedWords);
    meta.discoveredPower = Array.from(b.meta.discoveredPower);
    meta.firstGuessCasts += b.stats.firstGuessCasts;
    meta.spellsCast += b.stats.spellsCast;
    b.stats.firstGuessCasts = 0; b.stats.spellsCast = 0;
    SaveSystem.saveMeta(meta);
  }

  /* ---------- tiny DOM helpers ---------- */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function toast(msg, ms) {
    $toast.innerHTML = msg;
    $toast.classList.add('show');
    clearTimeout($toast._t);
    $toast._t = setTimeout(() => $toast.classList.remove('show'), ms || 2600);
  }
  function floatText(x, y, txt, color) {
    const f = el('div', 'float-txt', txt);
    f.style.left = (x - 20) + 'px'; f.style.top = (y - 20) + 'px';
    f.style.color = color || '#fff';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }
  function centerOf(elem) {
    if (!elem) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = elem.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function foeCenter(idx) {
    return centerOf(document.querySelector(`.foe-box[data-idx="${idx}"] .foe-art`) || document.querySelector('.foe-row'));
  }
  function shakeTome() {
    const t = document.getElementById('tome');
    t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake');
  }
  function flipTo(renderFn) {
    Sfx.flip();
    const flipper = document.getElementById('flipper');
    flipper.classList.add('flipping');
    setTimeout(() => { renderFn(); }, 300);
    setTimeout(() => { flipper.classList.remove('flipping'); }, 640);
  }
  function setBattleChrome(on) {
    $hand.innerHTML = '';
    $endTurn.classList.toggle('hidden', !on);
    $bhud.classList.toggle('hidden', !on);
  }
  const COARSE_POINTER = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function bookmarks(list) {
    $marks.innerHTML = '';
    list.forEach(([label, cls, fn]) => {
      const b = el('div', 'bookmark ' + (cls || ''), label);
      b.onclick = fn;
      $marks.appendChild(b);
    });
    // sound bookmark always present
    const snd = el('div', 'bookmark', Sfx.muted ? '🔇 Sound' : '🔊 Sound');
    snd.onclick = () => { Sfx.toggleMute(); bookmarksRefreshSound(snd); };
    $marks.appendChild(snd);
  }
  function bookmarksRefreshSound(elm) { elm.textContent = Sfx.muted ? '🔇 Sound' : '🔊 Sound'; if (!Sfx.muted) Sfx.coin(); }

  function relicBarHtml(ids) {
    if (!ids || !ids.length) return '<div class="relic-bar"><span class="small" style="opacity:0.6">No relics yet — elites and strange encounters carry them.</span></div>';
    return '<div class="relic-bar">' + ids.map(id => {
      const r = RelicData.BY_ID[id];
      return `<span class="relic-chip" title="${r.name} — ${r.desc} ${r.flavor}">${r.icon}</span>`;
    }).join('') + '</div>';
  }

  /* ============================================================
   * TITLE
   * ============================================================ */
  function dailySeed() {
    const d = new Date();
    const s = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return { seed: h >>> 0, dateStr: s };
  }

  function renderTitle() {
    screen = 'title'; setBattleChrome(false); bookmarks([]);
    $L.innerHTML = ''; $R.innerHTML = '';
    const left = el('div', '', `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
        <div class="title-glyph">📖</div>
        <div class="game-title">Lexicon<br>Arcanum</div>
        <div class="small center" style="margin-top:14px;max-width:300px">
          A roguelike deckbuilder where every spell is a <b>word</b> —
          guess it, learn it, and let its runes engrave themselves upon you.
        </div>
      </div>`);
    left.style.height = '100%';
    $L.appendChild(left);

    const wc = meta.learnedWords.length;
    const { dateStr } = dailySeed();
    const right = el('div', '', `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px">
        <div class="small center">
          Grimoire: <b>${wc}</b> / 180 words · ⚡ Words of Power: <b>${meta.discoveredPower.length}</b>/6<br>
          Victories: <b>${meta.totalWins}</b> · Runs: <b>${meta.runsPlayed}</b>
        </div>
        <button class="arcane" id="bt-open" style="font-size:20px;padding:14px 34px">Open the Tome</button>
        ${SaveSystem.loadRun() ? '<button id="bt-continue">Continue Expedition</button>' : ''}
        <button id="bt-daily" class="ghost">🗓️ Daily Challenge — ${dateStr}</button>
        <div class="small center" style="opacity:0.75">Turn pages. Guess words. Survive five worlds.</div>
      </div>`);
    right.style.height = '100%';
    $R.appendChild(right);
    right.querySelector('#bt-open').onclick = () => flipTo(renderClassSelect);
    const cont = right.querySelector('#bt-continue');
    if (cont) cont.onclick = () => {
      run = SaveSystem.loadRun();
      if (run) flipTo(renderMap); else toast('No expedition to continue');
    };
    right.querySelector('#bt-daily').onclick = startDaily;

    // a keyhole, barely visible, for those who know the word
    const keyhole = el('div', '', '🗝️');
    keyhole.id = 'keyhole';
    keyhole.style.cssText = 'position:absolute;right:6px;bottom:2px;font-size:15px;opacity:0.18;cursor:pointer;transition:opacity 0.3s';
    keyhole.onmouseenter = () => keyhole.style.opacity = '0.6';
    keyhole.onmouseleave = () => keyhole.style.opacity = '0.18';
    keyhole.onclick = whisperModal;
    $R.appendChild(keyhole);
  }

  /* Secret entry panel: speaking the maker's word engraves the whole Lexicon
   * (all 180 grimoire words) — intended for testing. */
  function whisperModal() {
    const m = overlayPanel(`<div class="rune-title">🗝️ Whisper to the Tome</div>
      <p class="small center" style="max-width:380px">The keyhole has no key. The tome listens instead.<br>Speak, and be judged.</p>`);
    const input = el('input');
    input.id = 'whisper-input';
    input.type = 'text';
    input.maxLength = 20;
    input.autocomplete = 'off';
    input.style.cssText = 'display:block;margin:12px auto;padding:9px 14px;font-family:inherit;font-size:18px;' +
      'letter-spacing:0.2em;text-transform:uppercase;text-align:center;background:rgba(255,250,235,0.6);' +
      'border:1.5px solid rgba(58,44,26,0.5);border-radius:8px;color:var(--ink);width:280px;outline:none';
    m.p.appendChild(input);
    const row = el('div', 'center');
    const speak = el('button', 'arcane small-btn', '🗣 Whisper');
    const leave = el('button', 'ghost small-btn', 'Say nothing');
    leave.style.marginLeft = '8px';
    row.appendChild(speak); row.appendChild(leave);
    m.p.appendChild(row);

    // The tome answers to a handful of whispered words:
    const SECRETS = {
      WORDSMITH: {
        apply() {
          const all = [];
          Object.values(WordData.POOLS).forEach(pool => all.push(...pool));
          meta.learnedWords = all.slice();
        },
        color: '#ffd700',
        msg: '🗝️ <b>The tome recognizes its maker.</b> All 180 words engrave themselves at once.',
      },
      RESETTIA: {
        apply() {
          // forget everything unlock-related; only run history remains
          meta.learnedWords = [];
          meta.discoveredPower = [];
          meta.totalWins = 0;
          meta.winsByDifficulty = {};
          meta.bestDifficultyWin = -1;
          meta.classWins = {};
          meta.firstGuessCasts = 0;
          meta.bestWorld = 1;
          meta.unlockAllClasses = false;
          meta.unlockAllDifficulties = false;
          meta.unlockArchivist = false;
        },
        color: '#8a8578',
        msg: '🌫️ <b>The tome forgets.</b> Every engraving fades; every unlocked door swings shut.',
      },
      SKELETUS: {
        apply() {
          meta.unlockAllClasses = true;
          meta.unlockAllDifficulties = true;
        },
        color: '#e8d9b0',
        msg: '💀 <b>A skeleton key of old bone.</b> Every class and every difficulty stands open.',
      },
      ARCHANEUM: {
        apply() { meta.unlockArchivist = true; },
        color: '#a887ff',
        msg: '📜 <b>The Archive answers.</b> THE ARCHIVIST steps from between the shelves.',
      },
      VAELORA: {
        apply() { meta.unlockAllDifficulties = true; },
        color: '#c0503f',
        msg: '🔥 <b>The pages harden.</b> All difficulties lie open — even the one that reads YOU.',
      },
    };

    const submit = () => {
      const word = (input.value || '').trim().toUpperCase();
      if (!word) return;
      const secret = SECRETS[word];
      if (secret) {
        secret.apply();
        SaveSystem.saveMeta(meta);
        m.close();
        Sfx.power();
        FX.confetti();
        FX.powerNova(window.innerWidth / 2, window.innerHeight / 2);
        FX.runes(window.innerWidth / 2, window.innerHeight / 3, word, { color: secret.color, size: 30 });
        toast(secret.msg, 4600);
        renderTitle();
      } else {
        shakeTome();
        Sfx.wrong();
        input.value = '';
        toast('The tome does not know that word. Or refuses to.');
      }
    };
    speak.onclick = submit;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); e.stopPropagation(); });
    leave.onclick = m.close;
    setTimeout(() => input.focus(), 80);
  }

  function startDaily() {
    const { seed, dateStr } = dailySeed();
    const dayNum = Math.floor(seed / 7) % 3;
    const clsId = ['scribe', 'oracle', 'warmage'][dayNum];
    const cls = ClassData.CLASSES.find(c => c.id === clsId);
    run = {
      classId: clsId, difficulty: 1,
      world: 1, seed, seedStep: 0,
      deck: cls.deck.map(id => ({ id, upgraded: false })),
      hp: cls.hp, maxHp: cls.hp, gold: 0, insight: 0,
      upgrades: 0, removals: 0, wordLen: 5,
      map: null, pos: null, done: [], relics: [],
      daily: dateStr,
    };
    meta.runsPlayed++;
    SaveSystem.saveMeta(meta);
    newWorldMap();
    toast(`🗓️ Daily Expedition ${dateStr} — ${cls.name}, Adept. Same tome for everyone today.`, 3600);
    flipTo(renderMap);
  }

  /* ============================================================
   * CLASS SELECT
   * ============================================================ */
  function renderClassSelect() {
    screen = 'classes'; setBattleChrome(false);
    bookmarks([['Grimoire', 'arc', () => renderGrimoireOverlay()]]);
    $L.innerHTML = ''; $R.innerHTML = '';

    const left = el('div', '', '<div class="rune-title">Choose Your Path</div>');
    ClassData.CLASSES.forEach(c => {
      const locked = !ClassData.classUnlocked(c, meta);
      const d = el('div', 'class-card' + (locked ? ' locked' : '') + (selClass === c.id ? ' selected' : ''), `
        <div class="ci">${Bestiary.crest(c.id)}</div>
        <div style="flex:1">
          <b>${c.name}</b> <span class="small">· ${c.hp} HP</span><br>
          <span class="small">${locked ? '🔒 Win with all other classes to unlock' : c.tagline}</span>
        </div>`);
      if (!locked) d.onclick = () => { selClass = c.id; Sfx.card(); renderClassSelect(); };
      left.appendChild(d);
    });
    $L.appendChild(left);

    const cls = ClassData.CLASSES.find(c => c.id === selClass);
    const right = el('div');
    right.appendChild(el('div', 'rune-title', 'The Expedition'));
    right.appendChild(el('div', 'small', `<i>${cls.desc}</i><br><br>`));
    right.appendChild(el('div', '', '<b class="small">DIFFICULTY</b>'));
    const dr = el('div', 'diff-row');
    ClassData.DIFFICULTIES.forEach(d => {
      const locked = !ClassData.difficultyUnlocked(d, meta);
      const p = el('div', 'diff-pill' + (locked ? ' locked' : '') + (selDiff === d.id ? ' selected' : ''),
        `${d.icon} ${d.name}`);
      p.title = locked ? `Win on ${ClassData.DIFFICULTIES[d.unlock.winsOn].name} to unlock` : d.desc;
      if (!locked) p.onclick = () => { selDiff = d.id; Sfx.key(); renderClassSelect(); };
      dr.appendChild(p);
    });
    right.appendChild(dr);

    const lens = ClassData.unlockedLengths(meta);
    right.appendChild(el('div', 'small', `
      <b>WORD LENGTHS UNLOCKED:</b> ${lens.join(', ')} letters<br>
      ${lens.includes(10) ? '' : [8, 9, 10].filter(l => !lens.includes(l)).map(l => `🔒 ${l}L — ${ClassData.lengthUnlockText(l)}`).join('<br>')}
      <br>`));
    const diff = ClassData.DIFFICULTIES[selDiff];
    right.appendChild(el('div', 'small',
      `Foes: ×${diff.hpMult} vitality, ×${diff.dmgMult} fury · Aurum: ×${diff.goldMult}<br><br>`));

    const start = el('button', 'arcane', 'Begin the Expedition ➤');
    start.style.cssText = 'font-size:17px;padding:12px 26px';
    start.onclick = () => startRun();
    right.appendChild(start);
    const back = el('button', 'ghost small-btn', '◂ Back');
    back.style.marginLeft = '10px';
    back.onclick = () => flipTo(renderTitle);
    right.appendChild(back);
    $R.appendChild(right);
  }

  /* ============================================================
   * RUN MANAGEMENT
   * ============================================================ */
  function startRun() {
    const cls = ClassData.CLASSES.find(c => c.id === selClass);
    run = {
      classId: selClass, difficulty: selDiff,
      world: 1, seed: Math.floor(Math.random() * 1e9), seedStep: 0,
      deck: cls.deck.map(id => ({ id, upgraded: false })),
      hp: cls.hp, maxHp: cls.hp, gold: 0, insight: 0,
      upgrades: 0, removals: 0, wordLen: 5,
      map: null, pos: null, done: [], relics: [],
      daily: null,
    };
    meta.runsPlayed++;
    SaveSystem.saveMeta(meta);
    newWorldMap();
    flipTo(renderMap);
  }

  function runRng() {
    run.seedStep++;
    return Engine.makeRng(run.seed + run.seedStep * 7919);
  }

  function newWorldMap() {
    run.map = Engine.generateWorldMap(runRng(), run.world);
    run.pos = null;
    run.done = [];
    SaveSystem.saveRun(run);
  }

  function nodeKey(n) { return n.stage + ':' + n.idx; }

  function availableNodes() {
    const cols = run.map.columns;
    if (!run.pos) return cols[0].map(n => nodeKey(n));
    const cur = cols[run.pos.stage - 1][run.pos.idx];
    if (run.pos.stage >= 6) return [];
    return cur.next.map(j => nodeKey(cols[run.pos.stage][j]));
  }

  function grantRelic(relicDef, why) {
    run.relics.push(relicDef.id);
    SaveSystem.saveRun(run);
    Sfx.relic();
    toast(`${relicDef.icon} <b>${relicDef.name}</b> — ${relicDef.desc}${why ? ' · ' + why : ''}`, 4200);
    FX.powerNova(window.innerWidth / 2, window.innerHeight / 3);
  }

  /* ============================================================
   * MAP
   * ============================================================ */
  function renderMap() {
    screen = 'map'; setBattleChrome(false);
    bookmarks([
      ['Grimoire', 'arc', () => renderGrimoireOverlay()],
      ['Arcane Forge', 'gold', () => renderForgeOverlay()],
      ['Abandon', '', () => { if (confirm('Abandon this expedition? Learned words are kept.')) { SaveSystem.clearRun(); run = null; flipTo(renderTitle); } }],
    ]);
    const world = EnemyData.WORLDS[run.world - 1];
    const cls = ClassData.CLASSES.find(c => c.id === run.classId);
    const diff = ClassData.DIFFICULTIES[run.difficulty];
    $L.innerHTML = ''; $R.innerHTML = '';

    const left = el('div', '', `
      <div class="rune-title">${world.icon} ${world.name}</div>
      <div class="small center"><i>${world.blurb}</i></div>
      <div class="hud" style="margin-top:12px">
        <span class="stat">❤️ ${run.hp}/${run.maxHp}</span>
        <span class="stat">🪙 ${run.gold}</span>
      </div>
      <div class="hud">
        <span class="stat">${cls.icon} ${cls.name}</span>
        <span class="stat">${diff.icon} ${diff.name}${run.daily ? ' · 🗓️ Daily' : ''}</span>
        <span class="stat">🃏 ${run.deck.length} cards</span>
      </div>
      ${relicBarHtml(run.relics)}
      <div class="small" style="margin-top:10px">
        World <b>${run.world}</b> of 5 — six stages each.<br><br>
        <b>Legend:</b><br>
        ⚔️ Battle (some hold <i>packs</i> of foes) · 💀 Elite (drops a relic)<br>
        🎁 Treasure · 🕯️ Shrine · ❓ Strange encounter · 👑 World Boss<br><br>
        The <b>Arcane Forge</b> bookmark is always within reach.
      </div>`);
    $L.appendChild(left);

    const cols = run.map.columns;
    const Wd = 470, Ht = 540;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('id', 'map-svg');
    svg.setAttribute('viewBox', `0 0 ${Wd} ${Ht}`);
    const px = (s) => 30 + (s * (Wd - 70) / 5);
    const py = (col, i) => (Ht / 2) + (i - (col.length - 1) / 2) * 92;

    const avail = availableNodes();
    cols.forEach((col, s) => {
      if (s >= 5) return;
      col.forEach((n, i) => {
        n.next.forEach(j => {
          const p = document.createElementNS(svgNS, 'path');
          const x1 = px(s), y1 = py(col, i), x2 = px(s + 1), y2 = py(cols[s + 1], j);
          p.setAttribute('d', `M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`);
          p.setAttribute('class', 'map-edge');
          svg.appendChild(p);
        });
      });
    });
    cols.forEach((col, s) => {
      col.forEach((n, i) => {
        const g = document.createElementNS(svgNS, 'g');
        const key = nodeKey(n);
        const isDone = run.done.includes(key);
        const isCur = run.pos && run.pos.stage - 1 === s && run.pos.idx === i;
        const isAvail = avail.includes(key);
        g.setAttribute('class', 'map-node' + (isAvail ? ' available' : isDone ? ' done' : isCur ? ' current' : ' unreachable'));
        const c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', px(s)); c.setAttribute('cy', py(col, i)); c.setAttribute('r', 24);
        g.appendChild(c);
        const fo = document.createElementNS(svgNS, 'foreignObject');
        fo.setAttribute('x', px(s) - 15); fo.setAttribute('y', py(col, i) - 15);
        fo.setAttribute('width', 30); fo.setAttribute('height', 30);
        fo.setAttribute('class', 'node-art');
        fo.innerHTML = Bestiary.nodeGlyph(n.type);
        g.appendChild(fo);
        if (n.type === 'battle' && n.enemies && n.enemies.length > 1) {
          const t = document.createElementNS(svgNS, 'text');
          t.setAttribute('x', px(s) + 16); t.setAttribute('y', py(col, i) - 16);
          t.setAttribute('style', 'font-size:12px;font-weight:bold');
          t.textContent = '×' + n.enemies.length;
          g.appendChild(t);
        }
        if (isAvail) g.onclick = () => enterNode(n);
        svg.appendChild(g);
      });
    });
    $R.appendChild(svg);
  }

  function enterNode(n) {
    run.pos = { stage: n.stage, idx: n.idx };
    run.done.push(nodeKey(n));
    SaveSystem.saveRun(run);
    if (n.type === 'battle' || n.type === 'elite' || n.type === 'boss') startBattle(n);
    else if (n.type === 'treasure') treasureModal(n);
    else if (n.type === 'shrine') shrineModal(n);
    else if (n.type === 'event') eventModal(n);
  }

  /* ---------- overlays ---------- */
  function overlayPanel(html) {
    const ov = el('div', 'overlay');
    const p = el('div', 'panel', html);
    ov.appendChild(p);
    document.getElementById('stage').appendChild(ov);
    modalOpen = true;
    return { ov, p, close: () => { ov.remove(); modalOpen = false; } };
  }

  function treasureModal() {
    const rng = runRng();
    const RR = Engine.RUN_RULES;
    const diff = ClassData.DIFFICULTIES[run.difficulty];
    const gold = Math.round((RR.treasureGold[0] + rng() * (RR.treasureGold[1] - RR.treasureGold[0])) * diff.goldMult);
    run.gold += gold;
    Sfx.coin();
    const withCard = rng() < RR.treasureCardChance;
    const m = overlayPanel(`<div class="rune-title">🎁 A Gilded Cache</div>
      <p class="center">Tucked between the pages: <b>${gold} aurum</b>.</p>`);
    if (withCard) {
      const offers = Engine.rollCardRewards(rng, metaForEngine(), 0.2);
      m.p.appendChild(el('p', 'center small', 'Something else glints beneath the coins…'));
      m.p.appendChild(cardChoiceRow(offers, m, () => { SaveSystem.saveRun(run); renderMap(); }));
    }
    const ok = el('button', '', withCard ? 'Take only the aurum' : 'Splendid');
    ok.style.cssText = 'display:block;margin:10px auto 0';
    ok.onclick = () => { m.close(); SaveSystem.saveRun(run); renderMap(); };
    m.p.appendChild(ok);
    FX.burst(window.innerWidth / 2, window.innerHeight / 2, { colors: ['#ffd700', '#fff3b0'], count: 40 });
  }

  function shrineModal() {
    const rng = runRng();
    const RR = Engine.RUN_RULES;
    const m = overlayPanel(`<div class="rune-title">🕯️ A Whispering Shrine</div>
      <p class="center small">The candles bend toward you, offering one boon.</p>`);
    const row = el('div', '', '');
    row.style.cssText = 'display:flex;gap:12px;justify-content:center;margin-top:14px;flex-wrap:wrap';
    const mkBtn = (label, fn) => {
      const b = el('button', '', label);
      b.onclick = () => { fn(); m.close(); SaveSystem.saveRun(run); renderMap(); };
      row.appendChild(b);
    };
    mkBtn(`💚 Mend (+${Math.round(run.maxHp * RR.shrineHealPct)} HP)`, () => {
      run.hp = Math.min(run.maxHp, run.hp + Math.round(run.maxHp * RR.shrineHealPct));
      Sfx.heal();
    });
    mkBtn(`🪙 Offering (+${RR.shrineGold} aurum)`, () => { run.gold += RR.shrineGold; Sfx.coin(); });
    const unlocked = ClassData.unlockedLengths(meta);
    const unknown = [];
    unlocked.forEach(len => WordData.POOLS[len].forEach(w => { if (!meta.learnedWords.includes(w)) unknown.push(w); }));
    if (unknown.length) {
      mkBtn('👁 Runic Vision (learn a word)', () => {
        const w = unknown[Math.floor(rng() * unknown.length)];
        meta.learnedWords.push(w);
        SaveSystem.saveMeta(meta);
        Sfx.autocast();
        toast(`✨ The shrine whispers: <b>${w}</b> — ${WordData.SPELLS[w].name} is yours`);
        FX.runes(window.innerWidth / 2, window.innerHeight / 2, w, { color: '#ffd700' });
      });
    }
    m.p.appendChild(row);
  }

  /* ---------- choice events ---------- */
  function eventModal() {
    const rng = runRng();
    const ev = EventData.EVENTS[Math.floor(rng() * EventData.EVENTS.length)];
    const m = overlayPanel(`<div class="rune-title">${ev.icon} ${ev.name}</div>
      <p class="small" style="max-width:480px;margin:0 auto 12px;text-align:center"><i>${ev.text}</i></p>`);
    ev.choices.forEach(choice => {
      const btn = el('button', 'event-choice', `${choice.label}<span class="ed">${choice.desc}</span>`);
      if (choice.cost && run.gold < choice.cost) { btn.disabled = true; btn.title = 'Not enough aurum'; }
      btn.onclick = () => { m.close(); applyEventChoice(choice, rng); };
      m.p.appendChild(btn);
    });
  }

  function applyEventChoice(choice, rng) {
    const fx = choice.fx;
    const after = () => { SaveSystem.saveRun(run); SaveSystem.saveMeta(meta); renderMap(); };
    if (fx.gold) { run.gold = Math.max(0, run.gold + fx.gold); if (fx.gold > 0) Sfx.coin(); }
    if (fx.hp) { run.hp = Math.max(1, run.hp + fx.hp); if (fx.hp < 0) { Sfx.hit(); shakeTome(); } }
    if (fx.maxHp) { run.maxHp = Math.max(20, run.maxHp + fx.maxHp); run.hp = Math.min(run.hp, run.maxHp); }
    if (fx.healPct) { run.hp = Math.min(run.maxHp, run.hp + Math.round(run.maxHp * fx.healPct)); Sfx.heal(); }
    if (fx.gamble) {
      if (run.gold >= fx.gamble.stake) {
        run.gold -= fx.gamble.stake;
        if (rng() < fx.gamble.chance) { run.gold += fx.gamble.win; Sfx.victory(); toast(`👺 The imp scowls. <b>+${fx.gamble.win} aurum!</b>`); }
        else { Sfx.wrong(); toast('👺 The imp cackles. Your aurum vanishes.'); }
      }
    }
    if (fx.relicRandom) {
      const r = RelicData.roll(rng, run.relics, 1);
      if (r.length) grantRelic(r[0], 'from the encounter');
      else { run.gold += 40; toast('Every relic is already yours — 40 aurum instead.'); }
    }
    if (fx.learnRandom) {
      const unlocked = ClassData.unlockedLengths(meta);
      const learned = [];
      for (let i = 0; i < fx.learnRandom; i++) {
        const unknown = [];
        unlocked.forEach(len => WordData.POOLS[len].forEach(w => { if (!meta.learnedWords.includes(w)) unknown.push(w); }));
        if (!unknown.length) break;
        const w = unknown[Math.floor(rng() * unknown.length)];
        meta.learnedWords.push(w);
        learned.push(w);
      }
      if (learned.length) {
        Sfx.autocast();
        toast(`📜 Engraved: <b>${learned.join(', ')}</b>`, 3600);
        FX.runes(window.innerWidth / 2, window.innerHeight / 2, learned[0], { color: '#a887ff' });
      }
    }
    if (fx.upgradeFree) {
      for (let i = 0; i < fx.upgradeFree; i++) {
        const cands = run.deck.filter(c => !c.upgraded);
        if (!cands.length) break;
        const c = cands[Math.floor(rng() * cands.length)];
        c.upgraded = true;
        toast(`⚒️ ${CardData.BY_ID[c.id].name} upgraded, free`);
      }
      Sfx.relic();
    }
    if (fx.dupeCard) { pickCardModal('Duplicate which card?', (c) => { run.deck.push(Object.assign({}, c)); after(); }); return; }
    if (fx.removeFree) { pickCardModal('Unbind which card?', (c, i) => { run.deck.splice(i, 1); after(); }); return; }
    if (fx.cardOffer != null) {
      const offers = Engine.rollCardRewards(rng, metaForEngine(), fx.cardOffer);
      if (fx.cardAuto && offers.length) {
        run.deck.push({ id: offers[0].id, upgraded: false });
        toast(`🃏 The djinn presses <b>${offers[0].name}</b> into your hands`);
        after(); return;
      }
      const m = overlayPanel('<div class="rune-title">🃏 Choose</div>');
      m.p.appendChild(cardChoiceRow(offers, m, after));
      const skip = el('button', 'ghost small-btn', 'None of these');
      skip.style.cssText = 'display:block;margin:8px auto 0';
      skip.onclick = () => { m.close(); after(); };
      m.p.appendChild(skip);
      return;
    }
    after();
  }

  function pickCardModal(title, onPick) {
    const m = overlayPanel(`<div class="rune-title">${title}</div>`);
    const list = el('div');
    list.style.cssText = 'max-height:420px;overflow-y:auto;min-width:520px';
    run.deck.forEach((c, i) => {
      const def = CardData.BY_ID[c.id];
      const fx = c.upgraded ? CardData.upgradedFx(def.fx) : def.fx;
      const row = el('div', 'spell-row clickable', `
        <span>🃏</span><span class="sw">${def.name}${c.upgraded ? ' +' : ''}</span>
        <span class="sd">${CardData.describeFx(fx)}</span>`);
      row.onclick = () => { m.close(); onPick(c, i); };
      list.appendChild(row);
    });
    m.p.appendChild(list);
    const cancel = el('button', 'ghost small-btn', 'Never mind');
    cancel.style.cssText = 'display:block;margin:10px auto 0';
    cancel.onclick = () => { m.close(); SaveSystem.saveRun(run); renderMap(); };
    m.p.appendChild(cancel);
  }

  function cardChoiceRow(offers, modal, after) {
    const row = el('div', 'reward-cards');
    offers.forEach(def => {
      const c = renderCardEl({ id: def.id, name: def.name, rarity: def.rarity, cost: def.cost, fx: def.fx, desc: CardData.describeFx(def.fx), flavor: def.flavor, upgraded: false });
      c.onclick = () => {
        run.deck.push({ id: def.id, upgraded: false });
        Sfx.card();
        toast(`🃏 <b>${def.name}</b> bound into your deck`);
        modal.close(); after();
      };
      row.appendChild(c);
    });
    return row;
  }

  /* ============================================================
   * BATTLE
   * ============================================================ */
  function startBattle(node) {
    const cls = ClassData.CLASSES.find(c => c.id === run.classId);
    const diff = ClassData.DIFFICULTIES[run.difficulty];
    const lens = ClassData.unlockedLengths(meta);
    if (!lens.includes(run.wordLen)) run.wordLen = lens[0];
    battle = Engine.createBattle({
      rng: runRng(), cls, deck: run.deck, hp: run.hp, maxHp: run.maxHp,
      enemyIds: node.enemies, world: run.world, stage: node.stage,
      difficulty: diff, meta: metaForEngine(), wordLen: run.wordLen,
      relics: run.relics,
    });
    battle._node = node;
    currentGuess = '';
    if (node.type === 'boss') Sfx.stinger();
    Engine.startPlayerTurn(battle);
    flipTo(() => {
      renderBattle();
      processEvents(Engine.drainEvents(battle));
      // live-tracking ember zone: follows the foe row through re-renders/resizes
      FX.setAmbient(() => {
        const fz = document.querySelector('.foe-row');
        if (!fz) return null;
        const r = fz.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height + 160 };
      });
    });
  }

  function renderBattle() {
    screen = 'battle';
    setBattleChrome(true);
    bookmarks([['Grimoire', 'arc', () => renderGrimoireOverlay()]]);
    renderBattleLeft();
    renderBattleRight();
    renderHand();
    renderBattleHud();
    $endTurn.onclick = onEndTurn;
  }

  function statusChips(unit, isPlayer) {
    const chips = [];
    if (unit.block) chips.push(`🛡 ${unit.block}`);
    if (unit.str) chips.push(`💪 +${unit.str}`);
    if (unit.weak) chips.push(`🌀 weak ${unit.weak}`);
    if (unit.vuln) chips.push(`🎯 exposed ${unit.vuln}`);
    if (!isPlayer && unit.blind) chips.push(`🌫 blind ${unit.blind}`);
    if (!isPlayer && unit.poison) chips.push(`☠ ${unit.poison}`);
    if (!isPlayer && unit.burn && unit.burnTurns) chips.push(`🔥 ${unit.burn}×${unit.burnTurns}`);
    if (!isPlayer && unit.stun) chips.push(`💫 stunned`);
    if (isPlayer && unit.thorns) chips.push(`🌵 thorns ${unit.thorns}`);
    if (isPlayer && unit.regen) chips.push(`💚 regen ${unit.regen}`);
    if (isPlayer && unit.insightRune) chips.push(`🔮 +${unit.insightRune}/turn`);
    if (isPlayer && unit.echo) chips.push(`📢 echo +${unit.echo}%`);
    if (isPlayer && unit.twincast) chips.push(`👯 twincast`);
    if (isPlayer && unit.freeGuesses) chips.push(`🗣 free ×${unit.freeGuesses}`);
    if (isPlayer && unit.resonance > 0.351) chips.push(`🔔 resonance ${Math.round(unit.resonance * 100)}%`);
    if (isPlayer && unit.guessCost > 1) chips.push(`🗣 guesses ${unit.guessCost} 💡`);
    return chips.map(c => `<span class="status-chip">${c}</span>`).join('');
  }

  function renderBattleLeft() {
    const b = battle;
    const world = EnemyData.WORLDS[b.world - 1];
    const single = b.enemies.length === 1;
    const anyBig = b.enemies.some(e => e.elite || e.boss);
    $L.innerHTML = `
      <div class="small center">${world.icon} ${world.name} — stage ${b.stage}${anyBig ? (b.enemies[0].boss ? ' · <b>BOSS</b>' : ' · <b>ELITE</b>') : ''}</div>
      <div class="foe-row">${b.enemies.map((e, i) => `
        <div class="foe-box ${single ? 'single' : ''} ${e.hp <= 0 ? 'dead' : (!single && i === b.target ? 'targeted' : '')}" data-idx="${i}">
          <div class="fname">${e.name}</div>
          <div class="foe-art" id="foe-art-${i}">${Bestiary.foe(e.id)}</div>
          <div class="hpbar"><div class="fill" style="width:${100 * e.hp / e.maxHp}%"></div>
            <div class="txt">${e.hp} / ${e.maxHp}</div></div>
          ${e.hp > 0 ? `<div class="intent" title="This foe's intent">${(m => m.icon + ' ' + m.text)(Engine.describeIntent(b, e))}</div>` : '<div class="intent">✝ felled</div>'}
          <div class="statuses">${statusChips(e, false)}</div>
        </div>`).join('')}
      </div>
      ${b.enemies.length > 1 ? '<div class="small center" style="opacity:0.7">Click a foe to aim your strikes ⌖</div>' : ''}
      <div class="you-zone">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>You</b>
          <span class="orb-row">
            <span class="energy-orb" id="energy-orb" title="Energy — cards cost ⚡">⚡ ${b.player.energy}/${b.player.maxEnergy}</span>
            <span class="insight-orb" id="insight-orb" title="Insight — each guess costs 1 · capped at ${Engine.INSIGHT_CAP} · resets each battle">💡 ${b.player.insight}/${Engine.INSIGHT_CAP}</span>
          </span>
        </div>
        <div class="hpbar player" style="margin-top:5px"><div class="fill" style="width:${100 * b.player.hp / b.player.maxHp}%"></div>
          <div class="txt">${b.player.hp} / ${b.player.maxHp}</div></div>
        <div class="statuses">${statusChips(b.player, true)}</div>
        <div class="attune-bar" title="Word-length attunement — cast different lengths for growing boons">
          ${[5, 6, 7, 8, 9, 10].map(l => `<span class="attune-pip ${b.lengthsCast.includes(l) ? 'lit' : ''}">${l}</span>`).join('')}
        </div>
      </div>
      <div id="battle-log">${b._log || ''}</div>`;
    $L.querySelectorAll('.foe-box').forEach(box => {
      box.onclick = () => {
        const i = Number(box.dataset.idx);
        if (b.enemies[i].hp <= 0) return;
        Engine.setTarget(b, i);
        Sfx.key();
        renderBattleLeft();
      };
    });
  }

  function log(html) {
    battle._log = (battle._log || '') + `<div>${html}</div>`;
    const bl = document.getElementById('battle-log');
    if (bl) { bl.innerHTML = battle._log; bl.scrollTop = bl.scrollHeight; }
  }

  function renderBattleRight() {
    const b = battle;
    const w = b.word;
    $R.innerHTML = '';
    const wrap = el('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;height:100%';

    const lens = ClassData.unlockedLengths(meta);
    const lr = el('div', 'wordlen-row');
    [5, 6, 7, 8, 9, 10].forEach(len => {
      const locked = !lens.includes(len);
      const p = el('div', 'len-pill' + (locked ? ' locked' : '') + (b.wordLen === len ? ' selected' : ''), len + 'L');
      p.title = locked ? ClassData.lengthUnlockText(len) : `${WordData.POOLS[len].length} words of this length exist`;
      if (!locked && !b.over) p.onclick = () => {
        if (b.wordLen === len) return;
        run.wordLen = len;
        Sfx.flip();
        Engine.changeWordLength(b, len);
        currentGuess = '';
        processEvents(Engine.drainEvents(b));
        renderBattleRight(); renderBattleLeft();
      };
      lr.appendChild(p);
    });
    wrap.appendChild(lr);

    if (!w) { $R.appendChild(wrap); return; }

    const learnedCount = WordData.POOLS[w.len].filter(x => b.meta.learnedWords.has(x)).length;
    const freeRunes = w.revealed.filter(r => r.free).length;
    wrap.appendChild(el('div', 'small center',
      `The mystery word — ${w.len} runes · grimoire knows ${learnedCount}/${WordData.POOLS[w.len].length}` +
      (freeRunes ? ` · <b>${freeRunes} rune${freeRunes > 1 ? 's' : ''} revealed freely</b>` : '')));

    if (w.vowelInfo) {
      const vh = el('div', 'vowel-hints');
      for (const v of Object.keys(w.vowelInfo)) vh.appendChild(el('span', 'vh ' + w.vowelInfo[v], v));
      wrap.appendChild(vh);
    }

    const grid = el('div', '', ''); grid.id = 'guess-grid';
    grid.style.marginTop = '6px';
    if (w.revealed.length) {
      const rrow = el('div', 'grow');
      for (let i = 0; i < w.len; i++) {
        const r = w.revealed.find(x => x.i === i);
        rrow.appendChild(el('div', 'tile sm' + (r ? ' revealed' : ''), r ? r.c : '·'));
      }
      grid.appendChild(rrow);
    }
    const sm = w.len > 7 ? ' sm' : '';
    w.guesses.forEach(g => {
      const row = el('div', 'grow');
      for (let i = 0; i < w.len; i++) row.appendChild(el('div', 'tile' + sm + ' ' + g.marks[i], g.word[i]));
      grid.appendChild(row);
    });
    const irow = el('div', 'grow'); irow.id = 'input-row';
    for (let i = 0; i < w.len; i++) {
      irow.appendChild(el('div', 'tile input' + sm, currentGuess[i] || ''));
    }
    grid.appendChild(irow);
    wrap.appendChild(grid);

    const gb = el('div', 'center', '');
    gb.style.marginTop = '7px';
    const canG = Engine.canGuess(b);
    const btn = el('button', 'arcane small-btn',
      b.player.freeGuesses > 0 ? '🗣 Speak (free guess)'
        : `🗣 Speak the Word (${b.player.guessCost} 💡)${b.player.guessCost > 1 ? ' ⬆' : ''}`);
    if (b.player.guessCost > 1) btn.title = 'Each correct guess this turn raises the cost of further guesses';
    btn.disabled = !canG || currentGuess.length !== w.len;
    btn.id = 'guess-btn';
    btn.onclick = submitGuess;
    gb.appendChild(btn);
    const scryBtn = el('button', 'ghost small-btn scry-btn', `🔮 Scry ×${b.player.scryLeft}`);
    scryBtn.disabled = !Engine.canScry(b);
    scryBtn.title = 'Free: ask whether one letter is in the word (resets each turn)';
    scryBtn.style.marginLeft = '8px';
    scryBtn.onclick = scryModal;
    gb.appendChild(scryBtn);
    if (!canG) gb.appendChild(el('div', 'small', 'No insight — play cards to gain 💡'));
    wrap.appendChild(gb);

    wrap.appendChild(renderKeyboard());
    $R.appendChild(wrap);
  }

  function scryModal() {
    const b = battle;
    if (!Engine.canScry(b)) return;
    const w = b.word;
    const m = overlayPanel(`<div class="rune-title">🔮 Scry a Rune</div>
      <p class="small center">Ask the tome whether one letter dwells within the word. Free — ${b.player.scryLeft} left this turn.</p>`);
    const kb = el('div'); kb.id = 'kb';
    ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].forEach(rowStr => {
      const row = el('div', 'krow');
      rowStr.split('').forEach(ch => {
        const known = w.knownAbsent.includes(ch) || (w.vowelInfo && w.vowelInfo[ch]) ||
          w.revealed.some(r => r.c === ch) ||
          w.guesses.some(g => g.word.includes(ch));
        const k = el('button', 'key' + (known ? ' absent' : ''), ch);
        k.disabled = known;
        k.onclick = () => {
          m.close();
          const res = Engine.scry(b, ch);
          Sfx.scry();
          processEvents(Engine.drainEvents(b));
          renderBattleRight();
          toast(res.present ? `🔮 <b>${ch}</b> dwells within the word!` : `🔮 <b>${ch}</b> is absent.`);
        };
        row.appendChild(k);
      });
      kb.appendChild(row);
    });
    m.p.appendChild(kb);
    const cancel = el('button', 'ghost small-btn', 'Not now');
    cancel.style.cssText = 'display:block;margin:12px auto 0';
    cancel.onclick = m.close;
    m.p.appendChild(cancel);
  }

  function keyState(b) {
    const st = {};
    const w = b.word;
    if (!w) return st;
    w.knownAbsent.forEach(c => st[c] = 'absent');
    w.guesses.forEach(g => {
      for (let i = 0; i < g.word.length; i++) {
        const c = g.word[i], m = g.marks[i];
        if (m === 'correct') st[c] = 'correct';
        else if (m === 'present' && st[c] !== 'correct') st[c] = 'present';
        else if (m === 'absent' && !st[c]) st[c] = 'absent';
      }
    });
    w.revealed.forEach(r => st[r.c] = 'correct');
    return st;
  }

  function renderKeyboard() {
    const st = keyState(battle);
    const kb = el('div'); kb.id = 'kb';
    ['QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫'].forEach(rowStr => {
      const row = el('div', 'krow');
      rowStr.split('').forEach(ch => {
        if (ch === '⏎') {
          const k = el('button', 'key wide', 'CAST');
          k.onclick = submitGuess;
          row.appendChild(k); return;
        }
        if (ch === '⌫') {
          const k = el('button', 'key wide', '⌫');
          k.onclick = () => { currentGuess = currentGuess.slice(0, -1); refreshInputRow(); };
          row.appendChild(k); return;
        }
        const k = el('button', 'key ' + (st[ch] || ''), ch);
        if (battle.word && battle.word.vowelInfo && battle.word.vowelInfo[ch] === 'present' && st[ch] !== 'correct') {
          k.classList.add('vowel-present');
        }
        k.onclick = () => typeLetter(ch);
        row.appendChild(k);
      });
      kb.appendChild(row);
    });
    return kb;
  }

  function typeLetter(ch) {
    if (!battle || !battle.word || battle.over || modalOpen) return;
    if (currentGuess.length >= battle.word.len) return;
    currentGuess += ch;
    Sfx.key();
    refreshInputRow();
  }

  function refreshInputRow() {
    const w = battle && battle.word;
    if (!w) return;
    const irow = document.getElementById('input-row');
    if (irow) {
      Array.from(irow.children).forEach((t, i) => { t.textContent = currentGuess[i] || ''; });
    }
    const btn = document.getElementById('guess-btn');
    if (btn) btn.disabled = !Engine.canGuess(battle) || currentGuess.length !== w.len;
  }

  function submitGuess() {
    const b = battle;
    if (!b || !b.word || b.over || modalOpen) return;
    if (currentGuess.length !== b.word.len) return;
    if (!Engine.canGuess(b)) { toast('No insight left — play cards to gain 💡'); return; }
    const res = Engine.guess(b, currentGuess);
    currentGuess = '';
    if (!res.ok) { toast('The tome rejects it'); return; }
    Sfx.tile();
    if (!res.correct) setTimeout(() => Sfx.wrong(), 260);
    processEvents(Engine.drainEvents(b));
    renderBattleLeft(); renderBattleRight(); renderHand(); renderBattleHud();
    if (b.over) finishBattle();
  }

  /* ---------- hand & cards ---------- */
  function renderCardEl(view, affordable) {
    const RAR_ICON = { common: '◦', uncommon: '◆', rare: '★', legendary: '👑' };
    const c = el('div', `card rar-${view.rarity}` + (view.upgraded ? ' upgraded' : '') + (view.token ? ' token' : '')
      + (affordable === false ? ' unaffordable' : ''), `
      <div class="ccost">${view.cost != null ? view.cost : ''}</div>
      <div class="crar">${RAR_ICON[view.rarity]}</div>
      <div class="cname">${view.name}</div>
      <div class="cdesc">${view.desc}</div>
      <div class="cflavor">${view.flavor || ''}</div>`);
    return c;
  }

  function renderHand() {
    $hand.innerHTML = '';
    if (!battle || battle.over) return;
    const n = battle.hand.length;
    battle.hand.forEach((card, i) => {
      const view = Engine.cardView(card);
      const afford = Engine.canAfford(battle, card);
      const c = renderCardEl(view, afford);
      const mid = (n - 1) / 2;
      c.style.setProperty('--fan-r', (i - mid) * 4);
      c.style.setProperty('--fan-y', Math.abs(i - mid) * 7);
      if (COARSE_POINTER) {
        // touch: first tap raises the card to read it, second tap plays it
        c.onclick = () => {
          if (!c.classList.contains('inspect')) {
            $hand.querySelectorAll('.card.inspect').forEach(x => x.classList.remove('inspect'));
            c.classList.add('inspect');
            Sfx.key();
            return;
          }
          c.classList.remove('inspect');
          onPlayCard(card, c);
        };
      } else {
        c.onclick = () => onPlayCard(card, c);
      }
      $hand.appendChild(c);
    });
  }

  function renderBattleHud() {
    if (!battle) return;
    $bhud.innerHTML = `
      <span class="stat" style="color:#f0e2c4">🃏 ${battle.drawPile.length}|${battle.discard.length}</span>
      <span class="stat" style="color:#f0e2c4">🪙 ${run.gold + battle.goldGained}</span>
      ${run.relics.map(id => `<span class="stat" title="${RelicData.BY_ID[id].name} — ${RelicData.BY_ID[id].desc}">${RelicData.BY_ID[id].icon}</span>`).join('')}`;
  }

  function onPlayCard(card, elem) {
    const b = battle;
    if (b.over || modalOpen) return;
    if (!Engine.canAfford(b, card)) { toast(`Needs ${card.cost} ⚡ — end the turn to refresh`); Sfx.wrong(); return; }
    if (card.fx.castTome) { castTomeModal(card); return; }
    elem.classList.add('playing');
    Sfx.card();
    const from = centerOf(elem);
    setTimeout(() => {
      const res = Engine.playCard(b, card.inst);
      if (!res.ok) { renderHand(); return; }
      FX.burst(from.x, from.y, { count: 10, colors: ['#e8d9b0', '#c9a227'], speed: 3 });
      processEvents(Engine.drainEvents(b));
      renderBattleLeft(); renderBattleRight(); renderHand(); renderBattleHud();
      if (b.over) finishBattle();
    }, 220);
  }

  function castTomeModal(card) {
    const b = battle;
    const learned = Array.from(b.meta.learnedWords).sort((a, z) => a.length - z.length || (a < z ? -1 : 1));
    if (!learned.length) { toast('Your grimoire holds no words yet'); return; }
    if (!Engine.canAfford(b, card)) { toast(`Needs ${card.cost} ⚡`); return; }
    const m = overlayPanel(`<div class="rune-title">📜 ${card.name}</div>
      <p class="small center">Choose an engraved word to cast. Cost: word length − 4 💡
      ${(card.fx.castDiscount || b.player.castDiscount) ? ` (−${(card.fx.castDiscount || 0) + b.player.castDiscount} discount)` : ''}
      · You hold 💡 ${b.player.insight}</p>`);
    const list = el('div');
    list.style.cssText = 'max-height:420px;overflow-y:auto';
    learned.forEach(wd => {
      const spell = WordData.SPELLS[wd];
      const cost = Math.max(0, wd.length - 4 - (card.fx.castDiscount || 0) - b.player.castDiscount);
      const afford = b.player.insight >= cost;
      const school = WordData.SCHOOLS[spell.school];
      const row = el('div', 'spell-row' + (afford ? ' clickable' : ' unknown'), `
        <span>${spell.icon}</span><span class="sw">${wd}${b.meta.discoveredPower.has(wd) ? ' <span class="powmark">⚡</span>' : ''}</span>
        <span class="school-chip">${school.icon} ${school.name}</span>
        <span class="sd">${spell.name} — ${spell.desc}</span>
        <b>${cost} 💡</b>`);
      if (afford) row.onclick = () => {
        m.close();
        const res = Engine.playCard(b, card.inst, { tomeWord: wd });
        if (!res.ok) { toast('The casting fizzles'); return; }
        processEvents(Engine.drainEvents(b));
        renderBattleLeft(); renderBattleRight(); renderHand(); renderBattleHud();
        if (b.over) finishBattle();
      };
      list.appendChild(row);
    });
    m.p.appendChild(list);
    const cancel = el('button', 'ghost small-btn', 'Close the tome');
    cancel.style.cssText = 'display:block;margin:10px auto 0';
    cancel.onclick = m.close;
    m.p.appendChild(cancel);
  }

  function onEndTurn() {
    const b = battle;
    if (!b || b.over || modalOpen) return;
    Sfx.flip();
    Engine.endTurn(b);
    currentGuess = '';
    processEvents(Engine.drainEvents(b));
    renderBattleLeft(); renderBattleRight(); renderHand(); renderBattleHud();
    if (b.over) finishBattle();
  }

  /* ---------- event animation ---------- */
  function processEvents(evts) {
    const orb = () => centerOf(document.getElementById('insight-orb'));
    const eorb = () => centerOf(document.getElementById('energy-orb'));
    const me = () => centerOf(document.querySelector('.you-zone'));
    let delay = 0;
    const later = (fn, add) => { setTimeout(fn, delay); delay += (add == null ? 90 : add); };
    evts.forEach(ev => {
      switch (ev.type) {
        case 'wordServed':
          later(() => log(`📖 A ${ev.len}-rune mystery word appears${ev.freeLetters ? ` — ${ev.freeLetters === 1 ? 'one rune shines' : ev.freeLetters + ' runes shine'} freely (length mastered)` : ''}.`));
          break;
        case 'autocast':
          later(() => {
            const s = WordData.SPELLS[ev.word];
            log(`🔔 Your guess resonates — <span class="bl-spell">${ev.word}</span> was the word, and its engraving fires itself! (${s.name})`);
            toast(`🔔 Resonance! <b>${ev.word}</b> casts itself from its engraving`);
            Sfx.autocast();
            const wp = centerOf(document.getElementById('guess-grid'));
            FX.runes(wp.x, wp.y - 20, ev.word, { color: '#a887ff' });
          }, 320);
          break;
        case 'spellCast':
          later(() => {
            const mult = ev.mult !== 1 ? ` <b>×${Math.round(ev.mult * 100) / 100}</b>` : '';
            const school = WordData.SCHOOLS[ev.school];
            log(`✨ <span class="bl-spell">${ev.word}</span> — ${ev.spell}${mult}${ev.casts > 1 ? ' (twice!)' : ''}${ev.firstGuess ? ' — first-guess brilliance!' : ''}${ev.combo ? ` · ${school.icon} combo` : ''}`);
            Sfx.spell(ev.school);
            const fp = foeCenter(battle ? battle.target : 0);
            FX.runes(fp.x, fp.y - 30, ev.word, { color: ev.power ? '#ffd700' : (ev.sig ? '#6ec1ff' : '#a887ff') });
            if (ev.firstGuess) { Sfx.correct(); toast(`🌟 First guess! <b>${ev.word}</b> surges at ×${Math.round(ev.mult * 100) / 100}`); }
            if (ev.combo) toast(`${school.icon} <b>${school.name} combo!</b> ${school.combo.split(':')[0]} deepens`, 2200);
          }, 260);
          break;
        case 'powerDiscovered':
          later(() => {
            log(`⚡⚡ <span class="bl-spell">${ev.word}</span> is a <b>WORD OF POWER</b> — it casts at twice its strength!`);
            toast(`⚡ <b>${ev.word}</b> is a Word of Power! ×2 forevermore`, 4200);
            Sfx.power();
            const fp = foeCenter(battle ? battle.target : 0);
            FX.powerNova(fp.x, fp.y);
          }, 500);
          break;
        case 'wordLearned':
          later(() => {
            log(`📜 <span class="bl-good">${ev.word}</span> joins your grimoire — its runes are engraved upon you.`);
            absorbBattleMeta(battle);
          });
          break;
        case 'attune':
          later(() => {
            const bits = [];
            if (ev.bonus.insight) bits.push(`+${ev.bonus.insight} 💡`);
            if (ev.bonus.energyMax) bits.push(`+${ev.bonus.energyMax} max ⚡`);
            if (ev.bonus.energyNow) bits.push(`+${ev.bonus.energyNow} ⚡`);
            if (ev.bonus.str) bits.push(`+${ev.bonus.str} might`);
            if (ev.chalice) bits.push(`+${ev.chalice} ⚡ (chalice)`);
            log(`🎼 <b>Attunement ${ev.tier}</b> — ${ev.tier} word-lengths woven: ${bits.join(', ')}`);
            toast(`🎼 Attunement ×${ev.tier}! ${bits.join(' · ')}`, 2600);
            Sfx.attune();
          }, 240);
          break;
        case 'scry':
          later(() => log(`🔮 Scry: <b>${ev.letter}</b> ${ev.present ? 'dwells within' : 'is absent'}.`));
          break;
        case 'guessCostUp':
          later(() => log(`🗣 The tome demands more — further guesses cost <b>${ev.cost} 💡</b> this turn.`));
          break;
        case 'enemyHit':
          later(() => {
            const p = foeCenter(ev.idx);
            FX.slash(p.x, p.y, { color: ev.tag === 'spell' ? '#a887ff' : '#fff' });
            floatText(p.x + (Math.random() * 40 - 20), p.y - 20, '-' + ev.amount, '#ff8a5c');
            Sfx.hit();
            const g = document.getElementById('foe-art-' + ev.idx);
            if (g) { g.classList.remove('hit'); void g.offsetWidth; g.classList.add('hit'); }
          }, 150);
          break;
        case 'enemyDown':
          later(() => {
            const p = foeCenter(ev.idx);
            FX.burst(p.x, p.y, { count: 30, colors: ['#8a8578', '#3a2c1a', '#c9a227'], speed: 6 });
            log(`✝ <b>${ev.name}</b> is felled.`);
          }, 250);
          break;
        case 'enemyMiss':
          later(() => {
            const p = foeCenter(ev.idx);
            floatText(p.x, p.y - 10, 'miss 🌫', '#cdb4ff');
            log('Blinded, the foe strikes only shadows.');
          }, 150);
          break;
        case 'dot':
          later(() => {
            const p = foeCenter(ev.idx);
            floatText(p.x, p.y - 10, `-${ev.amount} ${ev.kind === 'poison' ? '☠' : '🔥'}`,
              ev.kind === 'poison' ? '#7fbf5f' : '#ff9a3c');
            FX.burst(p.x, p.y, { count: 12, colors: ev.kind === 'poison' ? ['#7fbf5f', '#4a7a34'] : ['#ff9a3c', '#ff5c2c'], speed: 3 });
          }, 180);
          break;
        case 'playerHit':
          later(() => {
            const p = me();
            floatText(p.x, p.y, '-' + ev.hpLoss, '#ff5c5c');
            if (ev.hpLoss > 0) { shakeTome(); Sfx.hit(); log(`<span class="bl-hurt">You suffer ${ev.hpLoss}.</span>`); }
            else { Sfx.block(); log('Your ward absorbs the blow.'); }
            FX.burst(p.x, p.y, { count: 12, colors: ['#a2352c', '#ff8a5c'], speed: 4 });
          }, 180);
          break;
        case 'block':
          later(() => { const p = me(); FX.shield(p.x, p.y); });
          break;
        case 'heal':
          later(() => { const p = me(); FX.heal(p.x, p.y); floatText(p.x, p.y, '+' + ev.amount, '#5fbf6d'); });
          break;
        case 'insight':
          later(() => { const p = orb(); FX.burst(p.x, p.y, { count: 8, colors: ['#a887ff', '#cdb4ff'], speed: 2.5, gravity: -0.03 }); });
          break;
        case 'energy':
        case 'energyMax':
          later(() => {
            const p = eorb();
            FX.burst(p.x, p.y, { count: 10, colors: ['#ffe9a8', '#ffb347'], speed: 3, gravity: -0.03 });
            Sfx.energy();
            if (ev.type === 'energyMax') { log(`⚡ Your reserves swell — max energy +${ev.amount}!`); }
          });
          break;
        case 'reveal':
          later(() => { log(`👁 A rune reveals itself: <b>${ev.c}</b> (position ${ev.i + 1}).`); });
          break;
        case 'vowels':
          later(() => log('👁 The vowels of the word shimmer into view.'));
          break;
        case 'relicStun':
          later(() => { const p = foeCenter(ev.idx); floatText(p.x, p.y, '🌩️ 💫', '#cdb4ff'); log('🌩️ The jar rattles — lightning pins the foe!'); });
          break;
        case 'enemyAct':
          later(() => {
            const g = document.getElementById('foe-art-' + ev.idx);
            if (g) { g.classList.remove('acting'); void g.offsetWidth; g.classList.add('acting'); }
          }, 220);
          break;
        case 'enemyStunned':
          later(() => { const p = foeCenter(ev.idx); floatText(p.x, p.y, '💫 stunned', '#cdb4ff'); log('A foe reels, stunned — it forfeits its move.'); });
          break;
        case 'leeched':
          later(() => { const p = orb(); floatText(p.x, p.y, `-${ev.amount} 💡`, '#cdb4ff'); log(`<span class="bl-hurt">It leeches ${ev.amount} insight from your mind.</span>`); });
          break;
        case 'thorns':
          later(() => { const p = foeCenter(ev.idx); floatText(p.x, p.y, `-${ev.amount} 🌵`, '#9fce6a'); });
          break;
        case 'gold':
          later(() => {
            const p = me(); floatText(p.x, p.y, `+${ev.amount} 🪙`, '#ffd700'); Sfx.coin();
            if (ev.why === 'attunement') log(`🎼 Attunement spoils: +${ev.amount} aurum.`);
          });
          break;
        case 'turnStart':
          later(() => log(`— <i>Turn ${ev.turn}</i> —`));
          break;
        case 'victory':
          later(() => { FX.confetti(); Sfx.victory(); }, 300);
          break;
        case 'defeat':
          later(() => { shakeTome(); Sfx.defeat(); }, 300);
          break;
      }
    });
  }

  /* ---------- battle end ---------- */
  function finishBattle() {
    const b = battle;
    absorbBattleMeta(b);
    run.maxHp = b.player.maxHp;
    run.gold += b.goldGained;
    if (b.won) {
      run.hp = b.player.hp;
      setTimeout(() => renderVictoryRewards(), 900);
    } else {
      setTimeout(() => renderGameOver(false), 1100);
    }
  }

  function renderVictoryRewards() {
    const b = battle;
    const node = b._node;
    const rng = runRng();
    const diff = ClassData.DIFFICULTIES[run.difficulty];
    const kind = node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'battle';
    let gold = EnemyData.goldReward(run.world, kind, diff, rng);
    gold = Math.round(gold * (1 + RelicData.mod(run.relics, 'aurumPct') / 100));
    run.gold += gold;
    const RR = Engine.RUN_RULES;
    const healPct = kind === 'boss' ? RR.bossHealMissingPct : RR.postBattleHealMissingPct;
    let healed = Math.round((run.maxHp - run.hp) * healPct);
    run.hp = Math.min(run.maxHp, run.hp + healed);
    const relicHeal = RelicData.mod(run.relics, 'healAfterBattle');
    if (relicHeal) { const h2 = Math.min(relicHeal, run.maxHp - run.hp); run.hp += h2; healed += h2; }

    const bonus = kind === 'boss' ? 0.7 : kind === 'elite' ? 0.35 : 0;
    const offers = Engine.rollCardRewards(rng, metaForEngine(), bonus);
    const names = b.enemies.map(e => e.name).join(' & ');

    const m = overlayPanel(`<div class="rune-title">🏆 ${names} Defeated</div>
      <p class="center">Spoils: <b>${gold} aurum</b>${healed ? ` · you mend <b>${healed} HP</b>` : ''}</p>
      <p class="center small">Bind one card into your deck${kind !== 'battle' ? ' — richer spoils from a worthy foe' : ''}:</p>`);
    m.p.appendChild(cardChoiceRow(offers, m, () => afterBattleRelic(kind, rng)));
    const skip = el('button', 'ghost small-btn', 'Leave them — travel on');
    skip.style.cssText = 'display:block;margin:8px auto 0';
    skip.onclick = () => { m.close(); afterBattleRelic(kind, rng); };
    m.p.appendChild(skip);
    battle = null;
    setBattleChrome(false);
    FX.setAmbient(null);
  }

  function afterBattleRelic(kind, rng) {
    if (kind === 'elite') {
      const drops = RelicData.roll(rng, run.relics, 1);
      if (drops.length) grantRelic(drops[0], 'wrested from the elite');
    }
    afterBattleContinue();
  }

  function afterBattleContinue() {
    const pos = run.pos;
    if (pos && pos.stage === 6) {
      if (run.world >= 5) { winRun(); return; }
      run.world++;
      toast(`📖 The page turns… World ${run.world}: ${EnemyData.WORLDS[run.world - 1].name}`, 3400);
      meta.bestWorld = Math.max(meta.bestWorld, run.world);
      SaveSystem.saveMeta(meta);
      newWorldMap();
    }
    SaveSystem.saveRun(run);
    flipTo(renderMap);
  }

  function winRun() {
    const diff = run.difficulty;
    meta.totalWins++;
    meta.winsByDifficulty[diff] = (meta.winsByDifficulty[diff] || 0) + 1;
    meta.bestDifficultyWin = Math.max(meta.bestDifficultyWin, diff);
    meta.classWins[run.classId] = (meta.classWins[run.classId] || 0) + 1;
    SaveSystem.saveMeta(meta);
    renderGameOver(true);
  }

  function shareText(won) {
    const cls = ClassData.CLASSES.find(c => c.id === run.classId);
    const worlds = ['🌲', '🕯️', '🌋', '🌑', '✨'];
    const prog = worlds.map((w, i) => {
      const wn = i + 1;
      if (run.world > wn || won) return w;
      if (run.world === wn) return '💀';
      return '⬜';
    }).join('');
    return `📖 Lexicon Arcanum — Daily ${run.daily}\n${prog} ${won ? 'VICTORIOUS' : `fell in W${run.world}-${run.pos ? run.pos.stage : 1}`}\n${cls.icon} ${cls.name} · 📜 ${meta.learnedWords.length}/180 · 🏺 ${run.relics.length} relics`;
  }

  function renderGameOver(won) {
    const wasDaily = run && run.daily;
    const share = wasDaily ? shareText(won) : null;
    battle = null;
    setBattleChrome(false);
    FX.setAmbient(null);
    SaveSystem.clearRun();
    flipTo(() => {
      screen = 'gameover'; bookmarks([]);
      $L.innerHTML = `
        <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;text-align:center">
          <div style="font-size:70px">${won ? '👑' : '🕯️'}</div>
          <h1 style="font-size:30px">${won ? 'The Final Word Is Yours' : 'The Candle Gutters'}</h1>
          <p class="small" style="max-width:300px;margin-top:10px">
            ${won ? 'You have silenced THE AUTHOR and closed the fifth world. New powers stir in the Lexicon…'
                  : 'Your body fails — but words, once learned, are never unlearned. The grimoire remembers.'}
          </p>
        </div>`;
      $R.innerHTML = '';
      const right = el('div', '', `
        <div class="rune-title">The Grimoire Endures</div>
        <div class="small" style="line-height:2">
          📜 Words engraved: <b>${meta.learnedWords.length} / 180</b><br>
          ⚡ Words of Power found: <b>${meta.discoveredPower.length} / 6</b><br>
          🏆 Total victories: <b>${meta.totalWins}</b><br>
          ${wonUnlockNotes(won)}
        </div>`);
      if (share) {
        right.appendChild(el('div', 'share-box', share.replace(/\n/g, '<br>')));
        const copy = el('button', 'small-btn', '📋 Copy result');
        copy.onclick = () => {
          (navigator.clipboard ? navigator.clipboard.writeText(share) : Promise.reject())
            .then(() => toast('Copied — go gloat'))
            .catch(() => toast('Select and copy the text above'));
        };
        right.appendChild(copy);
      }
      const again = el('button', 'arcane', 'Return to the Cover');
      again.style.cssText = 'display:block;margin:16px auto 0;font-size:17px;padding:12px 26px';
      again.onclick = () => { run = null; flipTo(renderTitle); };
      right.appendChild(again);
      $R.appendChild(right);
      if (won) FX.confetti();
    });
  }

  function wonUnlockNotes(won) {
    if (!won) return '';
    const notes = [];
    const lens = ClassData.unlockedLengths(meta);
    if (lens.includes(8)) notes.push('🔓 8-letter words available');
    if (lens.includes(9)) notes.push('🔓 9-letter tide-changers available');
    if (lens.includes(10)) notes.push('🔓 10-letter ultimate words available');
    const arch = ClassData.CLASSES.find(c => c.id === 'archivist');
    if (ClassData.classUnlocked(arch, meta)) notes.push('🔓 THE ARCHIVIST awaits');
    ClassData.DIFFICULTIES.forEach(d => {
      if (d.unlock && ClassData.difficultyUnlocked(d, meta)) notes.push(`🔓 ${d.name} difficulty open`);
    });
    return notes.join('<br>');
  }

  /* ============================================================
   * FORGE
   * ============================================================ */
  function renderForgeOverlay() {
    if (screen === 'battle') { toast('The forge cannot hear you over the battle'); return; }
    const upCost = Engine.FORGE.upgradeCost(run.upgrades);
    const rmCost = Engine.FORGE.removeCost(run.removals);
    const m = overlayPanel(`<div class="rune-title">⚒️ The Arcane Forge</div>
      <p class="center small">Aurum: <b>🪙 ${run.gold}</b> · Upgrade: <b>${upCost}</b> · Unbind: <b>${rmCost}</b></p>`);
    const list = el('div');
    list.style.cssText = 'max-height:420px;overflow-y:auto;min-width:640px';
    run.deck.forEach((c, i) => {
      const def = CardData.BY_ID[c.id];
      const fx = c.upgraded ? CardData.upgradedFx(def.fx) : def.fx;
      const row = el('div', 'forge-card-row', `
        <span class="fname">${def.name}${c.upgraded ? ' <span style="color:var(--arcane)">+</span>' : ''} <span class="small">${def.cost}⚡</span></span>
        <span class="fdesc">${CardData.describeFx(fx)}</span>`);
      if (!c.upgraded) {
        const up = el('button', 'small-btn', `⚒️ ${upCost}`);
        up.disabled = run.gold < upCost;
        up.title = 'Upgrade: ' + CardData.describeFx(CardData.upgradedFx(def.fx));
        up.onclick = () => {
          run.gold -= Engine.FORGE.upgradeCost(run.upgrades);
          run.upgrades++; c.upgraded = true;
          SaveSystem.saveRun(run);
          Sfx.relic();
          FX.burst(window.innerWidth / 2, window.innerHeight / 2, { colors: ['#ffd700', '#ff9a3c'], count: 30 });
          m.close(); renderForgeOverlay();
        };
        row.appendChild(up);
      }
      if (run.deck.length > 5) {
        const rm = el('button', 'small-btn ghost', `🗑 ${rmCost}`);
        rm.disabled = run.gold < rmCost;
        rm.style.color = 'var(--blood)';
        rm.onclick = () => {
          run.gold -= Engine.FORGE.removeCost(run.removals);
          run.removals++; run.deck.splice(i, 1);
          SaveSystem.saveRun(run);
          Sfx.card();
          m.close(); renderForgeOverlay();
        };
        row.appendChild(rm);
      }
      list.appendChild(row);
    });
    m.p.appendChild(list);
    const done = el('button', '', 'Bank the coals');
    done.style.cssText = 'display:block;margin:12px auto 0';
    done.onclick = () => { m.close(); renderMap(); };
    m.p.appendChild(done);
  }

  /* ============================================================
   * GRIMOIRE
   * ============================================================ */
  let grimTab = 5;
  function renderGrimoireOverlay() {
    const learned = new Set(meta.learnedWords);
    if (battle) battle.meta.learnedWords.forEach(w => learned.add(w));
    const discovered = new Set(meta.discoveredPower);
    const lens = ClassData.unlockedLengths(meta);

    const m = overlayPanel(`<div class="rune-title">📖 Your Grimoire</div>`);
    m.p.style.minWidth = '720px';
    const tabs = el('div', 'tab-row');
    [5, 6, 7, 8, 9, 10].forEach(len => {
      const locked = !lens.includes(len);
      const pool = WordData.POOLS[len];
      const known = pool.filter(w => learned.has(w)).length;
      const t = el('div', 'tab' + (grimTab === len ? ' selected' : '') + (locked ? ' locked' : ''),
        `${len}L · ${known}/${pool.length}`);
      if (!locked) t.onclick = () => { m.close(); grimTab = len; renderGrimoireOverlay(); };
      else t.title = ClassData.lengthUnlockText(len);
      tabs.appendChild(t);
    });
    m.p.appendChild(tabs);

    const list = el('div');
    list.style.cssText = 'max-height:400px;overflow-y:auto';
    const pool = WordData.POOLS[grimTab];
    let unknownCount = 0;
    pool.forEach(w => {
      if (learned.has(w)) {
        const s = WordData.SPELLS[w];
        const school = WordData.SCHOOLS[s.school];
        list.appendChild(el('div', 'spell-row', `
          <span>${s.icon}</span>
          <span class="sw">${w}${discovered.has(w) ? ' <span class="powmark" title="Word of Power — casts at ×2">⚡</span>' : ''}</span>
          <span class="school-chip" title="${school.combo}">${school.icon} ${school.name}</span>
          <span class="sd">${s.name} — ${s.desc}${s.note ? ` · <i>${s.note}</i>` : ''}</span>`));
      } else unknownCount++;
    });
    if (unknownCount) {
      list.appendChild(el('div', 'spell-row unknown', `
        <span>❔</span><span class="sw">${'·'.repeat(grimTab)}</span>
        <span class="sd">${unknownCount} word${unknownCount > 1 ? 's' : ''} of ${grimTab} runes still elude${unknownCount > 1 ? '' : 's'} you. Guess them in battle to engrave them forever.</span>`));
    }
    m.p.appendChild(list);
    m.p.appendChild(el('p', 'small center',
      '🔔 Each guess has a 35% chance (boostable) to make a <b>known</b> mystery word fire itself from its engraving. ' +
      'Casting several words of one <b>school</b> in a battle triggers combos; ' +
      'weaving many <b>lengths</b> attunes you for insight and ⚡.' +
      (discovered.size ? ' · ⚡ marks Words of Power (×2)' : '')));
    const done = el('button', '', 'Close the grimoire');
    done.style.cssText = 'display:block;margin:10px auto 0';
    done.onclick = m.close;
    m.p.appendChild(done);
  }

  /* ---------- physical keyboard ---------- */
  window.addEventListener('keydown', (e) => {
    if (screen !== 'battle' || !battle || battle.over || modalOpen) return;
    if (e.key === 'Enter') { submitGuess(); return; }
    if (e.key === 'Backspace') { currentGuess = currentGuess.slice(0, -1); refreshInputRow(); return; }
    const k = e.key.toUpperCase();
    if (/^[A-Z]$/.test(k)) typeLetter(k);
  });

  /* ---------- debug hook (only with ?debug in URL; used by smoke tests) ---------- */
  if (location.search.includes('debug')) {
    window.LexDebug = {
      get battle() { return battle; }, get run() { return run; }, get meta() { return meta; },
      forceWin() {
        if (!battle || battle.over) return;
        battle.enemies.forEach(e => e.hp = 0);
        battle.over = true; battle.won = true;
        finishBattle();
      },
      learnAll(len) {
        WordData.POOLS[len].forEach(w => { if (!meta.learnedWords.includes(w)) meta.learnedWords.push(w); });
        SaveSystem.saveMeta(meta);
      },
    };
  }

  /* ---------- boot ---------- */
  renderTitle();
})();
