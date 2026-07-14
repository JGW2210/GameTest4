/* ============================================================
 * WORDLOOM — UI. One screen at a time, no page machinery:
 * title → run strip → battle (loom + mystery) → rewards → camp → end.
 * ============================================================ */
(function () {
  const $screen = document.getElementById('screen');
  const $hud = document.getElementById('hud');
  const $toast = document.getElementById('toast');

  let meta = LoomSave.load();
  let run = null;
  let battle = null;
  let picked = [];      // tile ids composing the spell being built

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

  function hud() {
    const notes = meta.parts.size;
    const readable = Morph.readableCount(meta.parts);
    $hud.innerHTML = run
      ? `<span>🖋 ink <b>${run.hp}/${run.maxHp}</b></span><span>✒️ notes <b>${notes}</b>/64</span><span title="words your notes can read">📖 reads <b>${readable}</b>/270</span><span>🪡 loom <b>${run.traySize}</b></span>`
      : `<span>✒️ notes <b>${notes}</b>/64</span><span title="words your notes can read">📖 reads <b>${readable}</b>/270 words</span><span>🏆 wins <b>${meta.wins}</b>/${meta.runs} runs</span>`;
  }

  /* ================= title ================= */
  function renderTitle() {
    hud();
    $screen.innerHTML = '';
    const w = el('div', 'title-wrap');
    w.appendChild(el('h1', null, 'WORDLOOM'));
    w.appendChild(el('div', 'title-sub', 'Deduce the words you do not know. Spell the words you do.<br>Everything you learn is yours forever.'));
    w.appendChild(el('div', 'ladder', 'IGNA · IGNUS · IGNIUS · IGNIORA · IGNIAROS · IGNIORUSA · <b>IGNIORARIS</b>'));
    const start = el('button', 'arcane', meta.runs ? '⚔ Weave a new run' : '⚔ Take up the needle');
    start.style.cssText = 'font-size:19px;padding:12px 34px;margin-top:24px';
    start.onclick = startRun;
    w.appendChild(start);
    const row = el('div', null, '');
    row.style.marginTop = '16px';
    const g = el('button', 'quiet', '📖 Open the grimoire');
    g.onclick = () => renderGrimoire(renderTitle);
    row.appendChild(g);
    const guide = el('button', 'quiet', '🪡 How the language works');
    guide.onclick = () => renderPrimer();
    row.appendChild(guide);
    const wh = el('button', 'quiet', '🌬 whisper to the loom');
    wh.onclick = () => renderWhisper();
    row.appendChild(wh);
    if (meta.runs) {
      const wipe = el('button', 'quiet', '⚠ forget everything');
      wipe.onclick = () => { if (confirm('Unlearn every word? This cannot be undone.')) { LoomSave.wipe(); meta = LoomSave.load(); renderTitle(); } };
      row.appendChild(wipe);
    }
    w.appendChild(row);
    $screen.appendChild(w);
  }

  function renderPrimer() {
    $screen.innerHTML = `
      <h2>🪡 The Loom-Tongue, briefly</h2>
      <p class="small" style="margin-top:8px">Every spell is a word assembled by rule. Learn the parts and you can read words you have never seen.</p>
      <div class="guide" style="margin-top:10px"><table>
        <tr><th></th><th>root</th><th>small</th><th>medium</th><th>large</th><th>binds with</th></tr>
        ${Morph.ELEMENTS.map(e => `<tr><td>${e.icon} ${e.name}</td><td class="mono">${e.root}</td><td class="mono">-${e.small}</td><td class="mono">-${e.medium}</td><td class="mono">-${e.large}</td><td class="mono">${e.longRoot ? e.root + '→' + e.longRoot : e.root + '+' + e.conn}</td></tr>`).join('')}
      </table></div>
      <p class="small" style="margin-top:10px"><b>The seven forms:</b> IGNA (4) → IGNUS (5) → IGNIUS (6) → IGNIORA (7, center-woven) →
      IGNIAROS (8, the center mirrored + S) → IGNIORUSA (9, the center's last vowel migrates to the end) → IGNIORARIS (10, center + large suffix).</p>
      <p class="small" style="margin-top:6px"><b>Centers</b> reshape a word:
      ${Morph.CENTERS.map(c => `<span class="mono">${c.seq}</span> ${c.name}`).join(' · ')}.</p>
      <p class="small" style="margin-top:6px"><b>The Scribe's Elision:</b> twin vowels never touch — the second transmutes (A→E, E→A, I→E, O→U, U→O).
      So GEL+A+AS is written <span class="mono">GELAES</span>, and VEN+O+ORA becomes <span class="mono">VENOURA</span>.</p>
      <p class="small dim" style="margin-top:6px">Your grimoire records <b>notes</b> — the rules and parts above — not words.
      A word casts at full strength once every part it uses is in your notes; otherwise it can still be improvised at half power.
      Solving a mystery word inscribes its parts forever. 64 notes read all 270 words.</p>`;
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
      return '✒️ The whole grammar unfurls — every note inscribes itself. 64/64.';
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

  function renderGrimoire(backTo) {
    const readable = Morph.readableCount(meta.parts);
    $screen.innerHTML = `<h2>📖 The Grimoire — ${meta.parts.size}/64 notes</h2>
      <p class="small dim">You do not collect words — you collect the grammar. These notes currently read <b>${readable}/270</b> words of the loom-tongue.</p>`;
    const GROUPS = [
      ['roots', '🌳 Roots'], ['suffixes', '✂️ Suffixes'], ['binders', '🧵 Binders'],
      ['centers', '🌀 Centers'], ['forms', '𝔏 Forms'], ['rules', '✒️ Rules'],
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

  /* ================= run flow ================= */
  function startRun() {
    meta.runs++;
    LoomSave.save(meta);
    run = Loom.newRun((Date.now() % 2147483647) | 0, meta);
    nextNode();
  }

  function nodeIcon(n) {
    return { battle: '⚔️', camp: '🏕', elite: '☠️', boss: '⬛' }[n.type];
  }

  function runStrip() {
    return `<div class="nodes">${run.nodes.map((n, i) =>
      `<div class="node ${i < run.nodeIdx ? 'done' : i === run.nodeIdx ? 'here' : ''}">${nodeIcon(n)}</div>`).join('')}</div>`;
  }

  function nextNode() {
    hud();
    if (run.nodeIdx >= run.nodes.length) { endRun(true); return; }
    const node = run.nodes[run.nodeIdx];
    if (node.type === 'camp') renderCamp(node);
    else startBattle(node);
  }

  function startBattle(node) {
    battle = Loom.battleForNode(run, node);
    picked = [];
    renderBattle();
  }

  /* ================= battle ================= */
  function renderBattle() {
    hud();
    const b = battle;
    $screen.innerHTML = runStrip();
    const wrap = el('div', 'battle');

    /* ---- left: foes + you + loom ---- */
    const left = el('div');
    const foeRow = el('div', 'foe-row');
    b.foes.forEach((f, i) => {
      const weakEl = f.weakTo ? Morph.EL_BY_ID[f.weakTo] : null;
      const resEl = f.resist ? Morph.EL_BY_ID[f.resist] : null;
      const it = f.hp > 0 ? Loom.describeIntent(b, f) : { icon: '✝', text: 'felled' };
      const box = el('div', 'foe' + (f.hp <= 0 ? ' dead' : (b.foes.length > 1 && i === b.target ? ' targeted' : '')), `
        <div class="fname">${f.name}${f.elite ? ' · ELITE' : ''}${f.boss ? ' · BOSS' : ''}</div>
        <div class="art" id="foe-art-${i}">${f.icon}</div>
        <div class="hpbar"><div class="fill" style="width:${100 * f.hp / f.maxHp}%"></div><div class="txt">${f.hp}/${f.maxHp}</div></div>
        <div class="intent" title="its next move">${it.icon} ${it.text}</div>
        <div class="affin">
          ${weakEl ? `<span class="wk" title="Takes ×1.5 from ${weakEl.name} (${weakEl.root}-words)">${weakEl.icon} fears</span>` : ''}
          ${resEl ? `<span title="Takes ×0.5 from ${resEl.name}">${resEl.icon} shrugs</span>` : ''}
          ${f.burn ? `<span>🔥${f.burn}×${f.burnTurns}</span>` : ''}${f.poison ? `<span>☠${f.poison}</span>` : ''}
          ${f.chill ? `<span>❄ chilled</span>` : ''}${f.blind ? `<span>🌫 blind</span>` : ''}${f.stun ? `<span>💫</span>` : ''}${f.str ? `<span>💪+${f.str}</span>` : ''}
        </div>
        <div class="gimmick">${f.gimmick}</div>`);
      box.onclick = () => { if (f.hp > 0 && b.foes.length > 1) { b.target = i; renderBattle(); } };
      foeRow.appendChild(box);
    });
    left.appendChild(foeRow);

    const you = el('div', 'you', `
      <div class="you-row"><b>You</b>
        <span>${b.player.block ? `<span class="chip">🛡 ${b.player.block}</span>` : ''}
        ${b.player.blooms.map(x => `<span class="chip">🌱 ${x.word}×${x.turns}</span>`).join('')}
        ${b.cursedLetter ? `<span class="chip" style="color:var(--bad)">🚫 ${b.cursedLetter} inked out</span>` : ''}</span>
      </div>
      <div class="hpbar mine" style="margin-top:5px"><div class="fill" style="width:${100 * b.player.hp / b.player.maxHp}%"></div>
      <div class="txt">${b.player.hp}/${b.player.maxHp}</div></div>`);
    left.appendChild(you);

    /* the loom */
    const loom = el('div', 'loom-zone');
    loom.appendChild(el('div', 'small center', `— your loom · turn ${b.turn} —`));
    const trayEl = el('div', 'tray');
    b.tray.forEach(t => {
      const tile = el('div', 'tile' + ('AEIOU'.includes(t.ch) ? ' vowel' : '') + (t.frozen ? ' frozen' : '') + (picked.includes(t.id) ? ' used' : ''), t.ch);
      if (!t.frozen) tile.onclick = () => { if (!picked.includes(t.id)) { picked.push(t.id); refreshBuild(); } };
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
    const endBtn = el('button', null, '⌛ End Turn');
    endBtn.id = 'end-turn';
    endBtn.onclick = () => { Loom.endTurn(b); picked = []; afterAction(); };
    btns.append(castBtn, clearBtn, mullBtn, endBtn);
    loom.appendChild(btns);

    /* speakable chips: inscribed words the tray can pay for right now */
    const speak = el('div', 'speakable');
    const spellable = Loom.spellableWords(b).slice(0, 10);
    if (spellable.length) {
      speak.appendChild(el('div', 'small dim', 'the loom can speak:'));
      spellable.forEach(e => {
        const c = el('button', 'cast-chip', `${Morph.EL_BY_ID[e.el].icon} ${e.word}`);
        c.title = `${e.name} — ${e.desc}`;
        c.onclick = () => { const r = Loom.castWord(b, e.word); if (r.ok) { picked = []; afterAction(); } };
        speak.appendChild(c);
      });
    } else {
      speak.appendChild(el('div', 'small dim', 'no inscribed word fits this loom — deduce, improvise, or sweep'));
    }
    loom.appendChild(speak);
    left.appendChild(loom);
    left.appendChild(el('div', null, `<div id="battle-log">${b.log.map(x => `<div>${x}</div>`).join('')}</div>`));
    wrap.appendChild(left);

    /* ---- right: the mystery word ---- */
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
    pane.appendChild(el('div', 'small', `${m.len} runes · solve it to cast it at ×1.5 <b>and</b> inscribe its grammar in your notes, forever`));

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
    m.guesses.forEach(g => {
      const row = el('div', 'mrow');
      for (let i = 0; i < m.len; i++) row.appendChild(el('div', 'mtile' + sm + ' ' + g.marks[i], g.word[i]));
      grid.appendChild(row);
    });
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
    } else {
      gz.appendChild(el('div', 'small dim', b.over ? '' : 'your guess is spent — end the turn to earn another'));
    }
    pane.appendChild(gz);
    pane.appendChild(loomGuide());
    return pane;
  }

  /* the player's grimoire notes, as a study table */
  function loomGuide() {
    const P = meta.parts;
    const suf = (e, sz, txt) => P.has('suf:' + e.id + ':' + sz) ? '-' + txt : '·';
    const g = el('div', 'guide');
    g.innerHTML = `<div class="small" style="margin-bottom:4px"><b>🪡 Loom guide</b> — notes in your grimoire</div>
      <table>
      ${Morph.ELEMENTS.map(e => {
        const root = P.has('root:' + e.id);
        const conn = P.has('conn:' + e.id);
        return `<tr class="${root ? '' : 'unk'}"><td>${e.icon}</td><td class="mono">${root ? e.root : '???'}</td>
          <td class="mono">${root ? [suf(e, 'small', e.small), suf(e, 'medium', e.medium), suf(e, 'large', e.large)].join(' ') : '· · ·'}</td>
          <td class="mono">${conn ? (e.longRoot ? '→' + e.longRoot : '+' + e.conn) : '·'}</td>
          <td>${root ? e.name : 'unknown'}</td></tr>`;
      }).join('')}
      </table>
      <div style="margin-top:5px">centers: ${Morph.CENTERS.map(c => P.has('center:' + c.id)
        ? `<span class="mono" title="${c.shape}">${c.seq}</span>` : '<span class="dim">···</span>').join(' ')}
      · forms: ${[4,5,6,7,8,9,10].map(l => P.has('form:' + l)
        ? `<span class="mono" title="${Morph.FORM_NAMES[l]}">${l}</span>` : '<span class="dim">·</span>').join(' ')}
      ${P.has('rule:elision') ? ' · <span class="mono" title="Twin vowels never touch — the second transmutes.">✒️elision</span>' : ''}</div>`;
    return g;
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
    const readable = entry && Morph.canRead(meta.parts, entry);
    build.innerHTML = word
      ? `<span class="${entry ? (readable ? 'ok' : 'improv') : 'no'}">${word}</span>`
      : '<span class="no dim">— pick tiles to weave a word —</span>';
    hint.innerHTML = entry
      ? (readable ? `✓ ${entry.name} — ${entry.desc}`
        : `<span class="improv">its grammar is not in your notes — improvised at half power (${entry.parts.filter(pid => !meta.parts.has(pid)).length} note${entry.parts.filter(pid => !meta.parts.has(pid)).length > 1 ? 's' : ''} missing)</span>`)
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
      ? `🌟 <b>${g}</b> — ${res.notes.length} new note${res.notes.length > 1 ? 's' : ''} in your grimoire!`
      : `🌟 <b>${g}</b> — spoken true!`, 3000);
    afterAction();
  }

  function afterAction() {
    const b = battle;
    LoomSave.save(meta);
    if (b.over) {
      renderBattle();
      setTimeout(() => b.won ? battleWon() : endRun(false), 900);
      return;
    }
    renderBattle();
  }

  function scrollLog() {
    const lg = document.getElementById('battle-log');
    if (lg) lg.scrollTop = lg.scrollHeight;
  }

  /* ================= rewards & camp ================= */
  function battleWon() {
    const b = battle;
    meta.bestNode = Math.max(meta.bestNode, run.nodeIdx + 1);
    LoomSave.save(meta);
    const notes = b.stats.notes;
    $screen.innerHTML = runStrip() + `
      <h2 class="center">🏆 The page is yours</h2>
      <p class="small center">${notes.length
        ? `Notes inscribed this battle: <b>${notes.map(pid => Morph.PARTS[pid].title.split(' — ')[0]).join(' · ')}</b> — yours forever, across every run.`
        : 'No new grammar this time — the grimoire waits.'}</p>
      <p class="small center dim">Choose a spoil:</p>`;
    const offers = Loom.rollRewards(run);
    const row = el('div', 'offers');
    offers.forEach(o => {
      const card = el('div', 'offer', `<b>${o.title}</b><div class="small" style="margin-top:6px">${o.desc}</div>`);
      card.onclick = () => {
        const msg = Loom.applyReward(run, o);
        LoomSave.save(meta);
        toast(msg);
        run.nodeIdx++;
        nextNode();
      };
      row.appendChild(card);
    });
    $screen.appendChild(row);
    hud();
  }

  function renderCamp(node) {
    $screen.innerHTML = runStrip() + `
      <h2 class="center">🏕 A quiet margin</h2>
      <p class="small center dim">The needle rests. Choose:</p>`;
    const row = el('div', 'offers');
    Loom.campChoices(run).forEach(c => {
      const card = el('div', 'offer', `<b>${c.title}</b><div class="small" style="margin-top:6px">${c.desc}</div>`);
      card.onclick = () => {
        const msg = Loom.applyCamp(run, c);
        LoomSave.save(meta);
        toast(msg);
        run.nodeIdx++;
        nextNode();
      };
      row.appendChild(card);
    });
    $screen.appendChild(row);
    hud();
  }

  /* ================= run end ================= */
  function endRun(victory) {
    if (victory) { meta.wins++; run.victory = true; }
    LoomSave.save(meta);
    const gained = meta.parts.size - run.startNotes;
    const readable = Morph.readableCount(meta.parts);
    $screen.innerHTML = `
      <div class="title-wrap">
        <h1>${victory ? '🏆 THE ILLITERATE IS UNWRITTEN' : '🕯 Your ink runs dry'}</h1>
        <p class="title-sub">${victory ? 'The loom hums your name.' : 'But nothing learned is ever lost.'}</p>
        <p><b>${gained}</b> new note${gained === 1 ? '' : 's'} inscribed this run · <b>${meta.parts.size}</b>/64 notes, reading <b>${readable}</b>/270 words</p>
        <p class="small dim" style="margin-top:6px">Every note makes the next run stronger — and the mystery words longer.</p>
      </div>`;
    const again = el('button', 'arcane', '⚔ Weave again');
    again.style.cssText = 'display:block;margin:0 auto;font-size:17px;padding:10px 28px';
    again.onclick = startRun;
    $screen.appendChild(again);
    const home = el('button', 'quiet', '← the title page');
    home.style.cssText = 'display:block;margin:10px auto 0';
    home.onclick = () => { run = null; battle = null; renderTitle(); };
    $screen.appendChild(home);
    run = null; battle = null;
    hud();
  }

  /* ---- physical keyboard: typing letters picks matching tiles ---- */
  document.addEventListener('keydown', (ev) => {
    if (!battle || battle.over) return;
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT') return; // typing a guess
    const ch = ev.key.toUpperCase();
    if (/^[A-Z]$/.test(ch)) {
      const t = battle.tray.find(x => x.ch === ch && !x.frozen && !picked.includes(x.id));
      if (t) { picked.push(t.id); refreshBuild(); }
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
      winBattle() { if (battle) { battle.foes.forEach(f => f.hp = 0); battle.over = true; battle.won = true; battleWon(); } },
      rerender() { if (battle) renderBattle(); },
    };
  }

  renderTitle();
  $screen.dataset.booted = '1'; // boot failsafe in index.html watches for this
})();
