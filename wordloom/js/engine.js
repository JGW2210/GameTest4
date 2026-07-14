/* ============================================================
 * WORDLOOM — engine (pure logic, browser + Node)
 *
 * The two loops:
 *   ACQUIRE — one free guess per turn at the mystery word (wordle
 *     feedback). Solve it → the word casts at ×1.5 and is inscribed
 *     in your grimoire FOREVER (across runs).
 *   DEPLOY — spell any inscribed word from your loom of letter
 *     tiles. Tiles are the only cost. Longer words need more (and
 *     rarer) letters: the cost curve IS the spelling.
 *
 * Improvisation: a word that is grammatically valid but not yet
 * inscribed can still be spoken — at half power, and it is NOT
 * learned. Deduction is the only way to truly own a word.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./data/morphology.js'), require('./data/foes.js'));
  } else {
    root.Loom = factory(root.Morph, root.Foes);
  }
})(typeof self !== 'undefined' ? self : this, function (Morph, Foes) {

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

  const TRAY_BASE = 12;
  const PLAYER_HP = 52;
  const SOLVE_MULT = 1.5;       // a word spoken true on the guess casts harder
  const IMPROV_MULT = 0.5;      // valid-but-uninscribed words cast at half power
  const VOWELS = 'AEIOU';

  /* ---------------- the letter bag ---------------- */
  // Weighted by the lexicon's own letter frequency, with a vowel floor so
  // a tray is never unspellable garbage.
  function drawLetter(rng, bag) {
    let total = 0;
    for (const ch in bag) total += bag[ch];
    let r = rng() * total;
    for (const ch in bag) { r -= bag[ch]; if (r <= 0) return ch; }
    return 'A';
  }

  let tileSeq = 1;
  function drawTile(rng, bag) { return { id: tileSeq++, ch: drawLetter(rng, bag), frozen: 0 }; }

  function refillTray(b) {
    const want = b.traySize - b.tray.length;
    for (let i = 0; i < want; i++) b.tray.push(drawTile(b.rng, b.bag));
    // vowel floor: at least 4 vowels among 12 (scaled to tray size)
    const floor = Math.max(3, Math.round(b.traySize / 3));
    let vowels = b.tray.filter(t => VOWELS.includes(t.ch)).length;
    let guard = 0;
    while (vowels < floor && guard++ < 20) {
      const idx = b.tray.findIndex(t => !VOWELS.includes(t.ch) && !t.frozen);
      if (idx < 0) break;
      b.tray[idx] = drawTile(b.rng, b.bag);
      if (VOWELS.includes(b.tray[idx].ch)) vowels++;
    }
  }

  /* ---------------- battles ---------------- */
  function makeFoe(id, scale) {
    const f = Foes.FOES[id];
    const hp = Math.round(f.hp * scale);
    return {
      id, name: f.name, icon: f.icon, boss: !!f.boss, elite: !!f.elite,
      hp, maxHp: hp, str: 0, dmgScale: scale,
      weakTo: f.weakTo || null, resist: f.resist || null,
      gimmick: f.gimmick, regen: f.regen || 0,
      poison: 0, burn: 0, burnTurns: 0, blind: 0, chill: 0, stun: 0,
      pattern: f.pattern, patternIdx: 0,
    };
  }

  function createBattle(run, foeIds, scale) {
    // foeIds entries: 'id' or { id, mult } for weakened companions
    const b = {
      rng: run.rng,
      run,
      foes: foeIds.map(fid => typeof fid === 'string'
        ? makeFoe(fid, scale)
        : makeFoe(fid.id, scale * (fid.mult || 1))),
      target: 0,
      player: { hp: run.hp, maxHp: run.maxHp, block: 0, blooms: [] },
      traySize: run.traySize,
      bag: run.bag,
      tray: [],
      cursedLetter: null,      // cannot appear in guesses this turn
      mulligans: 1,
      turn: 0, over: false, won: false,
      guessedThisTurn: false,
      mystery: null,
      log: [],
      stats: { casts: 0, improvs: 0, solves: 0, learned: [] },
    };
    refillTray(b);
    serveMystery(b);
    b.turn = 1;
    return b;
  }

  const alive = (b) => b.foes.filter(f => f.hp > 0);
  function targetFoe(b) {
    if (b.foes[b.target] && b.foes[b.target].hp > 0) return b.foes[b.target];
    const a = alive(b);
    if (a.length) b.target = b.foes.indexOf(a[0]);
    return a[0] || b.foes[0];
  }

  function say(b, msg) { b.log.push(msg); }

  /* ---------------- the mystery word (ACQUIRE loop) ---------------- */
  function unknownWords(run, lens) {
    return Morph.LIST.filter(e => lens.includes(e.len) && !run.meta.learned.has(e.word));
  }

  // Serve lengths grow with the player's grimoire: short words first, the
  // long weaves once the roots are known.
  function servableLens(run) {
    const n = run.meta.learned.size;
    if (n < 6) return [4, 5];
    if (n < 14) return [4, 5, 6];
    if (n < 26) return [5, 6, 7];
    if (n < 45) return [6, 7, 8];
    return [7, 8, 9, 10];
  }

  function serveMystery(b) {
    const lens = servableLens(b.run);
    let pool = unknownWords(b.run, lens);
    if (!pool.length) pool = Morph.LIST.filter(e => !b.run.meta.learned.has(e.word));
    if (!pool.length) pool = Morph.LIST; // omniscient player: serve anything
    const e = pick(b.rng, pool);
    b.mystery = { answer: e.word, len: e.len, guesses: [], revealed: [] };
    say(b, `📜 A ${e.len}-rune mystery word waits on the loom's margin.`);
  }

  function judge(guess, answer) {
    const marks = new Array(guess.length).fill('absent');
    const pool = {};
    for (let i = 0; i < answer.length; i++) {
      if (guess[i] === answer[i]) marks[i] = 'hit';
      else pool[answer[i]] = (pool[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < guess.length; i++) {
      if (marks[i] === 'hit') continue;
      if (pool[guess[i]] > 0) { marks[i] = 'near'; pool[guess[i]]--; }
    }
    return marks;
  }

  function canGuess(b) { return !b.over && !!b.mystery && !b.guessedThisTurn; }

  function guess(b, raw) {
    if (!canGuess(b)) return { ok: false, reason: 'spent' };
    const g = String(raw || '').toUpperCase().replace(/[^A-Z]/g, '');
    const m = b.mystery;
    if (g.length !== m.len) return { ok: false, reason: 'length' };
    if (b.cursedLetter && g.includes(b.cursedLetter)) return { ok: false, reason: 'cursed' };
    b.guessedThisTurn = true;
    const marks = judge(g, m.answer);
    m.guesses.push({ word: g, marks });
    const correct = g === m.answer;
    if (correct) {
      const word = m.answer;
      const newly = !b.run.meta.learned.has(word);
      b.run.meta.learned.add(word);
      b.stats.solves++;
      if (newly) b.stats.learned.push(word);
      say(b, `🌟 <b>${word}</b> — spoken true! ${newly ? 'It is inscribed in your grimoire forever.' : ''}`);
      castWordFx(b, word, SOLVE_MULT, 'solved');
      if (!b.over) serveMystery(b);
      return { ok: true, correct: true, marks };
    }
    return { ok: true, correct: false, marks };
  }

  function revealLetter(b) {
    const m = b.mystery;
    if (!m) return false;
    const hidden = [];
    for (let i = 0; i < m.answer.length; i++) if (!m.revealed.some(r => r.i === i)) hidden.push(i);
    if (!hidden.length) return false;
    const i = pick(b.rng, hidden);
    m.revealed.push({ i, c: m.answer[i] });
    say(b, `✨ Light falls on the mystery word — rune ${i + 1} is <b>${m.answer[i]}</b>.`);
    return true;
  }

  /* ---------------- spelling from the loom (DEPLOY loop) ---------------- */
  // Which tray tiles would spell this word? null if impossible.
  function tilesFor(b, word) {
    const avail = b.tray.filter(t => !t.frozen);
    const used = [];
    const pool = avail.slice();
    for (const ch of word) {
      const idx = pool.findIndex(t => t.ch === ch);
      if (idx < 0) return null;
      used.push(pool.splice(idx, 1)[0]);
    }
    return used;
  }
  const canSpell = (b, word) => !!tilesFor(b, word);

  function spellableWords(b) {
    // every inscribed word the current tray can pay for
    const out = [];
    for (const w of b.run.meta.learned) {
      if (Morph.WORDS[w] && canSpell(b, w)) out.push(Morph.WORDS[w]);
    }
    return out.sort((a, z) => z.len - a.len || (a.word < z.word ? -1 : 1));
  }

  function castWord(b, word) {
    if (b.over) return { ok: false, reason: 'over' };
    word = String(word || '').toUpperCase();
    const entry = Morph.WORDS[word];
    if (!entry) return { ok: false, reason: 'not-a-word' };
    const tiles = tilesFor(b, word);
    if (!tiles) return { ok: false, reason: 'tiles' };
    const inscribed = b.run.meta.learned.has(word);
    // spend the tiles
    for (const t of tiles) b.tray.splice(b.tray.indexOf(t), 1);
    if (inscribed) { b.stats.casts++; castWordFx(b, word, 1, 'cast'); }
    else {
      b.stats.improvs++;
      say(b, `〰 You improvise <b>${word}</b> — untrained, it carries half its strength.`);
      castWordFx(b, word, IMPROV_MULT, 'improvised');
    }
    return { ok: true, inscribed };
  }

  function elemMult(foe, elId) {
    if (foe.weakTo === elId) return 1.5;
    if (foe.resist === elId) return 0.5;
    return 1;
  }

  function hitFoe(b, foe, dmg, elId) {
    const mult = elemMult(foe, elId);
    const d = Math.max(0, Math.round(dmg * mult));
    foe.hp -= d;
    const tag = mult > 1 ? ' — it fears this!' : mult < 1 ? ' (resisted)' : '';
    say(b, `⚔ ${foe.icon} ${foe.name} takes <b>${d}</b>${tag}`);
    if (foe.hp <= 0) { foe.hp = 0; say(b, `✝ ${foe.name} is unwritten.`); }
    checkEnd(b);
    return d;
  }

  function healPlayer(b, n) {
    const amt = Math.min(n, b.player.maxHp - b.player.hp);
    if (amt > 0) { b.player.hp += amt; say(b, `💚 You mend <b>${amt}</b>.`); }
  }

  // Apply a word's fx at a multiplier. Used for casts, solves, improvs,
  // verse pulses and blooms.
  function castWordFx(b, word, mult, how) {
    const entry = Morph.WORDS[word];
    const el = Morph.EL_BY_ID[entry.el];
    let fx = entry.fx;
    if (how !== 'bloom') say(b, `${el.icon} <b>${word}</b> — ${entry.name}${mult !== 1 ? ` ×${mult}` : ''}`);
    applyFx(b, fx, el, mult, entry);
    // chained recast (the Chain center)
    let chains = 0;
    while (fx.chain && !b.over && chains < 3 && b.rng() < fx.chain) {
      chains++;
      say(b, `⛓ <b>${word}</b> chains itself — again, freely!`);
      applyFx(b, fx, el, mult, entry);
    }
  }

  function applyFx(b, fx, el, mult, entry) {
    const M = (n) => Math.max(0, Math.round(n * mult));
    const tgt = targetFoe(b);
    const victims = fx.aoe ? alive(b) : (tgt && tgt.hp > 0 ? [tgt] : []);
    let dealt = 0;
    for (const f of victims) {
      if (fx.dmg) {
        let d = fx.dmg;
        if (fx.wild) d = d * (1 - fx.wild + b.rng() * fx.wild * 2); // storm swings
        dealt += hitFoe(b, f, M(d), el.id);
      }
      if (fx.burn && f.hp > 0) {
        const scaled = Math.round(M(fx.burn) * elemMult(f, el.id));
        if (scaled > 0) { f.burn += scaled; f.burnTurns = Math.max(f.burnTurns, fx.burnTurns || 2); }
      }
      if (fx.poison && f.hp > 0) {
        const scaled = Math.round(M(fx.poison) * elemMult(f, el.id));
        if (scaled > 0) f.poison += scaled;
      }
      if (fx.chill && f.hp > 0) f.chill = Math.max(f.chill, fx.chill);
      if (fx.blind && f.hp > 0) f.blind += fx.blind;
      if (fx.stunChance && f.hp > 0 && b.rng() < fx.stunChance) { f.stun += 1; say(b, `💫 ${f.name} reels, stunned!`); }
    }
    if (fx.drain && dealt > 0) healPlayer(b, Math.round(dealt * fx.drain));
    if (fx.block) { b.player.block += M(fx.block); say(b, `🛡 Stone rises: +${M(fx.block)}.`); }
    if (fx.mirrorBlock) b.player.block += fx.mirrorBlock;
    if (fx.heal) healPlayer(b, M(fx.heal));
    if (fx.maxHp) { b.player.maxHp += fx.maxHp; b.player.hp += fx.maxHp; }
    if (fx.cleanse && b.cursedLetter) { b.cursedLetter = null; say(b, '💧 The inked-out letter washes clean.'); }
    if (fx.gust) {
      for (let i = 0; i < fx.gust; i++) if (b.tray.length < b.traySize + 2) b.tray.push(drawTile(b.rng, b.bag));
      say(b, `🌬 The wind carries ${fx.gust} fresh tile${fx.gust > 1 ? 's' : ''} to your loom.`);
    }
    if (fx.reveal) for (let i = 0; i < fx.reveal; i++) revealLetter(b);
    if (fx.bloom && entry && !b._blooming) {
      b.player.blooms.push({ word: entry.word, turns: fx.bloom });
      say(b, `🌱 <b>${entry.word}</b> takes seed — it will bloom again.`);
    }
    if (fx.versePulse && entry && !b._blooming) {
      // the Verse contains its element's Word (L5) — it echoes after
      const l5 = Morph.LIST.find(e => e.el === entry.el && e.len === 5);
      if (l5) { say(b, `🎶 The verse hums its inner word — <b>${l5.word}</b> echoes.`); castWordFx(b, l5.word, mult, 'bloom'); }
    }
  }

  function mulligan(b) {
    if (b.over || b.mulligans <= 0) return false;
    b.mulligans--;
    b.tray = b.tray.filter(t => t.frozen); // frozen tiles stay stuck
    refillTray(b);
    say(b, '♻ You sweep the loom and draw fresh letters.');
    return true;
  }

  /* ---------------- foe turn / end turn ---------------- */
  function foeIntent(b, f) {
    let move = f.pattern[f.patternIdx % f.pattern.length];
    return move;
  }

  function describeIntent(b, f) {
    const m = foeIntent(b, f);
    const dmg = (n) => Math.max(1, Math.round(n * f.dmgScale) + f.str - (f.chill ? Math.ceil((Math.round(n * f.dmgScale) + f.str) * 0.35) : 0));
    switch (m.kind) {
      case 'attack': return { icon: '⚔️', text: m.hits > 1 ? `${dmg(m.n)}×${m.hits}` : `${dmg(m.n)}`, kind: 'attack' };
      case 'devour': return { icon: '👅', text: `eats ${m.n} vowel${m.n > 1 ? 's' : ''}${m.dmg ? ` +${dmg(m.dmg)}` : ''}`, kind: 'devour' };
      case 'freeze': return { icon: '🧊', text: `freezes ${m.n} tiles`, kind: 'freeze' };
      case 'burnTile': return { icon: '🔥', text: `burns ${m.n} tile${m.n > 1 ? 's' : ''}${m.dmg ? ` +${dmg(m.dmg)}` : ''}`, kind: 'burnTile' };
      case 'curse': return { icon: '🚫', text: 'inks out a letter', kind: 'curse' };
      case 'scramble': return { icon: '🌀', text: 'scrambles your loom', kind: 'scramble' };
      case 'brood': return { icon: '💪', text: `+${m.str} strength`, kind: 'brood' };
      default: return { icon: '❔', text: '?', kind: '?' };
    }
  }

  function foeAttack(b, f, n, hits) {
    for (let h = 0; h < (hits || 1); h++) {
      if (b.over) return;
      if (f.blind > 0 && b.rng() < 0.5) { say(b, `🌫 ${f.name} strikes only shadow.`); continue; }
      let d = Math.round(n * f.dmgScale) + f.str;
      if (f.chill > 0) d = Math.max(1, d - Math.ceil(d * 0.35));
      const absorbed = Math.min(b.player.block, d);
      b.player.block -= absorbed;
      const loss = d - absorbed;
      b.player.hp -= loss;
      say(b, loss > 0 ? `💥 ${f.name} hits you for <b>${loss}</b>.` : `🛡 Your stone absorbs ${f.name}'s blow.`);
      checkEnd(b);
    }
  }

  function endTurn(b) {
    if (b.over) return;
    b.cursedLetter = null;
    // blooms fire before the foes act
    b._blooming = true;
    for (const bl of b.player.blooms) {
      say(b, `🌱 <b>${bl.word}</b> blooms.`);
      castWordFx(b, bl.word, 0.5, 'bloom');
      bl.turns--;
    }
    b._blooming = false;
    b.player.blooms = b.player.blooms.filter(x => x.turns > 0);
    if (b.over) return;

    for (const f of b.foes) {
      if (b.over) break;
      if (f.hp <= 0) continue;
      // dots
      if (f.poison > 0) { f.hp -= f.poison; say(b, `☠ ${f.name} suffers ${f.poison} venom.`); f.poison--; }
      if (f.hp > 0 && f.burn > 0 && f.burnTurns > 0) {
        f.hp -= f.burn; say(b, `🔥 ${f.name} burns for ${f.burn}.`);
        f.burnTurns--; if (!f.burnTurns) f.burn = 0;
      }
      if (f.hp <= 0) { f.hp = 0; say(b, `✝ ${f.name} is unwritten.`); checkEnd(b); continue; }
      if (f.regen && f.hp < f.maxHp) f.hp = Math.min(f.maxHp, f.hp + f.regen);
      if (f.stun > 0) { f.stun--; say(b, `💫 ${f.name} is stunned — it does nothing.`); }
      else {
        const m = foeIntent(b, f);
        switch (m.kind) {
          case 'attack': foeAttack(b, f, m.n, m.hits); break;
          case 'devour': {
            let eaten = 0;
            for (let i = 0; i < m.n; i++) {
              const idx = b.tray.findIndex(t => VOWELS.includes(t.ch));
              if (idx >= 0) { b.tray.splice(idx, 1); eaten++; }
            }
            if (eaten) say(b, `👅 ${f.name} devours ${eaten} vowel${eaten > 1 ? 's' : ''} from your loom!`);
            if (m.dmg) foeAttack(b, f, m.dmg, 1);
            b._trayDebt = (b._trayDebt || 0) + eaten; // devoured tiles refill a turn late
            break;
          }
          case 'freeze': {
            const free = b.tray.filter(t => !t.frozen);
            for (let i = 0; i < m.n && free.length; i++) {
              const t = free.splice(Math.floor(b.rng() * free.length), 1)[0];
              t.frozen = 2; // thaws at the START of your next-next turn
            }
            say(b, `🧊 ${f.name} rimes ${m.n} of your tiles.`);
            break;
          }
          case 'burnTile': {
            let burned = 0;
            for (let i = 0; i < m.n; i++) {
              const free = b.tray.filter(t => !t.frozen);
              if (!free.length) break;
              b.tray.splice(b.tray.indexOf(pick(b.rng, free)), 1);
              burned++;
            }
            if (burned) say(b, `🔥 ${f.name} burns ${burned} tile${burned > 1 ? 's' : ''} to ash.`);
            if (m.dmg) foeAttack(b, f, m.dmg, 1);
            break;
          }
          case 'curse': {
            const common = 'AEIOURSNT';
            b.cursedLetter = common[Math.floor(b.rng() * common.length)];
            say(b, `🚫 ${f.name} inks out <b>${b.cursedLetter}</b> — you cannot guess with it next turn.`);
            break;
          }
          case 'scramble':
            b.tray = b.tray.filter(t => t.frozen);
            refillTray(b);
            say(b, `🌀 ${f.name} scrambles your whole loom!`);
            break;
          case 'brood': f.str += m.str; say(b, `💪 ${f.name} swells with malice (+${m.str}).`); break;
        }
        f.patternIdx++;
      }
      if (f.blind > 0) f.blind--;
      if (f.chill > 0) f.chill--;
    }
    if (b.over) return;
    // your next turn begins
    b.turn++;
    b.player.block = 0;
    b.guessedThisTurn = false;
    for (const t of b.tray) if (t.frozen) t.frozen--;
    const debt = b._trayDebt || 0;
    b._trayDebt = 0;
    const hold = b.traySize;
    b.traySize -= debt;         // devoured letters stay missing one turn
    refillTray(b);
    b.traySize = hold;
  }

  function checkEnd(b) {
    if (b.over) return;
    if (!alive(b).length) {
      b.over = true; b.won = true;
      b.run.hp = b.player.hp; b.run.maxHp = b.player.maxHp;
      say(b, '🏆 The page is yours.');
    } else if (b.player.hp <= 0) {
      b.player.hp = 0; b.over = true; b.won = false;
      b.run.hp = 0;
      say(b, '🕯 Your ink runs dry...');
    }
  }

  /* ---------------- the run ---------------- */
  // Node types: battle ×4 (ramping), camp, elite, boss — a 15-minute spiral.
  function newRun(seed, meta) {
    const rng = makeRng(seed);
    const bag = Object.assign({}, Morph.LETTER_WEIGHTS);
    const run = {
      rng, meta, seed,
      hp: PLAYER_HP, maxHp: PLAYER_HP,
      traySize: TRAY_BASE,
      bag,
      nodeIdx: 0,
      nodes: buildNodes(rng),
      over: false, victory: false,
      startWords: meta.learned.size,
    };
    return run;
  }

  function buildNodes(rng) {
    return [
      { type: 'battle', tier: 0 },
      { type: 'battle', tier: 1 },
      { type: 'camp' },
      { type: 'battle', tier: 2 },
      { type: 'battle', tier: 3 },
      { type: 'elite', tier: 4 },
      { type: 'camp' },
      { type: 'boss', tier: 5 },
    ];
  }

  function battleForNode(run, node) {
    const scale = Foes.SCALE(node.tier);
    let ids;
    if (node.type === 'boss') ids = ['illiterate'];
    else if (node.type === 'elite') ids = ['grammarian', { id: pick(run.rng, ['vowelleech', 'pyreimp']), mult: 0.7 }];
    else ids = [pick(run.rng, Foes.ENCOUNTERS[Math.min(node.tier, 3)])];
    return createBattle(run, ids, scale);
  }

  /* Rewards after each won battle: pick one of three offers. */
  function rollRewards(run) {
    const offers = [];
    // 1) study a word: three unknown words revealed, pick teaches it
    const lens = servableLens(run);
    const pool = unknownWords(run, lens.concat(lens[lens.length - 1] + 1 <= 10 ? [lens[lens.length - 1] + 1] : []));
    if (pool.length) {
      const w = pick(run.rng, pool);
      offers.push({ kind: 'study', word: w.word, title: `Study ${w.word}`, desc: `${w.name} — ${w.desc}. Inscribe it now, no deduction needed.` });
    }
    offers.push({ kind: 'mend', title: 'Mend', desc: 'Recover 14 ink (hp).' });
    if (run.traySize < 16) offers.push({ kind: 'loom', title: 'Widen the Loom', desc: '+1 tile in your tray, this run.' });
    const el = pick(run.rng, Morph.ELEMENTS);
    offers.push({ kind: 'infuse', el: el.id, title: `Infuse ${el.name}`, desc: `Season your letter bag toward ${el.root}-words (${el.icon}).` });
    // pick 3 distinct
    const out = [];
    while (out.length < 3 && offers.length) out.push(offers.splice(Math.floor(run.rng() * offers.length), 1)[0]);
    return out;
  }

  function applyReward(run, offer) {
    switch (offer.kind) {
      case 'study': run.meta.learned.add(offer.word); return `${offer.word} inscribed.`;
      case 'mend': run.hp = Math.min(run.maxHp, run.hp + 14); return 'You mend 14.';
      case 'loom': run.traySize++; return 'Your loom widens.';
      case 'infuse': {
        const el = Morph.EL_BY_ID[offer.el];
        for (const ch of el.root + el.medium + el.large) run.bag[ch] = (run.bag[ch] || 0) + 14;
        return `The bag hums with ${el.name}.`;
      }
    }
  }

  function campChoices(run) {
    return [
      { kind: 'rest', title: 'Rest', desc: 'Recover 40% of your missing ink.' },
      { kind: 'reflect', title: 'Reflect', desc: 'Study one word you saw this run: learn a random unknown word of a length you have already solved.' },
    ];
  }
  function applyCamp(run, choice) {
    if (choice.kind === 'rest') {
      const heal = Math.round((run.maxHp - run.hp) * 0.4);
      run.hp += heal;
      return `You rest. +${heal} ink.`;
    }
    const known = Morph.knownParts(run.meta.learned);
    const lens = known.forms.size ? Array.from(known.forms) : [4, 5];
    const pool = unknownWords(run, lens);
    if (!pool.length) { run.hp = Math.min(run.maxHp, run.hp + 8); return 'Nothing new to study — you doze (+8).'; }
    const w = pick(run.rng, pool);
    run.meta.learned.add(w.word);
    return `In the quiet you finally parse it: ${w.word} — inscribed.`;
  }

  return {
    makeRng, pick,
    TRAY_BASE, PLAYER_HP, SOLVE_MULT, IMPROV_MULT,
    createBattle, newRun, buildNodes, battleForNode,
    guess, canGuess, judge, serveMystery, revealLetter,
    castWord, canSpell, tilesFor, spellableWords, mulligan, endTurn,
    targetFoe, alive, describeIntent, foeIntent,
    rollRewards, applyReward, campChoices, applyCamp,
    refillTray, drawTile, servableLens, unknownWords,
  };
});
