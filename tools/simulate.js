/* ============================================================
 * LEXICON ARCANUM — Balance simulator v2
 * Complete headless runs with heuristic players, on the SAME
 * engine + data the game ships (energy, multi-enemy, relics,
 * schools, scry, attunement, events).
 *
 *   node tools/simulate.js [runsPerConfig]
 * ============================================================ */
const Engine = require('../js/engine.js');
const WordData = require('../js/data/words.js');
const CardData = require('../js/data/cards.js');
const ClassData = require('../js/data/classes.js');
const EnemyData = require('../js/data/enemies.js');
const RelicData = require('../js/data/relics.js');
const EventData = require('../js/data/events.js');
const ArcanaData = require('../js/data/arcana.js');

const RUNS = Number(process.argv[2]) || 200;

/* ---------- meta snapshots ---------- */
function metaSnapshot(rng, learnedCount, opts) {
  const all = [];
  for (const len of Object.keys(WordData.POOLS)) all.push(...WordData.POOLS[len]);
  const learned = new Set();
  const ordered = all.slice().sort((a, b) => a.length - b.length || (rng() - 0.5));
  for (let i = 0; i < Math.min(learnedCount, ordered.length); i++) learned.add(ordered[i]);
  return Object.assign({
    learnedWords: learned,
    discoveredPower: new Set(),
    totalWins: 0, bestDifficultyWin: -1, firstGuessCasts: 0, classWins: {}, bestWorld: 1,
  }, opts || {});
}

/* ---------- guessing policies (cognition model, sim-only) ---------- */
function consistent(cands, guessed, marks) {
  return cands.filter(w => {
    if (w === guessed) return false;
    const m = WordData.judgeGuess(guessed, w);
    for (let i = 0; i < m.length; i++) if (m[i] !== marks[i]) return false;
    return true;
  });
}

function makeGuess(b, skill, rng) {
  const w = b.word;
  const len = w.len;
  const pool = WordData.POOLS[len];
  const revealed = w.revealed.length;
  const gnum = w.guesses.length + 1;

  // Learned words can BE the answer now, so every player consults their
  // grimoire: filter LEARNED words (the only ones a player can enumerate)
  // against the feedback gathered so far. Unlearned answers eliminate the
  // learned candidates quickly, dropping play into blind deduction below.
  let cands = pool.filter(x => b.meta.learnedWords.has(x));
  for (const g of w.guesses) cands = consistent(cands, g.word, g.marks);
  cands = cands.filter(x => w.revealed.every(r => x[r.i] === r.c));
  cands = cands.filter(x => !w.knownAbsent.some(ch => x.includes(ch)));
  const trust = skill === 'novice' ? 0.5 : skill === 'adept' ? 0.8 : 0.9;
  if (cands.length && rng() < trust) {
    return cands[Math.floor(rng() * cands.length)];
  }

  // Otherwise deduce an unknown fantasy word the hard way.
  let info = 0;
  for (const g of w.guesses) info += g.marks.filter(m => m !== 'absent').length;
  info += Math.min(6, w.knownAbsent.length) * 0.3; // scry/prune knowledge helps a little
  const mult = skill === 'novice' ? 1.0 : skill === 'adept' ? 1.3 : 1.6;
  const cap = skill === 'novice' ? 0.28 : skill === 'adept' ? 0.45 : 0.6;
  const p = Math.min(cap,
    (0.01 + 0.03 * (gnum - 1) + 0.12 * revealed + 0.015 * info) * mult);
  if (rng() < p) return w.answer;
  const alt = pool.filter(x => x !== w.answer && !w.guesses.some(g => g.word === x));
  return alt.length ? alt[Math.floor(rng() * alt.length)] : w.answer.split('').reverse().join('');
}

/* ---------- turn policy ---------- */
function pickLength(b, unlocked, skill) {
  let best = unlocked[0], bestScore = -1;
  for (const len of unlocked) {
    const pool = WordData.POOLS[len];
    const frac = pool.filter(w => b.meta.learnedWords.has(w)).length / pool.length;
    const power = (len - 4) / 6;
    let score = frac * 2.2 + power * (skill === 'novice' ? 0.25 : 0.8);
    if (skill === 'novice' && len > 7) score -= 0.5;
    if (b.lengthsCast.includes(len)) score -= 0.6; // chase attunement variety
    if (score > bestScore) { bestScore = score; best = len; }
  }
  return best;
}

