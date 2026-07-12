/* ============================================================
 * LEXICON ARCANUM — Balance simulator
 * Runs complete roguelike runs headlessly with heuristic player
 * policies, using the SAME engine + data the game ships.
 *
 *   node tools/simulate.js [runsPerConfig] [--verbose]
 *
 * Player models:
 *  novice  — doesn't know the word pools; guess success is a
 *            heuristic of feedback gathered, reveals & guess count.
 *  adept   — partial grimoire; consistent-candidate guessing over
 *            LEARNED words, heuristic otherwise.
 *  veteran — large grimoire; strong candidate filtering.
 * ============================================================ */
const Engine = require('../js/engine.js');
const WordData = require('../js/data/words.js');
const CardData = require('../js/data/cards.js');
const ClassData = require('../js/data/classes.js');
const EnemyData = require('../js/data/enemies.js');

const RUNS = Number(process.argv[2]) || 200;
const VERBOSE = process.argv.includes('--verbose');

/* ---------- meta snapshots (grimoire progression across runs) ---------- */
function metaSnapshot(rng, learnedCount, opts) {
  const all = [];
  for (const len of Object.keys(WordData.POOLS)) all.push(...WordData.POOLS[len]);
  const learned = new Set();
  // Learn lower lengths first (that's how real play progresses)
  const ordered = all.slice().sort((a, b) => a.length - b.length || (rng() - 0.5));
  for (let i = 0; i < Math.min(learnedCount, ordered.length); i++) learned.add(ordered[i]);
  return Object.assign({
    learnedWords: learned,
    discoveredPower: new Set(),
    totalWins: 0, bestDifficultyWin: -1, firstGuessCasts: 0, classWins: {}, bestWorld: 1,
  }, opts || {});
}

/* ---------- guessing policies ---------- */
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
  const everyKnown = pool.every(x => b.meta.learnedWords.has(x));

  if (everyKnown) {
    // Grimoire deduction: the answer is one of the fully-known pool.
    let cands = pool.slice();
    for (const g of w.guesses) cands = consistent(cands, g.word, g.marks);
    cands = cands.filter(x => w.revealed.every(r => x[r.i] === r.c));
    cands = cands.filter(x => !w.knownAbsent.some(ch => x.includes(ch)));
    if (!cands.length) cands = [w.answer];
    // skill = how reliably the player runs the elimination
    if (skill === 'novice' && rng() < 0.35) {
      const misread = pool.filter(x => !w.guesses.some(g => g.word === x));
      if (misread.length) return misread[Math.floor(rng() * misread.length)];
    }
    return cands[Math.floor(rng() * cands.length)];
  }

  // Unknown-answer deduction: the mystery word is never an already-learned
  // word (auto-cast guarantees it), so players probe with plausible letters
  // and deduce from feedback. Deducing an unknown fantasy word is genuinely
  // hard — success chances are capped low, rising with familiarity.
  let info = 0;
  for (const g of w.guesses) info += g.marks.filter(m => m !== 'absent').length;
  const mult = skill === 'novice' ? 1.0 : skill === 'adept' ? 1.3 : 1.6;
  const cap = skill === 'novice' ? 0.28 : skill === 'adept' ? 0.45 : 0.6;
  const p = Math.min(cap,
    (0.01 + 0.03 * (gnum - 1) + 0.12 * revealed + 0.015 * info) * mult);
  if (rng() < p) return w.answer;
  // probe: an unlearned pool word (never waste a guess on a learned word)
  const alt = pool.filter(x => x !== w.answer && !b.meta.learnedWords.has(x) && !w.guesses.some(g => g.word === x));
  return alt.length ? alt[Math.floor(rng() * alt.length)] : w.answer.split('').reverse().join('');
}

/* ---------- turn policy ---------- */
function pickLength(b, unlocked, skill) {
  // Prefer the highest length with strong grimoire coverage (autocast chains);
  // otherwise a comfortable low length.
  let best = unlocked[0], bestScore = -1;
  for (const len of unlocked) {
    const pool = WordData.POOLS[len];
    const frac = pool.filter(w => b.meta.learnedWords.has(w)).length / pool.length;
    const power = (len - 4) / 6;
    let score = frac * 2.2 + power * (skill === 'novice' ? 0.25 : 0.8);
    if (skill === 'novice' && len > 7) score -= 0.5;
    if (score > bestScore) { bestScore = score; best = len; }
  }
  return best;
}

