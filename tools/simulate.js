/* WORDLOOM — balance sim, second weaving: full 3-world runs with a
 * scripted player on the shipped engine.
 *   node tools/simulate.js [runsPerConfig]
 */
const Loom = require('../js/engine.js');
const Morph = require('../js/data/morphology.js');

const RUNS = Number(process.argv[2]) || 300;

function metaWith(rng, n, secrets) {
  const meta = {
    parts: new Set(['root:ign', 'suf:ign:small', 'root:san', 'suf:san:small', 'form:cantrip']),
    secrets: new Set(secrets || []),
    solved: new Set(['IGNA', 'SANA']),
    runs: 0, wins: 0, bestNode: 0,
  };
  const tierOf = (pid) =>
    pid.startsWith('root:') ? 0 :
    pid.includes(':small') ? 1 :
    pid === 'form:word' || pid.includes(':medium') ? 2 :
    pid.startsWith('conn:') || pid === 'form:bound' || pid === 'rule:elision' || pid === 'rule:easing' ? 3 :
    pid.startsWith('center:') || pid === 'form:weave' || pid.startsWith('alt:') || pid === 'join:et' ? 4 : 5;
  const ordered = Morph.PART_IDS.slice().sort((a, z) => tierOf(a) - tierOf(z) || (rng() - 0.5));
  let added = 0;
  for (const pid of ordered) {
    if (added >= n) break;
    if (!meta.parts.has(pid)) { meta.parts.add(pid); added++; }
  }
  return meta;
}

function trySolve(b, rng, skill) {
  const m = b.mystery;
  const P = Loom.knowSet(b.run.meta);
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
  // guess at the longest length where we know a good share of parts
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
      // consider ALL readable words we can pay for (hand-spelling included)
      const know = Loom.knowSet(b.run.meta, b.sealedNotes);
      const options = [];
      for (const e of Morph.VISIBLE) {
        if (Morph.canRead(know, e) && Loom.canSpell(b, e.word)) options.push(e);
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
    if (!b.over) Loom.endTurn(b);
  }
  if (!b.over) { b.over = true; b.won = false; }
  return b.won;
}

function simulateRun(notes, skill, clsId, seed, secrets) {
  const rng = Loom.makeRng(seed);
  const meta = metaWith(rng, notes, secrets);
  const run = Loom.newRun(seed * 7 + 1, meta, clsId);
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
      if (!playBattle(b, rng, skill)) return { won: false, stage: Loom.globalStageIdx(run), notes: meta.parts.size, secrets: meta.secrets.size };
      const offers = Loom.rollRewards(run, node);
      const rank = (o) => o.kind === 'formnote' ? 7 : o.kind === 'study' ? 5
        : (o.kind === 'mend' && run.hp < run.maxHp * 0.6) ? 6
        : o.kind === 'bobbin' ? 4.5
        : o.kind === 'ribbon' ? 4 : o.kind === 'loom' ? 3.5 : o.kind === 'vial' ? 3 : 2;
      offers.sort((a, z) => rank(z) - rank(a));
      Loom.applyReward(run, offers[0]);
    }
    Loom.advance(run);
  }
  return { won: run.victory, stage: 12, notes: run.meta.parts.size, secrets: run.meta.secrets.size };
}

function config(label, notes, skill, clsId, secrets) {
  let wins = 0, stageSum = 0, notesGained = 0, secretsGained = 0;
  const deaths = new Array(13).fill(0);
  const base = 5 + Math.min(notes, Morph.PART_IDS.length - 5);
  for (let i = 0; i < RUNS; i++) {
    const r = simulateRun(notes, skill, clsId, 1000 + notes * 31 + i * 13, secrets);
    if (r.won) wins++; else deaths[r.stage]++;
    stageSum += r.stage;
    notesGained += r.notes - base;
    secretsGained += r.secrets - (secrets ? secrets.length : 0);
  }
  console.log(`${label.padEnd(44)} win ${(100 * wins / RUNS).toFixed(0).padStart(3)}%  reach ${(stageSum / RUNS).toFixed(1)}/12  +notes ${(notesGained / RUNS).toFixed(1)}  +secrets ${(secretsGained / RUNS).toFixed(2)}  deaths ${deaths.join('/')}`);
}

console.log(`\n=== WORDLOOM v2 balance (${RUNS} runs/config) — 3 worlds × 4 stages ===\n`);
config('fresh (5 notes) scrivener, novice', 0, 0.04, 'scrivener');
config('fresh (5 notes) scrivener, sharp', 0, 0.10, 'scrivener');
config('16 extra notes, scrivener, sharp', 16, 0.10, 'scrivener');
config('30 extra notes, scrivener, sharp', 30, 0.10, 'scrivener');
config('30 extra notes, lector, sharp', 30, 0.10, 'lector');
config('30 extra notes, cantor, sharp', 30, 0.10, 'cantor');
config('full grammar, scrivener, sharp', 99, 0.10, 'scrivener');
config('full grammar + all secrets, cantor', 99, 0.10, 'cantor', Morph.SECRET_IDS);