function cardScore(c, b) {
  const fx = c.fx;
  const tgt = Engine.targetEnemy(b);
  const foes = Engine.alive(b).length;
  const intent = tgt ? Engine.enemyIntent(b, tgt) : { kind: 'attack', n: 0 };
  const aoeMult = fx.aoe ? Math.max(1, foes * 0.85) : 1;
  let s = 0;
  s += (fx.dmg || 0) * (fx.hits || 1) * aoeMult;
  s += (fx.dmgPerLearned || 0) * b.meta.learnedWords.size;
  s += (fx.dmgPerInsight || 0) * b.player.insight * 0.8;
  s += (fx.dmgPerAttuned || 0) * b.lengthsCast.length;
  if (fx.dmgFromBlock) s += b.player.block;
  s += (fx.block || 0) * (intent.kind === 'attack' ? 1.1 : 0.4);
  s += (fx.blockPerLearned || 0) * b.meta.learnedWords.size * 0.8;
  s += (fx.insight || 0) * 3.2;
  s += (fx.insightRune || 0) * 6;
  s += (fx.energyNow || 0) * 3;
  s += (fx.energyMax || 0) * 8;
  s += (fx.freeGuess || 0) * 3.5;
  s += (fx.reveal || 0) * 5.5;
  s += (fx.pruneLetters || 0) * 0.8;
  if (fx.revealVowels) s += 2.5;
  s += (fx.draw || 0) * 2;
  s += (fx.heal || 0) * (b.player.hp < b.player.maxHp * 0.6 ? 1.2 : 0.3);
  s += (fx.str || 0) * 4;
  s += ((fx.weak || 0) + (fx.vuln || 0)) * 3 * aoeMult;
  s += ((fx.poison || 0) * 1.6 + (fx.burn || 0) * 1.4) * aoeMult;
  if (fx.stun) s += 12 * aoeMult;
  if (fx.castRandom) s += 12;
  s += (fx.echo || 0) * 0.06 + (fx.twincast ? 8 : 0);
  s += (fx.goldGain || 0) * 0.3;
  s -= (fx.selfDmg || 0) * (b.player.hp < 15 ? 6 : 1.2);
  if (fx.castTome) s += 1;
  return s;
}

function bestTomeWord(b, fxCard) {
  const tgt = Engine.targetEnemy(b);
  const intent = tgt ? Engine.enemyIntent(b, tgt) : null;
  const incoming = intent && intent.kind === 'attack'
    ? (Math.round(intent.n * tgt.dmgMult) + tgt.str) * (intent.hits || 1) : 0;
  const needBlock = Math.max(0, incoming - b.player.block);
  let best = null, bestVal = 0;
  for (const w of b.meta.learnedWords) {
    const spell = WordData.SPELLS[w];
    const cost = Math.max(0, w.length - 4 - (fxCard.castDiscount || 0) - b.player.castDiscount);
    if (cost > b.player.insight - 1) continue;
    const fx = spell.fx;
    const foes = Engine.alive(b).length;
    const aoeMult = fx.aoe ? Math.max(1, foes * 0.85) : 1;
    const blockVal = Math.min(fx.block || 0, needBlock) * 1.4 + Math.max(0, (fx.block || 0) - needBlock) * 0.2;
    let val = (fx.dmg || 0) * aoeMult + blockVal + (fx.poison || 0) * 1.5 + (fx.burn || 0) * 1.3
      + (fx.str || 0) * 3 + (fx.heal || 0) * (b.player.hp < b.player.maxHp * 0.6 ? 1.0 : 0.3)
      + (fx.stun ? 12 : 0) + (fx.energyMax || 0) * 8 - cost * 1.2;
    if (!b.lengthsCast.includes(spell.len)) val += 3; // attunement chase
    if (val > bestVal) { bestVal = val; best = w; }
  }
  return best;
}