function cardScore(c, b) {
  const fx = c.fx;
  const intent = Engine.enemyIntent(b);
  let s = 0;
  s += (fx.dmg || 0) * (fx.hits || 1);
  s += (fx.dmgPerLearned || 0) * b.meta.learnedWords.size;
  s += (fx.dmgPerInsight || 0) * b.player.insight * 0.8;
  if (fx.dmgFromBlock) s += b.player.block;
  s += (fx.block || 0) * (intent.kind === 'attack' ? 1.1 : 0.4);
  s += (fx.blockPerLearned || 0) * b.meta.learnedWords.size * 0.8;
  s += (fx.insight || 0) * 3.2;
  s += (fx.insightRune || 0) * 6;
  s += (fx.freeGuess || 0) * 3.5;
  s += (fx.reveal || 0) * 5.5;
  s += (fx.pruneLetters || 0) * 0.8;
  if (fx.revealVowels) s += 2.5;
  s += (fx.draw || 0) * 2;
  s += (fx.heal || 0) * (b.player.hp < b.player.maxHp * 0.6 ? 1.2 : 0.3);
  s += (fx.str || 0) * 4;
  s += (fx.weak || 0) * 3 + (fx.vuln || 0) * 3;
  s += (fx.poison || 0) * 1.6 + (fx.burn || 0) * 1.4;
  if (fx.stun) s += 12;
  s += (fx.echo || 0) * 0.06 + (fx.twincast ? 8 : 0);
  s += (fx.goldGain || 0) * 0.3;
  s -= (fx.selfDmg || 0) * (b.player.hp < 15 ? 6 : 1.2);
  if (fx.castTome) s += 1; // handled separately
  return s;
}

function bestTomeWord(b, fxCard) {
  const intent = Engine.enemyIntent(b);
  const incoming = intent.kind === 'attack'
    ? (Math.round(intent.n * b.enemy.dmgMult) + b.enemy.str) * (intent.hits || 1) : 0;
  const needBlock = Math.max(0, incoming - b.player.block);
  let best = null, bestVal = 0;
  for (const w of b.meta.learnedWords) {
    const spell = WordData.SPELLS[w];
    const cost = Math.max(0, w.length - 4 - (fxCard.castDiscount || 0) - b.player.castDiscount);
    if (cost > b.player.insight - 1) continue; // keep 1 insight to keep guessing
    const fx = spell.fx;
    const blockVal = Math.min(fx.block || 0, needBlock) * 1.4 + Math.max(0, (fx.block || 0) - needBlock) * 0.2;
    const val = (fx.dmg || 0) + blockVal + (fx.poison || 0) * 1.5 + (fx.burn || 0) * 1.3
      + (fx.str || 0) * 3 + (fx.heal || 0) * (b.player.hp < b.player.maxHp * 0.6 ? 1.0 : 0.3)
      + (fx.stun ? 12 : 0) - cost * 1.2;
    if (val > bestVal) { bestVal = val; best = w; }
  }
  return best;
}

function playTurn(b, skill, rng) {
  // play cards by descending heuristic value
  let guard = 0;
  while (!b.over && guard++ < 30) {
    const playable = b.hand.slice().sort((a, z) => cardScore(z, b) - cardScore(a, b));
    if (!playable.length) break;
    const card = playable[0];
    if (card.fx.castTome) {
      const w = bestTomeWord(b, card.fx);
      if (w) { Engine.playCard(b, card.inst, { tomeWord: w }); continue; }
      // no affordable word: skip tome (leave in hand)
      const rest = playable.slice(1);
      if (!rest.length) break;
      const r = Engine.playCard(b, rest[0].inst);
      if (!r.ok) break;
      continue;
    }
    if (cardScore(card, b) <= 0.5 && b.hand.length < Engine.HAND_CAP) break; // hold junk
    const r = Engine.playCard(b, card.inst);
    if (!r.ok) break;
  }
  // guess while we have insight
  guard = 0;
  while (!b.over && b.word && Engine.canGuess(b) && guard++ < 25) {
    const g = makeGuess(b, skill, rng);
    Engine.guess(b, g);
  }
  if (!b.over) Engine.endTurn(b);
  Engine.drainEvents(b);
}

