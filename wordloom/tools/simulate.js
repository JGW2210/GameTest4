/* WORDLOOM — light balance sim: full runs, scripted player, on the
 * shipped engine. Cognition model: chance to solve the mystery word
 * grows with guesses made, revealed runes, and morphology knowledge.
 *   node wordloom/tools/simulate.js [runsPerConfig]
 */
const Loom = require('../js/engine.js');
const Morph = require('../js/data/morphology.js');

const RUNS = Number(process.argv[2]) || 300;

function metaWith(rng, n) {
  // starter notes + n extra, granted in a study-plausible order:
  // roots & small suffixes first, then binders/mediums, then centers/forms/larges.
  const meta = {
    parts: new Set(['root:ign', 'suf:ign:small', 'root:san', 'suf:san:small', 'form:4']),
    solved: new Set(['IGNA', 'SANA']),
    runs: 0, wins: 0, bestNode: 0,
  };
  const tierOf = (pid) =>
    pid.startsWith('root:') ? 0 :
    pid.includes(':small') ? 1 :
    pid === 'form:5' || pid.includes(':medium') ? 2 :
    pid.startsWith('conn:') || pid === 'form:6' || pid === 'rule:elision' ? 3 :
    pid.startsWith('center:') || pid === 'form:7' ? 4 : 5;
  const ordered = Morph.PART_IDS.slice().sort((a, z) => tierOf(a) - tierOf(z) || (rng() - 0.5));
  let added = 0;
  for (const pid of ordered) {
    if (added >= n) break;
    if (!meta.parts.has(pid)) { meta.parts.add(pid); added++; }
  }
  return meta;
}

/* solve chance: base skill + info gathered + notes in the grimoire.
 * Knowing the answer's own parts is worth far more than generic breadth. */
function trySolve(b, rng, skill) {
  const m = b.mystery;
  const P = b.run.meta.parts;
  const entry = Morph.WORDS[m.answer];
  const gnum = m.guesses.length;
  const revealed = m.revealed.length;
  const partsKnown = entry.parts.filter(pid => P.has(pid)).length / entry.parts.length;
  let roots = 0, centers = 0;
  for (const pid of P) { if (pid.startsWith('root:')) roots++; else if (pid.startsWith('center:')) centers++; }
  const langBonus = Math.min(0.35, partsKnown * 0.22 + roots * 0.012 + centers * 0.02);
  const p = Math.min(0.75, skill + gnum * 0.09 + revealed * 0.13 + langBonus);
  if (rng() < p) return m.answer;
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
    if (!playBattle(b, rng, skill)) return { won: false, node: i, notes: meta.parts.size };
    // reward policy: study > loom > infuse > mend-if-low
    const offers = Loom.rollRewards(run);
    const rank = (o) => o.kind === 'study' ? 4 : o.kind === 'loom' ? 3 : (o.kind === 'mend' && run.hp < run.maxHp * 0.6) ? 5 : o.kind === 'infuse' ? 2 : 1;
    offers.sort((a, z) => rank(z) - rank(a));
    Loom.applyReward(run, offers[0]);
  }
  return { won: true, node: run.nodes.length, notes: run.meta.parts.size };
}

function config(label, notes, skill) {
  let wins = 0, nodeSum = 0, notesGained = 0;
  const deaths = new Array(9).fill(0);
  const base = 5 + Math.min(notes, 59); // starters + granted
  for (let i = 0; i < RUNS; i++) {
    const r = simulateRun(notes, skill, 1000 + notes * 31 + i * 13);
    if (r.won) wins++; else deaths[r.node]++;
    nodeSum += r.node;
    notesGained += r.notes - base;
  }
  console.log(`${label.padEnd(38)} win ${(100 * wins / RUNS).toFixed(0).padStart(3)}%  reach ${(nodeSum / RUNS).toFixed(1)}/8  +notes ${(notesGained / RUNS).toFixed(1)}  deaths ${deaths.join('/')}`);
}

console.log(`\n=== WORDLOOM balance (${RUNS} runs/config) — 8-node spiral, 64-note grammar ===\n`);
config('fresh grimoire (5 notes), novice', 0, 0.04);
config('fresh grimoire (5 notes), sharp', 0, 0.10);
config('12 extra notes, novice', 12, 0.04);
config('20 extra notes, sharp', 20, 0.10);
config('35 extra notes, sharp', 35, 0.10);
config('full grammar (64), sharp', 59, 0.10);
