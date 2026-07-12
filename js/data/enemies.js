/* ============================================================
 * LEXICON ARCANUM — Foes: 5 worlds × (normals, elites, boss)
 * All scaling constants live here so the balance simulator can
 * exercise them directly. Tuned via tools/simulate.js trial runs.
 *
 * Move kinds: attack {n,hits}, block {n}, buff {str}, debuff {weak,vuln},
 *             leech {insight, n?}, smolder {burn}, venom {poison}, heal {n}
 * Patterns cycle; some entries are [choices] picked at random.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.EnemyData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const WORLDS = [
    { id: 1, name: 'The Whispering Woods', icon: '🌲', blurb: 'Where the first words were overheard.' },
    { id: 2, name: 'The Sunken Catacombs', icon: '🕯️', blurb: 'Libraries drowned, librarians not quite.' },
    { id: 3, name: 'The Ashen Peaks',      icon: '🌋', blurb: 'Every summit is a burnt offering.' },
    { id: 4, name: 'The Void Marches',     icon: '🌑', blurb: 'Where unfinished sentences go.' },
    { id: 5, name: 'The Astral Spire',     icon: '✨', blurb: 'The last word waits at the top.' },
  ];

  /* ---- Scaling knobs (tuned by simulation) ---- */
  const SCALING = {
    WORLD_HP:  [1.30, 2.20, 3.20, 4.30, 5.60],
    WORLD_DMG: [1.15, 1.70, 2.20, 2.70, 3.30],
    STAGE_HP_PER: 0.09,   // +9% hp per stage within a world
    STAGE_DMG_PER: 0.06,  // +6% dmg per stage within a world
    ELITE_HP: 1.55, ELITE_DMG: 1.25,
    GOLD_BASE: 16, GOLD_PER_WORLD: 7, GOLD_ELITE: 1.8, GOLD_BOSS: 3.0,
  };

  const A = (n, hits) => ({ kind: 'attack', n, hits: hits || 1 });
  const B = (n) => ({ kind: 'block', n });
  const BUFF = (str) => ({ kind: 'buff', str });
  const DBF = (weak, vuln) => ({ kind: 'debuff', weak: weak || 0, vuln: vuln || 0 });
  const LEECH = (insight, n) => ({ kind: 'leech', insight, n: n || 0 });
  const SMOLDER = (burn, n) => ({ kind: 'smolder', burn, n: n || 0 });
  const VENOM = (poison, n) => ({ kind: 'venom', poison, n: n || 0 });
  const HEAL = (n) => ({ kind: 'heal', n });

  /* Base stats are WORLD-1 NOVICE numbers; scaling multiplies them. */
  const ENEMIES = {
    /* ---------- World 1: Whispering Woods ---------- */
    thornling:  { world: 1, name: 'Thornling',        icon: '🌿', hp: 26, pattern: [A(6), B(5), A(7)] },
    inkmoth:    { world: 1, name: 'Ink Moth',         icon: '🦋', hp: 22, pattern: [A(4, 2), DBF(1, 0), A(6)] },
    mosswolf:   { world: 1, name: 'Moss-back Wolf',   icon: '🐺', hp: 30, pattern: [A(8), A(5), B(6)] },
    sprigwitch: { world: 1, name: 'Sprig Witch',      icon: '🧙', hp: 28, pattern: [VENOM(3, 3), A(6), [A(7), DBF(0, 1)]] },
    // elites
    owlsage:    { world: 1, name: 'Heretic Owl-Sage', icon: '🦉', hp: 34, elite: true, pattern: [LEECH(2, 4), A(8), BUFF(2), A(9)] },
    briarhulk:  { world: 1, name: 'Briar Hulk',       icon: '🌳', hp: 42, elite: true, pattern: [B(8), A(11), A(6, 2)] },
    // boss
    grovemaw:   { world: 1, name: 'The Grove-Maw',    icon: '🍃', hp: 72, boss: true,
                  pattern: [A(9), VENOM(4, 4), B(9), A(7, 2), BUFF(2)] },

    /* ---------- World 2: Sunken Catacombs ---------- */
    drownedscribe:{ world: 2, name: 'Drowned Scribe', icon: '🫧', hp: 27, pattern: [A(7), LEECH(1, 5), A(8)] },
    boneabbot:  { world: 2, name: 'Bone Abbot',       icon: '💀', hp: 31, pattern: [A(8), B(7), [A(9), DBF(1, 1)]] },
    silthag:    { world: 2, name: 'Silt Hag',         icon: '🦑', hp: 25, pattern: [VENOM(4, 4), A(6), DBF(2, 0)] },
    rustgolem:  { world: 2, name: 'Rust Golem',       icon: '🗿', hp: 36, pattern: [B(9), A(11), A(8)] },
    // elites
    choirless:  { world: 2, name: 'The Choirless',    icon: '👥', hp: 40, elite: true, pattern: [A(6, 2), LEECH(2, 5), BUFF(3), A(10)] },
    reliquary:  { world: 2, name: 'Waking Reliquary', icon: '⚱️', hp: 46, elite: true, pattern: [B(10), A(13), HEAL(6), A(9)] },
    // boss
    lexovore:   { world: 2, name: 'The Lexovore',     icon: '🐍', hp: 84, boss: true,
                  pattern: [LEECH(3, 6), A(11), B(10), A(8, 2), DBF(2, 2)] },

    /* ---------- World 3: Ashen Peaks ---------- */
    cinderimp:  { world: 3, name: 'Cinder Imp',       icon: '👹', hp: 28, pattern: [SMOLDER(4, 4), A(9), A(7)] },
    slagbeast:  { world: 3, name: 'Slag Beast',       icon: '🐗', hp: 35, pattern: [A(11), B(8), A(9)] },
    ashwidow:   { world: 3, name: 'Ash Widow',        icon: '🕷️', hp: 29, pattern: [VENOM(5, 4), SMOLDER(3, 3), A(8)] },
    pyrecaller: { world: 3, name: 'Pyre Caller',      icon: '🔥', hp: 31, pattern: [BUFF(2), SMOLDER(5, 5), A(10)] },
    // elites
    magmaTome:  { world: 3, name: 'Magma-Bound Tome', icon: '📕', hp: 44, elite: true, pattern: [SMOLDER(6, 6), A(12), B(9), A(9, 2)] },
    obsidianknight:{ world: 3, name: 'Obsidian Knight', icon: '♞', hp: 50, elite: true, pattern: [B(12), A(14), DBF(1, 1), A(11)] },
    // boss
    cinderking: { world: 3, name: 'The Cinder King',  icon: '👑', hp: 96, boss: true,
                  pattern: [SMOLDER(6, 6), A(12), BUFF(3), A(9, 2), B(12)] },

    /* ---------- World 4: Void Marches ---------- */
    nullwisp:   { world: 4, name: 'Null Wisp',        icon: '👻', hp: 30, pattern: [LEECH(2, 6), A(10), DBF(1, 1)] },
    unword:     { world: 4, name: 'The Un-Word',      icon: '❓', hp: 34, pattern: [A(12), DBF(2, 0), A(8, 2)] },
    hollowedjudge:{ world: 4, name: 'Hollowed Judge', icon: '⚖️', hp: 38, pattern: [B(10), A(13), DBF(0, 2)] },
    voidlarva:  { world: 4, name: 'Void Larva',       icon: '🐛', hp: 32, pattern: [VENOM(6, 5), HEAL(5), A(11)] },
    // elites
    silencer:   { world: 4, name: 'The Silencer',     icon: '🤫', hp: 48, elite: true, pattern: [LEECH(3, 7), A(13), BUFF(3), A(10, 2)] },
    eraser:     { world: 4, name: 'Eraser of Names',  icon: '🌫️', hp: 54, elite: true, pattern: [A(15), B(12), DBF(2, 2), A(12)] },
    // boss
    censor:     { world: 4, name: 'The Grand Censor', icon: '🚫', hp: 110, boss: true,
                  pattern: [LEECH(4, 8), A(13), B(13), DBF(2, 2), A(10, 2), BUFF(3)] },

    /* ---------- World 5: Astral Spire ---------- */
    starspawn:  { world: 5, name: 'Star-Spawn',       icon: '⭐', hp: 34, pattern: [A(13), SMOLDER(5, 5), B(10)] },
    glyphgeist: { world: 5, name: 'Glyph Geist',      icon: '🌀', hp: 36, pattern: [LEECH(2, 7), A(12), DBF(1, 2)] },
    seraphscribe:{ world: 5, name: 'Fallen Seraph-Scribe', icon: '🕊️', hp: 40, pattern: [HEAL(6), A(14), B(11)] },
    cometling:  { world: 5, name: 'Cometling',        icon: '☄️', hp: 33, pattern: [A(9, 2), BUFF(2), A(12)] },
    // elites
    constellation:{ world: 5, name: 'Bound Constellation', icon: '✨', hp: 58, elite: true, pattern: [A(11, 2), B(13), BUFF(4), A(16)] },
    archlector: { world: 5, name: 'The Arch-Lector',  icon: '📿', hp: 62, elite: true, pattern: [LEECH(3, 8), A(15), HEAL(8), A(12, 2)] },
    // boss — final
    author:     { world: 5, name: 'THE AUTHOR',       icon: '🖋️', hp: 130, boss: true,
                  pattern: [A(14), LEECH(4, 9), B(15), A(11, 2), BUFF(4), DBF(2, 2)] },
  };

  const BY_WORLD = {};
  for (const [id, e] of Object.entries(ENEMIES)) {
    e.id = id;
    const w = (BY_WORLD[e.world] = BY_WORLD[e.world] || { normals: [], elites: [], boss: null });
    if (e.boss) w.boss = id;
    else if (e.elite) w.elites.push(id);
    else w.normals.push(id);
  }

  function scaledStats(id, world, stage, difficulty) {
    const e = ENEMIES[id];
    const s = SCALING;
    const hpMult = s.WORLD_HP[world - 1] * (1 + s.STAGE_HP_PER * (stage - 1)) * difficulty.hpMult * (e.elite ? s.ELITE_HP : 1);
    const dmgMult = s.WORLD_DMG[world - 1] * (1 + s.STAGE_DMG_PER * (stage - 1)) * difficulty.dmgMult * (e.elite ? s.ELITE_DMG : 1);
    return { hp: Math.round(e.hp * hpMult), dmgMult };
  }

  function goldReward(world, kind, difficulty, rng) {
    const s = SCALING;
    let g = (s.GOLD_BASE + s.GOLD_PER_WORLD * (world - 1)) * difficulty.goldMult;
    if (kind === 'elite') g *= s.GOLD_ELITE;
    if (kind === 'boss') g *= s.GOLD_BOSS;
    return Math.round(g * (0.85 + rng() * 0.3));
  }

  return { WORLDS, ENEMIES, BY_WORLD, SCALING, scaledStats, goldReward };
});