/* ---------- battle ---------- */
function runBattle(state, enemyId, world, stage, skill, rng) {
  const unlocked = ClassData.unlockedLengths(state.meta);
  const b = Engine.createBattle({
    rng, cls: state.cls, deck: state.deck, hp: state.hp, maxHp: state.maxHp,
    enemyId, world, stage, difficulty: state.diff, meta: state.meta,
    wordLen: 5, insight: state.insight,
  });
  b.wordLen = pickLength(b, unlocked, skill);
  Engine.startPlayerTurn(b);
  Engine.drainEvents(b);
  let turns = 0;
  while (!b.over && turns++ < 60) playTurn(b, skill, rng);
  if (!b.over) { b.over = true; b.won = false; } // stalemate = death (shouldn't happen)
  state.hp = b.player.hp;
  state.insight = b.player.insight;
  state.maxHp = b.player.maxHp;
  state.gold += b.goldGained;
  return { won: b.won, turns, hpLeft: b.player.hp };
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
    hp: cls.hp, maxHp: cls.hp, gold: 0, insight: 0,
    upgrades: 0, removals: 0,
  };
  const result = { world: 1, stage: 0, won: false, battles: 0, turnsTotal: 0, wordsLearnedRun: 0 };
  const learnedBefore = meta.learnedWords.size;

  for (let world = 1; world <= 5; world++) {
    result.world = world;
    const map = Engine.generateWorldMap(rng, world);
    // walk a path: choose next node greedily
    let pos = Math.floor(rng() * map.columns[0].length);
    for (let s = 0; s < 6; s++) {
      const node = map.columns[s][pos];
      result.stage = s + 1;
      if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
        const r = runBattle(state, node.enemyId, world, s + 1, skill, rng);
        result.battles++; result.turnsTotal += r.turns;
        if (!r.won) { result.wordsLearnedRun = meta.learnedWords.size - learnedBefore; return result; }
        const kind = node.type === 'boss' ? 'boss' : node.type;
        state.gold += EnemyData.goldReward(world, kind, state.diff, rng);
        // post battle heal
        const healPct = node.type === 'boss' ? Engine.RUN_RULES.bossHealMissingPct : Engine.RUN_RULES.postBattleHealMissingPct;
        state.hp = Math.min(state.maxHp, state.hp + Math.round((state.maxHp - state.hp) * healPct));
        // card reward
        const bonus = node.type === 'boss' ? 0.7 : node.type === 'elite' ? 0.35 : 0;
        const offers = Engine.rollCardRewards(rng, meta, bonus);
        if (offers.length && state.deck.length < 26) {
          const bestOffer = offers.slice().sort((a, z) => rewardScore(z, state) - rewardScore(a, state))[0];
          if (rewardScore(bestOffer, state) > 6) state.deck.push({ id: bestOffer.id, upgraded: false });
        }
      } else if (node.type === 'treasure') {
        state.gold += Math.round((Engine.RUN_RULES.treasureGold[0] + rng() * (Engine.RUN_RULES.treasureGold[1] - Engine.RUN_RULES.treasureGold[0])) * state.diff.goldMult);
        if (rng() < Engine.RUN_RULES.treasureCardChance && state.deck.length < 26) {
          const offers = Engine.rollCardRewards(rng, meta, 0.2);
          if (offers.length) state.deck.push({ id: offers[0].id, upgraded: false });
        }
      } else if (node.type === 'shrine') {
        if (state.hp < state.maxHp * 0.65) state.hp = Math.min(state.maxHp, state.hp + Math.round(state.maxHp * Engine.RUN_RULES.shrineHealPct));
        else {
          // runic vision: learn a random unlearned word from unlocked lengths
          const unlocked = ClassData.unlockedLengths(meta);
          const unknown = [];
          for (const len of unlocked) for (const w of WordData.POOLS[len]) if (!meta.learnedWords.has(w)) unknown.push(w);
          if (unknown.length) meta.learnedWords.add(unknown[Math.floor(rng() * unknown.length)]);
          else state.gold += Engine.RUN_RULES.shrineGold;
        }
      }
      // forge visits between stages: upgrade greedily
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
  return result;
}