function playTurn(b, skill, rng) {
  // scry with a frequent letter we know nothing about
  if (Engine.canScry(b) && b.word) {
    const seq = 'EAROTLISNUCMPDHV';
    for (const ch of seq) {
      const w = b.word;
      const known = w.knownAbsent.includes(ch) || (w.vowelInfo && w.vowelInfo[ch]) ||
        w.guesses.some(g => g.word.includes(ch)) || w.revealed.some(r => r.c === ch);
      if (!known) { Engine.scry(b, ch); break; }
    }
  }
  // target lowest-hp foe
  const foes = Engine.alive(b);
  if (foes.length > 1) {
    const lowest = foes.reduce((a, z) => (z.hp < a.hp ? z : a));
    Engine.setTarget(b, b.enemies.indexOf(lowest));
  }
  // play cards greedily by value-per-energy while affordable
  let guard = 0;
  while (!b.over && guard++ < 40) {
    const affordable = b.hand.filter(c => Engine.canAfford(b, c));
    if (!affordable.length) break;
    const ranked = affordable.slice().sort((a, z) =>
      (cardScore(z, b) / Math.max(0.5, z.cost)) - (cardScore(a, b) / Math.max(0.5, a.cost)));
    const card = ranked[0];
    if (card.fx.castTome) {
      const w = bestTomeWord(b, card.fx);
      if (w) { Engine.playCard(b, card.inst, { tomeWord: w }); continue; }
      const rest = ranked.slice(1);
      if (!rest.length) break;
      if (cardScore(rest[0], b) <= 0.5) break;
      const r = Engine.playCard(b, rest[0].inst);
      if (!r.ok) break;
      continue;
    }
    if (cardScore(card, b) <= 0.5 && b.hand.length < Engine.HAND_CAP) break;
    const r = Engine.playCard(b, card.inst);
    if (!r.ok) break;
  }
  // guess while we have insight; switch lengths for attunement when smart
  guard = 0;
  while (!b.over && b.word && Engine.canGuess(b) && guard++ < 25) {
    if (skill !== 'novice' && b.word.guesses.length === 0 && b.lengthsCast.length >= 1 && b.lengthsCast.length < 3) {
      const unlocked = ClassData.unlockedLengths(b.meta);
      const better = pickLength(b, unlocked, skill);
      if (better !== b.word.len) { Engine.changeWordLength(b, better); if (b.over || !b.word) break; }
    }
    const g = makeGuess(b, skill, rng);
    Engine.guess(b, g);
  }
  if (!b.over) Engine.endTurn(b);
  Engine.drainEvents(b);
}

/* ---------- battle ---------- */
function runBattle(state, enemies, world, stage, skill, rng) {
  const unlocked = ClassData.unlockedLengths(state.meta);
  const b = Engine.createBattle({
    rng, cls: state.cls, deck: state.deck, hp: state.hp, maxHp: state.maxHp,
    enemyIds: enemies, world, stage, difficulty: state.diff, meta: state.meta,
    wordLen: 5, relics: state.relics,
    condition: state.condition, sigils: state.sigils, savedWord: state.savedWord,
  });
  if (!state.savedWord) b.wordLen = pickLength(b, unlocked, skill);
  state.savedWord = null;
  Engine.startPlayerTurn(b);
  Engine.drainEvents(b);
  let turns = 0;
  while (!b.over && turns++ < 60) playTurn(b, skill, rng);
  if (!b.over) { b.over = true; b.won = false; }
  state.savedWord = Engine.exportWord(b); // unsolved deduction follows the run
  state.hp = b.player.hp;
  state.maxHp = b.player.maxHp;
  state.gold += b.goldGained;
  return { won: b.won, turns, hpLeft: b.player.hp };
}

function pickSigils(state) {
  // slot the three heaviest-hitting learned words
  const scored = Array.from(state.meta.learnedWords).map(w => {
    const fx = WordData.SPELLS[w].fx;
    return { w, v: (fx.dmg || 0) + (fx.block || 0) * 0.6 + (fx.poison || 0) + (fx.burn || 0) };
  }).sort((a, z) => z.v - a.v);
  return scored.slice(0, 3).map(x => x.w);
}

