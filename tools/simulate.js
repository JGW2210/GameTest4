/* WORDLOOM — balance sim, third weaving: full 3-world runs with a
 * scripted player on the shipped engine, across the loom-school's tiers.
 *   node tools/simulate.js [runsPerConfig]
 */
const Loom = require('../js/engine.js');
const Morph = require('../js/data/morphology.js');

const RUNS = Number(process.argv[2]) || 300;

// discovery order for building rosters of a given size: the five
// starters first, then the rest of the public elements
const ROSTER_ORDER = ['ign', 'aqu', 'aer', 'san', 'ter', 'gel', 'ven', 'ful', 'umb', 'lum'];

function metaWith(nElements, secrets) {
  return {
    elements: new Set(ROSTER_ORDER.slice(0, Math.max(3, nElements))),
    diff: 4,
    parts: new Set(),
    secrets: new Set(secrets || []),
    solved: new Set(['IGNA', 'SANA']),
    runs: 0, wins: 0, bestNode: 0,
  };
}

function trySolve(b, rng, skill) {
  const m = b.mystery;
  const P = Loom.runKnow(b.run);
  const entry = Morph.WORDS[m.answer];
  const gnum = m.guesses.length;
  const revealed = m.revealed.length;
  const partsKnown = entry.parts.filter(pid => P.has(pid)).length / entry.parts.length;
  let roots = 0, centers = 0;
  for (const pid of P) { if (pid.startsWith('root:')) roots++; else if (pid.startsWith('center:')) centers++; }
  const langBonus = Math.min(0.35, partsKnown * 0.22 + roots * 0.012 + centers * 0.015);
  const p = Math.min(0.75, skill + gnum * 0.09 + revealed * 0.13 + langBonus);
  if (rng() < p) return m.answer;
  const pool = Morph.VISIBLE.filter(e => e.len === m.len && e.word !== m.answer);
  return pool.length ? pool[Math.floor(rng() * pool.length)].word : m.answer;
}

function pickLength(b) {
  const lens = Loom.guessableLengths(b.run);
  return lens[lens.length - 1];
}

function playBattle(b, rng, skill) {
  let guard = 0;
  const want = pickLength(b);
  if (b.mystery.len !== want) Loom.chooseLength(b, want);
  while (!b.over && guard++ < 40) {
    // guess FIRST: with the breath, a full-force solve wants a fresh voice
    if (Loom.canGuess(b)) Loom.guess(b, trySolve(b, rng, skill));
    let cast = true, casts = 0;
    while (cast && !b.over && casts < 4) {
      cast = false;
      const tgt = Loom.targetFoe(b);
      // consider ALL readable, tier-open words we can pay for
      const know = Loom.runKnow(b.run, b.sealedNotes);
      const cap = Loom.diffCap(b.run);
      const options = [];
      for (const e of Morph.VISIBLE) {
        if (e.len <= cap && Morph.canRead(know, e) && Loom.canSpell(b, e.word)) options.push(e);
      }
      if (options.length && tgt) {
        const scored = options.map(e => {
          let v = (e.fx.dmg || 0) + (e.fx.burn || 0) + (e.fx.poison || 0) + (e.fx.heal || 0) * 0.5 + (e.fx.block || 0) * 0.4;
          if (tgt.weakTo === e.el && !e.fx.trueDmg) v *= 1.5;
          if (tgt.resist === e.el && !e.fx.trueDmg) v *= 0.5;
          if (e.fx.heal && b.player.hp > b.player.maxHp * 0.7) v *= 0.2;
          if (e.fx.aoe && Loom.alive(b).length > 1) v *= 1.5;
          return { e, v };
        }).sort((a, z) => z.v - a.v);
        // the breath: a tired word must still be worth the speaking
        if (scored[0].v * Loom.spokenMult(b) > 2) { Loom.castWord(b, scored[0].e.word); cast = true; casts++; }
      }
    }
    if (b.over) break;
    // wind empty vessels with leftover letters before ending the turn
    for (const v of (b.run.bobbins || []).filter(v => v.active && !v.wound && v.seq && !v.capSeq)) {
      const ids = [];
      for (const ch of v.left) {
        const t = b.tray.find(x => !x.frozen && !x.blank && x.ch === ch && !ids.includes(x.id));
        if (t) ids.push(t.id);
      }
      if (ids.length) Loom.feedVessel(b, v.id, ids);
    }
    Loom.endTurn(b);
  }
  if (!b.over) { b.over = true; b.won = false; }
  return b.won;
}