function rewardScore(cardDef, state) {
  const fx = cardDef.fx;
  let s = 0;
  s += (fx.dmg || 0) * (fx.hits || 1) + (fx.block || 0) * 0.8 + (fx.insight || 0) * 3.5;
  s += (fx.reveal || 0) * 6 + (fx.insightRune || 0) * 7 + (fx.draw || 0) * 2 + (fx.str || 0) * 4;
  s += (fx.poison || 0) * 1.5 + (fx.burn || 0) * 1.3 + (fx.weak || 0) * 2.5 + (fx.vuln || 0) * 2.5;
  s += (fx.dmgPerLearned || 0) * state.meta.learnedWords.size;
  if (fx.castTome && state.meta.learnedWords.size > 15) s += 10;
  if (fx.stun) s += 10;
  s += (fx.heal || 0) * 0.5 + (fx.freeGuess || 0) * 4;
  return s;
}

/* ---------- experiment matrix ---------- */
function runConfig(label, clsId, diffIdx, learned, skill, n, metaOpts) {
  let wins = 0, worldSum = 0, stageSum = 0, battleTurns = 0, battles = 0, wordsLearned = 0;
  const worldDeaths = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const r = simulateRun(clsId, diffIdx, learned, skill, 1e6 * diffIdx + learned * 1000 + i * 7 + 13, metaOpts);
    if (r.won) wins++;
    else worldDeaths[r.world]++;
    worldSum += r.world + (r.won ? 1 : 0);
    stageSum += r.stage;
    battleTurns += r.turnsTotal; battles += r.battles;
    wordsLearned += r.wordsLearnedRun;
  }
  const out = {
    label, winPct: (100 * wins / n), avgWorld: worldSum / n, avgTurnsPerBattle: battleTurns / Math.max(1, battles),
    wordsPerRun: wordsLearned / n, deaths: worldDeaths.slice(1),
  };
  console.log(
    `${label.padEnd(44)} win ${out.winPct.toFixed(0).padStart(3)}%  reach ${out.avgWorld.toFixed(2)}  ` +
    `turns/battle ${out.avgTurnsPerBattle.toFixed(1)}  words/run ${out.wordsPerRun.toFixed(1)}  deaths ${out.deaths.join('/')}`
  );
  return out;
}

console.log(`\n=== LEXICON ARCANUM balance sim (${RUNS} runs/config) ===\n`);
console.log('--- Fresh grimoire (first runs) ---');
runConfig('scribe  novice-diff fresh(0w)   novice', 'scribe', 0, 0, 'novice', RUNS);
runConfig('oracle  novice-diff fresh(0w)   novice', 'oracle', 0, 0, 'novice', RUNS);
runConfig('warmage novice-diff fresh(0w)   novice', 'warmage', 0, 0, 'novice', RUNS);

console.log('--- Growing grimoire ---');
runConfig('scribe  novice-diff 30 words    adept', 'scribe', 0, 30, 'adept', RUNS);
runConfig('scribe  novice-diff 65 words    adept', 'scribe', 0, 65, 'adept', RUNS);
runConfig('oracle  novice-diff 65 words    adept', 'oracle', 0, 65, 'adept', RUNS);

console.log('--- Deep grimoire (unlocked 8-9L: wins=5, best diff win=Adept) ---');
const DEEP = { totalWins: 5, bestDifficultyWin: 1, classWins: { scribe: 1, oracle: 1, warmage: 1 } };
runConfig('scribe  novice-diff 140 words   veteran', 'scribe', 0, 140, 'veteran', RUNS, DEEP);
runConfig('oracle  novice-diff 140 words   veteran', 'oracle', 0, 140, 'veteran', RUNS, DEEP);
runConfig('warmage novice-diff 140 words   veteran', 'warmage', 0, 140, 'veteran', RUNS, DEEP);
runConfig('archivist novice-diff 140 words veteran', 'archivist', 0, 140, 'veteran', RUNS, DEEP);

console.log('--- Higher difficulties (veteran, deep grimoire) ---');
const FULL = { totalWins: 9, bestDifficultyWin: 2, classWins: { scribe: 1, oracle: 1, warmage: 1 } };
runConfig('scribe  ADEPT   140 words       veteran', 'scribe', 1, 140, 'veteran', RUNS, DEEP);
runConfig('scribe  MASTER  160 words       veteran', 'scribe', 2, 160, 'veteran', RUNS, FULL);
runConfig('scribe  ARCHMAGE 180 words      veteran', 'scribe', 3, 180, 'veteran', RUNS, FULL);
runConfig('archivist ARCHMAGE 180 words    veteran', 'archivist', 3, 180, 'veteran', RUNS, FULL);