/* ---------- events ---------- */
function applyEvent(state, rng, world) {
  const ev = EventData.EVENTS[Math.floor(rng() * EventData.EVENTS.length)];
  // policy: prefer relic > learn > heal-if-low > gold; skip costs we can't pay
  const scored = ev.choices.map(c => {
    const fx = c.fx;
    let s = 0;
    if (fx.relicRandom) s += 20;
    if (fx.learnRandom) s += 12 * fx.learnRandom;
    if (fx.healPct) s += state.hp < state.maxHp * 0.55 ? 18 : 3;
    if (fx.upgradeFree) s += 8 * fx.upgradeFree;
    if (fx.gold > 0) s += fx.gold * 0.25;
    if (fx.gamble) s += state.gold > 120 ? 4 : -5;
    if (fx.maxHp < 0) s -= 8;
    if (fx.hp < 0) s -= (state.hp < 25 ? 15 : 3);
    if (c.cost && state.gold < c.cost) s = -99;
    return s;
  });
  const choice = ev.choices[scored.indexOf(Math.max(...scored))];
  const fx = choice.fx;
  if (fx.gold) state.gold = Math.max(0, state.gold + fx.gold);
  if (fx.hp) state.hp = Math.max(1, state.hp + fx.hp);
  if (fx.maxHp) { state.maxHp = Math.max(20, state.maxHp + fx.maxHp); state.hp = Math.min(state.hp, state.maxHp); }
  if (fx.healPct) state.hp = Math.min(state.maxHp, state.hp + Math.round(state.maxHp * fx.healPct));
  if (fx.relicRandom) {
    const r = RelicData.roll(rng, state.relics, 1);
    if (r.length) state.relics.push(r[0].id);
  }
  if (fx.learnRandom) {
    const unlocked = ClassData.unlockedLengths(state.meta);
    for (let i = 0; i < fx.learnRandom; i++) {
      const unknown = [];
      for (const len of unlocked) for (const w of WordData.POOLS[len]) if (!state.meta.learnedWords.has(w)) unknown.push(w);
      if (unknown.length) state.meta.learnedWords.add(unknown[Math.floor(rng() * unknown.length)]);
    }
  }
  if (fx.upgradeFree) {
    for (let i = 0; i < fx.upgradeFree; i++) {
      const t = state.deck.find(c => !c.upgraded);
      if (t) t.upgraded = true;
    }
  }
  if (fx.gamble) {
    if (state.gold >= fx.gamble.stake) {
      state.gold -= fx.gamble.stake;
      if (rng() < fx.gamble.chance) state.gold += fx.gamble.win;
    }
  }
  if (fx.dupeCard) {
    const best = state.deck.slice().sort((a, z) => 0)[0];
    if (best && state.deck.length < 28) state.deck.push(Object.assign({}, best));
  }
  if (fx.cardOffer != null) {
    const offers = Engine.rollCardRewards(rng, state.meta, fx.cardOffer, { aetheria: Engine.aetheriaEligible(world, state.diff) });
    if (offers.length && state.deck.length < 26) state.deck.push({ id: offers[0].id, upgraded: false });
  }
}

