/* ============================================================
 * LEXICON ARCANUM — Core engine v2 (battle + run logic)
 * Pure logic, no DOM. Runs in the browser and in Node, so the
 * balance simulator exercises the exact rules the game ships.
 *
 * v2 systems: energy (with in-battle max-⚡ ramping), multi-enemy
 * encounters with targeting, scry, spell schools & combos,
 * word-length attunement, relics, signature spells.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./data/words.js'), require('./data/cards.js'),
      require('./data/classes.js'), require('./data/enemies.js'), require('./data/relics.js'));
  } else {
    root.Engine = factory(root.WordData, root.CardData, root.ClassData, root.EnemyData, root.RelicData);
  }
})(typeof self !== 'undefined' ? self : this, function (WordData, CardData, ClassData, EnemyData, RelicData) {

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
  const BASE_ENERGY = 3;
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
             cost: base.cost, fx, upgraded: !!upgraded, flavor: base.flavor, token: false };
  }

  /* ============================================================
   * BATTLE
   * ============================================================ */
  function makeEnemy(id, world, stage, difficulty, scale) {
    const e = EnemyData.ENEMIES[id];
    const st = EnemyData.scaledStats(id, world, stage, difficulty);
    const hp = Math.max(6, Math.round(st.hp * (scale || 1)));
    return {
      id: e.id, name: e.name, icon: e.icon, boss: !!e.boss, elite: !!e.elite,
      hp, maxHp: hp, block: 0, str: 0, dmgMult: st.dmgMult * (scale ? Math.sqrt(scale) : 1),
      weak: 0, vuln: 0, poison: 0, burn: 0, burnTurns: 0, stun: 0, blind: 0,
      patternIdx: 0, pattern: e.pattern, _choiceIdx: null,
    };
  }

  function relicMod(b, key) { return RelicData.mod(b.relics, key); }

  function createBattle(opts) {
    // opts: { rng, cls, deck:[{id,upgraded}], hp, maxHp, enemyIds:[{id,scale}]|enemyId,
    //         world, stage, difficulty, meta:{learnedWords:Set, discoveredPower:Set},
    //         wordLen, insight, relics:[ids] }
    const rng = opts.rng;
    const relics = opts.relics || [];
    let enemyDefs = opts.enemyIds;
    if (!enemyDefs && opts.enemyId) enemyDefs = [{ id: opts.enemyId, scale: 1 }];
    const enemies = enemyDefs.map(d => makeEnemy(d.id, opts.world, opts.stage, opts.difficulty, d.scale));

    const hasBig = enemies.some(e => e.elite || e.boss);
    const maxEnergy = BASE_ENERGY
      + RelicData.mod(relics, 'maxEnergy')
      + (hasBig ? RelicData.mod(relics, 'maxEnergyVsElite') : 0);

    const b = {
      rng,
      cls: opts.cls,
      difficulty: opts.difficulty,
      world: opts.world, stage: opts.stage,
      meta: opts.meta,
      relics,
      player: {
        hp: opts.hp, maxHp: opts.maxHp, block: 0, str: 0, wardBonus: 0, thorns: 0,
        weak: 0, vuln: 0, regen: 0,
        insight: opts.insight || 0,
        freeGuesses: RelicData.mod(relics, 'freeGuessPerBattle'),
        energy: 0, maxEnergy,
        scryLeft: 0,
        echo: RelicData.mod(relics, 'echoFirstSpell'),
        twincast: 0, insightRune: 0,
        refundOnCorrect: false,
        castDiscount: (opts.cls.castDiscount || 0) + RelicData.mod(relics, 'tomeDiscount'),
      },
      enemies,
      target: 0,
      drawPile: shuffle(rng, opts.deck.map(c => makeCard(c.id, c.upgraded))),
      hand: [], discard: [], exhausted: [],
      wordLen: opts.wordLen,
      word: null,
      turn: 0, over: false, won: false,
      goldGained: 0, maxHpGained: 0,
      schoolCasts: {}, lengthsCast: [],
      spellsThisBattle: 0,
      stats: { spellsCast: 0, firstGuessCasts: 0, autoCasts: 0, wordsLearned: [], powerDiscovered: [] },
      events: [],
    };
    // battle-start relics
    if (RelicData.mod(relics, 'strStart')) b.player.str += RelicData.mod(relics, 'strStart');
    if (RelicData.mod(relics, 'thornsStart')) b.player.thorns += RelicData.mod(relics, 'thornsStart');
    return b;
  }

  function emit(b, ev) { b.events.push(ev); return ev; }
  function drainEvents(b) { const e = b.events; b.events = []; return e; }

  const alive = (b) => b.enemies.filter(e => e.hp > 0);
  function targetEnemy(b) {
    if (b.enemies[b.target] && b.enemies[b.target].hp > 0) return b.enemies[b.target];
    const a = alive(b);
    if (a.length) { b.target = b.enemies.indexOf(a[0]); return a[0]; }
    return b.enemies[0];
  }
  function setTarget(b, idx) {
    if (b.enemies[idx] && b.enemies[idx].hp > 0) b.target = idx;
  }

  /* ---------- word serving ---------- */
  function allLearned(b, len) {
    return WordData.POOLS[len].every(w => b.meta.learnedWords.has(w));
  }

  function serveWord(b, len) {
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
      // relic assistance on every fresh word
      const prune = relicMod(b, 'pruneOnServe');
      if (prune) pruneLetters(b, prune);
      if (relicMod(b, 'vowelOnServe')) revealVowels(b);
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

  /* ---------- scry: free deduction, once per turn (+relics) ---------- */
  function canScry(b) { return !b.over && b.word && b.player.scryLeft > 0; }
  function scry(b, letter) {
    if (!canScry(b)) return { ok: false };
    letter = String(letter || '').toUpperCase();
    if (!/^[A-Z]$/.test(letter)) return { ok: false };
    const w = b.word;
    b.player.scryLeft--;
    const present = w.answer.includes(letter);
    if (!present && !w.knownAbsent.includes(letter)) w.knownAbsent.push(letter);
    if (present) {
      w.vowelInfo = w.vowelInfo || {};
      if (!w.vowelInfo[letter]) w.vowelInfo[letter] = 'present';
    }
    emit(b, { type: 'scry', letter, present });
    return { ok: true, present };
  }

  /* ---------- damage plumbing ---------- */
  function hitEnemy(b, enemy, base, tag) {
    let d = Math.max(0, base);
    if (b.player.weak > 0) d = Math.floor(d * 0.75);
    if (enemy.vuln > 0) d = Math.floor(d * 1.5);
    const absorbed = Math.min(enemy.block, d);
    enemy.block -= absorbed;
    const hpLoss = d - absorbed;
    enemy.hp -= hpLoss;
    emit(b, { type: 'enemyHit', amount: d, hpLoss, tag: tag || 'attack', idx: b.enemies.indexOf(enemy) });
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      emit(b, { type: 'enemyDown', idx: b.enemies.indexOf(enemy), name: enemy.name });
      const bonus = relicMod(b, 'insightOnKill');
      if (bonus && alive(b).length) { b.player.insight += bonus; emit(b, { type: 'insight', amount: bonus }); }
    }
    return d;
  }

  function playerDealDamage(b, base, hits, tag, opts) {
    opts = opts || {};
    hits = hits || 1;
    let total = 0;
    for (let h = 0; h < hits; h++) {
      const targets = opts.aoe ? alive(b) : [targetEnemy(b)].filter(e => e && e.hp > 0);
      if (!targets.length) break;
      for (const e of targets) {
        let dmg = base + b.player.str;
        if (opts.execute && e.hp <= e.maxHp * 0.25) dmg += opts.execute;
        total += hitEnemy(b, e, dmg, tag);
      }
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
    if (!alive(b).length) {
      b.over = true; b.won = true;
      // attunement spoils: bonus aurum per extra length attuned
      const extra = Math.max(0, b.lengthsCast.length - 1);
      if (extra) { b.goldGained += extra * 6; emit(b, { type: 'gold', amount: extra * 6, why: 'attunement' }); }
      emit(b, { type: 'victory' });
    } else if (b.player.hp <= 0) {
      b.player.hp = 0; b.over = true; b.won = false; emit(b, { type: 'defeat' });
    }
  }

  /* ---------- schools, attunement, spells ---------- */
  const ATTUNE_TIERS = {
    2: { insight: 1 },
    3: { energyMax: 1 },
    4: { insight: 2, energyNow: 1 },
    5: { str: 3 },
    6: { energyMax: 1, insight: 3 },
  };

  function noteAttunement(b, len) {
    if (b.lengthsCast.includes(len)) return;
    b.lengthsCast.push(len);
    const tier = b.lengthsCast.length;
    const bonus = ATTUNE_TIERS[tier];
    if (!bonus) return;
    const chalice = relicMod(b, 'attuneBonus');
    if (bonus.insight) b.player.insight += bonus.insight;
    if (bonus.energyMax) b.player.maxEnergy += bonus.energyMax;
    if (bonus.energyNow || chalice) b.player.energy += (bonus.energyNow || 0) + chalice;
    if (bonus.str) b.player.str += bonus.str;
    emit(b, { type: 'attune', tier, bonus, chalice });
  }

  function schoolComboApply(b, school, prior, fx, multRef) {
    // Returns adjusted fx additions applied post-cast; multRef.mult may change.
    switch (school) {
      case 'astral': multRef.mult *= 1 + Math.min(0.75, 0.25 * prior); break;
      case 'aegian': if (prior) { b.player.thorns += 2 * prior; healPlayer(b, 3 * prior); } break;
      case 'ignium': if (prior && (fx.burn || fx.dmg)) fx._burnBonus = 3 * prior; break;
      case 'pestis': if (prior && (fx.poison || fx.dmg)) fx._poisonBonus = 3 * prior; break;
      case 'sanguine': if (prior) fx._healBonus = 4 * prior; break;
      case 'umbral': if (prior) fx._durBonus = Math.min(2, prior); break;
      case 'mentis': if (prior) { b.player.insight += prior; emit(b, { type: 'insight', amount: prior }); } break;
      case 'fulmen': if (prior % 2 === 1) fx._stunBonus = 1; break;
    }
  }

  function applySpellFx(b, fx, mult) {
    const tgt = targetEnemy(b);
    const aoe = !!fx.aoe;
    const burnBonus = (fx._burnBonus || 0) + relicMod(b, 'burnBonus');
    const poisonBonus = (fx._poisonBonus || 0) + relicMod(b, 'poisonBonus');
    const durBonus = fx._durBonus || 0;

    if (fx.dmg) playerDealDamage(b, Math.round(fx.dmg * mult) + relicMod(b, 'spellDmg'), fx.hits || 1, 'spell',
      { aoe, execute: fx.execute || 0 });
    if (fx.block) gainBlock(b, Math.round(fx.block * mult));
    if (fx.heal) healPlayer(b, Math.round(fx.heal * mult) + (fx._healBonus || 0));
    else if (fx._healBonus) healPlayer(b, fx._healBonus);

    const applyTo = aoe ? alive(b) : (tgt && tgt.hp > 0 ? [tgt] : []);
    for (const e of applyTo) {
      if (fx.burn || burnBonus && fx.dmg) {
        const amt = Math.round((fx.burn || 0) * mult) + burnBonus;
        if (amt > 0) { e.burn += amt; e.burnTurns = Math.max(e.burnTurns, 2); }
      }
      if (fx.poison || poisonBonus && fx.dmg) {
        const amt = Math.round((fx.poison || 0) * mult) + poisonBonus;
        if (amt > 0) e.poison += amt;
      }
      if (fx.weak) e.weak += fx.weak + durBonus;
      if (fx.vuln) e.vuln += fx.vuln + durBonus;
      if (fx.blind) e.blind += fx.blind + durBonus;
      if (fx.stun || fx._stunBonus) e.stun += (fx.stun || 0) + (fx._stunBonus || 0);
    }
    if (fx.str) b.player.str += Math.round(fx.str * mult);
    if (fx.insight) b.player.insight += Math.round(fx.insight * mult);
    if (fx.energyNow) { b.player.energy += fx.energyNow; emit(b, { type: 'energy', amount: fx.energyNow }); }
    if (fx.energyMax) { b.player.maxEnergy += fx.energyMax; b.player.energy += fx.energyMax; emit(b, { type: 'energyMax', amount: fx.energyMax }); }
    if (fx.freeGuess) b.player.freeGuesses += fx.freeGuess;
    if (fx.scryFree) b.player.scryLeft += fx.scryFree;
    if (fx.reveal) for (let i = 0; i < fx.reveal; i++) revealLetter(b);
    if (fx.draw) drawCards(b, fx.draw);
    if (fx.thorns) b.player.thorns += fx.thorns;
    if (fx.selfDmg) damagePlayer(b, fx.selfDmg, 'self');
  }

  function castSpell(b, word, opts) {
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

    // school combo
    const school = spell.school;
    const prior = b.schoolCasts[school] || 0;
    const fx = Object.assign({}, spell.fx);
    const multRef = { mult };
    schoolComboApply(b, school, prior, fx, multRef);
    mult = multRef.mult;
    b.schoolCasts[school] = prior + 1;

    emit(b, {
      type: 'spellCast', word, spell: spell.name, arch: spell.arch, school, icon: spell.icon,
      mult, power: isPower, firstGuess: !!opts.firstGuess, auto: !!opts.auto, casts,
      combo: prior > 0, sig: spell.sig,
    });
    for (let c = 0; c < casts; c++) { applySpellFx(b, fx, mult); if (b.over) break; }
    b.stats.spellsCast++;
    b.spellsThisBattle++;
    noteAttunement(b, spell.len);

    // relic pulses
    const hc = relicMod(b, 'healOnCast');
    if (hc && !b.over) healPlayer(b, hc);
    const se = relicMod(b, 'stunEvery');
    if (se && b.spellsThisBattle % se === 0 && !b.over) {
      const t = targetEnemy(b);
      if (t && t.hp > 0) { t.stun += 1; emit(b, { type: 'relicStun', idx: b.enemies.indexOf(t) }); }
    }
    if (opts.firstGuess) {
      b.stats.firstGuessCasts++;
      const fgi = relicMod(b, 'firstGuessInsight');
      if (fgi) { b.player.insight += fgi; emit(b, { type: 'insight', amount: fgi }); }
    }
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
  function canAfford(b, card) { return b.player.energy >= card.cost; }

  function playCard(b, inst, choice) {
    if (b.over) return { ok: false, reason: 'over' };
    const idx = b.hand.findIndex(c => c.inst === inst);
    if (idx < 0) return { ok: false, reason: 'not-in-hand' };
    const card = b.hand[idx];
    const fx = card.fx;
    if (b.player.energy < card.cost) return { ok: false, reason: 'energy' };

    if (choice && choice.targetIdx != null) setTarget(b, choice.targetIdx);

    if (fx.castTome) {
      const word = choice && choice.tomeWord;
      if (!word || !b.meta.learnedWords.has(word)) return { ok: false, reason: 'need-word' };
      const cost = Math.max(0, word.length - 4 - (fx.castDiscount || 0) - b.player.castDiscount);
      if (b.player.insight < cost) return { ok: false, reason: 'insight' };
      b.player.energy -= card.cost;
      b.player.insight -= cost;
      emit(b, { type: 'cardPlayed', card: cardView(card) });
      castSpell(b, word, { tomeMult: fx.castTome * (b.cls.tomeMult || 1) });
      afterPlay(b, idx, card);
      return { ok: true };
    }

    b.player.energy -= card.cost;
    emit(b, { type: 'cardPlayed', card: cardView(card) });

    if (fx.selfDmg) damagePlayer(b, fx.selfDmg, 'self');
    if (fx.dmg || fx.dmgPerLearned || fx.dmgPerInsight || fx.dmgFromBlock || fx.dmgPerAttuned) {
      let base = fx.dmg || 0;
      if (fx.dmgPerLearned) base += fx.dmgPerLearned * b.meta.learnedWords.size;
      if (fx.dmgPerInsight) base += fx.dmgPerInsight * b.player.insight;
      if (fx.dmgFromBlock) base += b.player.block;
      if (fx.dmgPerAttuned) base += fx.dmgPerAttuned * b.lengthsCast.length;
      playerDealDamage(b, base, fx.hits || 1, 'card', { aoe: !!fx.aoe });
    }
    if (fx.block || fx.blockPerLearned) {
      let base = fx.block || 0;
      if (fx.blockPerLearned) base += fx.blockPerLearned * b.meta.learnedWords.size;
      gainBlock(b, base);
    }
    if (fx.insight) { b.player.insight += fx.insight; emit(b, { type: 'insight', amount: fx.insight }); }
    if (fx.energyNow) { b.player.energy += fx.energyNow; emit(b, { type: 'energy', amount: fx.energyNow }); }
    if (fx.energyMax) { b.player.maxEnergy += fx.energyMax; b.player.energy += fx.energyMax; emit(b, { type: 'energyMax', amount: fx.energyMax }); }
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
    // enemy-status card effects hit the current target (or all if aoe)
    const applyTo = fx.aoe ? alive(b) : [targetEnemy(b)].filter(e => e && e.hp > 0);
    for (const e of applyTo) {
      if (fx.weak) e.weak += fx.weak;
      if (fx.vuln) e.vuln += fx.vuln;
      if (fx.poison) e.poison += fx.poison + relicMod(b, 'poisonBonus');
      if (fx.burn) { e.burn += fx.burn + relicMod(b, 'burnBonus'); e.burnTurns = Math.max(e.burnTurns, 2); }
      if (fx.stun) e.stun += fx.stun;
    }
    if (fx.cleanse) { b.player.weak = 0; b.player.vuln = 0; }
    if (fx.thorns) b.player.thorns += fx.thorns;
    if (fx.echo) b.player.echo += fx.echo;
    if (fx.twincast) b.player.twincast += 1;
    if (fx.goldGain) { b.goldGained += fx.goldGain; emit(b, { type: 'gold', amount: fx.goldGain }); }
    if (fx.castRandom && b.meta.learnedWords.size) {
      const words = Array.from(b.meta.learnedWords);
      castSpell(b, pick(b.rng, words), {});
    }

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
    return { inst: c.inst, id: c.id, name: c.name, rarity: c.rarity, cost: c.cost, fx: c.fx,
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
    b.player.energy = b.player.maxEnergy;
    b.player.scryLeft = 1 + relicMod(b, 'scryPerTurn');
    const gain = b.cls.freeInsight + b.player.insightRune + relicMod(b, 'insightPerTurn');
    if (gain) { b.player.insight += gain; emit(b, { type: 'insight', amount: gain, free: true }); }
    const bpt = relicMod(b, 'blockPerTurn');
    if (bpt) gainBlock(b, bpt);
    if (b.player.regen) healPlayer(b, b.player.regen);
    let drawN = b.cls.draw;
    if (b.turn === 1) drawN += relicMod(b, 'drawFirstTurn');
    drawCards(b, drawN);
    if (b.cls.alwaysDrawsCastTome && !b.hand.some(c => c.fx.castTome) && b.hand.length < HAND_CAP) {
      const t = makeCard('casttome', false);
      t.token = true; t.name = 'Conjured Tome';
      b.hand.push(t);
      emit(b, { type: 'draw', card: cardView(t) });
    }
    if (!b.word) serveWord(b, b.wordLen);
    if (b.turn === 1 && relicMod(b, 'revealOnStart')) revealLetter(b);
    emit(b, { type: 'turnStart', turn: b.turn });
  }

  function enemyIntent(b, enemy) {
    const e = enemy || targetEnemy(b);
    if (!e) return { kind: 'attack', n: 0 };
    let move = e.pattern[e.patternIdx % e.pattern.length];
    if (Array.isArray(move)) {
      if (e._choiceIdx == null) e._choiceIdx = Math.floor(b.rng() * move.length);
      move = move[e._choiceIdx];
    }
    return move;
  }

  function describeIntent(b, enemy) {
    const e = enemy || targetEnemy(b);
    const m = enemyIntent(b, e);
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

  function enemyAttack(b, e, n, hits) {
    hits = hits || 1;
    for (let h = 0; h < hits; h++) {
      if (b.over) return;
      if (e.blind > 0 && b.rng() < 0.5) {
        emit(b, { type: 'enemyMiss', idx: b.enemies.indexOf(e) });
        continue;
      }
      let d = Math.round(n * e.dmgMult) + e.str;
      if (e.weak > 0) d = Math.floor(d * 0.75);
      if (b.player.vuln > 0) d = Math.floor(d * 1.5);
      damagePlayer(b, d, 'attack');
      if (b.player.thorns > 0 && !b.over && e.hp > 0) {
        const t = b.player.thorns;
        const absorbed = Math.min(e.block, t);
        e.block -= absorbed;
        e.hp -= (t - absorbed);
        emit(b, { type: 'thorns', amount: t, idx: b.enemies.indexOf(e) });
        if (e.hp <= 0) { e.hp = 0; emit(b, { type: 'enemyDown', idx: b.enemies.indexOf(e), name: e.name }); }
        checkBattleEnd(b);
      }
    }
  }

  function enemyTurnOne(b, e) {
    // dots tick at the start of each enemy's move
    if (e.poison > 0) { e.hp -= e.poison; emit(b, { type: 'dot', kind: 'poison', amount: e.poison, idx: b.enemies.indexOf(e) }); e.poison--; }
    if (e.hp > 0 && e.burn > 0 && e.burnTurns > 0) {
      e.hp -= e.burn; emit(b, { type: 'dot', kind: 'burn', amount: e.burn, idx: b.enemies.indexOf(e) });
      e.burnTurns--; if (e.burnTurns === 0) e.burn = 0;
    }
    if (e.hp <= 0) { e.hp = 0; emit(b, { type: 'enemyDown', idx: b.enemies.indexOf(e), name: e.name }); checkBattleEnd(b); return; }
    if (b.over) return;

    if (e.stun > 0) {
      e.stun--;
      emit(b, { type: 'enemyStunned', idx: b.enemies.indexOf(e) });
    } else {
      const m = enemyIntent(b, e);
      e._choiceIdx = null;
      e.block = 0;
      emit(b, { type: 'enemyAct', move: m, idx: b.enemies.indexOf(e) });
      switch (m.kind) {
        case 'attack': enemyAttack(b, e, m.n, m.hits); break;
        case 'block': e.block += Math.round(m.n * e.dmgMult); break;
        case 'buff': e.str += m.str; break;
        case 'debuff':
          if (m.weak) b.player.weak += m.weak;
          if (m.vuln) b.player.vuln += m.vuln;
          break;
        case 'leech':
          b.player.insight = Math.max(0, b.player.insight - m.insight);
          if (m.n) enemyAttack(b, e, m.n, 1);
          emit(b, { type: 'leeched', amount: m.insight });
          break;
        case 'smolder':
          if (m.n) enemyAttack(b, e, m.n, 1);
          break;
        case 'venom':
          if (m.n) enemyAttack(b, e, m.n, 1);
          break;
        case 'heal': e.hp = Math.min(e.maxHp, e.hp + Math.round(m.n * e.dmgMult)); break;
      }
      e.patternIdx++;
    }
    // durations tick per enemy
    if (e.weak > 0) e.weak--;
    if (e.vuln > 0) e.vuln--;
    if (e.blind > 0) e.blind--;
  }

  function endTurn(b) {
    if (b.over) return;
    emit(b, { type: 'turnEnd', turn: b.turn });
    for (const e of b.enemies) {
      if (b.over) break;
      if (e.hp <= 0) continue;
      enemyTurnOne(b, e);
    }
    if (b.over) return;
    if (b.player.weak > 0) b.player.weak--;
    if (b.player.vuln > 0) b.player.vuln--;
    startPlayerTurn(b);
  }

  /* ============================================================
   * RUN LAYER — map generation, encounters, rewards, forge
   * ============================================================ */
  const NODE_TYPES = { BATTLE: 'battle', ELITE: 'elite', TREASURE: 'treasure', SHRINE: 'shrine', EVENT: 'event', BOSS: 'boss' };

  function encounterFor(rng, world, type, wdata) {
    // Returns [{id, scale}] — multi-enemy packs appear from world 2 on.
    if (type === NODE_TYPES.BOSS) return [{ id: wdata.boss, scale: 1 }];
    if (type === NODE_TYPES.ELITE) return [{ id: pick(rng, wdata.elites), scale: 1 }];
    const r = rng();
    if (world >= 4 && r < 0.18) {
      return [0, 1, 2].map(() => ({ id: pick(rng, wdata.normals), scale: 0.52 }));
    }
    if (world >= 2 && r < 0.42) {
      return [0, 1].map(() => ({ id: pick(rng, wdata.normals), scale: 0.68 }));
    }
    return [{ id: pick(rng, wdata.normals), scale: 1 }];
  }

  function generateWorldMap(rng, world) {
    const columns = [];
    const wdata = EnemyData.BY_WORLD[world];
    for (let stage = 1; stage <= 6; stage++) {
      if (stage === 6) {
        columns.push([{ stage, idx: 0, type: NODE_TYPES.BOSS, enemies: encounterFor(rng, world, NODE_TYPES.BOSS, wdata), next: [] }]);
        continue;
      }
      const count = stage === 1 ? 2 : 2 + Math.floor(rng() * 2);
      const col = [];
      for (let i = 0; i < count; i++) {
        let type = NODE_TYPES.BATTLE;
        if (stage > 1) {
          const r = rng();
          if (r < 0.16) type = NODE_TYPES.ELITE;
          else if (r < 0.30) type = NODE_TYPES.TREASURE;
          else if (r < 0.42) type = NODE_TYPES.SHRINE;
          else if (r < 0.54) type = NODE_TYPES.EVENT;
        }
        const node = { stage, idx: i, type, next: [] };
        if (type === NODE_TYPES.BATTLE || type === NODE_TYPES.ELITE) {
          node.enemies = encounterFor(rng, world, type, wdata);
        }
        col.push(node);
      }
      if (!col.some(n => n.type === NODE_TYPES.BATTLE || n.type === NODE_TYPES.ELITE)) {
        const n = pick(rng, col);
        n.type = NODE_TYPES.BATTLE; n.enemies = encounterFor(rng, world, NODE_TYPES.BATTLE, wdata);
      }
      columns.push(col);
    }
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
    postBattleHealMissingPct: 0.18,
    bossHealMissingPct: 1.0,
    treasureGold: [22, 40],
    treasureCardChance: 0.35,
    shrineHealPct: 0.30,
    shrineGold: 25,
    eliteRelicChance: 1.0,   // elites always drop a relic
    bossRelicChoice: 0,      // bosses give gold/cards/full heal instead — relics come from elites & events
  };

  return {
    makeRng, pick, shuffle,
    HAND_CAP, BASE_ENERGY, FIRST_GUESS_MULT, POWER_MULT, ATTUNE_TIERS,
    makeCard, cardView, createBattle, startPlayerTurn, endTurn,
    playCard, canAfford, guess, canGuess, changeWordLength, serveWord,
    scry, canScry, setTarget, targetEnemy, alive,
    enemyIntent, describeIntent, drainEvents, castSpell,
    NODE_TYPES, generateWorldMap, encounterFor, rollCardRewards, FORGE, RUN_RULES,
    allLearned,
  };
});
