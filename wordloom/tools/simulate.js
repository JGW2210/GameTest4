/* WORDLOOM — light balance sim: full runs, scripted player, on the
 * shipped engine. Cognition model: chance to solve the mystery word
 * grows with guesses made, revealed runes, and morphology knowledge.
 *   node wordloom/tools/simulate.js [runsPerConfig]
 */
const Loom = require('../js/engine.js');
const Morph = require('../js/data/morphology.js');

const RUNS = Number(process.argv[2]) || 300;

function metaWith(rng, n) {
  const meta = { learned: new Set(['IGNA', 'SANA']), runs: 0, wins: 0, bestNode: 0 };
  const shortFirst = Morph.LIST.slice().sort((a, z) => a.len - z.len || (rng() - 0.5));
  for (let i = 0; i < Math.min(n, shortFirst.length); i++) meta.learned.add(shortFirst[i].word);
  return meta;
}

/* solve chance: base skill + info gathered + language knowledge */
function trySolve(b, rng, skill) {
  const m = b.mystery;
  const known = Morph.knownParts(b.run.meta.learned);
  const gnum = m.guesses.length;
  const revealed = m.revealed.length;
  // knowing the element roots narrows a 4-5L word massively; centers narrow long words
  let langBonus = 0;
  if (m.len <= 6) langBonus = Math.min(0.30, known.els.size * 0.03);
  else langBonus = Math.min(0.35, known.els.size * 0.02 + known.centers.size * 0.04);
  const p = Math.min(0.75, skill + gnum * 0.09 + revealed * 0.13 + langBonus);
  if (rng() < p) return m.answer;
  // otherwise a plausible wrong guess: any lexicon word of that length
  const pool = Morph.LIST.filter(e => e.len === m.len && e.word !== m.answer);
  return pool[Math.floor(rng() * pool.length)].word;
}

function playBattle(b, rng, skill) {
  let guard = 0;
  while (!b.over && guard++ < 40) {
    // cast the strongest spellable word vs the target's affinity
    let cast = true, casts = 0;
    while (cast && !b.over && casts < 4) {
      cast = false;
      const tgt = Loom.targetFoe(b);
      const options = Loom.spellableWords(b);
      if (options.length && tgt) {
        const scored = options.map(e => {
          let v = (e.fx.dmg || 0) + (e.fx.burn || 0) + (e.fx.poison || 0) + (e.fx.heal || 0) * 0.5 + (e.fx.block || 0) * 0.4;
          if (tgt.weakTo === e.el) v *= 1.5;
          if (tgt.resist === e.el) v *= 0.5;
          if (e.fx.heal && b.player.hp > b.player.maxHp * 0.7) v *= 0.2;
          return { e, v };
        }).sort((a, z) => z.v - a.v);
        if (scored[0].v > 2) { Loom.castWord(b, scored[0].e.word); cast = true; casts++; }
      }
    }
    if (b.over) break;
    if (Loom.canGuess(b)) Loom.guess(b, trySolve(b, rng, skill));
    if (!b.over) Loom.endTurn(b);
  }
  if (!b.over) { b.over = true; b.won = false; }
  return b.won;
}

function simulateRun(learned, skill, seed) {
  const rng = Loom.makeRng(seed);
  const meta = metaWith(rng, learned);
  const run = Loom.newRun(seed * 7 + 1, meta);
  for (let i = 0; i < run.nodes.length; i++) {
    run.nodeIdx = i;
    const node = run.nodes[i];
    if (node.type === 'camp') {
      const choice = run.hp < run.maxHp * 0.6 ? { kind: 'rest' } : { kind: 'reflect' };
      Loom.applyCamp(run, choice);
      continue;
    }
    const b = Loom.battleForNode(run, node);
    if (!playBattle(b, rng, skill)) return { won: false, node: i, learned: meta.learned.size };
    // reward policy: study > loom > infuse > mend-if-low
    const offers = Loom.rollRewards(run);
    const rank = (o) => o.kind === 'study' ? 4 : o.kind === 'loom' ? 3 : (o.kind === 'mend' && run.hp < run.maxHp * 0.6) ? 5 : o.kind === 'infuse' ? 2 : 1;
    offers.sort((a, z) => rank(z) - rank(a));
    Loom.applyReward(run, offers[0]);
  }
  return { won: true, node: run.nodes.length, learned: run.meta.learned.size };
}

function config(label, learned, skill) {
  let wins = 0, nodeSum = 0, wordsGained = 0;
  const deaths = new Array(9).fill(0);
  for (let i = 0; i < RUNS; i++) {
    const r = simulateRun(learned, skill, 1000 + learned * 31 + i * 13);
    if (r.won) wins++; else deaths[r.node]++;
    nodeSum += r.node;
    wordsGained += r.learned - Math.min(learned, 270);
  }
  console.log(`${label.padEnd(38)} win ${(100 * wins / RUNS).toFixed(0).padStart(3)}%  reach ${(nodeSum / RUNS).toFixed(1)}/8  +words ${(wordsGained / RUNS).toFixed(1)}  deaths ${deaths.join('/')}`);
}

console.log(`\n=== WORDLOOM balance (${RUNS} runs/config) — 8-node spiral ===\n`);
config('fresh grimoire, novice (skill .04)', 0, 0.04);
config('fresh grimoire, sharp  (skill .10)', 0, 0.10);
config('12 words, novice', 12, 0.04);
config('30 words, sharp', 30, 0.10);
config('60 words, sharp', 60, 0.10);
config('120 words, sharp', 120, 0.10);
config('full 270, sharp', 270, 0.10);
