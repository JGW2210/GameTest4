/* ============================================================
 * LEXICON ARCANUM — Core engine (battle + run logic)
 * Pure logic, no DOM. Runs in the browser and in Node, so the
 * balance simulator (tools/simulate.js) exercises the exact
 * rules the game ships with.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./data/words.js'), require('./data/cards.js'),
      require('./data/classes.js'), require('./data/enemies.js'));
  } else {
    root.Engine = factory(root.WordData, root.CardData, root.ClassData, root.EnemyData);
  }
})(typeof self !== 'undefined' ? self : this, function (WordData, CardData, ClassData, EnemyData) {

  /* ---------- deterministic RNG (mulberry32) ---------- */
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
  function shuffle(rng, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const HAND_CAP = 8;
  const FIRST_GUESS_MULT = 1.5;
  const POWER_MULT = 2;

  /* ============================================================
   * CARD INSTANCES
   * ============================================================ */
  let instSeq = 1;
  function makeCard(id, upgraded) {
    const base = CardData.BY_ID[id];
    const fx = upgraded ? CardData.upgradedFx(base.fx) : Object.assign({}, base.fx);
    return { inst: instSeq++, id, name: base.name + (upgraded ? ' +' : ''), rarity: base.rarity,
             fx, upgraded: !!upgraded, flavor: base.flavor, token: false };
  }

  /* ============================================================
   * BATTLE
   * ============================================================ */
  function createBattle(opts) {
    // opts: { rng, cls, deck:[{id,upgraded}], hp, maxHp, enemyId, world, stage,
    //         difficulty, meta:{learnedWords:Set, discoveredPower:Set}, wordLen, insight }
    const rng = opts.rng;
    const e = EnemyData.ENEMIES[opts.enemyId];
    const st = EnemyData.scaledStats(opts.enemyId, opts.world, opts.stage, opts.difficulty);
    const b = {
      rng,
      cls: opts.cls,
      difficulty: opts.difficulty,
      world: opts.world, stage: opts.stage,
      meta: opts.meta,
      player: {
        hp: opts.hp, maxHp: opts.maxHp, block: 0, str: 0, wardBonus: 0, thorns: 0,
        weak: 0, vuln: 0, regen: 0,
        insight: opts.insight || 0, freeGuesses: 0,
        echo: 0, twincast: 0, insightRune: 0,
        refundOnCorrect: false, castDiscount: opts.cls.castDiscount || 0,
      },
      enemy: {
        id: e.id, name: e.name, icon: e.icon, boss: !!e.boss, elite: !!e.elite,
        hp: st.hp, maxHp: st.hp, block: 0, str: 0, dmgMult: st.dmgMult,
        weak: 0, vuln: 0, poison: 0, burn: 0, burnTurns: 0, stun: 0,
        patternIdx: 0, pattern: e.pattern,
      },
      drawPile: shuffle(rng, opts.deck.map(c => makeCard(c.id, c.upgraded))),
      hand: [], discard: [], exhausted: [],
      wordLen: opts.wordLen,
      word: null,
      turn: 0, over: false, won: false,
      goldGained: 0, maxHpGained: 0,
      stats: { spellsCast: 0, firstGuessCasts: 0, autoCasts: 0, wordsLearned: [], powerDiscovered: [] },
      events: [],
    };
    return b;
  }

  function emit(b, ev) { b.events.push(ev); return ev; }
  function drainEvents(b) { const e = b.events; b.events = []; return e; }

  /* ---------- word serving ---------- */
  function allLearned(b, len) {
    return WordData.POOLS[len].every(w => b.meta.learnedWords.has(w));
  }

  function serveWord(b, len) {
    // Serves a fresh mystery word. Auto-casts through learned words (runic
    // engraving) until an unknown word lands — unless the whole pool is
    // learned, in which case a free letter is revealed and guessing resumes.
    b.wordLen = len;
    let guard = 0;
    while (true) {
      guard++;
      const pool = WordData.POOLS[len];
      const prev = b.word ? b.word.answer : null;
      let answer = pick(b.rng, pool);
      if (pool.length > 1 && answer === prev) answer = pick(b.rng, pool);
      const everyKnown = allLearned(b, len);
      if (b.meta.learnedWords.has(answer) && !everyKnown && guard < 40) {
        // Instant activation — the runes are engraved upon the caster.
        emit(b, { type: 'autocast', word: answer });
        b.stats.autoCasts++;
        castSpell(b, answer, { auto: true });
        if (b.over) { b.word = null; return; }
        continue;
      }
      b.word = {
        answer, len,
        guesses: [], revealed: [], knownAbsent: [], vowelInfo: null,
        served: true,
      };
      if (everyKnown) revealLetter(b, true);
      emit(b, { type: 'wordServed', len, freeLetter: everyKnown });
      return;
    }
  }

  function revealLetter(b, free) {
    const w = b.word;
    if (!w) return false;
    const unrevealed = [];
    for (let i = 0; i < w.answer.length; i++) if (!w.revealed.some(r => r.i === i)) unrevealed.push(i);
    if (!unrevealed.length) return false;
    const i = pick(b.rng, unrevealed);
    w.revealed.push({ i, c: w.answer[i], free: !!free });
    emit(b, { type: 'reveal', i, c: w.answer[i] });
    return true;
  }

  function pruneLetters(b, n) {
    const w = b.word;
    if (!w) return;
    const inWord = new Set(w.answer.split(''));
    const candidates = [];
    for (let c = 65; c <= 90; c++) {
      const ch = String.fromCharCode(c);
      if (!inWord.has(ch) && !w.knownAbsent.includes(ch)) candidates.push(ch);
    }
    for (let k = 0; k < n && candidates.length; k++) {
      const idx = Math.floor(b.rng() * candidates.length);
      w.knownAbsent.push(candidates.splice(idx, 1)[0]);
    }
    emit(b, { type: 'prune', letters: w.knownAbsent.slice() });
  }

  function revealVowels(b) {
    const w = b.word;
    if (!w) return;
    const info = {};
    for (const v of ['A', 'E', 'I', 'O', 'U']) info[v] = w.answer.includes(v) ? 'present' : 'absent';
    w.vowelInfo = info;
    emit(b, { type: 'vowels', info });
  }

  /* ---------- damage plumbing ---------- */
  function playerDealDamage(b, base, hits, tag) {
    hits = hits || 1;
    let total = 0;
    for (let h = 0; h < hits; h++) {
      if (b.enemy.hp <= 0) break;
      let d = base + b.player.str;
      if (b.player.weak > 0) d = Math.floor(d * 0.75);
      if (b.enemy.vuln > 0) d = Math.floor(d * 1.5);
      d = Math.max(0, d);
      const absorbed = Math.min(b.enemy.block, d);
      b.enemy.block -= absorbed;
      const hpLoss = d - absorbed;
      b.enemy.hp -= hpLoss;
      total += d;
      emit(b, { type: 'enemyHit', amount: d, hpLoss, tag: tag || 'attack' });
    }
    checkBattleEnd(b);
    return total;
  }

  function damagePlayer(b, amount, source) {
    let d = Math.max(0, amount);
    const absorbed = Math.min(b.player.block, d);
    b.player.block -= absorbed;
    const hpLoss = d - absorbed;
    b.player.hp -= hpLoss;
    emit(b, { type: 'playerHit', amount: d, hpLoss, source: source || 'enemy' });
    checkBattleEnd(b);
    return hpLoss;
  }

  function gainBlock(b, n) {
    const amt = n + b.player.wardBonus;
    b.player.block += amt;
    emit(b, { type: 'block', amount: amt });
  }

  function healPlayer(b, n) {
    const amt = Math.min(n, b.player.maxHp - b.player.hp);
    b.player.hp += amt;
    if (amt > 0) emit(b, { type: 'heal', amount: amt });
  }

  function checkBattleEnd(b) {
    if (b.over) return;
    if (b.enemy.hp <= 0) { b.enemy.hp = 0; b.over = true; b.won = true; emit(b, { type: 'victory' }); }
    else if (b.player.hp <= 0) { b.player.hp = 0; b.over = true; b.won = false; emit(b, { type: 'defeat' }); }
  }

  /* ---------- spells ---------- */
  function applySpellFx(b, fx, mult) {
    if (fx.dmg) playerDealDamage(b, Math.round(fx.dmg * mult), 1, 'spell');
    if (fx.block) gainBlock(b, Math.round(fx.block * mult));
    if (fx.heal) healPlayer(b, Math.round(fx.heal * mult));
    if (fx.burn) { b.enemy.burn += Math.round(fx.burn * mult); b.enemy.burnTurns = Math.max(b.enemy.burnTurns, 2); }
    if (fx.poison) b.enemy.poison += Math.round(fx.poison * mult);
    if (fx.weak) b.enemy.weak += fx.weak;
    if (fx.vuln) b.enemy.vuln += fx.vuln;
    if (fx.str) b.player.str += Math.round(fx.str * mult);
    if (fx.insight) b.player.insight += Math.round(fx.insight * mult);
    if (fx.stun) b.enemy.stun += fx.stun;
  }

  function castSpell(b, word, opts) {
    // opts: { firstGuess, auto, tomeMult }
    opts = opts || {};
    const spell = WordData.SPELLS[word];
    if (!spell) return null;
    let mult = 1;
    const isPower = spell.power;
    if (opts.firstGuess) mult *= FIRST_GUESS_MULT;
    if (isPower) mult *= POWER_MULT;
    if (opts.tomeMult) mult *= opts.tomeMult;
    if (b.player.echo) { mult *= 1 + b.player.echo / 100; b.player.echo = 0; }
    const casts = b.player.twincast > 0 ? 2 : 1;
    if (b.player.twincast > 0) b.player.twincast--;

    emit(b, {
      type: 'spellCast', word, spell: spell.name, arch: spell.arch, icon: spell.icon,
      mult, power: isPower, firstGuess: !!opts.firstGuess, auto: !!opts.auto, casts,
    });
    for (let c = 0; c < casts; c++) applySpellFx(b, spell.fx, mult);
    b.stats.spellsCast++;
    if (opts.firstGuess) b.stats.firstGuessCasts++;
    if (isPower && !b.meta.discoveredPower.has(word)) {
      b.meta.discoveredPower.add(word);
      b.stats.powerDiscovered.push(word);
      emit(b, { type: 'powerDiscovered', word });
    }
    return spell;
  }

  /* ---------- guessing ---------- */
  function canGuess(b) {
    return !!b.word && !b.over && (b.player.freeGuesses > 0 || b.player.insight >= 1);
  }

  function guess(b, raw) {
    const w = b.word;
    if (!w || b.over) return { ok: false, reason: 'no-word' };
    const g = String(raw || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (g.length !== w.len) return { ok: false, reason: 'length' };
    if (b.player.freeGuesses > 0) b.player.freeGuesses--;
    else if (b.player.insight >= 1) b.player.insight--;
    else return { ok: false, reason: 'insight' };

    const marks = WordData.judgeGuess(g, w.answer);
    w.guesses.push({ word: g, marks });
    // track keyboard knowledge
    for (let i = 0; i < g.length; i++) {
      if (marks[i] === 'absent' && !w.answer.includes(g[i]) && !w.knownAbsent.includes(g[i])) {
        w.knownAbsent.push(g[i]);
      }
    }
    const correct = g === w.answer;
    emit(b, { type: 'guess', word: g, marks, correct, guessNum: w.guesses.length });

    if (correct) {
      const firstGuess = w.guesses.length === 1;
      const newlyLearned = !b.meta.learnedWords.has(g);
      if (newlyLearned) {
        b.meta.learnedWords.add(g);
        b.stats.wordsLearned.push(g);
        emit(b, { type: 'wordLearned', word: g });
      }
      if (b.player.refundOnCorrect) b.player.insight += 1;
      castSpell(b, g, { firstGuess });
      if (!b.over) serveWord(b, b.wordLen);
      return { ok: true, correct: true, firstGuess, marks };
    }
    return { ok: true, correct: false, marks };
  }

  function changeWordLength(b, len) {
    if (b.over) return;
    serveWord(b, len);
  }

  /* ---------- playing cards ---------- */
  function playCard(b, inst, choice) {
    if (b.over) return { ok: false, reason: 'over' };
    const idx = b.hand.findIndex(c => c.inst === inst);
    if (idx < 0) return { ok: false, reason: 'not-in-hand' };
    const card = b.hand[idx];
    const fx = card.fx;

    // Cast Tome needs a valid chosen learned word & affordable cost.
    if (fx.castTome) {
      const word = choice && choice.tomeWord;
      if (!word || !b.meta.learnedWords.has(word)) return { ok: false, reason: 'need-word' };
      const cost = Math.max(0, word.length - 4 - (fx.castDiscount || 0) - b.player.castDiscount);
      if (b.player.insight < cost) return { ok: false, reason: 'insight' };
      b.player.insight -= cost;
      emit(b, { type: 'cardPlayed', card: cardView(card) });
      castSpell(b, word, { tomeMult: fx.castTome * (b.cls.tomeMult || 1) });
      afterPlay(b, idx, card);
      return { ok: true };
    }

    emit(b, { type: 'cardPlayed', card: cardView(card) });

    if (fx.selfDmg) { b.player.hp -= fx.selfDmg; emit(b, { type: 'playerHit', amount: fx.selfDmg, hpLoss: fx.selfDmg, source: 'self' }); }
    if (fx.dmg || fx.dmgPerLearned || fx.dmgPerInsight || fx.dmgFromBlock) {
      let base = fx.dmg || 0;
      if (fx.dmgPerLearned) base += fx.dmgPerLearned * b.meta.learnedWords.size;
      if (fx.dmgPerInsight) base += fx.dmgPerInsight * b.player.insight;
      if (fx.dmgFromBlock) base += b.player.block;
      playerDealDamage(b, base, fx.hits || 1, 'card');
    }
    if (fx.block || fx.blockPerLearned) {
      let base = fx.block || 0;
      if (fx.blockPerLearned) base += fx.blockPerLearned * b.meta.learnedWords.size;
      gainBlock(b, base);
    }
    if (fx.insight) { b.player.insight += fx.insight; emit(b, { type: 'insight', amount: fx.insight }); }
    if (fx.freeGuess) b.player.freeGuesses += fx.freeGuess;
    if (fx.insightRune) b.player.insightRune += fx.insightRune;
    if (fx.reveal) for (let i = 0; i < fx.reveal; i++) revealLetter(b);
    if (fx.pruneLetters) pruneLetters(b, fx.pruneLetters);
    if (fx.revealVowels) revealVowels(b);
    if (fx.refundOnCorrect) b.player.refundOnCorrect = true;
    if (fx.castDiscount && !fx.castTome) b.player.castDiscount += fx.castDiscount;
    if (fx.draw) drawCards(b, fx.draw);
    if (fx.heal) healPlayer(b, fx.heal);
    if (fx.regen) b.player.regen += fx.regen;
    if (fx.maxHp) { b.player.maxHp += fx.maxHp; b.player.hp += fx.maxHp; b.maxHpGained += fx.maxHp; }
    if (fx.str) b.player.str += fx.str;
    if (fx.wardBonus) b.player.wardBonus += fx.wardBonus;
    if (fx.weak) b.enemy.weak += fx.weak;
    if (fx.vuln) b.enemy.vuln += fx.vuln;
    if (fx.poison) b.enemy.poison += fx.poison;
    if (fx.burn) { b.enemy.burn += fx.burn; b.enemy.burnTurns = Math.max(b.enemy.burnTurns, 2); }
    if (fx.stun) b.enemy.stun += fx.stun;
    if (fx.cleanse) { b.player.weak = 0; b.player.vuln = 0; }
    if (fx.thorns) b.player.thorns += fx.thorns;
    if (fx.echo) b.player.echo += fx.echo;
    if (fx.twincast) b.player.twincast += 1;
    if (fx.goldGain) { b.goldGained += fx.goldGain; emit(b, { type: 'gold', amount: fx.goldGain }); }

    checkBattleEnd(b);
    afterPlay(b, idx, card);
    return { ok: true };
  }

  function afterPlay(b, idx, card) {
    b.hand.splice(idx, 1);
    if (card.fx.exhaust || card.token) b.exhausted.push(card);
    else b.discard.push(card);
  }

  function cardView(c) {
    return { inst: c.inst, id: c.id, name: c.name, rarity: c.rarity, fx: c.fx,
             upgraded: c.upgraded, desc: CardData.describeFx(c.fx), flavor: c.flavor, token: c.token };
  }

  /* ---------- turn structure ---------- */
  function drawCards(b, n) {
    for (let i = 0; i < n; i++) {
      if (b.hand.length >= HAND_CAP) return;
      if (!b.drawPile.length) {
        if (!b.discard.length) return;
        b.drawPile = shuffle(b.rng, b.discard);
        b.discard = [];
      }
      const c = b.drawPile.pop();
      b.hand.push(c);
      emit(b, { type: 'draw', card: cardView(c) });
    }
  }

  function startPlayerTurn(b) {
    if (b.over) return;
    b.turn++;
    b.player.block = 0;
    const gain = b.cls.freeInsight + b.player.insightRune;
    if (gain) { b.player.insight += gain; emit(b, { type: 'insight', amount: gain, free: true }); }
    if (b.player.regen) healPlayer(b, b.player.regen);
    drawCards(b, b.cls.draw);
    // The Archivist always has a Cast Tome in hand each turn.
    if (b.cls.alwaysDrawsCastTome && !b.hand.some(c => c.fx.castTome) && b.hand.length < HAND_CAP) {
      const t = makeCard('casttome', false);
      t.token = true; t.name = 'Conjured Tome';
      b.hand.push(t);
      emit(b, { type: 'draw', card: cardView(t) });
    }
    if (!b.word) serveWord(b, b.wordLen);
    emit(b, { type: 'turnStart', turn: b.turn });
  }

  function enemyIntent(b) {
    // Peek what the enemy will do (for UI). Choice-arrays resolve lazily but
    // deterministically per pattern index using a stashed roll.
    const e = b.enemy;
    let move = e.pattern[e.patternIdx % e.pattern.length];
    if (Array.isArray(move)) {
      if (e._choiceIdx == null) e._choiceIdx = Math.floor(b.rng() * move.length);
      move = move[e._choiceIdx];
    }
    return move;
  }

  function describeIntent(b) {
    const m = enemyIntent(b);
    const e = b.enemy;
    const scale = (n) => {
      let d = Math.round(n * e.dmgMult) + e.str;
      if (e.weak > 0) d = Math.floor(d * 0.75);
      return d;
    };
    switch (m.kind) {
      case 'attack': return { icon: '⚔️', text: m.hits > 1 ? `${scale(m.n)}×${m.hits}` : `${scale(m.n)}`, kind: 'attack' };
      case 'block': return { icon: '🛡️', text: `${Math.round(m.n * e.dmgMult)}`, kind: 'block' };
      case 'buff': return { icon: '💪', text: `+${m.str}`, kind: 'buff' };
      case 'debuff': return { icon: '🌀', text: 'curse', kind: 'debuff' };
      case 'leech': return { icon: '🧠', text: `−${m.insight} insight`, kind: 'leech' };
      case 'smolder': return { icon: '🔥', text: `burn${m.n ? ' +' + scale(m.n) : ''}`, kind: 'smolder' };
      case 'venom': return { icon: '☠️', text: `venom${m.n ? ' +' + scale(m.n) : ''}`, kind: 'venom' };
      case 'heal': return { icon: '💚', text: `+${Math.round(m.n * e.dmgMult)}`, kind: 'heal' };
      default: return { icon: '❔', text: '?', kind: 'unknown' };
    }
  }

  function enemyAttack(b, n, hits) {
    const e = b.enemy;
    hits = hits || 1;
    for (let h = 0; h < hits; h++) {
      if (b.over) return;
      let d = Math.round(n * e.dmgMult) + e.str;
      if (e.weak > 0) d = Math.floor(d * 0.75);
      if (b.player.vuln > 0) d = Math.floor(d * 1.5);
      damagePlayer(b, d, 'attack');
      if (b.player.thorns > 0 && !b.over) {
        e.block = Math.max(0, e.block - b.player.thorns);
        // thorns pierce residual to hp
        const t = b.player.thorns;
        const absorbed = Math.min(e.block, t);
        e.hp -= (t - absorbed);
        emit(b, { type: 'thorns', amount: t });
        checkBattleEnd(b);
      }
    }
  }

  function endTurn(b) {
    if (b.over) return;
    emit(b, { type: 'turnEnd', turn: b.turn });
    const e = b.enemy;

    // damage-over-time ticks at the start of the enemy's move
    if (e.poison > 0) { e.hp -= e.poison; emit(b, { type: 'dot', kind: 'poison', amount: e.poison }); e.poison--; checkBattleEnd(b); }
    if (!b.over && e.burn > 0 && e.burnTurns > 0) { e.hp -= e.burn; emit(b, { type: 'dot', kind: 'burn', amount: e.burn }); e.burnTurns--; if (e.burnTurns === 0) e.burn = 0; checkBattleEnd(b); }
    if (b.over) return;

    if (e.stun > 0) {
      e.stun--;
      emit(b, { type: 'enemyStunned' });
    } else {
      const m = enemyIntent(b);
      e._choiceIdx = null;
      e.block = 0;
      emit(b, { type: 'enemyAct', move: m });
      switch (m.kind) {
        case 'attack': enemyAttack(b, m.n, m.hits); break;
        case 'block': e.block += Math.round(m.n * e.dmgMult); break;
        case 'buff': e.str += m.str; break;
        case 'debuff':
          if (m.weak) b.player.weak += m.weak;
          if (m.vuln) b.player.vuln += m.vuln;
          break;
        case 'leech':
          b.player.insight = Math.max(0, b.player.insight - m.insight);
          if (m.n) enemyAttack(b, m.n, 1);
          emit(b, { type: 'leeched', amount: m.insight });
          break;
        case 'smolder':
          if (m.n) enemyAttack(b, m.n, 1);
          b.player.weak += 0; // burn foes brand the player: minor chip via attack only
          break;
        case 'venom':
          if (m.n) enemyAttack(b, m.n, 1);
          break;
        case 'heal': e.hp = Math.min(e.maxHp, e.hp + Math.round(m.n * e.dmgMult)); break;
      }
      e.patternIdx++;
    }
    if (b.over) return;

    // durations tick down at end of round
    if (e.weak > 0) e.weak--;
    if (e.vuln > 0) e.vuln--;
    if (b.player.weak > 0) b.player.weak--;
    if (b.player.vuln > 0) b.player.vuln--;

    startPlayerTurn(b);
  }

  /* ============================================================
   * RUN LAYER — map generation, rewards, forge
   * ============================================================ */
  const NODE_TYPES = { BATTLE: 'battle', ELITE: 'elite', TREASURE: 'treasure', SHRINE: 'shrine', BOSS: 'boss' };

  function generateWorldMap(rng, world) {
    // 6 stages: 1..5 branching columns, 6 = boss. Returns {columns:[[node]], world}
    const columns = [];
    const wdata = EnemyData.BY_WORLD[world];
    for (let stage = 1; stage <= 6; stage++) {
      if (stage === 6) {
        columns.push([{ stage, idx: 0, type: NODE_TYPES.BOSS, enemyId: wdata.boss, next: [] }]);
        continue;
      }
      const count = stage === 1 ? 2 : 2 + Math.floor(rng() * 2); // 2-3
      const col = [];
      for (let i = 0; i < count; i++) {
        let type = NODE_TYPES.BATTLE;
        if (stage > 1) {
          const r = rng();
          if (r < 0.18) type = NODE_TYPES.ELITE;
          else if (r < 0.34) type = NODE_TYPES.TREASURE;
          else if (r < 0.48) type = NODE_TYPES.SHRINE;
        }
        const node = { stage, idx: i, type, next: [] };
        if (type === NODE_TYPES.BATTLE) node.enemyId = pick(rng, wdata.normals);
        if (type === NODE_TYPES.ELITE) node.enemyId = pick(rng, wdata.elites);
        col.push(node);
      }
      // Guarantee at least one battle per column so runs can't be all-skips
      if (!col.some(n => n.type === NODE_TYPES.BATTLE || n.type === NODE_TYPES.ELITE)) {
        const n = pick(rng, col);
        n.type = NODE_TYPES.BATTLE; n.enemyId = pick(rng, wdata.normals);
      }
      columns.push(col);
    }
    // connect columns
    for (let s = 0; s < 5; s++) {
      const cur = columns[s], nxt = columns[s + 1];
      const covered = new Set();
      cur.forEach((node, i) => {
        const lo = Math.max(0, Math.min(i, nxt.length - 1) - (rng() < 0.5 ? 1 : 0));
        const hi = Math.min(nxt.length - 1, Math.max(i, 0) + (rng() < 0.5 ? 1 : 0));
        for (let j = lo; j <= hi; j++) { node.next.push(j); covered.add(j); }
        if (!node.next.length) { const j = Math.min(i, nxt.length - 1); node.next.push(j); covered.add(j); }
      });
      nxt.forEach((_, j) => {
        if (!covered.has(j)) {
          let bi = 0, bd = 1e9;
          cur.forEach((node, i) => { const d = Math.abs(i - j); if (d < bd) { bd = d; bi = i; } });
          cur[bi].next.push(j);
        }
      });
      cur.forEach(n => { n.next = Array.from(new Set(n.next)).sort((a, z) => a - z); });
    }
    return { world, columns };
  }

  function rollCardRewards(rng, meta, bonus) {
    const pool = CardData.rewardPool(meta);
    const out = [];
    const seen = new Set();
    let guard = 0;
    while (out.length < 3 && guard++ < 60) {
      const rarity = CardData.rollRarity(rng, bonus);
      const options = pool.filter(c => c.rarity === rarity && !seen.has(c.id));
      if (!options.length) continue;
      const c = pick(rng, options);
      seen.add(c.id);
      out.push(c);
    }
    return out;
  }

  const FORGE = {
    upgradeCost: (upgradesBought) => 45 + 20 * upgradesBought,
    removeCost: (removals) => 55 + 30 * removals,
  };

  /* Run-level rules shared by game and simulator */
  const RUN_RULES = {
    postBattleHealMissingPct: 0.25, // heal 25% of missing HP after each victory
    bossHealMissingPct: 1.0,        // full heal after felling a world boss
    treasureGold: [22, 40],         // min..max before difficulty gold mult
    treasureCardChance: 0.35,
    shrineHealPct: 0.30,            // shrines can restore 30% max HP
    shrineGold: 25,
    shrineWordChance: 1.0,          // runic vision always offered as an option
  };

  return {
    makeRng, pick, shuffle,
    HAND_CAP, FIRST_GUESS_MULT, POWER_MULT,
    makeCard, cardView, createBattle, startPlayerTurn, endTurn,
    playCard, guess, canGuess, changeWordLength, serveWord,
    enemyIntent, describeIntent, drainEvents, castSpell,
    NODE_TYPES, generateWorldMap, rollCardRewards, FORGE, RUN_RULES,
    allLearned,
  };
});