function simulateRun(nElements, difficulty, skill, clsId, seed, secrets) {
  const rng = Loom.makeRng(seed);
  const meta = metaWith(nElements, secrets);
  // attune three at random from the roster
  const roster = Array.from(meta.elements);
  const chosen = [];
  while (chosen.length < 3 && roster.length) chosen.push(roster.splice(Math.floor(rng() * roster.length), 1)[0]);
  const run = Loom.newRun(seed * 7 + 1, meta, clsId, { difficulty, elements: chosen });
  let guard = 0;
  while (!run.over && guard++ < 20) {
    const stage = Loom.currentStage(run);
    // door policy: prefer elder > camp-if-hurt > event > elite-if-healthy > battle
    let node = stage[0];
    if (stage.length > 1) {
      const rank = (nd) => nd.type === 'elder' ? 5
        : nd.type === 'camp' ? (run.hp < run.maxHp * 0.55 ? 6 : 2)
        : nd.type === 'event' ? 3
        : nd.type === 'elite' ? (run.hp > run.maxHp * 0.7 ? 4 : 1)
        : 2.5;
      node = stage.slice().sort((a, z) => rank(z) - rank(a))[0];
    }
    if (node.type === 'camp') {
      Loom.applyCamp(run, { kind: run.hp < run.maxHp * 0.6 ? 'rest' : 'reflect' });
    } else if (node.type === 'event') {
      const ev = Loom.rollEvent(run);
      Loom.applyEventChoice(run, ev, ev.choices[Math.floor(rng() * ev.choices.length)]);
    } else if (node.type === 'elder') {
      Loom.applyElder(run, node.event);
    } else {
      const b = Loom.battleForNode(run, node);
      if (!playBattle(b, rng, skill)) return { won: false, stage: Loom.globalStageIdx(run), els: run.elements.size, secrets: meta.secrets.size };
      const offers = Loom.rollRewards(run, node);
      const rank = (o) => o.kind === 'altspelling' ? 7.5
        : o.kind === 'element' ? (o.rare ? 7 : 5.5)
        : (o.kind === 'mend' && run.hp < run.maxHp * 0.6) ? 6
        : o.kind === 'center' ? 5
        : o.kind === 'bobbin' ? 4.5
        : o.kind === 'ribbon' ? 4 : o.kind === 'loom' ? 3.5 : o.kind === 'vial' ? 3 : 2;
      offers.sort((a, z) => rank(z) - rank(a));
      Loom.applyReward(run, offers[0]);
    }
    Loom.advance(run);
  }
  return { won: run.victory, stage: 12, els: run.elements.size, secrets: run.meta.secrets.size };
}

function config(label, nElements, difficulty, skill, clsId, secrets) {
  let wins = 0, stageSum = 0, elsSum = 0, secretsGained = 0;
  const deaths = new Array(13).fill(0);
  for (let i = 0; i < RUNS; i++) {
    const r = simulateRun(nElements, difficulty, skill, clsId, 1000 + nElements * 31 + difficulty * 7 + i * 13, secrets);
    if (r.won) wins++; else deaths[r.stage]++;
    stageSum += r.stage;
    elsSum += r.els;
    secretsGained += r.secrets - (secrets ? secrets.length : 0);
  }
  console.log(`${label.padEnd(46)} win ${(100 * wins / RUNS).toFixed(0).padStart(3)}%  reach ${(stageSum / RUNS).toFixed(1)}/12  attuned ${(elsSum / RUNS).toFixed(1)}  +secrets ${(secretsGained / RUNS).toFixed(2)}  deaths ${deaths.join('/')}`);
}

console.log(`\n=== WORDLOOM v3 balance (${RUNS} runs/config) — the loom-school ===\n`);
config('D1 Apprentice · 5 elements, novice', 5, 1, 0.04, 'scrivener');
config('D1 Apprentice · 5 elements, sharp', 5, 1, 0.10, 'scrivener');
config('D1 Apprentice · full roster, sharp', 10, 1, 0.10, 'scrivener');
config('D2 Journeyman · 7 elements, sharp', 7, 2, 0.10, 'scrivener');
config('D2 Journeyman · full roster, sharp', 10, 2, 0.10, 'scrivener');
config('D3 Artisan · full roster, sharp', 10, 3, 0.10, 'scrivener');
config('D3 Artisan · full roster, cantor', 10, 3, 0.10, 'cantor');
config('D4 Loomwright · full roster, cantor', 10, 4, 0.10, 'cantor');
config('D4 Loomwright · full + all secrets, cantor', 10, 4, 0.10, 'cantor', Morph.SECRET_IDS);