/* ---------- full run ---------- */
function simulateRun(clsId, diffIdx, learnedCount, skill, seed, metaOpts) {
  const rng = Engine.makeRng(seed);
  const cls = ClassData.CLASSES.find(c => c.id === clsId);
  const diff = ClassData.DIFFICULTIES[diffIdx];
  const meta = metaSnapshot(rng, learnedCount,
    metaOpts || (diffIdx > 0 ? { totalWins: 1, bestDifficultyWin: diffIdx - 1 } : {}));
  const state = {
    cls, diff, meta,
    deck: cls.deck.map(id => ({ id, upgraded: false })),
    hp: cls.hp, maxHp: cls.hp, gold: 0,
    upgrades: 0, removals: 0, relics: [],
    condition: null, sigils: [], savedWord: null,
  };
  const result = { world: 1, stage: 0, won: false, battles: 0, turnsTotal: 0, wordsLearnedRun: 0, relics: 0 };
  const learnedBefore = meta.learnedWords.size;

  for (let world = 1; world <= 5; world++) {
    result.world = world;
    const variants = EnemyData.variantsForTier(world);
    const wchoice = variants[Math.floor(rng() * variants.length)];
    state.condition = ArcanaData.CONDITIONS[Math.floor(rng() * ArcanaData.CONDITIONS.length)].mod;
    state.sigils = pickSigils(state);
    const map = Engine.generateWorldMap(rng, world, wchoice.id);
    let pos = Math.floor(rng() * map.columns[0].length);
    for (let s = 0; s < 6; s++) {
      const node = map.columns[s][pos];
      result.stage = s + 1;
      if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
        const r = runBattle(state, node.enemies, world, s + 1, skill, rng);
        result.battles++; result.turnsTotal += r.turns;
        if (!r.won) { result.wordsLearnedRun = meta.learnedWords.size - learnedBefore; result.relics = state.relics.length; return result; }
        const kind = node.type;
        let gold = EnemyData.goldReward(world, kind === 'boss' ? 'boss' : kind, state.diff, rng, map.risky);
        gold = Math.round(gold * (1 + RelicData.mod(state.relics, 'aurumPct') / 100));
        gold = Math.round(gold * (1 + ((state.condition && state.condition.goldPct) || 0) / 100));
        state.gold += gold;
        const healPct = node.type === 'boss' ? Engine.RUN_RULES.bossHealMissingPct : Engine.RUN_RULES.postBattleHealMissingPct;
        state.hp = Math.min(state.maxHp, state.hp + Math.round((state.maxHp - state.hp) * healPct));
        state.hp = Math.min(state.maxHp, state.hp + RelicData.mod(state.relics, 'healAfterBattle'));
        // relic drops
        if (node.type === 'elite') {
          const r2 = RelicData.roll(rng, state.relics, 1);
          if (r2.length) state.relics.push(r2[0].id);
        }
        const bonus = node.type === 'boss' ? 0.7 : node.type === 'elite' ? 0.35 : 0;
        const offers = Engine.rollCardRewards(rng, state.meta, bonus, { aetheria: Engine.aetheriaEligible(world, state.diff), guaranteeAetheria: node.type === 'boss' });
        if (offers.length && state.deck.length < 26) {
          const bestOffer = offers.slice().sort((a, z) => rewardScore(z, state) - rewardScore(a, state))[0];
          if (rewardScore(bestOffer, state) > 6) state.deck.push({ id: bestOffer.id, upgraded: false });
        }
      } else if (node.type === 'treasure') {
        state.gold += Math.round((Engine.RUN_RULES.treasureGold[0] + rng() * (Engine.RUN_RULES.treasureGold[1] - Engine.RUN_RULES.treasureGold[0])) * state.diff.goldMult);
        if (rng() < Engine.RUN_RULES.treasureCardChance && state.deck.length < 26) {
          const offers = Engine.rollCardRewards(rng, state.meta, 0.2, { aetheria: Engine.aetheriaEligible(world, state.diff) });
          if (offers.length) state.deck.push({ id: offers[0].id, upgraded: false });
        }
      } else if (node.type === 'shrine') {
        if (state.hp < state.maxHp * 0.65) state.hp = Math.min(state.maxHp, state.hp + Math.round(state.maxHp * Engine.RUN_RULES.shrineHealPct));
        else {
          const unlocked = ClassData.unlockedLengths(meta);
          const unknown = [];
          for (const len of unlocked) for (const w of WordData.POOLS[len]) if (!meta.learnedWords.has(w)) unknown.push(w);
          if (unknown.length) meta.learnedWords.add(unknown[Math.floor(rng() * unknown.length)]);
          else state.gold += Engine.RUN_RULES.shrineGold;
        }
      } else if (node.type === 'event') {
        applyEvent(state, rng, world);
      }
      while (state.gold >= Engine.FORGE.upgradeCost(state.upgrades) + 40) {
        const target = state.deck.find(c => !c.upgraded && (CardData.BY_ID[c.id].fx.dmg || CardData.BY_ID[c.id].fx.block || CardData.BY_ID[c.id].fx.insight));
        if (!target) break;
        state.gold -= Engine.FORGE.upgradeCost(state.upgrades);
        state.upgrades++;
        target.upgraded = true;
      }
      if (s < 5) {
        const nexts = node.next.length ? node.next : [0];
        pos = nexts[Math.floor(rng() * nexts.length)];
        pos = Math.min(pos, map.columns[s + 1].length - 1);
      }
    }
  }
  result.won = true;
  result.wordsLearnedRun = meta.learnedWords.size - learnedBefore;
  result.relics = state.relics.length;
  return result;
}

function rewardScore(cardDef, state) {
  const fx = cardDef.fx;
  let s = 0;
  s += (fx.dmg || 0) * (fx.hits || 1) + (fx.block || 0) * 0.8 + (fx.insight || 0) * 3.5;
  s += (fx.reveal || 0) * 6 + (fx.insightRune || 0) * 7 + (fx.draw || 0) * 2 + (fx.str || 0) * 4;
  s += (fx.poison || 0) * 1.5 + (fx.burn || 0) * 1.3 + (fx.weak || 0) * 2.5 + (fx.vuln || 0) * 2.5;
  s += (fx.dmgPerLearned || 0) * state.meta.learnedWords.size;
  s += (fx.energyMax || 0) * 9 + (fx.energyNow || 0) * 2;
  if (fx.aoe) s *= 1.3;
  if (fx.castTome && state.meta.learnedWords.size > 15) s += 10;
  if (fx.castRandom && state.meta.learnedWords.size > 30) s += 12;
  if (fx.stun) s += 10;
  s += (fx.heal || 0) * 0.5 + (fx.freeGuess || 0) * 4;
  s -= (cardDef.cost || 0) * 1.5;
  if (cardDef.rarity === 'aetheria') s += 20; // raw power is never a dead pick
  return s;
}

/* ---------- experiment matrix ---------- */
function runConfig(label, clsId, diffIdx, learned, skill, n, metaOpts) {
  let wins = 0, worldSum = 0, battleTurns = 0, battles = 0, wordsLearned = 0, relicsSum = 0;
  const worldDeaths = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const r = simulateRun(clsId, diffIdx, learned, skill, 1e6 * diffIdx + learned * 1000 + i * 7 + 13, metaOpts);
    if (r.won) wins++;
    else worldDeaths[r.world]++;
    worldSum += r.world + (r.won ? 1 : 0);
    battleTurns += r.turnsTotal; battles += r.battles;
    wordsLearned += r.wordsLearnedRun;
    relicsSum += r.relics;
  }
  console.log(
    `${label.padEnd(44)} win ${(100 * wins / n).toFixed(0).padStart(3)}%  reach ${(worldSum / n).toFixed(2)}  ` +
    `turns/battle ${(battleTurns / Math.max(1, battles)).toFixed(1)}  words/run ${(wordsLearned / n).toFixed(1)}  ` +
    `relics ${(relicsSum / n).toFixed(1)}  deaths ${worldDeaths.slice(1).join('/')}`
  );
}

console.log(`\n=== LEXICON ARCANUM v2 balance sim (${RUNS} runs/config) ===\n`);
console.log('--- Fresh grimoire (first runs) ---');
runConfig('scribe  novice-diff fresh(0w)   novice', 'scribe', 0, 0, 'novice', RUNS);
runConfig('oracle  novice-diff fresh(0w)   novice', 'oracle', 0, 0, 'novice', RUNS);
runConfig('warmage novice-diff fresh(0w)   novice', 'warmage', 0, 0, 'novice', RUNS);

console.log('--- Growing grimoire ---');
runConfig('scribe  novice-diff 30 words    adept', 'scribe', 0, 30, 'adept', RUNS);
runConfig('scribe  novice-diff 65 words    adept', 'scribe', 0, 65, 'adept', RUNS);
runConfig('oracle  novice-diff 65 words    adept', 'oracle', 0, 65, 'adept', RUNS);

console.log('--- Deep grimoire (8-9L unlocked) ---');
const DEEP = { totalWins: 5, bestDifficultyWin: 1, classWins: { scribe: 1, oracle: 1, warmage: 1 } };
runConfig('scribe  novice-diff 140 words   veteran', 'scribe', 0, 140, 'veteran', RUNS, DEEP);
runConfig('oracle  novice-diff 140 words   veteran', 'oracle', 0, 140, 'veteran', RUNS, DEEP);
runConfig('warmage novice-diff 140 words   veteran', 'warmage', 0, 140, 'veteran', RUNS, DEEP);
runConfig('archivist novice-diff 140 words veteran', 'archivist', 0, 140, 'veteran', RUNS, DEEP);

console.log('--- ANCHORS: fresh ~1%, full grimoire ~25% (Novice) ---');
const FULL = { totalWins: 9, bestDifficultyWin: 2, classWins: { scribe: 1, oracle: 1, warmage: 1 } };
runConfig('scribe  novice-diff 180 words   veteran', 'scribe', 0, 180, 'veteran', RUNS, FULL);

console.log('--- Higher difficulties (veteran, deep grimoire) ---');
runConfig('scribe  ADEPT   140 words       veteran', 'scribe', 1, 140, 'veteran', RUNS, DEEP);
runConfig('scribe  MASTER  160 words       veteran', 'scribe', 2, 160, 'veteran', RUNS, FULL);
runConfig('scribe  ARCHMAGE 180 words      veteran', 'scribe', 3, 180, 'veteran', RUNS, FULL);
runConfig('archivist ARCHMAGE 180 words    veteran', 'archivist', 3, 180, 'veteran', RUNS, FULL);
